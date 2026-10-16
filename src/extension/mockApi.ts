import { AttributeEntry, TodoObject } from "@sleek-types";
import colorsData from "../../resources/colors.json";
import { BrowserStorageAdapter } from "./BrowserStorageAdapter";

/**
 * Bridge exposing `window.api` for the Firefox extension web build,
 * same contract as src/preload/index.ts. Persistence goes through the
 * BrowserStorageAdapter (ROADMAP Phase 1); in the extension it wraps
 * browser.storage.local, in the web build/tests it wraps the in-memory
 * polyfill below. The in-memory seed data stands in for the todo.txt
 * file content until import/export lands (Phase 2).
 */

type Listener = (...args: unknown[]) => void;

const listeners: Map<string, Set<Listener>> = new Map();

const channel = (name: string): Set<Listener> => {
  if (!listeners.has(name)) listeners.set(name, new Set());
  return listeners.get(name)!;
};

const emit = (name: string, ...args: unknown[]): void => {
  channel(name).forEach((listener) => listener(...args));
};

export class MemoryStorageArea {
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
}

export const storageArea = new MemoryStorageArea();
export const storage = new BrowserStorageAdapter(storageArea);

void storage.load();

const todoLines: string[] = [
  "(A) Pay rent +home @finance due:2025-01-05",
  "Read about WebExtensions +learning @reading due:2025-01-10",
  "x 2024-12-30 Call the bank @finance",
];

const defaultConfig: Record<string, unknown> = {
  appendCreationDate: true,
  convertRelativeToAbsoluteDates: false,
  useHumanFriendlyDates: false,
  bulkTodoCreation: false,
  weekStart: 1,
  language: "en",
  tray: false,
  invertTrayColor: false,
  startMinimized: false,
  notificationsAllowed: true,
  notificationThreshold: 1,
  colorTheme: "system",
  menuBarVisibility: true,
  disableAnimations: false,
  compact: false,
  zoom: 100,
  matomo: false,
  welcomeScreenShown: true,
  showCompleted: false,
  showHidden: false,
  showAttributesFromHiddenTodosInDrawer: false,
  fileSorting: false,
  sortCompletedLast: false,
  dueDateInTheFuture: true,
  files: [
    {
      active: true,
      todoFileName: "mock.txt",
      todoFilePath: "/mock/todo.txt",
      todoFileBookmark: null,
      doneFilePath: null,
      doneFileBookmark: null,
    },
  ],
  sorting: [{ value: "due", invert: false }],
  windowDimensions: { width: 1280, height: 800 },
  windowMaximized: false,
  windowPosition: { x: 0, y: 0 },
  shouldUseDarkColors: window.matchMedia?.("(prefers-color-scheme: dark)")
    ?.matches,
};

const patterns = {
  contexts: /(?:^|\s)@(\S+)/g,
  projects: /(?:^|\s)\+(\S+)/g,
  due: /(?:^|\s)due:(\S+)/g,
  priority: /(?:^|\s)\(([A-Z])\)/g,
};

function extract(lines: string[], pattern: keyof typeof patterns): string[] {
  const regex = patterns[pattern];
  const values: string[] = [];
  for (const line of lines) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      values.push(match[1]);
    }
  }
  return [...new Set(values)];
}

function buildAttributes(): Record<string, AttributeEntry[]> {
  const group = (
    lines: string[],
    key: keyof typeof patterns,
  ): AttributeEntry[] =>
    extract(lines, key).map((value) => ({
      count: 1,
      notify: false,
      hide: false,
      value: [value],
    }));
  return {
    priority: group(todoLines, "priority"),
    due: group(todoLines, "due"),
    t: [],
    contexts: group(todoLines, "contexts"),
    projects: group(todoLines, "projects"),
    rec: [],
    pm: [],
    hidden: [],
    created: [],
    completed: [],
    customProtocol: [],
  };
}

