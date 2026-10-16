import { StorageAdapter } from "./StorageAdapter";
import { SettingStore, Filters } from "@sleek-types";

/**
 * In-memory StorageAdapter used by contract tests and as the reference
 * implementation. Behaves like the electron-store wrappers: keyed JSON
 * documents with plain get/set semantics.
 */
export class InMemoryStorageAdapter implements StorageAdapter {
  private config: Partial<SettingStore> = {};
  private filters: Partial<Filters> = {};
  private colors: Record<string, unknown> = {};
  private notifiedTodoObjects: string[] = [];

  constructor(initial?: {
    config?: Partial<SettingStore>;
    filters?: Partial<Filters>;
    colors?: Record<string, unknown>;
  }) {
    if (initial?.config) this.config = { ...this.config, ...initial.config };
    if (initial?.filters) this.filters = { ...this.filters, ...initial.filters };
    if (initial?.colors) this.colors = { ...this.colors, ...initial.colors };
  }

  getConfig<T = SettingStore>(key?: string): T {
    if (key === undefined) return { ...this.config } as T;
    return this.config[key as keyof SettingStore] as T;
  }

  setConfig<K extends keyof SettingStore>(property: K, value: SettingStore[K]): void;
  setConfig(property: string, value: unknown): void;
  setConfig(property: string, value: unknown): void {
    this.config = { ...this.config, [property]: value };
  }

  getFilters<T = Filters>(key?: string): T {
    if (key === undefined) return { ...this.filters } as T;
    return this.filters[key as keyof Filters] as T;
  }

  setFilters<K extends keyof Filters>(property: K, value: Filters[K]): void;
  setFilters(property: string, value: unknown): void;
  setFilters(property: string, value: unknown): void {
    this.filters = { ...this.filters, [property]: value as Filters[string] };
  }

  getColors<T = unknown>(key?: string): T {
    if (key === undefined) return { ...this.colors } as T;
    return this.colors[key as string] as T;
  }

  setColors<K extends string>(property: K, value: unknown): void;
  setColors(property: string, value: unknown): void;
  setColors(property: string, value: unknown): void {
    this.colors = { ...this.colors, [property]: value };
  }

  getNotifiedTodoObjects(): string[] {
    return this.notifiedTodoObjects;
  }

  setNotifiedTodoObjects(value: string[]): void {
    this.notifiedTodoObjects = value;
  }
}
