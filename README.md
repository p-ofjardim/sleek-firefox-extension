# sleek-firefox-extension

sleek-firefox-extension is a community fork of [sleek](https://github.com/ransome1/sleek), the open-source (FOSS) todo manager based on the [todo.txt syntax](https://github.com/todotxt/todo.txt). The goal of this fork is to bring the sleek experience to the browser as a **Firefox extension (WebExtension)**.

The UI (React) and the todo.txt domain logic (parsing, filters, recurrence, grouping, sorting) are reused from the original project. The Electron desktop shell is replaced by a WebExtension shell: data is stored in `browser.storage.local`, with import/export of plain `todo.txt` / `done.txt` files to stay compatible with other todo.txt apps.

## Status

This fork is in an early stage. The WebExtension port is being implemented following [ROADMAP.md](ROADMAP.md). The Electron desktop application builds and runs from this repository unchanged.

## Key differences from sleek desktop

| Aspect        | sleek (desktop)                                            | sleek-firefox-extension                     |
| ------------- | ---------------------------------------------------------- | ------------------------------------------- |
| Runtime       | Electron app for Windows, macOS, Linux                     | Firefox WebExtension                        |
| Storage       | Reads/writes `todo.txt` files on disk, watches for changes | Stores todo data in `browser.storage.local` |
| File sync     | Live, via filesystem watcher                               | Via explicit import/export of `.txt` files  |
| Settings      | `electron-store`                                           | `browser.storage.local`                     |
| Notifications | Native OS notifications                                    | `browser.notifications`                     |

## Development setup

Prerequisites: latest Git and Node.js (`>= 26`).

```bash
git clone https://github.com/p-ofjardim/sleek-firefox-extension.git
cd sleek-firefox-extension
npm install
```

### Desktop app (Electron)

The desktop app is unchanged and remains the baseline:

```bash
npm run dev          # start the dev server
npm run build        # build the app
npm test             # run unit tests (vitest)
```

### Firefox extension (once implemented)

The extension will be loaded as a temporary add-on during development:

1. Build the extension target (see [ROADMAP.md](ROADMAP.md) for current state).
2. Open `about:debugging#/runtime/this-firefox` in Firefox.
3. Click **Load Temporary Add-on** and select the built `manifest.json`.

Packaging uses [`web-ext`](https://github.com/mozilla/web-ext) and publication targets [addons.mozilla.org](https://addons.mozilla.org).

## Data and privacy

Tasks live inside the extension's local storage in your Firefox profile. Nothing is sent anywhere; use the import/export feature to exchange `todo.txt` files with other applications. See [PRIVACY.md](PRIVACY.md) and note that the analytics (Matomo) present in the desktop app are removed in the extension build.

## Documentation

- [ROADMAP.md](ROADMAP.md) — implementation plan for the Firefox extension port
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to contribute to this fork
- [CHANGELOG.md](CHANGELOG.md) — changes in this fork
- [PRIVACY.md](PRIVACY.md) — privacy policy

## Credits and license

This project is a fork of [sleek](https://github.com/ransome1/sleek) by [Robin Ahle](https://github.com/ransome1), licensed under the [MIT License](LICENSE). sleek-firefox-extension is licensed under the same MIT License; the original copyright notice is preserved in [LICENSE](LICENSE).

All credit for the original application goes to Robin Ahle. If you like the desktop app, consider [sponsoring the original project](https://github.com/sponsors/ransome1) or [donating via Liberapay](https://liberapay.com/ransome1/donate).
