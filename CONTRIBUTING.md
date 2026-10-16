# Contributing to sleek-firefox-extension

Thanks for your interest in contributing! This fork adapts [sleek](https://github.com/ransome1/sleek), the open-source todo.txt desktop app, into a Firefox extension. See [ROADMAP.md](ROADMAP.md) for the implementation plan and current status.

We welcome contributors skilled in `React`, `TypeScript`, `WebExtensions` and `vitest`.

## Where to report what

- **Issues specific to the Firefox extension** (storage, manifest, extension build, import/export): open an issue in this repository.
- **Issues shared with the desktop app** (todo.txt parsing, filters, UI behavior): consider reporting them upstream at [ransome1/sleek](https://github.com/ransome1/sleek/issues) so the whole community benefits; cross-link the issue here if it affects the fork.
- **Feature requests**: open a feature request issue in this repository; for loose ideas, discuss first in [ransome1/sleek Discussions](https://github.com/ransome1/sleek/discussions) when the topic also applies to the original project.

## Getting started

Prerequisites: latest version of Git and Node.js (`>= 26`).

1. Fork and clone this repository.
2. Install dependencies: `npm install`
3. Start the desktop dev server: `npm run dev`

## Pull requests

1. Create a new branch based on `main`.
2. Make your changes, adhering to the [coding guidelines](#coding-guidelines).
3. Write tests using [vitest](https://vitest.dev/guide/) to cover your changes.
4. Ensure tests pass: `npm run test`
5. Check formatting: `npm run format` (use `npm run format:write` to fix).
6. Run `npm run lint` and `npm run typecheck`.
7. Commit using the [commit guidelines](#commit-guidelines).
8. Push your branch and open a pull request against this repository's `main` branch.

New feature pull requests without prior discussion in an issue will receive low priority for review.

## Extension-specific guidance

- Follow [ROADMAP.md](ROADMAP.md): the desktop app must keep building and passing tests; the extension is an additional target, not a replacement.
- All UI-to-backend communication must go through the `window.api` bridge so the same renderer code works on Electron and WebExtension.
- Persist data exclusively via the storage adapter (`browser.storage.local` in the extension); never add direct filesystem or network access.
- Keep permissions in `manifest.json` to the minimum required.
- No analytics or telemetry in the extension build.
- Run `web-ext lint` on the extension build before submitting changes that touch it.

## Coding guidelines

- Write lean and efficient code. Avoid unnecessary complexity or redundant logic.
- Follow the [React coding style guide](https://reactjs.org/docs/style-guide.html) for writing React components.
- Use meaningful and descriptive variable and function names.
- Prioritize code readability over cleverness.
- Consider the user interface and user experience when adding new functionality.

## Testing

- sleek uses [vitest](https://vitest.dev/guide/) for unit testing: run `npm test`.
- Test files live next to the module they cover, e.g. `Module.ts` & `Module.test.ts`.
- Ensure existing tests pass before contributing; aim for high coverage on new code.
- Changes to the storage adapter must pass the shared contract tests on both adapters.

## Commit guidelines

- Use descriptive and meaningful commit messages.
- Separate the subject from the body with a blank line.
- Start the subject with a verb in the imperative mood (e.g., "Add," "Fix," "Update").
- Keep the subject line short and concise (preferably 50 characters or less).
- Reference relevant issues or pull requests in the commit message if applicable.

Example:

```
Add storage adapter contract tests

Cover the BrowserStorageAdapter with the same contract suite used
for ElectronStorageAdapter.

Fixes #123
```

## Credits

This fork builds on [sleek](https://github.com/ransome1/sleek) by [Robin Ahle](https://github.com/ransome1), MIT licensed. Contributions that fix issues shared with the original project are encouraged to also be offered upstream.
