# Lumen v4 dependency refresh — 2026-10-03

The workspace remains on release/v4.0.0. No releases, pushes, deployments, account changes, or consumer repository changes were made. Versions were verified directly against npm, Google Maven, Maven Central, and Gradle metadata. Stable versions less than 24 hours old were held under the existing `minimumReleaseAgeStrict` policy; no exclusions or age bypasses were added.

## Consolidation security investigation

This follow-up was performed in the isolated `chore/v4-consolidation` candidate, after the owner
approved increasing the stylesheet budget for the combined v4 feature set. The stylesheet now
has limits of 220,000 bytes raw and 36,000 bytes gzip, approximately 3% above the measured
213,671 / 34,856 bytes. All measured bundles pass. The owner subsequently approved the two
version-locked patches and a guarded audit treatment while retaining the 24-hour release-age hold.

Registry metadata and installed imports were checked again on October 3 (October 4 UTC).
All three findings are transitive; none can simply be deleted from Lumen's manifests:

| Dependency | Installed / latest stable | Required consumer | Finding and safe next step |
| --- | --- | --- | --- |
| `node-forge` | 1.4.0 / 1.4.0 | Expo CLI certificate parsing and Expo update certificate/signature operations | No fixed stable release. An approved version-locked local patch backports the nested ASN.1 element-count check from upstream PR 1152. |
| `braces` | 3.0.3 / 3.0.3 | `micromatch`, used by Metro file watching and development glob tooling | No fixed stable release. An approved version-locked local patch backports bounded brace/parenthesis and AST depth checks from upstream PR 72. |
| `http-cache-semantics` | 4.2.0 / 4.3.0 | Astro remote-image build caching | Audit metadata lists 4.3.0 outside the affected range, but this is not evidence that the reported stale-cache behavior was fixed. See the maintainer dispute and release-age restriction below. |

Latest stable Astro 7.3.5 and Expo 57.0.26 are already installed. Latest `micromatch` 4.0.8
still requires `braces`. Updating `@expo/code-signing-certificates` from 0.0.6 to 0.0.7 would
still require `node-forge` 1.4.0, so it does not resolve that finding. A Metro upgrade alone also
leaves Expo's own file-map and CLI dependency paths. Removing Expo Updates alone leaves the
CLI's Forge dependency. Replacing Astro, Expo, or Metro is a larger migration with no demonstrated
security benefit over a targeted patch. No maintained compatible replacement was established.

### Cache advisory correction

The earlier statement that 4.3.0 is patched came from audit version metadata. Comparing the
official npm tarballs shows additions to response status and Vary-header matching, but no change
to the reported `max-stale` logic. Isolated probes reproduce the same shared-cookie and
`proxy-revalidate` stale reuse in both 4.2.0 and 4.3.0, alongside legitimate ordinary stale reuse.
This demonstrates the reported behavior; it does not establish an exploitable Lumen application.

