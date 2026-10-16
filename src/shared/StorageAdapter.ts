import { SettingStore, Filters } from "@sleek-types";

/**
 * Storage contract (ROADMAP Phase 1).
 *
 * Single seam between the renderer and persistence. The desktop uses
 * ElectronStorageAdapter (electron-store via the preload bridge); the
 * Firefox extension uses BrowserStorageAdapter (browser.storage.local).
 * Both adapters must satisfy the same contract tests.
 */

export interface StorageAdapter {
  // Settings (config store) - with strong typing
  getConfig<T = SettingStore>(key?: string): T;
  setConfig<K extends keyof SettingStore>(property: K, value: SettingStore[K]): void;
  setConfig(property: string, value: unknown): void;

  // Filters store - with strong typing
  getFilters<T = Filters>(key?: string): T;
  setFilters<K extends keyof Filters>(property: K, value: Filters[K]): void;
  setFilters(property: string, value: unknown): void;

  // Colors store - with strong typing
  getColors<T = unknown>(key?: string): T;
  setColors<K extends string>(property: K, value: unknown): void;

  // Notified todo objects - strongly typed as string array
  getNotifiedTodoObjects(): string[];
  setNotifiedTodoObjects(value: string[]): void;
}

export type SettingsSnapshot = SettingStore;
