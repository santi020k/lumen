# Lumen 4 preparation

This working record tracks the local `release/v4.0.0` candidate. It is not publication or
production qualification evidence. Consumer audits inspect application source; application
data, deployment, and migration remain owned by those projects.

## Consolidation

The release starts from `origin/main` at `3d8af731`. The initial checkout had one worktree,
one local branch, 25 changed or untracked paths, and eight preserved stashes.

| Source | Disposition |
| --- | --- |
| Uncommitted range controls and package guidance | Preserved in `475597ea`; focused React tests, typecheck, and lint passed. Spanish example vocabulary was added to the spelling dictionary. |
| Actions branch `55eb4545` | Integrated pinned Quality setup and CodeQL updates; existing workflow inputs remain valid. |
| Theme branch `e0b94fdb` | Integrated Theme 2.0.1. Lumen uses its unchanged typography and Shiki exports, not the changed application URL contract. |
| Production dependency branch `83006823` | Integrated its history with a compatibility resolution: retain the SDK 57 dependency set listed below. |
| Native stash `1bd14696` | Existing native APIs, catalogs, playgrounds, and release tooling already incorporate the intended work. |
| Native/docs stash `568bef0a` | Native components are incorporated. Keep the enhanced documentation-owned framework example instead of adding a duplicate library component. Replace old showcase prototypes with fresh captures. |
| Snippet/metadata stash `e701c8a2` | Recover QR code tag naming, framework snippet cleanup, and runtime metadata with regression coverage. Evaluate button sizes through current consumer audits. Existing Card/Stat and Badge composition supersede the metric/status prototypes. |
| Icon stash `a2f7a905` | Icon dimensions and filled brand rendering are incorporated. Do not restore temporary configuration or obsolete screenshots. |
| Package-manager stash `212d3eed` | Superseded pnpm 10 fields; root pnpm 12.6.0 remains authoritative. |
| Scroll/miscellaneous stash `65a70d72` | Scroll cue examples and tooling changes are incorporated. |
| Motion stashes `9b41b959`, `33c190f4` | Identical snapshots; intended motion components and options are incorporated. Preserve both originals. |

The production dependency branch changes every package in the pinned Expo set without updating
Expo itself. Installed Expo 57.0.25 metadata and the
[official SDK compatibility table](https://docs.expo.dev/versions/latest/#each-expo-sdk-version-depends-on-a-react-native-version)
confirm React/React DOM 19.2.3, React Native 0.86.3, datetimepicker 9.1.0,
safe-area-context ~5.7.0, and SVG 15.15.4. Keep matching React 19.2 types and test-renderer 1.2.0.
Updating this set requires a coordinated SDK migration and native validation; v4 component work
does not require that migration.

The live compatibility check also identified compatible SDK 57 patches: Expo 57.0.26 and
expo-updates 57.0.24. Their official release notes document no new Expo user-facing behavior and
an embedded-asset hash fix, respectively. Updated only those catalog entries and their lockfile
graph; `expo install --check` then passed using live metadata.

### Initial checks

The post-merge `pnpm run validate` completed generation/platform checks and the full build,
then stopped at the shared CSS size budget after inclusion of the two range controls.
Separately, `pnpm run typecheck` passed all 23 tasks and `pnpm run test` passed 703 tests in
64 files. HTTP fixture tests require loopback access; their sandbox-only permission
failures were rerun successfully with that access. Recovered snippet/runtime changes passed
69 focused tests and zero-warning lint. The final gate remains pending until implementation
and its generated outputs are complete.

## Consumer audit and implementation

Rebuild the older adoption inventory from current manifests and source. Give each consumer
repository a dedicated audit agent, record precise source examples and reusable library gaps,
and distinguish an absent component from an existing component that needs better guidance.
Prioritize chart readability, responsive layout, range selection, public API consistency,
accessibility, error/loading states, and avoidable consumer CSS overrides.

Audit and implementation results are pending. Do not interpret this plan as completed evidence.

## Design references

- [Tremor charts](https://www.tremor.so/docs/visualizations/area-chart): restrained axes, legible
  legends, and consistent data colors as visual references.
- [Recharts sizing](https://recharts.github.io/en-US/guide/sizes/): container-driven dimensions
  as a responsive behavior reference.
- [React Spectrum range picker](https://react-spectrum.adobe.com/v3/DateRangePicker.html):
  internationalized range selection and accessible labeling as interaction references.

Use these references to assess Lumen's own implementation. Preserve dependency-free web chart
rendering and semantic Lumen tokens unless actual consumer evidence requires a different design.

## Validation and release boundaries

- Run the canonical `pnpm run validate` after consolidation and again on the final candidate.
- Run focused behavioral and adversarial tests while implementing; verify representative rendered
  desktop/mobile layouts, keyboard interaction, light/dark themes, and accessible feedback.
- Update registry, MCP snapshot, reviewed public API baselines, examples, and migration guidance
  together. Use the existing generators for generated outputs.
- Capture only public consumer pages or local synthetic fixtures for the documentation showcase.
  Record the source URL, capture date, viewport, and actual adapter evidence.
- Keep completed work committed and integrated into `release/v4.0.0`. No remote push, release,
  package publication, application deployment, or production mutation is part of this local task.
- Prepare major Changesets and forward migration guidance. Publication uses the repository's
  GitHub workflow after separate release authorization; no local tags or manual publication.
- Rollback before publication means retaining the released v3 packages. After publication, fix
  regressions with a new version; never move a published tag or rewrite consumer data.
