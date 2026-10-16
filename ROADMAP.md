# Roadmap: sleek as a Firefox extension

Goal: reuse the existing React UI and todo.txt domain logic (parsing, filters, recurrence, grouping, sorting) and replace the Electron desktop shell with a WebExtension shell. Data is stored in `browser.storage.local`, with explicit import/export of `todo.txt` / `done.txt` files.

Guiding principle: the desktop app stays intact and keeps building. All UI-to-backend communication goes through the single existing bridge (`window.api`, exposed by `src/preload/index.ts`), which is the only layer replaced.

## Phase 0 — Preparation and foundation (≈ 1 week)

- [ ] Create a separate extension build target (`vite.config.extension.ts`) without `electron-vite`; the renderer is a plain web bundle.
- [ ] Establish the rule that all UI-to-backend calls go through `window.api`.
- [ ] Branch strategy: extension work happens on top of `main` (branch `vibe/firefox-extension`), desktop remains the baseline.

Deliverable: renderer web build running against a mocked API.

## Phase 1 — Storage contract and abstraction (≈ 1–2 weeks)

- [ ] Define a `StorageAdapter` interface covering current store operations: `getConfig`/`setConfig`, filters, colors, notified todo objects, and file operations (`readTodoFile`, `writeTodoFile`, `appendTodo`, `archiveTodo`).
- [ ] Implement `ElectronStorageAdapter` wrapping the current code (desktop behavior unchanged).
- [ ] Implement `BrowserStorageAdapter` backed by `browser.storage.local`: settings/filters/colors, plus todo/done file contents stored as strings.
- [ ] Port the settings schema migrations from `src/main/Stores.ts` to a versioned migration chain in `browser.storage.local`.
- [ ] Expose the adapter uniformly: preload bridge on Electron, injected script exposing the same `window.api` in the extension.

Known friction: the WebExtension API is fully async while the current bridge uses `ipcRenderer.sendSync` for some calls (`storeGetConfig`, `storeGetFilters`, `storeGetColors`); those flows must become async.

Deliverable: both adapters passing the same contract tests (vitest) against an in-memory polyfill.

## Phase 2 — Async UI and desktop-specific teardown (≈ 1–2 weeks)

- [ ] Replace `sendSync` calls in the renderer with promise-based flows; adjust affected components/hooks.
- [ ] Implement import/export: file input → read `.txt` → write to `browser.storage.local`; export current content as `.txt` download.
- [ ] Disable in extension mode: filesystem watcher (`chokidar`), native file dialogs, Mac App Store scoped-resource logic, Matomo analytics (`src/renderer/Matomo.tsx`).
- [ ] Introduce a mode flag to keep desktop and extension code paths in the same codebase.

Deliverable: full renderer working in Firefox with data from extension storage.

## Phase 3 — Manifest, lifecycle and integration (≈ 1–2 weeks)

- [ ] Author `manifest.json` (MV3 with `background.scripts`): action opens the UI in a tab; permissions limited to `storage` (plus `downloads`/`notifications` only if needed); `browser_specific_settings.gecko.id` for a stable storage profile.
- [ ] Keep i18next for localization (14 languages already in `src/locales/`).
- [ ] Replace native notifications with `browser.notifications`.
- [ ] Generate icons from `resources/icon.iconset/`.
- [ ] Ensure prompt writes to storage and add an "unsaved/not exported" reminder to the UI.

Deliverable: extension loadable via `about:debugging`, full flow working: add → edit → complete → archive → export.

## Phase 4 — Testing and quality (≈ 1–2 weeks, parallel)

- [ ] Contract tests for `StorageAdapter` run against real extension storage (Playwright `launchPersistentContext` with Firefox).
- [ ] Adapt existing Playwright e2e tests to the extension target.
- [ ] Keep the desktop test suite green — zero desktop regression is an acceptance criterion.
- [ ] Lint/typecheck/prettier pass for both targets; CI runs two pipelines.

## Phase 5 — Publication (≈ 1 week + AMO review time)

- [ ] Package with `web-ext build`, lint with `web-ext lint` from the start.
- [ ] Submit to [addons.mozilla.org](https://addons.mozilla.org); base the listing privacy policy on `PRIVACY.md` with analytics references removed.
- [ ] Document the storage limitation honestly on the listing: tasks live in Firefox; use import/export to sync with todo.txt files.
- [ ] Post-launch: gather feedback on the "live file" limitation; consider Native Messaging as an optional advanced mode in the future.

## Risks and mitigations

| Risk                                             | Impact | Mitigation                                                                        |
| ------------------------------------------------ | ------ | --------------------------------------------------------------------------------- |
| Sync → async migration in the UI                 | High   | Adapter pattern; audit all `sendSync` usages in Phase 1; contract tests           |
| Loss of live file sync disappoints desktop users | Medium | Easy export; clear communication; Native Messaging as future option               |
| AMO review rejecting telemetry/permissions       | Medium | Minimal permissions; no analytics in extension build; `web-ext lint` from day one |
| Desktop/extension divergence over time           | Medium | Shared code, mode flag, dual CI pipelines from the start                          |

Total estimate: **6–9 weeks** to a publishable extension, with the main uncertainty in Phases 1–2 (async bridge and storage).
