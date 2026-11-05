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
