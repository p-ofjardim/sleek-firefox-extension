import { StorageAdapter } from "../shared/StorageAdapter";

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

  getConfig(key?: string): unknown {
    if (key === undefined) return this.stores.settings.get();
    return this.stores.settings.get(key);
  }

  setConfig(property: string, value: unknown): void {
    this.stores.settings.set(property, value);
  }

  getFilters(key?: string): unknown {
    if (key === undefined) return this.stores.filters.get();
    return this.stores.filters.get(key);
  }

  setFilters(property: string, value: unknown): void {
    this.stores.filters.set(property, value);
  }

  getColors(key?: string): unknown {
    if (key === undefined) return this.stores.colors.get();
    return this.stores.colors.get(key);
  }

  setColors(property: string, value: unknown): void {
    this.stores.colors.set(property, value);
  }

  getNotifiedTodoObjects(): unknown {
    return this.stores.notifications.get("notificationHashes");
  }

  setNotifiedTodoObjects(value: unknown): void {
    this.stores.notifications.set("notificationHashes", value);
  }
}
