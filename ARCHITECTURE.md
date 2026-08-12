# Architecture

Header Ext uses a layered, feature-oriented architecture. The goal is to keep
browser APIs and DNR details out of business logic, while keeping UI code close
to the capability it implements.

## Dependency Direction

```text
entrypoints
    ↓
app
    ↓
features
    ↓
application
    ↓
platform ───→ domain
    ↓
shared
```

The diagram describes the allowed direction, not a requirement that every
module must depend on every lower layer:

- `domain` is pure business data and derivation. It must not import platform,
  application, feature, or app modules.
- `platform` adapts browser APIs, storage, files, and DNR. It may depend on
  `domain`, but never on application or UI modules.
- `application` owns long-lived application state, synchronization, i18n, and
  application hooks. It may coordinate `domain` and `platform`.
- `features` implement user-facing capabilities and may use application state,
  domain types, platform ports when necessary, and shared UI.
- `app` composes features into the popup and options experiences.
- `entrypoints` are WXT adapters only: mount an app or start the background
  process.
- `shared` contains business-agnostic UI primitives, styles, and utilities.

Oxlint enforces the most important lower-to-upper dependency restrictions in
`.oxlintrc.json`. Browser globals are restricted outside `src/platform/browser`.

## Directory Map

```text
entrypoints/
  background.ts               # WXT service-worker adapter
  options/                    # HTML + React mount only
  popup/                      # HTML + React mount only

src/
  app/
    options/                  # Options page composition and page CSS
    popup/                    # Popup composition and popup-only components

  application/
    profile-store/            # Zustand state, persistence orchestration, actions
    hooks/                    # State-aware application hooks
    i18n/                     # i18next setup and persisted language selection

  domain/
    models.ts                 # Business types and supported value sets
    profile-status.ts         # Pure profile/workspace derivations
    templates.ts              # Rule template construction
    transfer.ts               # Pure import/export schema and normalization

  features/
    workspace/                # Profile, rule, filter, variable editing
    preferences/              # Theme, language, global pause controls
    data-transfer/            # Import/export user flow

  platform/
    browser/                  # WebExtension API adapter and capabilities
    storage/                  # storage.local state repository
    dnr/                      # DNR compilation and rule application
    files/                    # Browser file download/read adapters

  shared/
    ui/                       # Business-agnostic UI primitives
    styles/                   # Design tokens and shared global styles
    lib/                      # Generic helpers such as cn()
```

## Public APIs

Cross-layer imports should prefer each layer or feature's `index.ts` entry:

```ts
import { useProfileStore } from "@/src/application";
import type { Profile } from "@/src/domain";
import { LanguageSwitcher } from "@/src/features/preferences";
import { getActiveTab } from "@/src/platform/browser";
import { Button } from "@/src/shared/ui";
```

Deep imports are acceptable inside the same feature or when selecting a
specific shared primitive bundle such as `@/src/shared/ui/controls`. App code
must not import another app's private modules.

## Data Flow

```text
feature UI
  → application/profile-store
  → platform/storage
  → storage.local
       ├─→ popup/options store synchronization
       └─→ background → platform/dnr → declarativeNetRequest
```

`storage.local` remains the source of truth. `meta.activeProfileId` identifies
the profile being edited, while `meta.enabledProfileIds` identifies every
profile compiled into active DNR rules. `meta.globalPaused` clears all applied
rules.

## Placement Guide

- New business types or pure derivations: `src/domain/`.
- New browser, storage, file, or DNR integration: `src/platform/`.
- New persistent state or state-aware hooks: `src/application/`.
- New end-user capability: create or extend a folder in `src/features/`.
- Popup/options-only composition: `src/app/popup` or `src/app/options`.
- Generic primitives with no Header Ext concepts: `src/shared/ui`.
- WXT metadata or mounting code only: `entrypoints/`.

Do not create generic `components`, `utils`, or `core` dumping grounds. Place
code by responsibility and dependency direction.
