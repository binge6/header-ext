# Header Ext User Manual

English | [简体中文](./user-manual.zh-CN.md)

Header Ext is a browser extension for Chrome, Edge, and Firefox. It modifies HTTP request and response headers, appends cookies, redirects URLs, and organizes different debugging scenarios with profiles, filters, and variables.

> Header Ext processes rules and configuration locally in your browser and does not send user data to any remote service. Rules are enforced through the browser's `declarativeNetRequest` (DNR) API without a content script.

## Contents

- [1. Installation and Access](#1-installation-and-access)
- [2. Core Concepts](#2-core-concepts)
- [3. Quick Start](#3-quick-start)
- [4. Popup](#4-popup)
- [5. Full Settings Page](#5-full-settings-page)
- [6. Profile Management](#6-profile-management)
- [7. Mods: Changing Requests and Responses](#7-mods-changing-requests-and-responses)
- [8. Filters: Limiting the Scope](#8-filters-limiting-the-scope)
- [9. Per-Rule Advanced Conditions](#9-per-rule-advanced-conditions)
- [10. Variables](#10-variables)
- [11. Quick Templates](#11-quick-templates)
- [12. Importing, Sharing, and Backups](#12-importing-sharing-and-backups)
- [13. Global Pause and Tab Lock](#13-global-pause-and-tab-lock)
- [14. Status, Risk, and Error Indicators](#14-status-risk-and-error-indicators)
- [15. Language, Theme, and Local Storage](#15-language-theme-and-local-storage)
- [16. Common Examples](#16-common-examples)
- [17. Troubleshooting](#17-troubleshooting)
- [18. Browser and DNR Limitations](#18-browser-and-dnr-limitations)

## 1. Installation and Access

### 1.1 Install from an extension store

- [Chrome Web Store](https://chromewebstore.google.com/detail/header-ext/fmeahkfblcdknabpmhlmbkconfcaoemi)
- [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/header-ext/ablejeigpmcijedpfaefhjdijjlnphni)
- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/header-ext/)

After installation, pin Header Ext to the browser toolbar for quick profile switching and rule editing.

### 1.2 Install a release manually

If you cannot access an extension store, download the correct zip package from the project's [Releases](https://github.com/binge6/header-ext/releases) page and extract it.

- Chrome / Edge:
  1. Open `chrome://extensions` or `edge://extensions`.
  2. Enable **Developer mode**.
  3. Click **Load unpacked**.
  4. Select the extracted extension directory.
- Firefox:
  1. Open `about:debugging#/runtime/this-firefox`.
  2. Click **Load Temporary Add-on**.
  3. Select `manifest.json` from the extracted directory.

A temporary Firefox add-on is removed after Firefox restarts. Install from Firefox Add-ons for regular use.

### 1.3 Open the two interfaces

Header Ext provides two synchronized interfaces:

- **Popup**: click the toolbar icon. It is designed for quick profile switching, rule editing, and creating filters from the current page.
- **Full settings page (Options)**: select **Open full settings** from the popup's **More actions** menu. It is better for managing many profiles, rules, variables, and imports or exports.

Changes in either interface are saved and synchronized automatically. There is no separate Save button for rule editing.

## 2. Core Concepts

### 2.1 Profile

A profile is a complete configuration for one scenario. It contains:

- Header, Cookie, and Redirect rules;
- Profile-level filters;
- Profile variables;
- A profile name and activation state.

For example, you might create separate profiles for Local Development, Staging, Disable Cache, and API Debugging.

### 2.2 Current profile and always-on profiles

- **Current profile**: the profile currently displayed and edited. It also participates in rule delivery by default.
- **Always-on profile**: a pinned profile that remains active regardless of which profile is currently selected.

The effective configuration is:

```text
Current profile + all always-on profiles
```

Switching profiles does not disable profiles that are pinned as always on. If multiple active profiles modify the same header, cookie, or redirect source, the settings page reports a potential conflict.

### 2.3 Mod

A Mod is a rule that performs a network modification. Header Ext supports five types:

1. Request header modification;
2. Response header modification;
3. Request Cookie append;
4. Response Set-Cookie append;
5. Redirect / URL rewrite.

### 2.4 Filter

A Filter defines profile-level scope. It applies to all rules in that profile and can restrict them by tab scenario, request domain, request URL, excluded URL, or request method.

### 2.5 Advanced conditions

Each rule can also have its own advanced conditions, including URL, domain, resource type, and request method constraints. Profile-level filters and per-rule advanced conditions are combined.

## 3. Quick Start

The following example adds `X-Debug: true` to requests sent to `api.example.com`:

1. Click the Header Ext toolbar icon.
2. Select an existing profile, or click **New profile** at the bottom of the profile panel.
3. Click **Add Mod** in the profile toolbar.
4. Select **Add request header**.
5. Enter:
   - Header name: `X-Debug`
   - Header value: `true`
   - Operation: Set
6. Click **Add a filter**.
7. Select **Request domain filter** and enter `api.example.com`.
8. Make sure the checkboxes on the rule and filter are enabled.
9. Send the target request again and inspect its Request Headers in the browser DevTools Network panel.

Every field is saved automatically. A domain filter includes subdomains, so `api.example.com` also matches `v2.api.example.com`.

## 4. Popup

### 4.1 Top toolbar

The popup header shows the number of active profiles and enabled rules. It also provides:

- **Pause / resume all rules**: pausing removes delivered rules; resuming rebuilds and delivers them.
- **Lock to current tab**: temporarily restrict all active rules to the current tab.
- **Language**: switch between English and Simplified Chinese.
- **Theme**: choose Light, Dark, or Follow system.
- **More actions**:
  - Open full settings;
  - Open the operation manual;
  - Import configuration;
  - Share configuration.

The extension badge normally shows the number of enabled rules in the active stack. It shows `off` while globally paused.

### 4.2 Profile panel

The profile panel on the left can be expanded or collapsed:

- Click a profile to make it current.
- Click the pin button to enable or disable always-on mode.
- Right-click a profile to rename, duplicate, or delete it.
- Expanded mode shows the enabled rule count and indicators for global-scope risk and advanced conditions.
- Use the button at the bottom to create a profile.

### 4.3 Current profile toolbar

The current profile toolbar provides:

- Add Mod;
- Add Filter;
- Add variable;
- Apply a quick template;
- Enable or disable always-on mode;
- Rename, duplicate, or delete the profile.

### 4.4 Create filters from the current page

When the popup is opened on a regular `http` or `https` page, new filters can be prefilled with the current page context:

- Tab filter: `*://current-host/*`
- Request domain filter: the current hostname
- Request URL filter: a regular expression for the current hostname
- Exclude request URL: the full current URL

These values might not be available on browser-internal pages, extension pages, or other non-HTTP(S) pages.

## 5. Full Settings Page

The full settings page is intended for larger configurations and has three main areas.

### 5.1 Left profile panel

You can:

- Create, switch, duplicate, rename, and delete profiles;
- Enable always-on mode;
- Enter batch-delete mode;
- Select all profiles, invert the selection, or select empty profiles.

If every profile is deleted, Header Ext automatically creates an empty `Profile 1` so that there is always an editable profile.

### 5.2 Center editor

The center area displays the current profile in this order:

1. Profile summary and scope;
2. Global-scope risk warning;
3. Profile-level filters;
4. Variables;
5. Mod rules.

Each group can add entries and enable or disable the entire group. Rules can also be reordered within their group using the drag handle.

### 5.3 Right status panel

The right panel displays:

- Number of active profiles;
- Number of enabled rules;
- Global pause status;
- Active profiles without a configured scope;
- Potential conflict groups;
- Profiles in the active stack;
- Number of rules using advanced conditions.

Conflict indicators are informational and do not necessarily mean that the browser rejected a rule. When a conflict appears, check whether multiple active profiles modify the same target.

## 6. Profile Management

### 6.1 Create a profile

Click **New profile** to create a uniquely named profile and make it current. A new profile starts without rules or filters.

### 6.2 Switch profiles

Click a profile to make it current. After switching:

- The newly selected profile becomes active by default;
- The previous profile stops being active unless it is always on;
- All always-on profiles remain active.

### 6.3 Always-on mode

Use the pin button to keep a profile active across profile switches. This is useful for shared rules such as disabling cache, adding a common debug header, or defining reusable environment variables.

> Avoid pinning many conflicting profiles. The settings page reports potential conflicts when active profiles modify the same header, cookie name, or redirect source.

### 6.4 Rename and unique names

Profile names are kept unique automatically. If a name already exists, Header Ext adds a suffix such as `Local (2)`.

### 6.5 Duplicate a profile

Duplicating creates an independent copy containing the rules, filters, and variables. Internal IDs are regenerated, so editing the copy does not modify the source profile.

### 6.6 Delete and batch delete

- The popup can delete one profile at a time.
- The full settings page supports individual and batch deletion.
- Batch mode can select empty profiles, select all, or invert the current selection.

Deleting a profile also deletes all of its rules, filters, and variables. Header Ext asks for confirmation before deletion.

## 7. Mods: Changing Requests and Responses

### 7.1 Request and response headers

A Header rule contains:

- **Header name**: for example, `Authorization` or `X-Debug`.
- **Header value**: required for Set and Append; not used for Remove.
- **Operation**:
  - **Set**: set the header to the given value;
  - **Append**: append a value to the existing header;
  - **Remove**: remove the header.
- **Enabled checkbox**: a disabled rule is not delivered.
- **Advanced conditions**: further restrict the rule's scope.

The operation button cycles through **Set → Append → Remove**. Header names and values provide autocomplete suggestions from previous entries.

### 7.2 Append a request Cookie

**Add Cookie (request append)** requires a cookie name and value. Header Ext compiles them as:

```http
Cookie: name=value
```

This rule always uses Append and does not expose Set or Remove. If the target request already contains a cookie with the same name, the final behavior also depends on how the browser handles the Cookie request header.

### 7.3 Append a response Set-Cookie

**Add Set-Cookie (response append)** requires a cookie name and value. Header Ext compiles them as:

```http
Set-Cookie: name=value
```

Cookie attributes such as `Path`, `Domain`, `Secure`, and `SameSite` can be included in the value:

```text
abc; Path=/; Secure; SameSite=None
```

### 7.4 Redirect / URL rewrite

A Redirect rule has a source and destination:

- **Plain mode**:
  - The source uses DNR URL Filter syntax, such as `*://*.example.com/old/*`;
  - The destination must be a complete URL, such as `https://example.com/new/`.
- **Regular-expression mode**:
  - Enable **Use regex** in advanced conditions;
  - Enter a source regex such as `^https?://example\.com/old/(.*)`;
  - Use back-references in the destination, such as `https://example.com/new/\1`.

A regex Redirect requires a valid source regular expression. A rule with only a destination or an invalid regex is not registered and displays a warning.

### 7.5 Enable, disable, delete, and reorder

- The checkbox at the end of a row enables or disables that rule.
- The checkbox in a group header enables or disables all rules in that group.
- The delete button removes the rule immediately.
- The full settings editor and expanded popup editor allow drag-and-drop ordering within a rule group.

## 8. Filters: Limiting the Scope

### 8.1 Combination rules

Filters are combined as follows:

- **Different filter types are generally ANDed**: tab scenario, domain, URL regex, excluded URL, and request method must all match. However, DNR prevents a tab filter and a regex URL condition from being represented together in the same final rule. See the next section.
- **Entries of the same type are ORed**: for example, either of two domain entries can match.
- **Profile filters and per-rule advanced conditions are also ANDed**.
- If there is no enabled, non-empty profile filter, only the rule's own conditions restrict it. An enabled rule with no scope of its own can apply to every request.

For example:

```text
Tab scenario matches example.com
AND request domain matches api.example.com
AND request method is GET or POST
AND request URL is not under excluded.example.com
```

### 8.2 Tab filter

A Tab filter starts from a tab scenario and stores a DNR URL Filter such as:

```text
*://*.example.com/*
```

Multiple enabled Tab filters are ORed. Because of DNR limitations, the final rule matches network request URLs, not a tab title or a fixed tab ID. To strictly limit rules to the current tab, use **Lock to current tab** in the top toolbar.

> A Tab filter cannot be applied to a final rule that uses a regex URL condition, whether that regex comes from the rule itself or from a profile-level Request URL filter. A DNR rule cannot contain both `urlFilter` and `regexFilter`. Prefer domain, method, or another filter type for that combination.

### 8.3 Request domain filter

Enter one hostname, for example:

```text
api.example.com
```

It matches that hostname and its subdomains. Multiple domain entries are ORed. Do not include a scheme or path. Header Ext attempts to clean pasted URLs, but entering only the hostname is clearer.

### 8.4 Request URL filter

Request URL filters use JavaScript regular expressions:

```regex
^https?://api\.example\.com/v\d+/
```

Multiple valid expressions are combined with OR. An invalid expression is ignored and displays a warning while other valid expressions continue to work. If every enabled URL regex is invalid, rules fall back to the remaining conditions. With no other conditions, that can widen the scope to all requests, so fix invalid expressions promptly.

### 8.5 Exclude request URL

This filter accepts a URL but excludes by hostname. For example:

```text
https://static.example.com/assets/app.js
```

Header Ext extracts `static.example.com` and excludes requests to that hostname. The path is not used. You can also enter a hostname directly.

### 8.6 Request method filter

The multi-select supports:

- `CONNECT`
- `DELETE`
- `GET`
- `HEAD`
- `OPTIONS`
- `PATCH`
- `POST`
- `PUT`

You can select all methods or clear the selection. Browser DNR does not support `TRACE`, so Header Ext does not offer it.

### 8.7 Add filters from the current page

The popup prefills new Tab, domain, URL regex, and excluded URL filters with information from the current page. The full settings page has no current-tab context, so new entries start empty.

An empty entry does not create an effective scope. Fill it in, disable it, or delete it.

## 9. Per-Rule Advanced Conditions

Click the funnel icon on a rule row to configure the following conditions.

### 9.1 URL filter

- Plain mode uses a DNR URL Filter;
- Enable **Use regex** to use a regular expression;
- Leave the field empty to avoid narrowing the rule through this field.

For Redirect rules, the redirect source is already the rule's URL condition. The advanced panel therefore shows only the **Use regex** checkbox and does not duplicate the source input.

### 9.2 Include domains

The rule matches only the specified request domains. You can enter multiple domains; entries are ORed and include subdomains.

If both a profile-level Request domain filter and per-rule Include domains exist, Header Ext uses their intersection. If the intersection is empty, the rule is not delivered.

### 9.3 Exclude domains

The rule does not apply when a request matches any excluded domain. Per-rule excluded domains are combined with hostnames extracted from profile-level Exclude request URL filters.

### 9.4 Resource types

You can restrict a rule to resource types including:

- `main_frame`, `sub_frame`
- `xmlhttprequest`
- `script`, `stylesheet`
- `image`, `font`, `media`
- `websocket`
- `ping`
- `other`

With no selection, Header Ext uses all resource types supported by the current browser. Its default set avoids Chrome-specific types that Firefox does not support.

### 9.5 Request methods

You can restrict the methods allowed by a single rule. If the profile also has a Request method filter, Header Ext uses the intersection. If the intersection is empty, the rule is not delivered.

### 9.6 Regex condition conflicts

A single DNR rule can use only one `regexFilter`. If a rule has its own regex and its profile also has a Request URL regex, the profile regex cannot be added to that rule and Header Ext displays a conflict warning.

To resolve it:

- Combine both expressions into the rule's regex;
- Replace the profile-level regex with a domain, method, tab, or another filter;
- Split the behavior into separate profiles or rules.

## 10. Variables

### 10.1 Create a variable

Each profile has its own variables. A variable has a name, value, and enabled state:

```text
Name: apiToken
Value: Bearer abc123
```

### 10.2 Reference syntax

Use double braces:

```text
{{apiToken}}
```

Variables can be used in:

- Header names and values;
- Cookie names and values;
- Redirect sources and destinations;
- Per-rule URL Filters;
- Per-rule included and excluded domains;
- Profile-level Tab, domain, Request URL, and Exclude request URL filters.

Variables are substituted before the rules are delivered to the browser. Variables are not shared across profiles.

### 10.3 Duplicate variable names

If multiple enabled variables have the same name, the later variable in the list wins. Earlier enabled variables with that name display an overridden warning.

### 10.4 Undefined variables

When a rule or profile filter references a missing, empty, or disabled variable:

- For a single rule, that rule is not delivered;
- For a profile-level filter, the profile's rules are not delivered, preventing the scope from widening accidentally;
- The corresponding row or group displays an **Undefined variables** warning.

## 11. Quick Templates

A template appends preset rules to the current profile and does not replace existing rules.

### 11.1 Remove CSP

Adds two response-header removal rules:

- `Content-Security-Policy`
- `Content-Security-Policy-Report-Only`

This can help debug inline scripts or pages restricted by CSP. Use it only when you understand the security impact.

### 11.2 Allow CORS

Adds these response headers:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,PATCH`
- `Access-Control-Allow-Headers: *`
- `Access-Control-Allow-Credentials: true`

This is a client-side response-header modification for debugging. It does not change whether the server handles preflight requests correctly and cannot fix every CORS scenario.

### 11.3 Remove X-Frame-Options

Removes the `X-Frame-Options` response header to help test iframe embedding. The page can still be restricted by CSP `frame-ancestors`.

### 11.4 Custom User-Agent

Adds a rule that sets the `User-Agent` request header. Browsers may apply additional restrictions to protected headers, so verify the result in the Network panel.

### 11.5 Disable cache

Adds:

- `Cache-Control: no-cache, no-store, must-revalidate`
- `Pragma: no-cache`

After applying the template, add a profile filter or per-rule advanced condition if it should affect only a specific site.

## 12. Importing, Sharing, and Backups

### 12.1 Share profiles

Click **Share** and then:

1. Select one or more profiles;
2. Choose **Copy JSON** or **Download file**;
3. The default filename is `header-ext-config.json`.

The exported schema is `header-ext.v1`. It includes the selected profiles and the relevant subset of their activation state.

### 12.2 Import configuration

You can import by:

- Pasting Header Ext JSON;
- Selecting a `.json` file.

Opening a system file picker can unload the Firefox popup. Header Ext therefore directs Firefox users to the full settings page for file imports.

### 12.3 Merge behavior

Imports are **merged**, not used as a replacement:

- Existing profiles remain;
- Imported profiles receive new internal IDs;
- Duplicate names receive numeric suffixes;
- Imported profiles marked as always on remain always on after merging;
- Imported data does not forcibly replace the current profile, global pause state, language, theme, or Tab lock.

Invalid profiles in imported data are skipped. If the import contains no valid profile, the import fails and displays an error.

### 12.4 Backup recommendation

Before large edits, batch deletion, or moving to another browser:

1. Click **Share**;
2. Select all profiles;
3. Download the JSON file;
4. Store it in a safe location.

## 13. Global Pause and Tab Lock

### 13.1 Global pause

Global pause stops delivery for all profiles and clears the current dynamic rules. It does not delete configuration. Resuming recompiles the current profile together with all always-on profiles.

You can control it from:

- The pause / play button in the popup header;
- The **Globally paused** switch in the full settings header.

### 13.2 Lock to current tab

Click the lock icon in the popup header to add the current tab ID as a temporary condition to all active rules:

- Rules affect only the tab that was locked;
- The lock remains while switching profiles or editing rules;
- If another tab is locked, the button shows that tab's ID;
- Click again from the locked tab to unlock.

Tab lock is a temporary global scope. It does not belong to a profile and is not included in exported configuration.

If the locked tab has been closed, lock the rules again from another regular page or use the displayed tab ID to understand the current state.

## 14. Status, Risk, and Error Indicators

### 14.1 Enabled and disabled states

A profile marked **Enabled** belongs to the active stack: it is either the current profile or an always-on profile. Individual rules and filters also have their own enabled checkboxes.

### 14.2 Global-scope risk

A profile is marked as potentially applying to all requests when:

- It contains an enabled rule;
- It has no effective profile-level filter;
- At least one enabled rule also has no URL, domain, resource type, or request method scope of its own.

A Redirect-only profile usually has a source URL on each rule and therefore does not always trigger this warning.

This is a risk indicator rather than an error. Add an explicit scope to debugging rules to avoid affecting unrelated sites.

### 14.3 Potential conflicts

Header Ext can report conflicts when multiple active profiles modify the same target:

- The same request or response header name;
- The same Cookie or Set-Cookie name;
- The same Redirect source.

The browser's DNR behavior still determines the final execution result. If behavior is inconsistent, combine the conflicting rules into one profile or keep only one of the profiles active.

### 14.4 Rule registration warnings

A yellow warning on a rule commonly means:

- The header name is empty;
- A Set or Append operation has no value;
- A Redirect has no destination;
- A regular expression is invalid;
- A regex Redirect has no regex source condition;
- The rule references an undefined variable;
- A profile regex conflicts with a rule regex;
- The browser rejected the rule.

Hover over the warning icon for the specific reason. Invalid rules are normally isolated so other valid rules can still be delivered.

### 14.5 Filter warnings

A warning on a filter row or group commonly means:

- It references an undefined variable;
- A URL regular expression is invalid;
- The filter cannot be applied.

An invalid URL regex is ignored independently. An undefined variable is more dangerous because it could widen the scope, so Header Ext stops delivering the profile's rules until the variable issue is fixed.

## 15. Language, Theme, and Local Storage

### 15.1 Language

Header Ext supports:

- English;
- Simplified Chinese.

On first use, Header Ext chooses a language from the saved preference and browser UI language. Later selections are stored locally.

### 15.2 Theme

Available themes:

- Light;
- Dark;
- Follow system.

The popup and full settings page use the same saved theme.

### 15.3 Data storage and privacy

- Profiles, rules, filters, variables, and preferences are stored in browser `storage.local`;
- The popup, full settings page, and background service worker synchronize through local storage;
- Header Ext does not upload configuration or browsing logs to any remote service;
- Uninstalling the extension or clearing extension data can delete local configuration, so export backups regularly.

Header Ext requests the `<all_urls>` host permission so DNR rules can modify requests and responses for sites selected by the user. The actual scope is determined by your configuration.

## 16. Common Examples

### 16.1 Add Authorization to a test API

1. Create a profile named **Test API**.
2. Add a variable:

   ```text
   token = Bearer abc123
   ```

3. Add a request header:

   ```text
   Authorization = {{token}}
   ```

4. Add a Request domain filter for `api.test.example.com`.
5. Select this profile only when needed.

### 16.2 Disable cache only for the current site

1. Open the popup on the target site.
2. Create or select a profile.
3. Apply the **Disable cache** template.
4. Add a **Request domain filter**. The popup prefills the current hostname.
5. Confirm that the profile no longer shows a global-scope risk warning.

### 16.3 Rewrite an old API URL

Plain redirect:

```text
Source: *://api.example.com/v1/*
Destination: https://api.example.com/v2/
```

Regex rewrite that preserves the path:

```text
Source: ^https?://api\.example\.com/v1/(.*)
Destination: https://api.example.com/v2/\1
Use regex: enabled
```

### 16.4 Modify only XHR / Fetch requests

1. Add a Header rule.
2. Open its advanced conditions.
3. Select only `xmlhttprequest` under Resource types.
4. Add domain or method conditions if needed.

### 16.5 Combine shared and scenario-specific rules

1. Create a **Shared Debugging** profile, add common headers, and pin it as always on.
2. Create **Environment A** and **Environment B** profiles with separate domains, tokens, and redirects.
3. Switch between A and B while Shared Debugging remains active.
4. If a conflict appears, check whether the shared profile modifies the same header as an environment profile.

## 17. Troubleshooting

### 17.1 A modification does not work

Check the following:

1. Is Header Ext globally paused?
2. Is the target profile current or always on?
3. Is the rule's checkbox enabled?
4. Do the filters and advanced conditions actually match the request?
5. Are the rules locked to another tab?
6. Does the rule show a yellow warning?
7. Did you send the request again or reload the page?
8. Does the browser restrict the target header or response behavior?

Inspect the actual request and response in the DevTools Network panel instead of relying only on visible page behavior.

### 17.2 A rule affects unrelated sites

- Check whether the profile shows a global-scope risk warning;
- Add a domain, Tab, or URL filter;
- Check for empty filters, which do not create an effective scope;
- Check whether an invalid profile URL regex was ignored;
- Check for always-on profiles that are active at the same time.

### 17.3 Old rules remain active after switching profiles

The previous profile may be pinned as always on. Check the pin state in the profile list and confirm the active stack in the right-hand status panel.

### 17.4 A regex Redirect does not work

Confirm that:

- **Use regex** is enabled;
- The source is a valid regular expression;
- The destination is not empty;
- Back-references use `\1`, `\2`, and so on;
- A profile-level URL regex is not conflicting with the rule regex;
- The expression is compatible with browser DNR regex constraints.

### 17.5 Import fails

An import file must:

- Be valid JSON;
- Use `header-ext.v1` as its `schema`;
- Contain at least one valid profile.

Use Header Ext's built-in **Share** feature to create partial exports instead of manually deleting unknown fields.

### 17.6 Browser rule state appears inconsistent

If the configuration looks correct but rules still do not work:

1. Open the full settings page;
2. Click **Reinitialize rules**;
3. Wait for the success message;
4. Reload the target page and inspect the request again.

This makes the background service worker reload local state, clean up DNR registrations, and rebuild them. It does not delete profile configuration.

### 17.7 Firefox cannot import a file from the popup

Opening the system file picker can unload the popup before it receives the selected file. Header Ext directs Firefox users to the full settings page, where the file can be imported reliably.

## 18. Browser and DNR Limitations

Header Ext relies on the browser DNR API and therefore has these boundaries:

- Rules can affect only network requests that the browser allows extensions to process;
- Browser-internal pages, extension stores, and some protected requests may not allow modification;
- Browsers can ignore or rewrite some protected headers;
- Modifying response headers does not change actual server behavior; for example, the server still needs to handle CORS preflight requests;
- Exclude request URL currently works by hostname, not by path;
- A Tab filter ultimately matches request URLs, not a tab title or fixed tab ID. Use Tab lock for a fixed-tab scope;
- A DNR rule cannot use both a plain `urlFilter` and a `regexFilter`;
- A profile URL regex and a rule's own regex cannot be directly combined;
- DNR request methods do not include `TRACE`;
- Firefox does not support every Chrome resource type, so Header Ext's default set avoids known incompatible types;
- A regex must satisfy both JavaScript syntax and the browser's DNR constraints. The browser may reject complex expressions;
- Browsers limit the number of dynamic rules. Large numbers of profiles, Tab filters, and source rules can reach the limit more quickly because one source rule may expand into multiple DNR rules.

When the browser rejects a rule, Header Ext attempts to isolate the problematic rule and show a warning. Simplify conditions, remove duplicate rules, and use **Reinitialize rules** to rebuild the DNR state.
