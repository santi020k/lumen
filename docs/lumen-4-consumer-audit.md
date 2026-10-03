# Lumen 4 consumer audit

Twenty dedicated source audits were completed on October 3, 2026. Each compared actual consumer
usage against the current library, rather than treating an older installed version as proof of a
missing component. Consumer repositories and application data were left unchanged.

The implementation record and final validation belong in [v4 readiness](lumen-4-readiness.md).
The table records the decision for each project; it does not claim that consumers have upgraded.

| Consumer | Evidence from current usage | Library response and adoption guidance |
| --- | --- | --- |
| Fenix / Cartera | Reporting date drafts, localized dates, narrow chart labels, old axis patches | Harden range validity and read-only behavior; separate abbreviated axes from full dates; verify the reporting composition inside a dialog. Controlled manual table sorting preserves server page order; explicit dialog dismissal policies protect pending submissions. Remove old chart patches only after consumer visual checks. |
| Observatory | Formatted bars, singleton data, duplicate localized X values, compact metric cards | Share formatter-aware margins and collision-aware ticks. Reject duplicate X identities at validation; use the same first observation in plot and table. Compose existing Card and bare Stat/Chart. |
| PostLens | Hidden empty/error states, before/after media, loading-button width | Preserve native hidden semantics; add ImageComparison; preserve loading-label dimensions. Keep actual photo analysis and editing policy in the app. |
| KinJar | Long native section titles/trailing labels; date-only forms | Bound native text layout. Document the existing date-field and validation composition; preserve local calendar dates and explicit currency units. Development consumer only: no approved deployment. |
| Between Contractions | Irregular time measurements and singleton native trends | Correct Compose continuous/time positions and visible isolated points. Provide formatters and compact native charts; medical interpretation remains app-owned. |
| Aaronmgz | Disabled slotted upload actions and incomplete brand-token mapping | Block disabled/loading slotted activation. Nested inputs still require their own disabled binding. Document typography and foreground/background token pairs. |
| Astro Doctor | Theme-control overrides and mobile documentation navigation | Preserve host ownership of controlled theme initialization. Use existing navigation/Sheet composition and CopyButton instead of duplicate controllers. |
| Auth | Syntax colors inherited from decorative status colors; code-copy localization | Use text-safe Code theme defaults; add localized success/error copy feedback. Existing Table covers public comparison tables. |
| Commitprompt | Copyable command examples and long code lines | Make Code copy failures actionable and overflowing code keyboard-accessible. Existing Code/CodeTabs cover terminal documentation. |
| Coolstead | Native slider units, compact charts, loading actions | Expose formatted slider accessibility values, optional visual headings, bare chart frames and explicit plot heights, and stable loading geometry. |
| Cult | Spanish Astro date controls, long OTP codes, hidden form sections | Align localized dates and read-only behavior across web adapters; verify count-aware OTP layouts and native hidden behavior. Domain authentication remains app-owned. |
| Dep Beacon | Ordinary navigation links changed into a composite Tab stop | Keep native Tab order for NavigationMenu links. Existing Prose, Code and SkipLink cover the documentation shell. |
| ESLint Config Basic | Config-builder copy failures and old CodeTabs overflow overrides | Share clipboard recovery. Current Tabs already scroll and prevent shrinking, so avoid adding a duplicate overflow fix. |
| MeMudo | Numeric native Input size, Radix Slot wrappers, mixed light/dark palettes | Document `size` versus `visualSize`, public `asChild`, server imports, and complete theme mapping. No new primitive is justified by dormant wrappers. |
| Quality | Markdown prose styling, code overflow, unsafe theme bootstrap | Expand existing Prose semantics and provide a guarded theme-bootstrap recipe. Use existing navigation primitives for mobile documentation. |
| RoadScore | Native score bars without visual labels and compact result sheets | Add native chart axes and matching pie data markers. Existing adaptive LumenSheet already covers the local sheet wrapper. |
| Open Graph | Public checker hidden-state patch, copyable code, metric metadata | Apply shared hidden/copy fixes; use existing Stat, Badge and Descriptions. Keep checker and scoring policy outside Lumen. |
| Santi020k Themes | Filtered flex cards, repeated dynamic-command copy handlers | Shared hidden fix and a CopyButton dynamic-output recipe. Six source sites now form one public theme site, not six independent deployments. |
| Santiago Molina website | Duplicate Astro accessibility attributes and older compatibility CSS | Resolve Pagination labels and Icon semantics once before passthrough. Retire consumer CSS only after verifying the actual version migration. |
| Workscene | Contextual symbol selection, preset colors, native shortcuts | Improve existing SymbolPickerButton tint/completion. Compose named swatches with the platform ColorPicker; keep palette persistence and shortcut policy in the app. |

## Decisions that avoid duplicate APIs

- Card plus bare Stat/Chart provides a metric card; status-to-label mappings belong to products.
- Existing native DateField/DateRangeField and FieldGroup already supply date controls and field
  associations. A lossless date-only mapping recipe is more useful than another date component.
- NavigationMenu, Sidebar, Sheet and ContextNavigation compose documentation navigation. There is
  no need for a second documentation-shell primitive.
- CopyButton already provides target/value and recovery behavior. Code reuses that interaction
  contract; applications should remove brittle custom clipboard handlers as they migrate.
- Native Sheet, ShortcutRecorder and SymbolPicker already cover several older consumer wrappers.
- Money parsing, report aggregation, missing-observation policy, medical interpretation, identity
  ownership, live sensors and workspace persistence remain application responsibilities.

## Visual evidence

Public websites were opened in fresh anonymous contexts at 1440×1000 and 390×844. The selected
captures appear on the community page; [capture provenance](showcase-captures.json) records exact
URLs, dates, dimensions and HTTP status. They demonstrate deployed consumer designs, not adoption
of this unpublished v4 candidate, public-store availability, or device qualification.

No authenticated financial records, photo libraries, contraction history, driving history, live
sensor readings, desktop window titles or guest messages were captured. KinJar is excluded from
the published showcase. Native layout tests and synthetic component previews are separate from
physical-device, screen-reader and store validation.
