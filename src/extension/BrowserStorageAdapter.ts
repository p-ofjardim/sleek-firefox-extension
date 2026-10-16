import { StorageAdapter } from "../shared/StorageAdapter";
import {
  runMigrations,
  settingsMigrations,
  filtersMigrations,
} from "../shared/storageMigrations";
import colorsData from "../../resources/colors.json";

/**
 * StorageAdapter backed by browser.storage.local (ROADMAP Phase 1).
 *
 * Layout:
 *   "settings"  → full config object (migrated via versioned chain)
 *   "filters"   → full filters object
 *   "colors"    → full colors object
 *   "notifiedTodoObjects" → notification hashes
 *
 * The browser.storage API is fully async; getters return the cached
 * snapshot hydrated at startup, and setters fire-and-forget writes that
 * also update the cache synchronously so the UI reads stay in sync.
 */

interface BrowserStorageArea {
  get(keys?: string[] | string | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export class BrowserStorageAdapter implements StorageAdapter {
  private area: BrowserStorageArea;
  private settingsCache: Record<string, unknown> = {};
  private filtersCache: Record<string, unknown> = {};
  private colorsCache: Record<string, unknown> = {};
  private notifiedCache: unknown = null;

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
    this.settingsCache = (stored.settings as Record<string, unknown>) ?? {};
    this.filtersCache = (stored.filters as Record<string, unknown>) ?? {};
    this.colorsCache = (stored.colors as Record<string, unknown>) ?? {
      colors: colorsData,
    };
    this.notifiedCache = stored.notifiedTodoObjects ?? null;

    const settingsVersion = (stored.settingsVersion as string) ?? null;
    const latestSettings = Object.keys(settingsMigrations).at(-1)!;
    if (settingsVersion !== latestSettings) {
      runMigrations(this, "settings", settingsVersion, latestSettings);
      await this.area.set({
        settings: this.settingsCache,
        settingsVersion: latestSettings,
      });
    }

    const latestFilters = Object.keys(filtersMigrations).at(-1);
    if (latestFilters && this.filtersCache.attributes === undefined) {
      runMigrations(this, "filters", settingsVersion, latestFilters);
      await this.area.set({ filters: this.filtersCache });
    }
  }

  getConfig(key?: string): unknown {
    if (key === undefined) return { ...this.settingsCache };
    return this.settingsCache[key];
  }

  setConfig(property: string, value: unknown): void {
    this.settingsCache = { ...this.settingsCache, [property]: value };
    void this.area.set({ settings: this.settingsCache });
  }

  getFilters(key?: string): unknown {
    if (key === undefined) return { ...this.filtersCache };
    return this.filtersCache[key];
  }

  setFilters(property: string, value: unknown): void {
    this.filtersCache = { ...this.filtersCache, [property]: value };
    void this.area.set({ filters: this.filtersCache });
  }

  getColors(key?: string): unknown {
    if (key === undefined) return { ...this.colorsCache };
    return this.colorsCache[key];
  }

  setColors(property: string, value: unknown): void {
    this.colorsCache = { ...this.colorsCache, [property]: value };
    void this.area.set({ colors: this.colorsCache });
  }

  getNotifiedTodoObjects(): unknown {
    return this.notifiedCache;
  }

  setNotifiedTodoObjects(value: unknown): void {
    this.notifiedCache = value;
    void this.area.set({ notifiedTodoObjects: value });
  }
}