The [maintainer's response](https://github.com/kornelski/http-cache-semantics/issues/56#issuecomment-5975759591)
disputes the advisory's interpretation of HTTP caching and points to `Cache-Control: private`
for user-private responses. The proposed fixes were closed without merging. Lumen's installed
Astro consumer calls `storable()` and `timeToLive()` for remote-image build caching; it does not
call the reported `evaluateRequest()` / `satisfiesWithoutRevalidation()` request-reuse path.
Do not describe a version-only upgrade as a demonstrated behavior fix or silently suppress the
advisory based on this limited consumer analysis.

The signed upstream 4.3.0 package was published at `2026-10-04T02:56:05.593Z`. A normal targeted
update retained 4.2.0. An attempted explicit compatible 4.3.0 floor was rejected by pnpm with
`ERR_PNPM_NO_MATURE_MATCHING_VERSION`: the release was younger than the configured 24-hour
minimum. The temporary floor was removed, leaving the manifest, lockfile, and age policy
unchanged. Without an approved exception, 4.3.0 becomes age-eligible after
`2026-10-05T02:56:05.593Z` (October 4, 21:56 in Colombia).

On October 4 the owner approved preparing the local release with the reviewed 4.3.0 version.
`minimumReleaseAgeExclude` now allows exactly `http-cache-semantics@4.3.0`; the existing global
hold, strict mode, audit enforcement and other exclusions remain unchanged. A targeted pnpm update
changes only this package's resolution and integrity in the lockfile. Remove this temporary entry
after the normal hold expires. This is an approved age-policy exception, not an advisory suppression
or a claim that the reported cache behavior changed. Final validation is recorded in
[release readiness](lumen-4-readiness.md).

### Applied patches and audit verification

Both proposed runtime patches were first reproduced in isolated copies, then applied to the
workspace with `pnpm patch` and `pnpm patch-commit`. The committed patch files and lockfile
preserve exact versions and hashes:

- [Forge PR 1152](https://github.com/digitalbazaar/forge/pull/1152), exact proposed commit
  `ceba34402e329f0365134f23fe19898756527d65`: the original release accepts a synthetic signature
  with an extra nested DigestAlgorithm child; the patched copy rejects it. Valid SHA-1, SHA-256,
  SHA-384, and SHA-512 signatures, incorrect-digest rejection, and self-signed certificate
  verification continue to work.
- [Braces PR 72](https://github.com/micromatch/braces/pull/72), exact proposed commit
  `28d440b5dd449dbf1fe6f3506cf94ecca4d02660`: original compile/expand overflow on 4,500 nested
  braces; the patched copy rejects the input with a bounded-depth diagnostic. Depth 100/101,
  parentheses, ordinary globs/ranges, fractional and excessive limit overrides, and cyclic AST
  parent chains passed focused checks.

These are proposed upstream patches, not merged or released fixes. Lumen temporarily owns their
review, compatibility tests, exact-version application, and removal after fixed releases arrive.
`registry/security-patches.json` records the source commits and SHA-256 hashes of the patch files
and every changed installed runtime file. These workspace patches do not propagate to consumers
of published Lumen packages; the affected dependencies belong to the development applications.

`pnpm run check:security` now runs the guard regression suite and then verifies pnpm's exact-version
patch configuration, patch bytes, every installed occurrence, and actual dependency resolution
against the lockfile inventory. It checks the signature/certificate and glob/range behaviors before
accepting only the two recorded advisory/package/version pairs as locally mitigated. Missing or
altered patches, an additional unpatched installation, different versions, stale dependency links,
malformed audit reports, network failures, and other moderate-or-higher findings remain failures.
No global pnpm advisory ignore list was added. `pnpm run check:security:raw` retains the original
unfiltered production audit, which still identifies all three original package versions.

Remove each patch, its registry entry, and the corresponding verification code only after a
compatible fixed stable release is eligible under the age policy. Update the manifest/lockfile,
inspect the upstream fix, and rerun the security regressions and full validation. Do not merely
refresh the stored hashes to accept changed upstream code.

The cache dependency remains at 4.2.0 and is not exempted. The age policy and existing exclusions
are unchanged. Its 4.3.0 upgrade becomes eligible at the time above; reassess current registry and
maintainer evidence then. The owner-approved patch treatment resolves two of the three current
gate findings but does not authorize skipping this remaining cache finding.

After the approved stylesheet budget change, the previous `pnpm run validate` passed the bundle
limits, build, web/native consistency checks, type checking, 1,434 tests, zero-warning lint,
spelling, Knip, and registry checks before stopping at the three raw audit findings. Validation of
the applied patches is recorded in the current readiness section. The release branch remains at
`50990a22`; the candidate is preserved on `chore/v4-consolidation` until the security gate passes.

## Updated

| Dependency/tool | Before | Installed/prepared |
| --- | --- | --- |
| pnpm | 12.6.0 | 12.8.1 |
| @lucide/icons | 1.48.0 | 1.50.0 |
| MCP SDK | monolithic @modelcontextprotocol/sdk 1.30.1 | server/client 2.2.0, Express adapter 2.0.1, Express 5.2.1 |
| @types/node | 26.6.2 | 26.6.4 |
| Vitest and coverage-v8 | 5.0.1 | 5.0.3 |
| cspell | 10.3.3 | 10.3.6 |
| knip | 6.38.0 | 6.39.0 |
| lint-staged | 17.5.1 | 17.6.0 |
| Next | 16.3.6 | 16.3.8 |
| oxlint | 1.85.0 | 1.86.0 |
| react-hook-form | 7.88.0 | 7.89.0 |
| react-native-web | 0.21.2 | 0.21.3 |
| sharp | 0.35.4 | 0.35.5 |
| turbo | 2.11.3 | 2.11.7 |
| Vite | 8.3.1 | 8.3.2 |
| Wrangler | 4.138.0 | 4.147.0 |
| EAS CLI command pins | 22.4.0 | 24.8.0 |
| Compose BOM (all five consumers) | 2026.08.00 | 2026.09.00 |
| TSDoc TypeScript utility override | 8.68.0 | 8.71.0 |
| brace-expansion security floors | 1.1.18 / 2.1.4 | 1.1.21 / 2.1.7 |
| fflate security floor (Satori/OG tooling) | 0.7.3 | 0.7.5 |

The React type catalog minimums now match their already installed compatible 19.2.18 / 19.2.7 versions. Other transitive versions within supported ranges were refreshed with `pnpm update --recursive`.

Private root development engines now match the supported tooling intersection: ^22.22.2 || ^24.15.0 || >=26.0.0. Existing jsdom 30.1.1 already requires ^22.22.2 || ^24.15.0 || >=26; old and new lint-staged both require >=22.22.1. Local Node is 22.23.1 and CI selects 22.x/24.x. Public package consumer engine floors were preserved. pnpm 12.8.1 requires Node >=18. Docs and Astro's stale pnpm 10.32.1 declarations now match root 12.8.1.

## Removed

- Unused @astrojs/mdx docs dependency/catalog entry; independent audit removed the unused Astro integration. No MDX source/content exists.
- Redundant root Next and React DOM declarations; the smoke application and React package own their dependencies, and the icon benchmark executes from the React workspace.
- Old monolithic MCP SDK. Server runtime now uses split v2 packages; the MCP client is a development-only dependency. The migration agent preserves stdio/HTTP/Worker contracts with dedicated tests.
- Nine obsolete overrides with zero remaining matching consumers: @hono/node-server, hono, ip-address@10, joi@17, js-yaml@3, minimatch@5, tar@7, ts-deepmerge@<8, undici@7<7.29.0.

Retained phone metadata/validation, QR encoding, semantic version resolution, schema validation, and framework tooling dependencies have real imports and no suitable existing internal replacement. No bespoke parser/crypto/protocol replacement was introduced. The TSDoc utility override remains necessary: upstream eslint-plugin-tsdoc 0.5.4 pins ~8.56.0, while the selected 8.71.0 supports the current TypeScript 6 tooling graph. Existing React overrides preserve the Expo renderer version.

## Documented holds

- Latest stable Expo is 57.0.26. Its SDK 57 graph remains React/React DOM 19.2.3, RN 0.86.3, datetimepicker 9.1.0, safe-area 5.7.0, SVG 15.15.4. Newer React 19.3.0, RN 0.87.1, datetimepicker 9.2.1, safe-area 5.10.1, SVG 15.15.5, and matching React types are not the supported Expo graph. `expo install --check` passes unchanged.
- test-renderer stays 1.2.0: latest 1.3.0 depends on react-reconciler ~0.34.0, whose peer requires React ^19.3.0.
- TypeScript stays 6.0.3: latest stable 7.0.2 is outside @astrojs/check's ^5 || ^6 range, owned ESLint configuration's <7 range, and @typescript-eslint/typescript-estree's <6.1 range. TS7's native compiler does not yet supply a compatible stable programmatic API for this toolchain.
- Supply-chain age holds at selection time: Lucide 1.51.0 (published Oct 3 06:17 UTC), ESLint 10.12.0 (Oct 2 20:08 UTC), MCP server/client/core 2.3.0 and Express adapter 2.0.2 (Oct 2 17:44–17:48 UTC), EAS 24.9.0 and 24.10.0 (Oct 2 17:41/20:58 UTC). Latest policy-eligible releases selected instead. The regular `pnpm outdated` command applies the age policy, so registry publication metadata was checked separately.
- Native tools already latest stable: Gradle 9.8.0, Android Gradle Plugin 9.4.1, Kotlin 2.4.20, Dokka 2.2.0, binary-compatibility-validator 0.18.2, activity-compose 1.13.0, libphonenumber 9.0.40, Espresso 3.7.0, AndroidX test JUnit 1.3.0 and runner 1.7.0. Swift packages have no external dependencies (only local package references). Platform SDK and minimum OS requirements were preserved.

## Generated icon impact

Regenerated with `pnpm run generate:platform-icons`: 1864 interface (+4), 573 brand (unchanged), 1858 static web definitions (+4). New shared Lucide icons: bangladeshi-taka, layout-grid-circles, letters, printer-3d. Nut/nut-off use upstream compliant replacement artwork. The four additive icon cases and corresponding native API snapshots are reviewed together.

## Validation completed

- `pnpm install --frozen-lockfile`: PASS with pnpm 12.8.1.
- `pnpm --filter @santi020k/lumen-playground-react-native exec expo install --check`: PASS, dependencies up to date.
- `pnpm run check:platform-icons`: PASS, all icon sources/resources current.
- `pnpm run check:playground-eas-version`: PASS, four scripts and two docs commands all 24.8.0.
- `pnpm --filter @santi020k/lumen-next-smoke run build`: PASS on Next 16.3.8 after root Next removal.
- Direct ESLint of all edited JS manifests/workspace catalog and EAS documentation with `--max-warnings=0`: PASS.
- Compose `./gradlew test lint apiCheck` with Android Studio JBR and SDK: PASS, 99 tasks, on BOM 2026.09.00 before icon regeneration. The subsequent icon baseline update passed 53 phone and 3 Wear tests, lint and API checks. Existing Gradle 10 deprecation notice remains upstream/tooling, not a Kotlin or Android lint diagnostic.
- `pnpm outdated --recursive --format json`: remaining entries are the documented Expo/React/test-renderer/TypeScript holds.
- `git diff --check`: PASS at handoff.
- Full `pnpm audit --json`: reduced from 10 findings (7 high, 3 moderate) to exactly 3 high, 0 moderate. Fixed seven development findings through compatible patched versions. Remaining three are unchanged production-transitive advisories with `patched_versions: null`: node-forge, http-cache-semantics, braces. No exclusions/suppressions. Canonical security gate remains blocked.
- MCP migration agent separately reports: strict typecheck/lint, 75 tests, 686 component contracts + 162 examples, packed stdio/HTTP consumer smoke, Cloudflare dry-run and real local workerd handshake/tools/schema error smoke all PASS.

Final integrated verification and release blockers are recorded in [the v4 readiness record](lumen-4-readiness.md).

## Official evidence

- https://registry.npmjs.org/ — package versions, publish times, engines, dependency and peer contracts.
- https://expo.dev/sdk/57 and https://docs.expo.dev/versions/latest/ — Expo SDK alignment.
- https://ts.sdk.modelcontextprotocol.io/v2/migration/upgrade-to-v2 — split package/import/transport migration.
- https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/@modelcontextprotocol%2Fserver@2.2.0 — mature v2 release.
- https://github.com/lucide-icons/lucide/releases/tag/1.50.0 — icon artwork and additions.
- https://github.com/vercel/next.js/releases/tag/v16.3.8 — Next security fixes.
- https://github.com/vitejs/vite/releases/tag/v8.3.2 — build and optimizer fixes.
- https://github.com/vitest-dev/vitest/releases/tag/v5.0.3 — test isolation, cache, jsdom fixes.
- https://github.com/vercel/turborepo/releases/tag/v2.11.7 — SDK path propagation/cache fixes.
- https://github.com/lovell/sharp/releases/tag/v0.35.5 — image bounds and processing fixes.
- https://github.com/streetsidesoftware/cspell/releases/tag/v10.3.6 — directive diagnostics fixes.
- https://github.com/webpro-nl/knip/releases — current 6.39.0 release.
- https://github.com/oxc-project/oxc/releases — current oxlint 1.86.0 release.
- https://github.com/lint-staged/lint-staged/releases/tag/v17.6.0 — compatible task logging additions.
- https://github.com/react-hook-form/react-hook-form/releases/tag/v7.89.0 — validation/reset correctness fixes.
- https://github.com/necolas/react-native-web/releases/tag/0.21.3 — Image lifecycle/color-scheme subscription fixes.
- https://github.com/cloudflare/workers-sdk/releases/tag/wrangler@4.147.0 — stable CLI changes.
- https://github.com/pnpm/pnpm/releases/tag/v12.8.1 — frozen lockfile, executable bit, and dedupe fixes.
- https://github.com/expo/eas-cli/releases/tag/v24.8.0 — compatible mature EAS CLI.
- https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — compiler API compatibility boundary.
- https://developer.android.com/develop/ui/compose/bom/bom-mapping — Compose BOM/library alignment.
- https://dl.google.com/dl/android/maven2/ and https://repo.maven.apache.org/maven2/ — native artifact metadata.
- https://services.gradle.org/versions/current — current Gradle verification.
- https://github.com/advisories/GHSA-q2hr-2g5m-vwhr and https://github.com/advisories/GHSA-px8p-9vwx-vf98 — available development patches.
