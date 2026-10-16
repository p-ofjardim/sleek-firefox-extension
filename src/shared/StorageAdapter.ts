import { SettingStore } from "@sleek-types";

/**
 * Storage contract (ROADMAP Phase 1).
 *
 * Single seam between the renderer and persistence. The desktop uses
 * ElectronStorageAdapter (electron-store via the preload bridge); the
 * Firefox extension uses BrowserStorageAdapter (browser.storage.local).
 * Both adapters must satisfy the same contract tests.
 */

export interface ConfigKeyValues {
  [key: string]: unknown;
}

export interface StorageAdapter {
  // Settings (config store)
  getConfig(key?: string): unknown;
  setConfig(property: string, value: unknown): void;

  // Filters store
  getFilters(key?: string): unknown;
  setFilters(property: string, value: unknown): void;

  // Colors store
  getColors(key?: string): unknown;
  setColors(property: string, value: unknown): void;

  // Notified todo objects
  getNotifiedTodoObjects(): unknown;
  setNotifiedTodoObjects(value: unknown): void;
}

export type SettingsSnapshot = SettingStore;
