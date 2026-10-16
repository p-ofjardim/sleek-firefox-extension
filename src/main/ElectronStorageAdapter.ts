import { StorageAdapter } from "../shared/StorageAdapter";
import { SettingStore, Filters } from "@sleek-types";

/**
 * StorageAdapter wrapping the current desktop stores (ROADMAP Phase 1).
 * Desktop behavior unchanged: electron-store instances are passed in so
 * this adapter adds no Electron coupling of its own.
 */
export class ElectronStorageAdapter implements StorageAdapter {
  private stores: {
    settings: {
      get(key?: string): unknown;
      set(key: string, value: unknown): void;
    };
    filters: {
      get(key?: string): unknown;
      set(key: string, value: unknown): void;
    };
    colors: {
      get(key?: string): unknown;
      set(key: string, value: unknown): void;
    };
    notifications: {
      get(key?: string): unknown;
      set(key: string, value: unknown): void;
    };
  };

  constructor(stores: ElectronStorageAdapter["stores"]) {
    this.stores = stores;
  }

  getConfig<T = SettingStore>(key?: string): T {
    if (key === undefined) return this.stores.settings.get() as T;
    return this.stores.settings.get(key) as T;
  }

  setConfig<K extends keyof SettingStore>(property: K, value: SettingStore[K]): void;
  setConfig(property: string, value: unknown): void;
  setConfig(property: string, value: unknown): void {
    this.stores.settings.set(property, value);
  }

  getFilters<T = Filters>(key?: string): T {
    if (key === undefined) return this.stores.filters.get() as T;
    return this.stores.filters.get(key) as T;
  }

  setFilters<K extends keyof Filters>(property: K, value: Filters[K]): void;
  setFilters(property: string, value: unknown): void;
  setFilters(property: string, value: unknown): void {
    this.stores.filters.set(property, value);
  }

  getColors<T = unknown>(key?: string): T {
    if (key === undefined) return this.stores.colors.get() as T;
    return this.stores.colors.get(key) as T;
  }

  setColors<K extends string>(property: K, value: unknown): void;
  setColors(property: string, value: unknown): void;
  setColors(property: string, value: unknown): void {
    this.stores.colors.set(property, value);
  }

  getNotifiedTodoObjects(): string[] {
    return (this.stores.notifications.get("notificationHashes") as string[]) ?? [];
  }

  setNotifiedTodoObjects(value: string[]): void {
    this.stores.notifications.set("notificationHashes", value);
  }
}
