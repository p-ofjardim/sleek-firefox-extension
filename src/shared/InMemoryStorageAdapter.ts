import { StorageAdapter } from "./StorageAdapter";

/**
 * In-memory StorageAdapter used by contract tests and as the reference
 * implementation. Behaves like the electron-store wrappers: keyed JSON
 * documents with plain get/set semantics.
 */
export class InMemoryStorageAdapter implements StorageAdapter {
  private config: Record<string, unknown> = {};
  private filters: Record<string, unknown> = {};
  private colors: Record<string, unknown> = {};
  private notifiedTodoObjects: unknown = null;

  constructor(initial?: {
    config?: Record<string, unknown>;
    filters?: Record<string, unknown>;
    colors?: Record<string, unknown>;
  }) {
    if (initial?.config) this.config = { ...initial.config };
    if (initial?.filters) this.filters = { ...initial.filters };
    if (initial?.colors) this.colors = { ...initial.colors };
  }

  getConfig(key?: string): unknown {
    if (key === undefined) return { ...this.config };
    return this.config[key];
  }

  setConfig(property: string, value: unknown): void {
    this.config = { ...this.config, [property]: value };
  }

  getFilters(key?: string): unknown {
    if (key === undefined) return { ...this.filters };
    return this.filters[key];
  }

  setFilters(property: string, value: unknown): void {
    this.filters = { ...this.filters, [property]: value };
  }

  getColors(key?: string): unknown {
    if (key === undefined) return { ...this.colors };
    return this.colors[key];
  }

  setColors(property: string, value: unknown): void {
    this.colors = { ...this.colors, [property]: value };
  }

  getNotifiedTodoObjects(): unknown {
    return this.notifiedTodoObjects;
  }

  setNotifiedTodoObjects(value: unknown): void {
    this.notifiedTodoObjects = value;
  }
}
