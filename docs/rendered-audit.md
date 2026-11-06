# Opt-in rendered audit

Use the existing Lumen CLI to inspect an already running loopback route. Install the CLI separately
from the runtime adapter. The audit resolves an existing Playwright development tool from the target
project or an ancestor workspace node_modules directory.

    pnpm add -D @santi020k/lumen @playwright/test
    pnpm exec playwright install chromium
    pnpm exec lumen audit-rendered http://127.0.0.1:4321/ --cwd . --json

Tool and browser installation are explicit operator steps. The audit opens a fresh headless context.
The ordinary source-only doctor command continues to inspect files without loading optional browser
tooling.

## Inputs and output

The default browser is Chromium and the default viewports are 390x844 and 1280x900. Select WebKit or
Firefox through --browser. Repeat --viewport WIDTHxHEIGHT to inspect up to eight viewports. Dimensions
must be from 200 through 4096. --timeout-ms accepts 100 through 60000 and defaults to 10000.
--settle-ms accepts 0 through 5000 and defaults to 200 after the load event.

Each route record contains the requested/final route, viewport, document dimensions, horizontal
overflow, console warnings/errors, page errors, blocked or failed requests, and script/style requests.
Request records distinguish pending, finished, and failed requests and include HTTP status when
observed. The tool records browser name and version.

Exit codes are 0 for measured checks without findings, 1 for issues or incomplete observations, and 2
for invalid configuration or unavailable tooling. --json emits a single structured report. Use
lumen audit-rendered --help for the complete options.

HTTP and HTTPS inputs must use localhost, a 127.x.x.x address, or [::1], with URL credentials omitted.
External HTTP requests and all WebSocket connections are blocked. Use a built preview when an app
requires a development socket. Redirects are recorded and blocked, including local redirects.
Supply the intended canonical loopback destination explicitly for another audit. The report marks
guarded or unfinished observations with observationComplete: false. Console/page errors and
measured overflow are findings even when the observation completes.

Reports omit URL credentials, query strings, and fragments. Console warning/error text is retained
for diagnosis. Review that text before sharing a report.

## Explain a requested JavaScript chunk

For a Vite 8 client build, add the optional plugin from the Lumen CLI package to the app's
`plugins` list. In Astro, put it under `vite.plugins` in `astro.config.mjs`.

```js
import { defineConfig } from 'vite'
import { lumenBuildReport } from '@santi020k/lumen/vite/build-report'

export default defineConfig({ plugins: [lumenBuildReport()] })
```

Build and serve that same output, then run:

    pnpm exec lumen audit-rendered http://127.0.0.1:4321/ --build-report .cache/lumen/build-report.json

Each matched script lists the Lumen modules the bundler associated with that chunk and one
build-time import chain for each. Use the first application module in a chain to investigate
why the dependency is present. A shared chunk may have several import paths. The browser
request establishes which chunks loaded; the chain describes a possible build dependency.
An entry with only a module name means the bundler supplied no path from a client entry.

The report is local to the build and uses origin-relative Vite bases, including subdirectories.
Use a distinct filename for each client build. It recognizes installed packages under
`node_modules/@santi020k/lumen*`. CSS, externalized modules and workspace aliases that bypass the
installed packages require separate evidence. Use an explicit inventory to enforce a route policy.

## Enlarged text

Pass `--text-scale 200` to multiply the page's computed root font size by two after loading.
The accepted integer range is 100 through 200. The audit waits for loaded fonts and the configured
settle period before measuring. Each route reports `textScale` and `clippedControls`, including
control tag, ID, and horizontal/vertical overflow in pixels. Clipped controls cause exit code 1.

    pnpm exec lumen audit-rendered http://127.0.0.1:4321/guides/build-an-editorial-article --viewport 320x844 --text-scale 200 --json

The check examines visible links, buttons, labels, summaries and button/tab roles with text whose
own box uses hidden or clipped overflow. A one-pixel tolerance accommodates rounding. Scrollable
code and tables remain scrollable. Hidden and inert controls are excluded. Reports omit control
text to avoid collecting page content.

This is root-relative text enlargement. Fixed-pixel text, clipping by ancestor boxes, text covered
by other elements, and unopened overlays require separate interaction and visual checks. The tool
measures the loaded state. Repeat the route without the flag for its original size, and verify
keyboard paths and content manually. A passing result covers only the reported measurements.

## Explicit asset expectations

Pass --asset-expectations ./lumen-assets.json to classify known Lumen request URLs.

    {
      "knownLumenAssets": [
        "/_astro/dialog.a1b2.js",
        "/_astro/phone-input.c3d4.js",
        "/_astro/controls.e5f6.css"
      ],
      "allowedLumenAssets": [
        "/_astro/dialog.a1b2.js",
        "/_astro/controls.e5f6.css"
      ]
    }

Build this inventory from bundler metadata with verified Lumen ownership. Matching uses exact
origin-relative paths or absolute loopback URLs. Entries omit query strings and fragments.
Allowed assets must be included in the known list.

Observed known assets outside the allowlist are findings. Allowed assets that were not requested
are reported separately, because they may belong to another route or later interaction. Other
script/style paths remain unclassified, including hashed filenames. Without supplied expectations,
the asset audit scope is unknown. The report makes no complete-delivery-conformance assertion from
that request list.

The audit captures the bounded load state at each viewport. HTTP responses are buffered through
Playwright to enforce the redirect boundary. This tool supports layout, console, and request
inspection. Use the repository's route-delivery benchmarks for timing and transfer-performance
measurements.

## Validation

Run pnpm run test:rendered-audit from the repository root. Its controlled local HTTP fixture checks
Chromium and WebKit reports, overflow, console/page errors, explicit asset inventories, redirects,
blocked external requests, and JSON exit behavior. Separate unit tests cover URL/options validation
and missing tooling/browser diagnostics. The source-only doctor regression installs a sentinel
browser module and verifies that doctor never imports it.

## Stylesheet provenance

The build plugin also records CSS import chains associated with emitted client chunks through Vite's
CSS metadata. A requested stylesheet can carry `importChains` and `fullStylesheet: true` when one
chain includes the adapter's complete `styles.css`. Inspect the application modules in that chain
to locate the importing layout. Associations describe build provenance for shared CSS assets and
can include several contributing import paths. CSS loaded by server-only or external pipelines
requires separate evidence. An absent association leaves ownership unknown.

Compare the same route and viewport before and after adopting selective imports. Preserve explicit
styles for Markdown, manually produced markup, themes and runtime-created content. Use cold loads
and client navigation to verify requested assets. Full CSS remains a supported delivery choice.