function buildTodoObjects(): TodoObject[] {
  return todoLines.map((line, index) => {
    const complete = line.startsWith("x ");
    const priorityMatch = line.match(/\(([A-Z])\)/);
    const dueMatch = line.match(/(?:^|\s)due:(\S+)/);
    const createdMatch = line.match(/(?:^|\s)(\d{4}-\d{2}-\d{2})/);
    const body = line
      .replace(/^\([^)]*\)\s*/, "")
      .replace(/^x \d{4}-\d{2}-\d{2}\s*/, "")
      .replace(/^x\s*/, "");
    return {
      body,
      lineNumber: index + 1,
      complete,
      created: createdMatch?.[1] ?? null,
      completed: complete ? (createdMatch?.[1] ?? null) : null,
      contexts: extract([line], "contexts"),
      projects: extract([line], "projects"),
      priority: priorityMatch?.[1] ?? null,
      hidden: /\bh:1\b/.test(line),
      due: dueMatch?.[1] ?? null,
      dueString: dueMatch?.[1] ?? null,
      t: null,
      tString: null,
      rec: null,
      pm: null,
      string: line,
      notify: false,
    };
  });
}

const mockApi = {
  store: {
    getConfig(key?: string): Record<string, unknown> {
      const value = storage.getConfig(key);
      if (key) {
        return (value ?? defaultConfig[key] ?? null) as Record<string, unknown>;
      }
      return { ...defaultConfig, ...(value as Record<string, unknown>) };
    },
    setConfig(property: string, value: unknown): void {
      storage.setConfig(property, value);
      emit("settingsChanged", {
        ...defaultConfig,
        ...(storage.getConfig() as Record<string, unknown>),
      });
    },
    setFilters(property: string, value: unknown): void {
      storage.setFilters(property, value);
    },
    getFilters(key?: string): Record<string, unknown> {
      const value = storage.getFilters(key);
      if (key) {
        return (value ?? null) as Record<string, unknown>;
      }
      return (value ?? {}) as Record<string, unknown>;
    },
    getColors(key?: string): Record<string, unknown> {
      // Colors.ts reads the whole palette via getColors("colors")
      if (!key || key === "colors") {
        return (storage.getColors("colors") ?? colorsData) as Record<
          string,
          unknown
        >;
      }
      const colors = storage.getColors("colors") as Record<string, unknown>;
      return { [key]: colors?.[key] } as Record<string, unknown>;
    },
    notifiedTodoObjects(value: unknown): void {
      storage.setNotifiedTodoObjects(value);
    },
  },
  deleteFilterValue(params: { attrType: string; valueToDelete: string }): void {
    params satisfies { attrType: string; valueToDelete: string };
  },
  renameFilterValue(params: {
    attrType: string;
    oldValue: string;
    newValue: string;
  }): void {
    params satisfies { attrType: string; oldValue: string; newValue: string };
  },
  ipcRenderer: {
    send(channelName: string, ...args: unknown[]): void {
      switch (channelName) {
        case "requestData": {
          const requestedData = {
            headers: {
              availableObjects: todoLines.length,
              visibleObjects: todoLines.filter((line) => !line.startsWith("x "))
                .length,
              completedObjects: todoLines.filter((line) =>
                line.startsWith("x "),
              ).length,
            },
            attributes: buildAttributes(),
            filters: (storage.getFilters() ?? {}) as Record<string, unknown>,
            todoData: [
              {
                title: null,
                visible: true,
                todoObjects: buildTodoObjects(),
              },
            ],
          };
          emit("requestData", requestedData);
          break;
        }
        default:
          console.debug("[mock api] unhandled channel", channelName, args);
      }
    },
    on(channelName: string, func: Listener): () => void {
      channel(channelName).add(func);
      return () => channel(channelName).delete(func);
    },
    off(channelName: string, func: Listener): void {
      channel(channelName).delete(func);
    },
  },
};

declare global {
  interface Window {
    api: typeof mockApi;
    _mtm: unknown[];
    _paq: unknown[];
  }
}

window.api = mockApi as unknown as typeof window.api;

export {};
