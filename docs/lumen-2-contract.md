# Lumen 2 contract proposal

**Status:** Draft

**Target:** `2.0.0`
**Machine-readable source:** [`registry/lumen-2-contract.json`](../registry/lumen-2-contract.json)

This proposal turns the [Lumen 2 readiness program](lumen-2-readiness.md) into an explicit public
contract. Lumen 2 is a coordinated production-support milestone for web and native platforms. It is
not permission to rename healthy APIs or manufacture migration work.

## Decision rules

A breaking change can enter Lumen 2 only when it has:

1. observed consumer, accessibility, performance, or maintainability evidence;
2. one documented replacement contract;
3. an idempotent codemod or a precise manual migration when automation is unsafe;
4. affected documentation, registry, MCP, examples, templates, and release metadata updated from
   the same decision; and
5. passing production-shaped consumer and package validation.

The machine-readable proposal is checked by `pnpm run check:lumen-2-contract`. A candidate becomes
approved only after its migration and consumer evidence are present. Native Beta labels remain until
every readiness gate passes; accepting a web change does not imply native graduation.

## Candidate breaking changes

### Isolate the Astro runtime

Remove `UIPrimitives` from the Astro root barrel and keep it as the default export of
`@santi020k/lumen-astro/runtime`.

```astro
---
import { Button } from '@santi020k/lumen-astro'
import UIPrimitives from '@santi020k/lumen-astro/runtime'
---

<Button>Continue</Button>
<UIPrimitives />
```

The existing runtime subpath makes the replacement available before v2. Current import measurements
show that mixing the runtime into the root barrel can turn otherwise static imports into an emitted
runtime graph. The migration must split mixed imports, preserve aliases, and make no further changes
when run twice.

### Remove the ambiguous visual `size` alias

Astro and Elements still accept the pre-1.0 values `sm`, `default`, and `lg` through the native
`size` attribute on Input and NativeSelect. Lumen 2 reserves `size` for the native numeric attribute
and uses `visualSize` in Astro or `visual-size` in Elements.

```astro
<Input size={24} visualSize="sm" />
```

```html
<lumen-input size="24" visual-size="sm"></lumen-input>
```

Only literal Lumen component attributes can be rewritten automatically. Dynamic values must produce
a diagnostic because their intent cannot be inferred safely.

### Retire the duplicate `Sonner` entry point

`Toast` is already the single documented notification contract, while `Sonner` remains in public
adapter barrels and the component-name registry without its own guide. Lumen 2 removes the duplicate
entry point and keeps the notification viewport behind `Toast` and each framework's public toast
controller or provider. The 1.x line must deprecate direct Sonner use first. Automated migration is
safe only when placement and maximum-count configuration map directly; custom child content requires
manual review.

## Contract investigations

- **React server/client boundaries — resolved, retain:** keep the package root as the complete
  client catalog and provide `@santi020k/lumen-react/server` for the seven stateless primitives it
  implements directly. The workspace and clean packed-package Next consumers validate both
  boundaries, and the [repeatable measurement](import-and-icon-performance.md#august-26-2026-react-server-boundary-baseline)
  shows the implementation-level server entrypoint materially reduces emitted static output. The
  root reuses the same primitive implementations, so this additive path does not fork behavior or
  require a breaking v2 root change.
- **Granular Elements registration — resolved, retain:** keep complete-catalog registration and its
  typed component-set overload, while providing implementation-level Badge, Button, and Card
  entrypoints for small surfaces. The full catalog reuses those exact constructors, a clean Astro
  application consumes them from the packed package, and the
  [repeatable bundle measurement](import-and-icon-performance.md#august-26-2026-elements-registration-baseline)
  proves material output reduction. This additive path avoids a breaking full-catalog deprecation;
  expand it component by component as equivalent evidence becomes available.
- **Umbrella Core re-exports — resolved, retain:** the web API baseline protects 202 umbrella
  symbols, the clean consumer already demonstrates explicit Core usage, and the
  [consumer import audit](lumen-2-consumer-import-audit.md) found no observed problem that justifies
  a breaking removal. Lumen 2 keeps this compatibility surface.

## Foundations and approval gates

- **Established:** `registry/web-api-baseline.json` now guards package export maps and public root
  symbols across Astro, Core, Elements, the umbrella package, and React. The next schema revision
  must add component props, Elements attributes and events, styling hooks, runtime requirements,
  and deprecation state before any candidate is approved.
- A versioned registry contract that generates documentation, MCP data, diagnostics, and release
  migration metadata without contradictory hand-maintained copies.
- `lumen migrate v2 --dry-run`, with idempotence tests and production-shaped Astro and Elements
  fixtures for the accepted candidates.
- Native maturity classifications that agree across source annotations, baselines, docs, MCP, and
  readiness summaries.
- The complete physical-device, active-consumer, artifact-distribution, and two-release stability
  evidence required by the readiness ledger.

## Product release bar

The website and playgrounds must present each platform truthfully: browser-hosted React Native Web
previews are labeled as such, while SwiftUI and Compose use verified native captures until a real
interactive host exists. The launch surface must also pass responsive, keyboard, focus, metadata,
canonical, sitemap, structured-data, and generated social-image checks before the v2 tag is created.
