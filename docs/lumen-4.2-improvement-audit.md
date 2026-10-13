# Lumen 4.2 improvement reconciliation

Audit date: October 12, 2026. Baseline: `f9a06b40`, which contains released v4.1 plus the
release-documentation follow-up. The selected integration target is `release/v4.2.0`.
This is an implementation audit, not release approval or a claim that v4.2 is published.

## Result

The 52 proposals in [improvement.md](../improvement.md) are not 52 missing implementations.
Several requested APIs shipped before v4.2; their remaining criteria concern examples and behavior
verification. Historical real-consumer and physical-device requirements were removed from release
policy and must not be reintroduced through this backlog.

| Status | Count | Meaning |
| --- | --- | --- |
| Retired | 2 | Superseded by current release policy. |
| Core present | 5 | Requested central API or fix exists; listed acceptance follow-up remains. |
| Partial | 13 | Some requested behavior exists, with a concrete API or acceptance gap. |
| Open | 12 | Requested contract or fix was not identified in current source. |
| Implemented locally | 1 | Appearance fix reproduced before implementation and verified in hosted macOS views; release CI remains separate. |
| Recipe | 19 | Existing public primitives provide the foundation; the requested composed example and its acceptance evidence remain. |

The appearance proposal was closed with a failing-before/passing-after hosted-view regression.
No other proposal is marked fully complete solely because a symbol exists or a general suite passes.
Recipe and Partial classifications do not claim that the precise requested consumer fixture already
exists. External physical-device evidence is not a launch gate, but local tests must not be described
as fresh VoiceOver/TalkBack or physical-device verification.

## Item-by-item disposition

Source links identify the implementation inspected. The original heading in the backlog retains
its detailed acceptance criteria; its historical consumer narrative is not a current limitation.

