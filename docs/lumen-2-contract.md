# Lumen 2 contract proposal

**Status:** Draft release contract; five breaking changes approved

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
approved only after its migration and consumer evidence are present. Version 2 publication remains blocked until
every readiness gate passes; accepting a web change does not imply native graduation.

The proposal remains `draft` during the stability iterations. Before the coordinated `2.0.0`
revision, the release owner changes it to `approved` and records an `approval` object with the
approver, approval date, full 40-character reviewed candidate revision, and immutable HTTPS
evidence. Approval is invalid while any breaking change remains a candidate or any investigation
remains deferred.

Prepare and commit the complete versioned release candidate before approval. The publication commit
may differ from `approval.reviewedRevision` only by `registry/lumen-2-contract.json` changing from
the draft proposal to its approval record. Both npm and Compose publication verify that ancestry and
changed-file boundary, so any later source, generated artifact, dependency, documentation, or
release-metadata change requires a new review and approval revision.

```json
{
  "status": "approved",
  "approval": {
    "approver": "RELEASE_OWNER",
    "date": "YYYY-MM-DD",
    "reviewedRevision": "FULL_40_CHARACTER_GIT_REVISION",
    "evidence": ["IMMUTABLE_HTTPS_APPROVAL_RECORD"]
  }
}
```

`pnpm run check:native-stable-readiness` enforces that approved state in addition to the consumer,
physical-device, and stability-soak ledgers.

The contract's `releaseMigration` object is also the source of truth for the version 2 codemod,
removed exports, and runtime instructions. The release-manifest generator copies that metadata into
both published manifests for major version 2, and stable readiness rejects an initial `2.0.0`
manifest that does not match it exactly. Removed exports use package-qualified
`@scope/package#Export` records; the contract check verifies that each package is part of the
reviewed breaking-change set, each export is absent from the authoritative root API baseline, and
the migration utility recognizes the export name.

After every `2.0.0` artifact and the immutable repository tag are verified, add a `graduation`
record with the verifier, verification date, exact release revision, version, and immutable HTTPS
evidence. Until that record exists, the stable-readiness gate rejects versions newer than `2.0.0`;
this prevents skipping the coordinated milestone. Publication also peels the immutable `v2.0.0`
tag and requires it to match `graduation.releaseRevision`; a merely well-formed record cannot unlock
later releases. Once that identity check passes, later 2.x releases may follow normal semantic
versioning without package-family lockstep. The Lumen 2 gate rejects a later stable major; that
major must define and approve its own release contract rather than inherit Lumen 2 evidence.

```json
{
  "graduation": {
    "verifiedBy": "RELEASE_VERIFIER",
    "date": "YYYY-MM-DD",
    "version": "2.0.0",
    "releaseRevision": "FULL_40_CHARACTER_GIT_REVISION",
    "evidence": ["IMMUTABLE_HTTPS_RELEASE_RECORD"]
  }
}
```

## Approved breaking changes

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

### Rename the `Sonner` viewport contract

`Sonner` is not a duplicate of `Toast`: it is the configurable notification viewport that owns
placement, stack limits, live-region semantics, and optional static children. Its library-specific
name obscures that role and makes a lossy `Sonner` to `Toast` replacement tempting. The compatible
1.x path therefore adds `ToastViewport` across Astro, React, and Elements while retaining `Sonner`
as a deprecated alias. Lumen 2 removes only the old name.

The v2 migrator rewrites `Sonner` and `SonnerProps` imports to `ToastViewport` and
`ToastViewportProps` while preserving local aliases, so existing JSX and Astro markup keeps its
configuration and children. It renames `lumen-sonner` to `lumen-toast-viewport` directly. Imports
with comments or syntax that cannot be reconstructed safely remain explicit manual-review findings.

### Expand the Swift surface scale without replacing component signatures

Swift's exhaustive-enum source-compatibility rules classify new cases as breaking even when the
cases only add visual options. Lumen 2 adds `xl` padding and `xl`, `size2xl`, and `size3xl` radius
roles so product-owned SwiftUI cards can use the same semantic native surface scale as React Native
and Compose. Existing cases remain unchanged.

The published `LumenCard`, `LumenStatusBar`, and `lumenTheme` signatures remain available alongside
the explicit product-configuration overloads. Consumers only need a migration when they exhaustively
switch over `LumenSurfacePadding` or `LumenSurfaceRadius`: handle the new cases or add an
`@unknown default` branch. The release canary compares Swift's diagnostics with the reviewed list in
`registry/lumen-2-contract.json`, so a new removal or signature change cannot hide behind the
accepted enum expansion.

### Isolate the optional React Native datetime integration

Move `LumenDateField`, `LumenDateRangeField`, their props, and `LumenDateRangeValue` from the React
Native root to `@santi020k/lumen-react-native/datetime`. The package root no longer loads the native
datetime picker, and `@react-native-community/datetimepicker` becomes an optional peer installed
only by consumers of the subpath.

```tsx
import { LumenButton } from "@santi020k/lumen-react-native";
import {
  LumenDateField,
  type LumenDateFieldProps,
} from "@santi020k/lumen-react-native/datetime";
```

The v2 migrator splits mixed named imports, preserves aliases and type-only imports, and is
idempotent. When a file already imports the datetime subpath, it reports a manual merge rather than
risk creating duplicate local bindings.

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

- **Established:** schema 2 of `registry/web-api-baseline.json` guards package export maps, maturity
  classifications, and 1,329 public root symbols across eight web packages. It also fingerprints
  the documented props, Elements attributes, runtime behavior and events, dependencies, and stable
  styling hooks for all 161 catalog components. Contract drift requires an explicit baseline update
  and review before stable readiness can pass. The baseline checker first verifies that the
  generated MCP component catalog matches current source, so stale generated data cannot preserve
  an obsolete fingerprint.
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
