import { describe, it, expect } from "vitest";
import { StorageAdapter } from "./StorageAdapter";
import { InMemoryStorageAdapter } from "./InMemoryStorageAdapter";
import { BrowserStorageAdapter } from "../extension/BrowserStorageAdapter";
import { runMigrations } from "./storageMigrations";

/**
 * Contract tests every StorageAdapter must satisfy (ROADMAP Phase 1).
 * The same suite runs against the in-memory reference adapter and the
 * browser adapter over an in-memory polyfill.
 */

class MemoryBrowserArea {
  private data: Record<string, unknown> = {};
  async get(keys?: string[] | string | null): Promise<Record<string, unknown>> {
    if (keys === null || keys === undefined) return { ...this.data };
    const list = Array.isArray(keys) ? keys : [keys];
    const result: Record<string, unknown> = {};
    for (const key of list) {
      if (key in this.data) result[key] = this.data[key];
    }
    return result;
  }
  async set(items: Record<string, unknown>): Promise<void> {
    this.data = { ...this.data, ...items };
  }
  dump(): Record<string, unknown> {
    return { ...this.data };
  }
}

function adapterContract(name: string, make: () => Promise<StorageAdapter>) {
  describe(`StorageAdapter contract: ${name}`, () => {
    it("returns undefined for unknown config keys", async () => {
      const adapter = await make();
      expect(adapter.getConfig("nonexistent")).toBeUndefined();
    });

    it("sets and gets config values", async () => {
      const adapter = await make();
      adapter.setConfig("zoom", 150);
      expect(adapter.getConfig("zoom")).toBe(150);
    });

    it("returns the whole config when no key is given", async () => {
      const adapter = await make();
      adapter.setConfig("zoom", 100);
      adapter.setConfig("compact", true);
      const config = adapter.getConfig() as Record<string, unknown>;
      expect(config.zoom).toBe(100);
      expect(config.compact).toBe(true);
    });

    it("sets and gets filters", async () => {
      const adapter = await make();
      adapter.setFilters("attributes", { contexts: [] });
      expect(adapter.getFilters("attributes")).toEqual({ contexts: [] });
    });

    it("sets and gets colors", async () => {
      const adapter = await make();
      adapter.setColors("colors", { semantic: { primary: "#1976d2" } });
      const colors = adapter.getColors("colors") as Record<string, unknown>;
      expect(colors.semantic).toEqual({ primary: "#1976d2" });
    });

    it("sets and gets notified todo objects", async () => {
      const adapter = await make();
      adapter.setNotifiedTodoObjects(["hash1", "hash2"]);
      expect(adapter.getNotifiedTodoObjects()).toEqual(["hash1", "hash2"]);
    });

    it("overwrites config values", async () => {
      const adapter = await make();
      adapter.setConfig("zoom", 100);
      adapter.setConfig("zoom", 200);
      expect(adapter.getConfig("zoom")).toBe(200);
    });
  });
}

adapterContract(
  "InMemoryStorageAdapter",
  async () => new InMemoryStorageAdapter(),
);

adapterContract("BrowserStorageAdapter (polyfill)", async () => {
  const adapter = new BrowserStorageAdapter(new MemoryBrowserArea());
  await adapter.load();
  return adapter;
});

describe("storage migrations", () => {
  it("creates a fresh settings schema from scratch", () => {
    const adapter = new InMemoryStorageAdapter();
    runMigrations(adapter, "settings", null, "2.0.30");
    expect(adapter.getConfig("sorting")).toEqual([
      { id: "1", value: "priority", invert: false },
      { id: "2", value: "projects", invert: false },
      { id: "3", value: "contexts", invert: false },
      { id: "4", value: "due", invert: false },
      { id: "5", value: "t", invert: false },
      { id: "6", value: "completed", invert: false },
      { id: "7", value: "created", invert: false },
      { id: "8", value: "rec", invert: false },
      { id: "9", value: "pm", invert: false },
    ]);
    expect(adapter.getConfig("welcomeScreenShown")).toBe(false);
    expect(adapter.getConfig("showAttributesFromHiddenTodosInDrawer")).toBe(
      true,
    );
  });

  it("does not overwrite keys set after the from-version", () => {
    const adapter = new InMemoryStorageAdapter();
    runMigrations(adapter, "settings", null, "2.0.27");
    adapter.setConfig("welcomeScreenShown", true);
    runMigrations(adapter, "settings", "2.0.27", "2.0.30");
    expect(adapter.getConfig("welcomeScreenShown")).toBe(true);
  });

  it("migrates filters with attributes and hiddenCategories", () => {
    const adapter = new InMemoryStorageAdapter();
    runMigrations(adapter, "filters", null, "2.0.28");
    expect(adapter.getFilters("attributes")).toEqual({});
    expect(adapter.getFilters("hiddenCategories")).toEqual([]);
  });

  it("seeds colors", () => {
    const adapter = new InMemoryStorageAdapter();
    runMigrations(adapter, "colors", null, "2.0.26");
    const colors = adapter.getColors("colors") as Record<string, unknown>;
    expect(colors).toHaveProperty("semantic");
    expect(colors).toHaveProperty("attributes");
  });
});

describe("BrowserStorageAdapter persistence", () => {
  it("persists config writes to the storage area", async () => {
    const area = new MemoryBrowserArea();
    const adapter = new BrowserStorageAdapter(area);
    await adapter.load();
    adapter.setConfig("zoom", 125);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const stored = area.dump();
    const settings = stored.settings as Record<string, unknown>;
    expect(settings.zoom).toBe(125);
  });

  it("runs settings migrations on first load and stores the version", async () => {
    const area = new MemoryBrowserArea();
    const adapter = new BrowserStorageAdapter(area);
    await adapter.load();
    const stored = area.dump();
    expect(stored.settingsVersion).toBe("2.0.30");
    const settings = stored.settings as Record<string, unknown>;
    expect(Array.isArray(settings.sorting)).toBe(true);
  });

  it("does not re-run migrations when the version matches", async () => {
    const area = new MemoryBrowserArea();
    await area.set({
      settings: { zoom: 100, welcomeScreenShown: true },
      settingsVersion: "2.0.30",
    });
    const adapter = new BrowserStorageAdapter(area);
    await adapter.load();
    expect(adapter.getConfig("welcomeScreenShown")).toBe(true);
    expect(adapter.getConfig("sorting")).toBeUndefined();
  });
});