| Original proposal | Status | Current evidence and remaining action |
| --- | --- | --- |
| [Maintained consumer canaries](../improvement.md#maintained-consumer-canaries) | Retired | External real-consumer completion is not a release gate. Preserve the historical evidence; retain configured package-consumer canaries. [Source][policy]. |
| [Physical-device accessibility evidence](../improvement.md#physical-device-accessibility-evidence) | Retired | The physical-device matrix is historical and is not a release gate. Automated accessibility checks remain required where configured. [Source][policy]. |
| [SwiftUI semantic button roles](../improvement.md#swiftui-semantic-button-roles) | Core present | Button and IconButton accept ButtonRole and pass it to SwiftUI; the README explains role versus intent and system containers. Remaining acceptance work is role-specific interaction coverage and the complete native-treatment recipe. [Source][primitives]. |
| [SwiftUI compact button hit targets](../improvement.md#swiftui-compact-button-hit-targets) | Partial | Regular small IconButton metrics are 44 points, but small text Button metrics remain 36 points. Expanded semantic-frame, adjacent-target, selected-action, and adaptive composition acceptance remain. [Source][primitives]. |
| [SwiftUI picker rich label and current-value content](../improvement.md#swiftui-picker-rich-label-and-current-value-content) | Core present | Picker has rich label and currentValueLabel initializers and a README example. PickerLabelTests covers selected-label layout; the full opposite-locale and interaction matrix is not established by that test. [Source][forms]. |
| [SwiftUI date-field verbatim and custom-label content](../improvement.md#swiftui-date-field-verbatim-and-custom-label-content) | Open | DateField still stores LocalizedStringKey title, description, and error. LumenTextContent and custom-label overloads remain to implement and test. [Source][apple]. |
| [SwiftUI slider gesture and composition contract](../improvement.md#swiftui-slider-gesture-and-composition-contract) | Partial | onEditingChanged and showsLabel exist and are documented. The binding and bounds are still Double; generic floating-point support and the complete gesture/undo example remain. [Source][forms]. |
| [SwiftUI icon-button loading state](../improvement.md#swiftui-icon-button-loading-state) | Core present | IconButton has loading, localized loadingAccessibilityValue, foreground-tinted progress, and disabled activation. The README documents the transition; the requested compact native interaction and semantic-frame fixtures remain. [Source][primitives]. |
| [SwiftUI button loading accessibility content](../improvement.md#swiftui-button-loading-accessibility-content) | Partial | Button accepts LumenTextContent loadingAccessibilityValue and retains label geometry. Loading still couples disabling and the built-in spinner; independently configurable busy presentation and rendered locale assertions remain. [Source][primitives]. |
| [SwiftUI accent-derived theme bridge](../improvement.md#swiftui-accent-derived-theme-bridge) | Partial | Palette overriding exposes brand, brandSolid, brandSoft, onBrand, and accent independently. A coherent derived-accent recipe with contrast verification remains. [Source][theme]. |
| [SwiftUI structured-state verbatim content](../improvement.md#swiftui-structured-state-verbatim-content) | Open | EmptyState and ErrorState still store localized-key content. Verbatim title/description/reference overloads and their fixtures remain; generic action slots already exist. [Source][structured]. |
| [SwiftUI semantic icon tones in status labels](../improvement.md#swiftui-semantic-icon-tones-in-status-labels) | Open | Icon accepts explicit Color and inherits button content color, but has no public semantic-tone initializer. Tone resolution and combined noninteractive status examples remain. [Source][primitives]. |
| [SwiftUI icon-button verbatim accessibility labels](../improvement.md#swiftui-icon-button-verbatim-accessibility-labels) | Open | IconButton accessible labels remain LocalizedStringKey even though its loading value accepts LumenTextContent. Both named-icon and SF Symbol label overloads remain. [Source][primitives]. |
| [SwiftUI selection-control rich option content](../improvement.md#swiftui-selection-control-rich-option-content) | Partial | Typed selection and accessibility state exist, but SelectionOption labels are strings. Rich option labels/values and adaptive layouts need an intentional contract; the many nested-card recipes need separate acceptance. [Source][selection]. |
| [SwiftUI badge accessory and verbatim content](../improvement.md#swiftui-badge-accessory-and-verbatim-content) | Partial | Badge supports LumenTextContent; Chip still takes LocalizedStringKey and Badge has no leading-content slot. Accessory/chip APIs and parent-owned count semantics examples remain. [Source][additional]. |
| [Native spinner color in nested actions](../improvement.md#native-spinner-color-in-nested-actions) | Partial | SwiftUI and Compose Spinner accept an explicit tint; composed SwiftUI buttons tint progress from intent. Standalone defaults remain brand. Size, parent-owned announcement, nested-theme, and rendered cross-adapter acceptance remain. [Source][primitives]. |
| [Native button hierarchy and semantic tone](../improvement.md#native-button-hierarchy-and-semantic-tone) | Open | Button intent still combines hierarchy and color, with a filled danger intent. Independent success/destructive tone across primary, secondary, and quiet hierarchies remains a public-contract proposal. [Source][primitives]. |
| [Compose disabled quiet-button background](../improvement.md#compose-disabled-quiet-button-background) | Core present | The disabled-container helper explicitly preserves zero-alpha backgrounds and PrimitivesTest covers both themes. Representative long-label rendered and consumer acceptance remain unverified here. [Source][compose-primitives]. |
| [SwiftUI icon-only menu labels on macOS](../improvement.md#swiftui-icon-only-menu-labels-on-macos) | Partial | Menu supports arbitrary label content, so the caller can label that content. A direct accessible-name parameter and rendered macOS locale/disabled tests remain. [Source][overlays]. |
| [SwiftUI system-container boundary guidance](../improvement.md#swiftui-system-container-boundary-guidance) | Partial | The Swift README tells consumers to retain native toolbar, alert, and confirmationDialog actions and apply public styles where appropriate. Complete per-container rendered and semantic regression coverage remains. [Source][swift-readme]. |
| [SwiftUI share-button width and resolved-label contract](../improvement.md#swiftui-share-button-width-and-resolved-label-contract) | Open | ShareButton has custom-label initializers and localized-key convenience labels, but no explicit full-width/alignment or LumenTextContent convenience contract. System sharing stays host-owned. [Source][overlays]. |
| [SwiftUI divider orientation and contrast contract](../improvement.md#swiftui-divider-orientation-and-contrast-contract) | Open | Divider remains a horizontal one-point theme-line rectangle. Vertical orientation and semantic media-contrast treatment remain; retain native system-menu dividers. [Source][primitives]. |
| [SwiftUI pinned browser surfaces with independent controls](../improvement.md#swiftui-pinned-browser-surfaces-with-independent-controls) | Recipe | Surface and Divider exist. Add the pinned opaque-bar recipe with directional insets, independent control semantics, scrolling geometry, and material-boundary guidance. [Source][primitives]. |
| [SwiftUI disclosure and nested-action ownership](../improvement.md#swiftui-disclosure-and-nested-action-ownership) | Recipe | Disclosure has a separate header button and expanded sibling content. Add deterministic nested-action examples, collapsed/expanded focus assertions, and single-owner activation guidance. [Source][content]. |
| [SwiftUI text-input character-limit contract](../improvement.md#swiftui-text-input-character-limit-contract) | Open | TextField and Textarea expose no character-limit contract. Specify grapheme counting, validation versus truncation, paste/composition behavior, and counters before implementing an additive API. [Source][additional]. |
| [SwiftUI phone-input in-app localization](../improvement.md#swiftui-phone-input-in-app-localization) | Partial | PhoneInput already accepts explicit Locale and uses it for country metadata. Document the in-app locale bridge and verify mounted updates and opposite-locale behavior. [Source][phone]. |
| [Native status-bar message reflow](../improvement.md#native-status-bar-message-reflow) | Partial | SwiftUI StatusBar and sheet layouts respond to accessibility size; this is not the complete three-adapter 200-percent reflow and persistent progress recipe. Keep task lifecycle host-owned. [Source][structured]. |
| [SwiftUI compact stat density](../improvement.md#swiftui-compact-stat-density) | Core present | Stat exposes explicit compact density, with theme/layout tests and a native reference example. Complete the requested two-stat 360-point and localized-value rendering matrix. [Source][structured]. |
| [SwiftUI skeleton theme inheritance and media composition](../improvement.md#swiftui-skeleton-theme-inheritance-and-media-composition) | Partial | Skeleton reads the nearest theme, supports shapes, and derives circle width from height. Add branded placeholder grids, one parent announcement, circle geometry regression coverage, and media-boundary examples. [Source][content]. |
| [SwiftUI transient status actions and resolved localization](../improvement.md#swiftui-transient-status-actions-and-resolved-localization) | Open | Toast and related status surfaces still use localized-key content in their convenience contracts. Verbatim status/action content and multi-action ownership recipes remain. [Source][additional]. |
| [SwiftUI informational card migration boundaries](../improvement.md#swiftui-informational-card-migration-boundaries) | Recipe | Card and Surface already provide non-action containers. Add before/after informational-card examples and ensure descriptions, summaries, and nearby actions stay consumer-owned. [Cards][shared], [rows][structured]. |
| [SwiftUI sheet cards and scroll-to-action reachability](../improvement.md#swiftui-sheet-cards-and-scroll-to-action-reachability) | Recipe | Sheets already support scrolling and dismissal policy. Add nested-card reachability fixtures above safe-area actions, asserting visible/hittable controls rather than presence alone. [Source][overlays]. |
| [SwiftUI membership information cards and selection boundaries](../improvement.md#swiftui-membership-information-cards-and-selection-boundaries) | Recipe | Use non-action cards with independently selected leaf controls. Add the requested membership example and selection/large-text interaction acceptance. [Cards][shared], [rows][structured]. |
| [SwiftUI control-rich scheduling cards and nested action targets](../improvement.md#swiftui-control-rich-scheduling-cards-and-nested-action-targets) | Recipe | Keep scheduling state and nested controls in the application. Add the non-action scheduling card with independent target, focus-order, and narrow-width assertions. [Cards][shared], [rows][structured]. |
| [SwiftUI result cards with independent score and picker controls](../improvement.md#swiftui-result-cards-with-independent-score-and-picker-controls) | Recipe | Rich Picker labels exist. Add the result/sorting example with separate score and picker actions, static headings, resolved text, and viewport coverage. [Source][forms]. |
| [SwiftUI action cards with independent overlaid accessories](../improvement.md#swiftui-action-cards-with-independent-overlaid-accessories) | Recipe | Keep secondary accessories outside the action card. Add sibling-overlay examples and assertions that accessory activation never triggers the primary action. [Cards][shared], [rows][structured]. |
| [SwiftUI zero-padding cards as grouped selection rows](../improvement.md#swiftui-zero-padding-cards-as-grouped-selection-rows) | Recipe | Card supports zero padding and ListRow is a visual label layout. Add grouped native-button rows with selected traits, separators, target sizes, and no parent action. [Cards][shared], [rows][structured]. |
| [SwiftUI list-row inset ownership inside native lists](../improvement.md#swiftui-list-row-inset-ownership-inside-native-lists) | Recipe | ListRow owns fixed semantic insets. Add native List recipes that deliberately remove native row insets and preserve outer-button and secondary-control semantics. [Cards][shared], [rows][structured]. |
| [SwiftUI responsive informational cards with a concise accessibility summary](../improvement.md#swiftui-responsive-informational-cards-with-a-concise-accessibility-summary) | Recipe | Add horizontal/vertical non-action card examples with a caller-owned concise summary, one static focus stop, and independently reachable external actions. [Cards][shared], [rows][structured]. |
| [SwiftUI non-action cards with nested controls in a partial sheet](../improvement.md#swiftui-non-action-cards-with-nested-controls-in-a-partial-sheet) | Recipe | Add partial-sheet fixtures with independent leaf identifiers and selected/cached/retry states. Verify that card-level modifiers do not mask child actions. [Source][overlays]. |
| [SwiftUI grouped cards above a persistent action bar](../improvement.md#swiftui-grouped-cards-above-a-persistent-action-bar) | Recipe | Add grouped-card examples with score and copy/add actions above a safe-area bar, using exact token inspection and scroll-to-action assertions. [Cards][shared], [rows][structured]. |
| [SwiftUI cards inside native navigation links](../improvement.md#swiftui-cards-inside-native-navigation-links) | Recipe | Use a non-action Card inside the native NavigationLink. Add navigation/context-menu fixtures, one semantic action, and accessible-size media-summary reflow. [Cards][shared], [rows][structured]. |
| [SwiftUI grouped cards containing independent controls](../improvement.md#swiftui-grouped-cards-containing-independent-controls) | Recipe | Add shared static-card helpers with independent choice and crop controls, preserving stable leaf identities, safe-area reachability, and token-density comparisons. [Cards][shared], [rows][structured]. |
| [SwiftUI single-action selection cards inside a static group](../improvement.md#swiftui-single-action-selection-cards-inside-a-static-group) | Recipe | Add a static parent with independently actionable child cards, explicit selected traits, cached/ready/disabled states, and deterministic generating fixtures. [Cards][shared], [rows][structured]. |
| [SwiftUI action cards with sibling overlay controls](../improvement.md#swiftui-action-cards-with-sibling-overlay-controls) | Recipe | Add enabled/capacity/over-capacity fixtures proving primary-action disabling does not disable useful sibling controls; assert separate identities and targets. [Cards][shared], [rows][structured]. |
| [SwiftUI selection cards with directional consumer padding](../improvement.md#swiftui-selection-cards-with-directional-consumer-padding) | Recipe | Zero-padding Card is available. Document directional host insets and stable domain identities; evaluate a directional-inset API only if composition cannot satisfy the example. [Cards][shared], [rows][structured]. |
| [SwiftUI non-action surfaces inside existing menu buttons](../improvement.md#swiftui-non-action-surfaces-inside-existing-menu-buttons) | Recipe | Use Surface inside the system-owned Button or Menu label. Add resolved-name/value fixtures, one activation owner, and before/after density checks. [Source][primitives]. |
| [SwiftUI compact selected date tiles](../improvement.md#swiftui-compact-selected-date-tiles) | Open | No dedicated compact selection-tile contract was identified. First validate a composition with current primitives, selected traits, directional padding, and a 44-point target before adding a new primitive. [Source][selection]. |
| SwiftUI non-enforcing themes must preserve caller appearance | Implemented locally | The modifier now omits preferredColorScheme when enforcement is disabled. ThemeAppearanceTests covers both caller modifier orders, light/dark host inheritance, explicit enforcement, and tint on/off; 146 local Swift tests pass. [Source][theme]. |
| [SwiftUI section-header leading content and verbatim titles](../improvement.md#swiftui-section-header-leading-content-and-verbatim-titles) | Open | SectionHeader title and subtitle are LocalizedStringKey and only trailing actions are generic. Verbatim content, decorative leading slots, and intrinsic-fit action layout remain. [Source][structured]. |
| [Compose sheet locale and form presentation](../improvement.md#compose-sheet-locale-and-form-presentation) | Partial | Sheet skips partial expansion, uses IME padding, and scrolls the complete layout for large text or short heights. Caller locale propagation and opposite-locale rendered fixtures remain to verify. [Source][compose-overlays]. |
| [SwiftUI grouped list-card composition and selectable row semantics](../improvement.md#swiftui-grouped-list-card-composition-and-selectable-row-semantics) | Open | ListRow and Card exist separately; no dedicated grouped list-card/header/footer/selected-row contract was identified. Evaluate a public composition first, preserving native activation and context menus. [Cards][shared], [rows][structured]. |

## Prepared v4.2 scope

The custom-select guidance source commit `8f8a68c0` is integrated on the task branch as
`06cbe593`, using only that commit rather than merging its old v4.1 task history. It updates
AGENTS, the portable skill and generated plugin, AI guidance, `llms.txt`, and the generated MCP
snapshot. The MCP snapshot conflict was resolved by regenerating from the combined sources.
The guidance Changeset is a patch; the umbrella's appearance Changeset targets the requested minor.
The independent ESLint-package helper is outside this repository and remains conditional on its
own publication. No external repository was modified.

The integration branch also contains `f9a06b40`, the v4.1 documentation follow-up. The v4.2 scope now adds the confirmed non-enforcing SwiftUI appearance fix, with hosted-view
regressions and documentation. Other native API proposals remain outside this release. The umbrella
minor Changeset targets the requested 4.2 version; guidance and behavior changes remain compatible.

## Verification boundary

- `swift test`: 148 tests passed on the local macOS host, including the failing-before/passing-after
  appearance regression. This does not prove iOS, watchOS,
  visionOS, VoiceOver, or physical-device behavior.
- The existing Swift tests cover picker label layout, native layout configuration, button content
  contrast, theme values, and consumer settings composition. They do not establish every
  item-specific acceptance matrix in this report.
- Compose source and `PrimitivesTest` were inspected for the transparent disabled-background fix.
  Source inspection is not a fresh rendered Android or TalkBack pass.
- Canonical validation exposed the earlier documentation update's three changed component
  fingerprints. The web API baseline was regenerated after reviewing DatePicker, InputOTP, and
  ListBox reference changes; root exports and their classifications were unchanged.
- Canonical validation results for this change are recorded in the task handoff; this document
  makes no claim about a future release revision or hosted CI run.

## Remaining release work

1. Keep the selected scope to custom-select guidance, the appearance fix, documentation, and the reviewed Elements DatePicker field-shell correction.
2. Preserve the remaining Open, Partial, and Recipe work for separately scoped changes.
3. Version preparation used the repository generator: umbrella, Elements, and MCP are 4.2.0, Swift uses
   `v4.2.0`, and unaffected packages retain their existing versions. Changesets, changelogs,
   manifests, Swift installation guidance, and plugin/MCP mirrors are synchronized.
4. Run canonical validation on the final release candidate, obtain the independent pre-push review,
   and dispose of every finding. Publication still requires explicit authorization, required PR/CI
   checks and reviews, and any configured exact-revision delivery approval.
5. Publish through GitHub automation, then verify immutable tags, package provenance, applicable
   deployments, and consumer smoke checks. Do not republish unchanged native artifacts.

[policy]: native-release-runbook.md#current-release-policy
[primitives]: ../packages/swift/Sources/LumenUI/Primitives.swift
[forms]: ../packages/swift/Sources/LumenUI/FormControls.swift
[apple]: ../packages/swift/Sources/LumenUI/AppleComponents.swift
[structured]: ../packages/swift/Sources/LumenUI/StructuredComponents.swift
[additional]: ../packages/swift/Sources/LumenUI/AdditionalComponents.swift
[selection]: ../packages/swift/Sources/LumenUI/SelectionControls.swift
[overlays]: ../packages/swift/Sources/LumenUI/OverlayComponents.swift
[phone]: ../packages/swift/Sources/LumenUI/PhoneComponents.swift
[swift-readme]: ../packages/swift/README.md#runtime-and-localized-text
[compose-primitives]: ../packages/compose/src/main/kotlin/com/santi020k/lumen/Primitives.kt
[compose-overlays]: ../packages/compose/src/main/kotlin/com/santi020k/lumen/OverlayComponents.kt
[content]: ../packages/swift/Sources/LumenUI/ContentComponents.swift
[shared]: ../packages/swift/Sources/LumenUI/SharedComponents.swift
