import { StorageAdapter } from "../shared/StorageAdapter";
import {
  runMigrations,
  settingsMigrations,
  filtersMigrations,
  colorsMigrations,
  SCHEMA_VERSIONS,
} from "../shared/storageMigrations";
import colorsData from "../../resources/colors.json";
import { SettingStore, Filters } from "@sleek-types";

/**
 * StorageAdapter backed by browser.storage.local (ROADMAP Phase 1).
 *
 * Layout:
 *   "settings"  -> full config object (migrated via versioned chain)
 *   "filters"   -> full filters object
 *   "colors"    -> full colors object
 *   "notifiedTodoObjects" -> notification hashes
 *
 * The browser.storage API is fully async; getters return the cached
 * snapshot hydrated at startup, and setters use async writes with
 * error handling and cache synchronization.
 */

interface BrowserStorageArea {
  get(keys?: string[] | string | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export class BrowserStorageAdapter implements StorageAdapter {
  private area: BrowserStorageArea;
  private settingsCache: Partial<SettingStore> = {};
  private filtersCache: Partial<Filters> = {};
  private colorsCache: Record<string, unknown> = {};
  private notifiedCache: string[] = [];
  private loaded = false;
  private writeQueue: Record<string, unknown> = {};
  private writeTimeout: NodeJS.Timeout | null = null;

  constructor(area: BrowserStorageArea) {
    this.area = area;
  }

  async load(): Promise<void> {
    const stored = await this.area.get([
      "settings",
      "settingsVersion",
      "filters",
      "colors",
      "notifiedTodoObjects",
    ]);

    this.settingsCache = (stored.settings as Partial<SettingStore>) ?? {};
    this.filtersCache = (stored.filters as Partial<Filters>) ?? {};
    this.colorsCache = (stored.colors as Record<string, unknown>) ?? colorsData;
    this.notifiedCache = (stored.notifiedTodoObjects as string[]) ?? [];

    const settingsVersion = (stored.settingsVersion as string) ?? null;
    const latestSettings = SCHEMA_VERSIONS.settings;

    if (settingsVersion !== latestSettings) {
      runMigrations(this, "settings", settingsVersion, latestSettings);
      await this.area.set({
        settings: this.settingsCache,
        settingsVersion: latestSettings,
      });
    }

    const latestFilters = SCHEMA_VERSIONS.filters;
    if (latestFilters && (this.filtersCache as Filters).attributes === undefined) {
      runMigrations(this, "filters", settingsVersion, latestFilters);
      await this.area.set({ filters: this.filtersCache });
    }

    const latestColors = SCHEMA_VERSIONS.colors;
    if (latestColors && Object.keys(this.colorsCache).length === 0) {
      runMigrations(this, "colors", settingsVersion, latestColors);
      await this.area.set({ colors: this.colorsCache });
    }

    this.loaded = true;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getConfig<T = SettingStore>(key?: string): T {
    if (key === undefined) return { ...this.settingsCache } as T;
    return this.settingsCache[key as keyof SettingStore] as T;
  }

  setConfig<K extends keyof SettingStore>(property: K, value: SettingStore[K]): void;
  setConfig(property: string, value: unknown): void;
  setConfig(property: string, value: unknown): void {
    this.settingsCache = { ...this.settingsCache, [property]: value };
    this.queueWrite("settings", this.settingsCache);
  }

  getFilters<T = Filters>(key?: string): T {
    if (key === undefined) return { ...this.filtersCache } as T;
    return this.filtersCache[key as keyof Filters] as T;
  }

  setFilters<K extends keyof Filters>(property: K, value: Filters[K]): void;
  setFilters(property: string, value: unknown): void;
  setFilters(property: string, value: unknown): void {
    this.filtersCache = { ...this.filtersCache, [property]: value as Filters[string] };
    this.queueWrite("filters", this.filtersCache);
  }

  getColors<T = unknown>(key?: string): T {
    if (key === undefined) return { ...this.colorsCache } as T;
    return this.colorsCache[key as string] as T;
  }

  setColors<K extends string>(property: K, value: unknown): void;
  setColors(property: string, value: unknown): void;
  setColors(property: string, value: unknown): void {
    this.colorsCache = { ...this.colorsCache, [property]: value };
    this.queueWrite("colors", this.colorsCache);
  }

  getNotifiedTodoObjects(): string[] {
    return this.notifiedCache;
  }

  setNotifiedTodoObjects(value: string[]): void {
    this.notifiedCache = value;
    this.queueWrite("notifiedTodoObjects", value);
  }

  /**
   * Queue writes and debounce to reduce storage I/O
   */
  private queueWrite(key: string, value: unknown): void {
    this.writeQueue[key] = value;

    if (!this.writeTimeout) {
      this.writeTimeout = setTimeout(() => {
        this.flushWrites();
      }, 100);
    }
  }

  /**
   * Flush all queued writes to storage
   */
  private async flushWrites(): Promise<void> {
    if (Object.keys(this.writeQueue).length > 0) {
      try {
        await this.area.set(this.writeQueue);
        this.writeQueue = {};
      } catch (error) {
        console.error("Failed to flush writes to storage:", error);
      }
    }
    this.writeTimeout = null;
  }

  /**
   * Force immediate write (for critical data)
   */
  async flush(): Promise<void> {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
      this.writeTimeout = null;
    }
    await this.flushWrites();
  }
}
