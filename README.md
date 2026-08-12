# Header Ext

English | [简体中文](./README-ZH.md)

A browser extension for modifying HTTP request/response headers, appending cookies, and redirecting URLs by rule. Supports Chrome and Firefox (MV3).

## Installation

- Chrome Web Store: <https://chromewebstore.google.com/detail/header-ext/fmeahkfblcdknabpmhlmbkconfcaoemi>
- Microsoft Edge Add-ons: <https://microsoftedge.microsoft.com/addons/detail/header-ext/ablejeigpmcijedpfaefhjdijjlnphni>
- Firefox Add-ons: <https://addons.mozilla.org/zh-CN/firefox/addon/header-ext/>

If you cannot access Chrome Web Store, Microsoft Edge Add-ons, or Firefox Add-ons, download the matching zip from [Releases](https://github.com/binge6/header-ext/releases), unzip it, and load the extracted directory manually:

- Chrome / Edge: open `chrome://extensions` or `edge://extensions`, enable Developer mode, then choose **Load unpacked**.
- Firefox: open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, then select `manifest.json` from the extracted directory.

## Features

- **Request/response header editing**: Add, remove, or modify headers, with templates (common presets like CORS and CSP) and autocomplete from history.
- **Cookie appending**: Append `Cookie` to request headers, or `Set-Cookie` to response headers.
- **URL redirection**: Supports plain URL replacement and regex backreference (`\1`) rewrites.
- **Rule filtering**: AND-combined filters by tab URL, request domain, request URL regex, excluded URL, and request method (multi-select).
- **Profile management**: Switch between multiple configurations, with JSON import/export.
- **Internationalization**: Built-in Chinese and English (i18next).
- **Light/dark theme**: Follow the system or switch manually.

## Tech Stack

- [WXT](https://wxt.dev/) + React 19 + TypeScript
- Radix UI primitives + shadcn/ui-style local components
- Tailwind CSS v4 + Lucide icons
- CVA component variants + `tw-animate-css`
- Zustand for state management
- `declarativeNetRequest` + Service Worker (no content script)

## Development

```bash
pnpm install
pnpm dev            # Chrome MV3
pnpm dev:firefox    # Firefox MV3
```

Development mode does not launch the browser automatically. Manually load `.output/chrome-mv3-dev` (or the corresponding firefox directory) as an unpacked extension.

## Build

```bash
pnpm build           # Chrome
pnpm build:firefox   # Firefox
pnpm zip             # Package Chrome zip
pnpm zip:firefox     # Package Firefox zip
pnpm compile         # Type check only
pnpm lint            # Oxlint
pnpm format          # Format with Oxfmt
pnpm check           # Format check + lint + type check
```

## Project Structure

```
entrypoints/
  background.ts        # WXT service-worker adapter
  popup/               # Popup HTML + React mount
  options/             # Options HTML + React mount
src/
  app/                 # Popup/options composition and page-only UI
  application/         # Zustand state, synchronization, hooks, i18n
  domain/              # Pure models, derivations, templates, transfer schema
  features/            # Workspace, preferences, and data-transfer capabilities
  platform/            # Browser, storage, file, and DNR adapters
  shared/              # Business-agnostic UI, styles, and utilities
public/icon/           # 16/32/48/96/128 icons
```

Dependencies point from entrypoints and app composition toward features,
application, platform, and domain. Lower layers never import UI or app layers.
See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full dependency rules and
placement guide.

## Permissions

Profiles are stored only in local `storage.local`; no data is ever sent to any remote server. For Firefox, `data_collection_permissions: { required: ["none"] }` is declared in the `gecko` field of `wxt.config.ts`, meeting AMO review requirements.
