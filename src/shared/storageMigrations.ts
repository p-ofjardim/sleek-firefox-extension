import { StorageAdapter } from "./StorageAdapter";
import colorsData from "../../resources/colors.json";

/**
 * Versioned migration chain ported from src/main/Stores.ts for
 * browser.storage.local (ROADMAP Phase 1). Desktop-only keys (tray,
 * window state, file watchers) are migrated with defaults because the
 * schema is shared, even though the extension never reads most of them.
 */

type MigrationFn = (adapter: StorageAdapter) => void;

export const settingsMigrations: Record<string, MigrationFn> = {
  "2.0.0": (config) => {
    config.setConfig("sorting", [
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
    config.setConfig("accordionOpenState", [
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    config.setConfig("files", []);
    config.setConfig("appendCreationDate", false);
    config.setConfig("showCompleted", true);
    config.setConfig("showHidden", false);
    config.setConfig("windowMaximized", false);
    config.setConfig("fileSorting", false);
    config.setConfig("convertRelativeToAbsoluteDates", true);
    config.setConfig("thresholdDateInTheFuture", true);
    config.setConfig("colorTheme", "system");
    config.setConfig(
      "shouldUseDarkColors",
      globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false,
    );
    config.setConfig("notificationsAllowed", true);
    config.setConfig("notificationThreshold", 2);
    config.setConfig("showFileTabs", true);
    config.setConfig("isNavigationOpen", true);
    config.setConfig("tray", false);
    config.setConfig("zoom", 100);
    config.setConfig("matomo", false);
    config.setConfig("welcomeScreenShown", false);
  },
  "2.0.1": (config) => {
    config.setConfig("anonymousUserId", crypto.randomUUID());
  },
  "2.0.2": (config) => {
    config.setConfig("dueDateInTheFuture", true);
  },
  "2.0.4": (config) => {
    config.setConfig("bulkTodoCreation", false);
    config.setConfig("disableAnimations", false);
  },
  "2.0.10": (config) => {
    config.setConfig("useHumanFriendlyDates", false);
    config.setConfig("excludeLinesWithPrefix", null);
  },
  "2.0.12": (config) => {
    config.setConfig("channel", "WebExtension");
  },
  "2.0.13": (config) => {
    config.setConfig("chokidarOptions", {
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 100 },
    });
  },
  "2.0.14": (config) => {
    config.setConfig("menuBarVisibility", true);
  },
  "2.0.17": (config) => {
    config.setConfig("compact", false);
    config.setConfig("sortCompletedLast", false);
  },
  "2.0.19": (config) => {
    config.setConfig("invertTrayColor", false);
    config.setConfig("startMinimized", false);
  },
  "2.0.26": () => {
    // desktop: deletes customStylesPath; nothing to do for fresh installs
  },
  "2.0.27": (config) => {
    config.setConfig("enableSafeWrites", true);
  },
  "2.0.28": (config) => {
    config.setConfig("showAttributesFromHiddenTodosInDrawer", true);
  },
  "2.0.30": (config) => {
    if (config.getConfig("welcomeScreenShown") === undefined) {
      config.setConfig("welcomeScreenShown", false);
    }
  },
};

export const filtersMigrations: Record<string, MigrationFn> = {
  "2.0.19": (filters) => {
    filters.setFilters("attributes", {});
  },
  "2.0.28": (filters) => {
    filters.setFilters("hiddenCategories", []);
  },
};

export const colorsMigrations: Record<string, MigrationFn> = {
  "2.0.26": (colors) => {
    colors.setColors("colors", colorsData);
  },
};

export const SCHEMA_VERSIONS = {
  settings: Object.keys(settingsMigrations).at(-1)!,
  filters: Object.keys(filtersMigrations).at(-1)!,
  colors: Object.keys(colorsMigrations).at(-1)!,
} as const;

function compareVersions(a: string, b: string): number {
  const pa = a.split(/[-.]/).map(Number);
  const pb = b.split(/[-.]/).map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da - db;
  }
  return 0;
}

export function runMigrations(
  adapter: StorageAdapter,
  store: "settings" | "filters" | "colors",
  fromVersion: string | null,
  toVersion: string,
): void {
  const migrations =
    store === "settings"
      ? settingsMigrations
      : store === "filters"
        ? filtersMigrations
        : colorsMigrations;
  const applicable = Object.keys(migrations)
    .filter((version) => {
      if (!fromVersion) return true;
      return compareVersions(version, fromVersion) > 0;
    })
    .sort(compareVersions);
  for (const version of applicable) {
    migrations[version](adapter);
  }
  void toVersion;
}
