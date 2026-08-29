# Active Lumen improvements

This file contains only improvements that remain actionable after the August 2026 web and native
adoption work. Completed items are intentionally removed instead of accumulating progress logs;
their implementation, tests, Changesets, and Git history are the durable record.

## Maintained consumer canaries

The in-repository release-candidate workflow verifies packed npm consumers, the Swift package and
playground, Compose publications, and the Android playground. Repository-specific dispatch workflows
and successful local candidate runs now exist for the maintained Astro, React, SwiftUI, and Compose
consumers recorded in [`docs/native-consumer-validation.md`](docs/native-consumer-validation.md).
The remaining work is external adoption and immutable remote evidence:

- review, commit, and push each prepared workflow to its owning repository's default branch;
- dispatch an immutable release-manifest URL and record the successful remote run for each adapter;
  and
- make the canaries required for a stable release only after each consumer owner confirms the
  workflow is reliable.

Acceptance criteria:

- At least one maintained Astro, React, SwiftUI, and Compose consumer runs against a candidate.
- The resolved adapter, umbrella, core, Swift, and Compose versions match the candidate manifest.
- A tool crash is reported with its exact command and diagnostic without being mislabeled as a
  Lumen product regression.

The local workflow files are intentionally uncommitted because committing and pushing external
repository changes requires explicit authorization. This item cannot be removed until those remote
runs exist.

## Physical-device accessibility evidence

Automated semantics, unit tests, simulator builds, and accessibility-test compilation are present.
The remaining evidence requires representative hardware and human judgment. Continue recording
results in [`docs/native-device-validation.md`](docs/native-device-validation.md), including:

- VoiceOver, Dynamic Type, Reduce Motion, and Increase Contrast on iOS, macOS, and watchOS;
- TalkBack, font/display scaling, reduced animation, and high contrast on Android;
- TalkBack, rotary input, font scaling, Always On behavior, and round-screen clipping on Wear OS;
- keyboard, switch, touch-target, focus-order, announcement, and live-region behavior where the
  platform supports them.

Every result must identify the device, OS, revision, tester, exercised surface, outcome, and an
issue or recording when appropriate. Simulator or accessibility-tree output must not be recorded
as a completed physical-device pass.

## SwiftUI semantic button roles

PostLens migrated ordinary primary, secondary, and quiet content actions to `LumenButton`, and it
applied the public `LumenButtonStyle` to `PhotosPicker` actions in onboarding, the Photos permission
screen, and its internal treatment-calibration tool without wrapping or replacing the system
picker. `LumenButtonGroup` can contain that styled system control alongside a composed
`LumenButton`, which keeps the action hierarchy and spacing consistent without taking ownership of
photo-selection behavior. This also established a useful migration rule: prefer the public style
when a system control owns selection or presentation, and prefer the composed component when the
application owns activation. Destructive and cancel actions could not migrate with the same
confidence:
`LumenButton` and `LumenIconButton` create an inner `Button(action:)` without accepting SwiftUI's
`ButtonRole`. A danger intent supplies the visual recipe, but it does not preserve the semantic role
that menus, dialogs, accessibility, and platform styling can use.

Acceptance criteria:

- Accept an optional `ButtonRole` in generic, text-content, and icon-button initializers.
- Pass the role to the underlying SwiftUI `Button` instead of inferring semantics from color.
- Keep role and visual intent independent so a destructive action cannot accidentally lose its
  semantic meaning when a consumer customizes presentation.
- Test destructive and cancel roles in standalone content, menus, and dialog-compatible contexts.
- Document when consumers should retain native system buttons, especially toolbar, alert, and
  confirmation-dialog actions.

## SwiftUI compact button hit targets

PostLens migrated Publishing Studio's primary creation, recovery, and restoration actions to
`LumenButton` while retaining the adjacent native destructive action and the system-owned sheet
toolbar. The hidden-pick rows need a visually compact Restore action, but `LumenButton(size: .sm)`
has a 36-point regular-density minimum height and a 28-point compact-density minimum height. Those
metrics do not independently meet the app's 44-point touch-target requirement, so the consumer had
to use the medium button size even though the small visual recipe better fits the row.

Carousel Builder confirmed the other side of that tradeoff on a narrow iPhone: the medium secondary
button preserves the 44-point target but its horizontal padding truncates the trailing `Edit Cover`
label in a score-summary row. The small recipe fits visually but would reduce the hit target, so the
consumer retained the native bordered row action.

The treatment-calibration tool confirmed that medium Lumen buttons can still support a dense
adaptive choice grid when the consumer owns the grid minimum width and gives each label a 48-point
minimum height. Seven one-character choices rendered as five columns plus a wrapped second row on a
narrow iPhone, with every action fully visible above the bottom safe-area inset. A reusable example
would help consumers understand that the component supplies control metrics while the container
still owns column count and reflow.

PostLens's focused crop editor exposed a semantic mismatch in the same metrics. Medium
`LumenIconButtonStyle` controls rendered and accepted taps at the intended 44-point size, but XCTest
reported only the inner SF Symbol's 19–21-point accessibility frame. Applying another 44-point frame
outside the styled button did not expand the reported frame, while forcing the outer view to become
an accessibility element removed native Button discoverability. The consumer retained the native
button semantic, Lumen icon and public style, and verified activation behavior plus the rendered
composition. Lumen should make the semantic button element own the advertised target rectangle so
VoiceOver, Switch Control, XCTest, and visual hit testing agree without consumer accessibility
reconstruction. The Photo Editor's styled Prepare post action reproduced this with a 34-point
material-circle label: the public small icon style still exposed the inner circle's frame until the
consumer put its explicit 44-point semantic minimum inside the label rather than outside the style.
Its adjacent Compare action added a responsive composition case: `ViewThatFits` changes the same
command from a labeled material capsule to an icon-only material circle. PostLens had to style the
labeled native button through its Lumen intent adapter, style the compact branch with
`LumenIconButtonStyle`, and repeat one identifier, accessible name, hint, and 44-point target across
both branches. Responsive component guidance should require a stable semantic leaf across visual
representations and verify that the unselected fallback does not surface as a duplicate control.
Rendered accessibility-text evidence also showed that swapping the label for an icon was not enough:
the system-owned destination menu still consumed the row and pushed the icon partly off-screen, even
though XCTest could find and tap it. The consumer needed a third, vertically stacked fallback and
viewport/intersection assertions. A responsive component recipe cannot substitute for container
reflow under large text.

The same consumer exposed a full-width composition boundary when migrating its primary `Adjust
Crop` action. `LumenButton(size: .lg)` was valid inside the SwiftUI `List`, but the initial media
preview left the 52-point row underneath a persistent `safeAreaInset` export bar. The accessibility
tree still contained the action even though a person could not see or tap it. PostLens fixed the
consumer layout by using its compact preview geometry for Crop and Sequence panels, then asserted
that the rendered button ends above the export bar before exercising the handoff. Lumen guidance
should make clear that component metrics cannot reserve space across sibling scroll and safe-area
containers; migration evidence must cover the final composed viewport, not only component presence.
The compact Carousel Reorder/Done header repeated that evidence trap: XCTest could report a 44-point
frame and activate the control while a screenshot of the current viewport still did not contain it.
The workspace also had a sibling horizontal thumbnail collection before its vertical list, so a
generic first-match swipe moved the wrong container, while a full list swipe could virtualize the
header past the opposite edge. UI guidance should require consumers to identify the owning scroll
container and position the exact row in view before treating a screenshot as visual proof.

PostLens also confirmed that Lumen's semantic types do not carry control metrics through a
consumer-owned native-treatment adapter. Mapping `LumenControlSize.md` to SwiftUI's `.regular`
control size produced a roughly 35-point bordered button in the accessibility tree until the
adapter explicitly applied the app's 44-point minimum target. This is valid composition, but the
API shape can make intent and size mapping look more complete than it is; adapter guidance should
require consumers to map both the visual recipe and platform hit-target policy. Carousel and Layout
then migrated their compact Reorder/Done section-header actions with the `.sm` visual recipe while
the same adapter independently preserved a 44-point interactive frame through both label states.
The posting-plan composer also confirmed that a system-owned `Menu` needs the adapter as a style,
while the adjacent app-owned Reorder action can use the composed button. Wrapping the menu in a
replacement button would transfer disclosure ownership and change behavior. The editor review and
carousel readiness surfaces further showed that an app-owned composed action must accept structured
row content—a leading label, flexible space, and trailing disclosure icon—without losing the
semantic intent, full-width layout, or minimum target. XCTest also reported a nominal 44-point
accessibility frame as `43.99999999999994`; conformance tests should compare native geometry with a
subpixel or display-scale tolerance instead of treating floating-point representation as a product
failure. PostLens could migrate its compact Carousel and Layout edit strips by retaining the
adapter's medium semantic size and adding the explicit target; adopting Lumen semantics should not
implicitly shrink an established control to `.sm`, especially when the localized label already fits.
The same adapter initially omitted the `ButtonRole` that `LumenButton` already supports. Cancel and
destructive semantics are independent from visual intent: a consumer may need a secondary bordered
treatment while still forwarding `.cancel` or `.destructive` to the native `Button`. A UI-system
fixture also showed that applying one accessibility identifier to a composite SwiftUI root can
overwrite every descendant identifier, even when the adapter applies its identifier directly to the
native button. The same issue recurred on PostLens's real editor root: Undo and Redo retained their
accessible names but inherited the screen identifier, making XCTest re-resolve them through the
composite container. Moving the screen marker onto the editor's segmented control restored distinct
button identities. Stable identifiers belong on the smallest semantic element, not a screen
container.
PostLens then migrated the compact Save Recipe and Save Kit header commands while retaining their
system-owned SwiftUI alerts, text fields, cancel roles, and confirmation actions. This boundary lets
Lumen own the trigger's intent and size without transferring presentation state or form semantics.
The Recipe trigger and its `Save Adjustment Recipe` alert intentionally use different accessible
names, so a migration test must verify the leaf trigger and the presented dialog independently
rather than assuming the button label is also the presentation title.
The Gallery's compact Find More action exposed a separate async ownership boundary. Its domain
model already replaces the trigger with a progress status while a bounded on-device scan runs, then
removes the action when no candidates remain. Setting `LumenButton.loading` as a second busy source
would keep stale button semantics mounted and risk state drift. Guidance should distinguish actions
that remain mounted and legitimately use component loading from triggers whose parent state machine
replaces them with a richer progress or completion surface. The On-device Scoring settings screen
showed that the same rule also applies to synchronous recovery state: applying a session-only
low-battery override immediately replaces Continue Slowly with an ongoing status. Button-local
loading would be inaccurate even briefly, so the interaction test should assert the old trigger
leaves the accessibility tree and the model-owned status appears.
Finally, Smart Crop is an action that becomes selected after applying a verified suggestion and
returns to unselected when Reset is used. The consumer can switch between primary and secondary
intent and write a `Selected` accessibility value, but that conflates emphasis with state and does
not add a first-class selected contract. Loading, selected, disabled, and intent need to remain
orthogonal so the same action can announce preparation and then selection without changing its name.

Acceptance criteria:

- Keep the small button's visible shape compact while providing a platform-appropriate minimum hit
  target, including at least 44 by 44 points on iOS.
- Keep compact label padding proportional enough for common trailing row actions at narrow iPhone
  widths without forcing avoidable truncation.
- Define how expanded hit regions behave when compact buttons sit beside other row actions so
  targets do not overlap or steal gestures.
- Preserve the current medium and large visual metrics and source-compatible size cases.
- Apply the same target policy to `LumenIconButton`, or document any intentional difference.
- Test small text buttons and icon buttons in lists, cards, toolbars, and dense action groups with
  touch, pointer, keyboard, Switch Control, and VoiceOver.
- Add an adaptive-grid example that combines medium buttons, a consumer-defined minimum column
  width, and an explicit 44-point-or-larger target, then verify reflow at narrow iPhone widths and
  accessibility text sizes.
- Assert the accessibility frame as well as the rendered and interactive frame for every regular-
  density `LumenIconButton` size and for native buttons using `LumenIconButtonStyle`; medium and
  small controls must expose at least 44 by 44 points on iOS.
- Keep the expanded semantic frame on the native Button element. Do not require consumers to hide
  its children, synthesize a replacement button trait, or duplicate activation actions.
- Add a SwiftUI media-workspace example with a large button in a `List` above a persistent
  `safeAreaInset` action bar, and assert that the rendered frames do not overlap at compact heights.
- Document that accessibility-tree presence does not prove a migrated control is visible or
  hittable when sibling previews, scroll containers, and safe-area bars divide the viewport.
- For virtualized lists with sibling scroll views, identify the owning scroll container, position
  the intended row without overshooting it, and assert that its frame intersects the visible
  viewport before capturing visual evidence.
- Add native-treatment adapter guidance that maps `LumenButtonIntent` and `LumenControlSize` while
  explicitly preserving the platform minimum interactive target, with an accessibility-frame test
  and a system-owned `Menu` beside an app-owned composed action.
- Include a full-width card-row example whose composed label has leading content and a trailing
  disclosure cue, and verify that activation, semantic intent, and the minimum target remain owned
  by the button.
- Add a SwiftUI example where a compact Lumen-styled trigger presents an application-owned native
  naming alert; verify the trigger frame and accessible name separately from the alert title, text
  field, cancel role, and confirmation action.
- Document async ownership for actions whose domain state replaces the trigger with progress or
  completion content; do not require button-local loading when it would duplicate the source of
  truth. Cover both async work and synchronous recovery transitions by testing that the old trigger
  leaves the accessibility tree and the model-owned status appears.
- Define a native accessibility-frame assertion tolerance no larger than one physical pixel so a
  nominal 44-point target passes despite platform floating-point rounding, while materially smaller
  targets still fail.
- Tell adapter consumers to preserve the established visual size during semantic migration and to
  choose `.sm` only after localized labels and target spacing are verified in the real compact
  composition.
- Document that native-treatment adapters must mirror `LumenButton`'s optional `ButtonRole` rather
  than inferring cancel or destructive semantics from `LumenButtonIntent`; test role-sensitive
  actions through cancellation and destructive recovery behavior.
- Add SwiftUI testing guidance that assigns identifiers to leaf semantic controls and avoids one
  identifier on a composite ancestor; verify that sibling button identifiers remain distinct in the
  accessibility tree.
- Test a `ViewThatFits` action that changes between labeled-button and icon-button representations
  at standard and accessibility text sizes, preserving one identifier, name, hint, target, and
  activation result without exposing the unselected fallback. Require the selected representation's
  full frame to remain inside the viewport and clear of adjacent controls, with a stacked fallback
  when icon compaction alone cannot satisfy those constraints.
- Define a SwiftUI selected-action contract or documented composition for `LumenButton` that keeps
  intent independent, exposes selected semantics to assistive technology, and preserves the button's
  accessible name through loading, selected, reset, and disabled transitions.
- Document when a consumer must retain a native compact control because the surrounding system
  container owns hit testing or presentation.

## SwiftUI picker rich label and current-value content

PostLens evaluated the released SwiftUI `LumenPicker` 2.0.0 contract for two app-owned settings:
the app Accent row presents a branded swatch beside the current accent name, and the publishing
reminder row presents a clock icon beside `Notify me`. The released initializer accepts only a
text title, selection, style, label visibility, and option content. Replacing either native
`Picker` with that contract compiles only after discarding its rich label; rendered verification
of the reminder migration visibly lost the clock icon. The sibling Lumen source now contains a
richer label and `currentValueLabel` initializer, but a maintained consumer cannot adopt an
unreleased checkout API or sacrifice existing information to appear migrated. Both controls
therefore remain native until the richer contract ships and can be verified from the consumer's
resolved package version.

Acceptance criteria:

- Release a source-compatible SwiftUI picker initializer with custom label content and an optional
  custom current-value label.
- Preserve the existing text-title initializer and automatic, menu, segmented, and inline styles.
- Add examples matching a Settings accent row with a swatch and a reminder row with a clock icon,
  while keeping the option selection and current value accessible.
- Test compact and regular layouts, long localized values, Dynamic Type, VoiceOver, disabled state,
  and light and dark themes.
- Version-qualify migration documentation so consumers can distinguish released package contracts
  from APIs present only on Lumen's development branch.

## SwiftUI date-field verbatim and custom-label content

PostLens migrated both its create and edit posting-plan forms to the released SwiftUI
`LumenDateField` 2.0.0 contract with date-and-time components and a lower bound at the current
moment. Its separate graphical posting calendar remains a native `DatePicker`: that control owns
calendar navigation rather than a form field, and `LumenDateField` intentionally does not expose a
graphical style. This is a useful component boundary, not an incomplete migration.

The form migration exposed two content limitations. PostLens resolves copy through an in-app
language setting, but `LumenDateField` accepts only `LocalizedStringKey` for its title, description,
and error message. It cannot receive already-localized text as verbatim content like
`LumenTextarea` can. The create form also previously used a structured label with a calendar icon;
adopting the shared Lumen field required dropping that icon because the component has no custom-label
initializer. The consistent create/edit field was preferable to retaining two treatments, but a
consumer should not need to discard useful label content to adopt Lumen.

Focused XCTest inspection exposed a related semantic gap in the released implementation. The
visible title appears as a separate `StaticText`, while the native picker is found only by the
generic `Date and Time Picker` label; querying the picker by `Post at` fails. The picker reports a
36-point accessibility frame inside a 66-point form row, so accessibility-tree geometry alone also
does not prove that the complete row is an interactive target. Lumen should verify and document the
programmatic label relationship and the effective hit region instead of relying on visual proximity.

Acceptance criteria:

- Accept `LumenTextContent` for the title, description, and error message while preserving the
  source-compatible `LocalizedStringKey` initializer.
- Provide a custom-label initializer that retains the native `DatePicker` selection, component,
  bounds, validation, focus, and accessibility behavior.
- Document that graphical calendar navigation remains platform-owned unless Lumen deliberately adds
  a separate calendar component rather than overloading the form-field contract.
- Test date, time, and date-and-time variants with closed, lower, upper, and unbounded ranges.
- Test an in-app locale that differs from the system locale, structured icon labels, long text,
  Dynamic Type, VoiceOver, validation messages, and light and dark themes.
- Verify that the visible title programmatically labels the picker, that automation can identify the
  control by the field title rather than a generic system label, and that the effective interactive
  target meets the platform minimum without synthesizing replacement semantics.

## SwiftUI slider gesture and composition contract

PostLens evaluated every remaining native editor slider against released `LumenSlider` 2.0.0. Its
complete labeled stack works for a conventional settings field, but the photo editor needs lower-
level composition: look intensity and manual adjustments use `onEditingChanged` to group a drag
into one undoable history entry; crop zoom places a reset action, slider, and percentage on one row;
and Layout Builder switches between inline and stacked labels at accessibility Dynamic Type sizes
while binding `CGFloat` geometry. Layout Builder has since migrated the containing expansion control
to `LumenDisclosure`, but its shared `PhotoLayoutValueSlider` still keeps native sliders with explicit
localized names and percentage values. This preserves the domain bindings and adaptive layout while
letting Lumen own the surrounding disclosure. `LumenSlider` accepts only `Binding<Double>`, owns the
visible label/value stack, and does not expose the native editing callback. Migrating these controls
would either break history semantics or duplicate and distort their established layouts, so they
remain native while continuing to use the app's Lumen theme and spacing around the control.

Acceptance criteria:

- Expose the native editing-state callback, or an equivalent drag-began/drag-ended contract, so a
  consumer can create exactly one undo record per gesture.
- Provide a style or lower-level slider primitive that can omit Lumen's visible label/value row
  while retaining its tint, disabled, focus, and accessibility treatment.
- Support floating-point bindings beyond `Double`, including `CGFloat`, without requiring an
  unsynchronized second source of truth.
- Preserve the current fully labeled initializer as the source-compatible default.
- Document inline crop, manual-adjustment-with-reset, and Dynamic Type-reflow examples, including
  accessible names and values when the visible label is composed outside the primitive.
- Test keyboard and accessibility increments, touch and pointer drags, Reduce Motion, disabled
  state, undo grouping, and regular versus accessibility text sizes.

## SwiftUI icon-button loading state

PostLens has an icon-only Apple Intelligence action that must remain visible, disabled, and
animated while an on-device caption request is running. `LumenButton` owns a loading state, but
`LumenIconButton` accepts only a fixed icon and disabled state. The consumer can apply the public
`LumenIconButtonStyle` to a native button to retain its existing spinner, but then it must recreate
the icon foreground treatment and loading semantics that the composed component normally owns.
The Photo Editor's Prepare post action confirmed the same boundary for a non-generative workflow:
it keeps a compact material circle beside a system-owned destination menu, swaps the sparkle for a
domain spinner without moving the control, and must retain `Prepare post` as its accessible name
while announcing a localized loading value. Applying the released public style supplied the visual
recipe, but XCTest still reported only the 34-point inner material circle until the consumer added
an explicit 44-point semantic frame inside the styled label. The consumer also still owns all
dynamic content and semantics until the composed loading contract ships.
PostLens's Caption Assistant exposed why loading must be separate from the command name even when
the styled native button already swaps its icon correctly. Its initial implementation changed the
accessible label from `Improve with AI` to `Improving…`, which removed the stable command identity
exactly while the disabled control was reporting progress. The consumer now keeps the command name,
publishes localized `Loading` as the value, and places its 44-point minimum inside the dynamic label
so the Lumen-styled semantic leaf owns the measured frame. A deterministic busy-state fixture also
proved that exactly one button remains in the accessibility tree while the spinner occupies the
same slot beside a multiline field.

Acceptance criteria:

- Allow `LumenIconButton` to display a loading state without replacing its accessible name.
- Disable repeated activation while loading and expose localized progress semantics.
- Preserve the selected intent's foreground, background, border, pressed, and disabled recipes for
  both the resting icon and progress indicator.
- Keep the button's dimensions stable when switching between the icon and spinner.
- Test primary, secondary, quiet, and danger intents in light and dark themes, including Reduce
  Motion and larger accessibility text settings.
- Test a compact loading icon action beside a system-owned menu, preserving its spatial slot,
  accessible name, localized loading value, and 44-point target through the transition.
- Test a loading icon action beside multiline input content, requiring one semantic button whose
  command name remains stable, whose localized loading value changes independently, and whose full
  accessibility frame stays at least 44 by 44 points without moving the adjacent text layout.
- Document when a styled native button remains appropriate for dynamic content that the composed
  icon-button contract does not yet support.

## SwiftUI button loading accessibility content

PostLens migrated the shared Save and Share dock used by its photo editor, Carousel Builder,
Layout Builder, Publishing Set, and publishing plan to `LumenButton`. The component
unconditionally sets its loading accessibility value to the `LocalizedStringKey` literal
`Loading`. A consumer that has already resolved copy through its own localization layer cannot
supply an action-specific or verbatim progress value, and must override the modifier after
composing the Lumen button to avoid an untranslated English value in the accessibility tree.

The shared PostLens selection dock confirmed a related composition need. Its busy state is already
represented by a blocking workflow overlay, so the action must become unavailable and announce
localized progress without inserting a second spinner or replacing its contextual label. The
consumer must currently pass the busy state through `disabled`, then separately override
`accessibilityValue`. The single `loading` flag conflates visual progress, interaction locking, and
the accessibility announcement even when those responsibilities belong to a surrounding workflow.

PostLens's publishing-plan Schedule action confirmed the same boundary for inline progress. The
button must keep its verb-specific, in-app-localized `Scheduling…` label and existing contrast-aware
progress icon while preventing another activation. The released component's `loading` flag would
also prepend its built-in spinner and announce the fixed `Loading` value, so the consumer migrated
the primary surface but still has to express the busy state through its label and `disabled` input.

Acceptance criteria:

- Accept optional localized or verbatim loading accessibility content on `LumenButton` while
  preserving the current default for source compatibility.
- Keep the visible label stable and expose the supplied busy value only while loading.
- Allow consumers to expose a busy interaction state without forcing the built-in spinner, or make
  spinner visibility independently configurable from loading semantics.
- Do not perform a second localization lookup when the consumer supplies already-resolved copy.
- Preserve the disabled loading state and prevent repeated activation.
- Test system-localized and in-app-localized English and Spanish values in the rendered iOS and
  macOS accessibility trees.

## SwiftUI accent-derived theme bridge

PostLens initially overrode Lumen's `brand`, `brandSoft`, and `accent` colors with its selected app
accent, but `LumenButton(intent: .primary)` paints with the separate `brandSolid` and `onBrand`
tokens. The first migrated controls therefore remained Lumen's default blue while the surrounding
native controls were violet, coral, or another selected accent. Correcting `brandSolid` alone is
not sufficient: several adaptive dark-appearance accents need dark foreground content to retain
WCAG text contrast instead of the default white `onBrand`.

Acceptance criteria:

- Provide a documented SwiftUI helper or recipe for deriving a coherent brand palette that updates
  `brand`, `brandSolid`, `brandSoft`, `onBrand`, and `accent` together.
- Allow consumers to provide an explicit solid color and foreground when their brand system already
  owns those decisions.
- Offer or document a contrast-safe foreground derivation for adaptive light and dark colors.
- Keep individual token overrides available for advanced themes without silently coupling them.
- Test primary buttons and other solid-brand components across adaptive consumer accents in light,
  dark, disabled, pressed, and loading states.

## SwiftUI structured-state verbatim content

PostLens uses an in-app English, Spanish, or System language setting and resolves workflow copy
before constructing its shared empty and unavailable states. `LumenEmptyState` and
`LumenErrorState` accept `LocalizedStringKey` for their title, description, and reference label,
but not `LumenTextContent`. Passing an already-resolved string through a dynamic localized key can
route it back through the system locale and makes the contract inconsistent with `LumenButton` and
`LumenBadge`. The generic action slot does compose correctly with a `LumenButton` whose `Text`
label receives the resolved string, so PostLens could migrate the recovery action without giving
Lumen ownership of the application language setting.

PostLens also migrated the empty Recently Deleted collection inside a native inset `List` from
`ContentUnavailableView` to `LumenEmptyState`. The Lumen composition preserved the title and
retention explanation and provided a consistent token-aware icon treatment, while the surrounding
list continued to own navigation and row chrome. The consumer supplied a finite minimum row height;
`LumenEmptyState` otherwise requests the maximum available height, which is appropriate for a page
state but does not define a useful intrinsic row size inside a list. List integration guidance
should distinguish page-filling, section-row, and compact empty states without forcing arbitrary
consumer geometry.

Acceptance criteria:

- Add `LumenTextContent` initializers for `LumenEmptyState` and `LumenErrorState` title,
  description, and reference-label content while preserving current localized-key initializers.
- Render verbatim content without a second localization lookup and keep localized content using
  the system localization environment.
- Preserve generic action and graphic slots so consumer-owned recovery behavior remains intact.
- Test English selected in-app on a Spanish system and Spanish selected in-app on an English
  system, including compact and page layouts.
- Provide a documented native `List`/`Form` recipe or an explicit section-row layout that has a
  bounded intrinsic height while preserving the existing page-filling default.

## SwiftUI icon-button verbatim accessibility labels

Between Contractions localizes its macOS interface with an in-app English/Spanish toggle that is
independent of the system locale. `LumenButton` and `LumenBadge` accept `LumenTextContent`, so the
consumer can pass already-resolved copy with `.verbatim(...)`. `LumenIconButton` accepts only
`LocalizedStringKey`, forcing an already-localized accessible name back through SwiftUI's string-
key path. The menu-bar Quit action can use the dynamic-key fallback, but the contract is
inconsistent and does not explicitly preserve verbatim consumer copy.

Acceptance criteria:

- Add a `LumenTextContent` initializer for both named and SF Symbol icon buttons while preserving
  the existing `LocalizedStringKey` initializers.
- Pass the supplied content to the underlying button's accessibility label without a second
  localization lookup.
- Keep source compatibility for applications that rely on SwiftUI's system-locale lookup.
- Test localized and verbatim labels in the macOS and iOS accessibility trees.
- Verify an English system with Spanish selected in-app, then the inverse.

## SwiftUI selection-control rich option content

PostLens groups manual photo adjustments into Light, Color, and Detail & Focus. Each segment pairs
an SF Symbol with its localized title, shows a live count only when that group contains changes,
and announces the count as the option's accessibility value. `LumenSegmentedControl` accepts
`LumenSelectionOption` values with a plain string title, so migrating this selector would remove
useful visual and assistive state. The consumer must retain a custom segmented selector even though
Lumen owns the corresponding selection recipe. The Supporter purchase screen exposes the same
limitation in `LumenRadioGroup`: each App Store plan needs a selection mark, plan name, optional
recommendation badge, offer or billing detail, optional value framing, and a trailing localized
price. Flattening that card into a title and description would discard purchase context.

Between Contractions confirmed a useful partial-adoption pattern on macOS: action-backed
`LumenCard` instances can own the pressed and selected surfaces for rich feedback, notification,
and theme choices, while a zero-padding non-action card can contain a selectable pregnancy row and
its separate native destructive action. Rendered accessibility still requires the consumer to own
the binding, selection marker, selected trait or value, grouping, and option-specific content. This
bridge reduces duplicate surface styling, but it is not a typed selection-control replacement.

PostLens confirmed the complementary non-action composition on iOS. A `LumenCard` with public
padding and radius options now contains the Studio heading plus its canonical destination-format
menu. Lumen owns only the semantic surface, line, spacing, and corner treatment; the nested native
button retains its accessible name and current-value announcement, presents the selection sheet,
and updates the consumer-owned ranking binding. Making the card action-backed would create nested
button semantics and incorrectly transfer activation from the labeled menu. Rendered tests covered
both the initial Instagram 3:4 value and a successful switch to Pinterest 2:3 without changing that
interaction boundary.

The prepared-draft review card extends that pattern to media and multiple actions. Its non-action
`LumenCard` contains an application-owned preview image, a readiness-score button, explanatory
metadata, and a separate Review & publish button. Lumen can own the card surface and spacing, but it
must not infer the preview's fit, crop, background, privacy behavior, or accessible description, and
it must not merge the score dialog with the editor-navigation action. The deterministic iOS test
verifies that the preview, score, and review controls remain independently discoverable and that
the review action opens the prepared draft in the editor. An action-backed card would introduce
nested buttons and an ambiguous activation target.

PostLens also removed its final Studio-specific card modifier by placing an adaptive Supporter hero
and a divided benefits list in separate non-action `LumenCard` instances. The hero continues to
switch from a horizontal to a vertical application-owned layout at accessibility text sizes, and
the list keeps independently readable benefit rows separated by `LumenDivider`; the card does not
need to understand either composition. The separately rendered rich Supporter button needed an
explicit accessible name and hint because its visible title and subtitle otherwise merged into one
unstable label. Its deterministic preview originally supplied a no-op action, which could prove
only appearance; wiring the real callback and asserting the presented Supporter destination turned
the same fixture into interaction evidence.

PostLens then removed the editor's remaining generic `cardStyle()` modifier by moving ten filter,
adjustment, crop, creation, progress, unavailable, and review panels to non-action `LumenCard`
surfaces with explicit public padding and radius tokens. The same contract safely contains sliders,
toggles, disclosures, menu buttons, progress semantics, and multiple independent actions because
the card itself does not add activation. This broad replacement also demonstrated why migration
evidence must cover the whole screen composition: at an accessibility text size, the fixed photo
preview and vertically expanded bottom `LumenButtonGroup` left too little gesture space to reach a
nested slider even though every individual Lumen component was valid. Making the application-owned
preview yield height restored reachability; changing card padding or weakening the test would not
have addressed the root cause. The regression test begins its scroll in the remaining content
viewport rather than over the safe-area action dock, then verifies that the nested slider is
hittable and remains within the screen bounds.

The shared PostLens readiness hierarchy added a useful distinction between cards and lower-level
surfaces. Each score explanation is one non-action `LumenCard`, while repeated measured-signal tiles
use muted `LumenSurface` instances so the composition does not accumulate nested card borders or
suggest that every datum is independently actionable. The derived readiness result alone uses an
accent card, and its already-resolved destination-format context uses a verbatim `LumenBadge`.
Neither `LumenCard` nor `LumenSurface` adds semantic grouping without an action, so the host retains
the deliberate combined label and value for a score hero and each measured row. Focused UI coverage
therefore verifies that score labels remain readable static content rather than becoming buttons,
and that the larger card metrics remain scroll-reachable at an accessibility text size. Lumen's
composition guidance should explain this visual-versus-semantic boundary instead of implying that a
shared surface automatically supplies an accessible group.

Acceptance criteria:

- Allow each SwiftUI segmented or radio option to supply rich label content without weakening the typed
  selection contract.
- Keep a stable localized accessible name separate from decorative icons and visible accessories.
- Allow dynamic state such as a count or status to be exposed as the option's accessibility value.
- Preserve selected and disabled semantics, focus order, keyboard operation, and full-segment hit
  targets when rich labels are used.
- Verify short and long localized labels, zero and multi-digit counts, larger accessibility text,
  and narrow iPhone widths.
- Document when consumers should use a segmented control, radio group, tabs, or an
  application-owned domain selector.
- Document the action-backed `LumenCard` bridge for rich standalone choices, including explicit
  selected semantics and the non-action-card pattern when a row contains a separate native action.
- Include a non-action card example containing a heading and independently labeled menu button;
  verify that VoiceOver exposes the menu's current value and that the card adds no competing action.
- Include a media-card example with an application-owned preview and at least two independent
  controls; document that Lumen does not infer media fit, crop, privacy, or description semantics.
- Verify VoiceOver order from preview through score, metadata, explanations, and primary action,
  independent activation of each control, larger accessibility text, and narrow iPhone widths.
- Include an adaptive non-action-card example whose application-owned content changes axis at an
  accessibility text size and another example that composes independently readable rows with
  `LumenDivider`.
- Keep a rich CTA outside informational cards, document explicit accessible names and hints for
  title-plus-subtitle labels, and verify its destination rather than relying on screenshot-only or
  no-op preview actions.
- Include a non-action `LumenCard` composition containing several independently interactive native
  or Lumen controls, and verify that the card contributes no merged or competing activation target.
- Document that fixed media previews and safe-area action groups remain host-owned layout regions;
  when actions reflow vertically at an accessibility text size, the preview must yield enough space
  for the card's scrollable controls to remain reachable.
- Add rendered native coverage that scrolls from the actual content viewport, not through a fixed
  action dock, and asserts a nested control is both hittable and within horizontal screen bounds.
- Add a compound readiness example with one non-action outer card, muted nested surfaces for peer
  signals, a verbatim context badge, progress indicators, and one accent result card; document why
  every nested tile should not become another card.
- Document that non-action `LumenCard` and `LumenSurface` provide visual structure but do not infer
  accessibility grouping, labels, values, headings, or data relationships from arbitrary content.
- Verify the compound example exposes informative static groups rather than buttons, preserves the
  host's combined score labels and values, and remains scroll-reachable at accessibility text sizes.

## SwiftUI badge accessory and verbatim content

Between Contractions migrated simple macOS ready, active, count, and connection-state metadata to
`LumenBadge`. Two compact pills still need application-owned content: the Live Sync header pairs an
SF Symbol with a localized status, and the History scope menu trigger pairs a heart with its current
scope. `LumenBadge` accepts localized or verbatim text but no leading content; `LumenChip` is also
text-only and accepts only `LocalizedStringKey`. Replacing either rich pill would remove useful
visual context or route already-resolved in-app English/Spanish copy back through system-locale
lookup.

Acceptance criteria:

- Allow `LumenBadge` to accept optional leading icon content while keeping a stable localized or
  verbatim accessible name.
- Add `LumenTextContent` support to `LumenChip` without breaking its existing localized-string
  initializer.
- Keep icon, label, tone, selected state, disabled state, and remove action understandable without
  relying on color alone.
- Support a non-interactive badge or chip as a `LumenMenu` label without creating nested buttons or
  obscuring the menu's accessible name.
- Test text-only and icon-bearing badges plus static, selectable, removable, and menu-label chips
  on macOS and iOS with opposite system and in-app locales.

## Native spinner color in nested actions

Between Contractions migrated its Android and macOS Partner Sync actions to `LumenButton` while
preserving localized, immediate store progress states. The standalone Compose and SwiftUI
`LumenSpinner` implementations always paint with the theme brand color, so composing one inside a
primary brand button can remove the contrast needed to perceive progress. Android must retain a
Material progress indicator, while macOS cannot safely expose the same nested loading treatment,
even though Lumen otherwise owns the action recipes.

PostLens confirmed the same gap in the composed SwiftUI button. `LumenButton(loading: true)` inserts
a native `ProgressView`, but does not tint it with the intent's semantic foreground. Rendered light,
dark, and Accessibility Text editor states showed the default indicator becoming low-contrast
inside the disabled primary Share action. The consumer can use the public Lumen button surface, but
must retain its contrast-aware loading icon in the custom label until the component owns this state.

Acceptance criteria:

- `LumenSpinner` inherits the surrounding content color by default or accepts a semantic tint.
- A spinner remains visible inside primary, secondary, quiet, and danger buttons in light and dark
  themes without consumer-owned color overrides.
- `LumenButton` applies the selected intent's semantic foreground to its built-in progress
  indicator before disabled-state opacity.
- Standalone use on canvas and surface backgrounds retains the existing brand treatment by default.
- The caller can provide a localized progress label without changing visual color behavior.
- Compose and SwiftUI screenshots and semantics tests cover both standalone and nested use.

## Native button hierarchy and semantic tone

Between Contractions exposes semantic actions at different levels of emphasis. Ending a whole
Partner Sync group belongs in a prominent danger button behind confirmation, removing one device
is a compact trailing destructive action, and calling the configured care team is a positive
primary action. The released native danger intent always produces the filled danger recipe, quiet
and secondary intents cannot carry a danger tone, and no hierarchy can opt into a success tone.
Those actions therefore cannot all migrate without becoming visually dominant or losing meaning.

Acceptance criteria:

- Primary, secondary, and quiet hierarchies can opt into destructive or success presentation
  independently of the platform button role.
- Foreground, background, border, pressed, disabled, focus, and loading states retain contrast.
- A compact trailing destructive action fits a native list row without competing with the page
  action.
- Assistive technology receives the same accessible name and button role at every hierarchy.
- SwiftUI, Compose, and React Native document a confirmed page-level delete, a row-level remove,
  and a positive primary action such as Call or Connect.

## Compose disabled quiet-button background

Rendered verification of the Spanish Partner Sync flow found that a disabled quiet `LumenButton`
becomes a large dark rectangle instead of remaining visually quiet. The Compose recipe starts with
`Color.Transparent`, then creates `disabledContainerColor` by copying a nonzero alpha onto that
color. This produces translucent black rather than transparent, and is especially prominent on a
full-width Restore action.

Acceptance criteria:

- Disabled quiet buttons retain a transparent container in light and dark themes.
- Disabled foreground treatment remains visibly distinct without reducing label legibility.
- Primary, secondary, and danger disabled recipes remain unchanged unless contrast testing finds a
  separate issue.
- Screenshot tests cover enabled and disabled buttons at compact and full width.
- The fix is verified against a real consumer using long English and Spanish labels.

## SwiftUI icon-only menu labels on macOS

Between Contractions migrated its CSV/PDF export menu to `LumenMenu` and applied a localized
`Export` accessibility label to the composed menu. The rendered macOS accessibility tree still
announced the SF Symbol's inferred name, `Share`. Moving the accessibility label onto the custom
menu-label content corrected the consumer, but this ownership is easy to miss and the public API
does not provide a direct accessible-name parameter.

Acceptance criteria:

- Allow an icon-only `LumenMenu` to declare its accessible name directly through the public API.
- Ensure the localized menu purpose overrides an SF Symbol's inferred description on macOS.
- Preserve the same name and correct availability state when the menu is disabled.
- Test English and Spanish names in the rendered macOS accessibility tree.
- Document text, icon-plus-text, and icon-only label recipes.

## SwiftUI system-container boundary guidance

Between Contractions can use `LumenDivider` between rows and sections rendered in application
content, but a SwiftUI `Menu` or `contextMenu` requires the native `Divider` to create a semantic
system-menu separator. Substituting Lumen's visual rectangle compiles, yet it does not carry the
platform role or guarantee native menu presentation. The same distinction applies to other system-
owned containers where custom views and native semantic elements are not interchangeable.

PostLens confirmed the same boundary in its optional Image Playground handoff. A full-width
`LumenButton` can own the application-rendered entry action and disabled availability state, while
the per-use privacy disclosure remains a native SwiftUI alert and the generative experience remains
Apple's public system sheet. Lumen should theme the transition point without wrapping, replacing,
or implying ownership of the system consent and handoff surfaces.

Acceptance criteria:

- Document that `LumenDivider` is for application-rendered layouts, not system menu command groups.
- Provide SwiftUI examples that retain native `Divider`, `Section`, button roles, and toolbar or
  alert actions inside their platform-owned containers.
- Identify comparable boundaries for Compose and React Native where a Lumen visual primitive does
  not replace navigation, menu, dialog, or accessibility semantics.
- Add a migration checklist that asks whether a primitive is being placed in ordinary view content
  or a platform-owned result-builder/container before recommending replacement.
- Keep consumer examples visually themed around the system container instead of wrapping native
  commands in unsupported custom presentation.

## SwiftUI divider orientation and contrast contract

PostLens migrated ordinary horizontal separators in its Gallery and Studio selection bars, saved-
photo picker, destination cards, editor review, and multi-photo readiness sheet to `LumenDivider`.
Those surfaces can use the theme's line token while preserving consumer-owned leading insets and
row spacing. The remaining native dividers are not unfinished equivalents: SwiftUI's `Divider`
automatically becomes vertical inside the editor, Carousel, and Layout split panes and between the
compact Undo and Redo controls, while `LumenDivider` is a fixed full-width rectangle with a one-
point height. Giving it a taller outer frame does not turn it into a vertical separator. The live
camera control deck also needs a low-opacity light separator on black media chrome, which the fixed
theme-line treatment cannot express without a consumer color override. Native dividers inside
`Menu` and `contextMenu` builders remain platform-owned semantic separators as documented above.

A deterministic PostLens readiness fixture verified the horizontal migration with three scored
rows in the same medium sheet before and after the change. The separators remained decorative and
the row names and values kept their accessibility order; this is the representative contract that
fits the released component today.

Acceptance criteria:

- Let `LumenDivider` declare horizontal or vertical orientation, with an adaptive option matching
  SwiftUI stack context when that behavior can be implemented reliably.
- Preserve the one-point horizontal recipe and source compatibility for existing callers.
- Support a semantic contrast treatment suitable for dark media chrome without requiring raw
  consumer colors or weakening the normal theme line token.
- Keep every visual divider hidden from accessibility while preserving the order and grouping of
  adjacent semantic content.
- Test leading-inset row separators, top and bottom overlays, vertical split panes, compact toolbar
  groups, light and dark themes, and high-contrast settings.
- Continue requiring native `Divider` inside system menus even after visual orientation support is
  added.

## SwiftUI disclosure and nested-action ownership

PostLens migrated the Image Playground explanation from a native `DisclosureGroup` with a custom
card modifier to `LumenDisclosure`'s released custom-label initializer. The Lumen component can own
the themed surface, border, expansion indicator, and expansion binding while the application keeps
its localized icon-and-status label, privacy explanation, availability fallback, and Apple consent
handoff. The expanded content also contains its own full-width Lumen action. This works because
`LumenDisclosure` keeps the disclosure header as the toggle and renders expanded content beside it
in the semantic hierarchy; wrapping the same composition in an action-backed `LumenCard` would
create an outer button around another button and transfer activation away from the disclosure.

Rendered available and unavailable fixtures confirmed that the migration leaves exactly one
`Image Playground, Optional` disclosure button with at least a 44-point target, exposes the nested
`Edit with Image Playground` action independently after expansion, and preserves the native consent
alert and disabled fallback. This is a useful boundary for any disclosure whose body contains links,
buttons, or other application-owned controls. The first rendered assertion also exposed that the
component's card padding does not enlarge the `DisclosureGroup` button reported to accessibility:
the custom label measured only 28.7 points high until PostLens supplied a 44-point minimum frame and
rectangular content shape.

A follow-up migration covered three related creation workflows that had shared one app-styled card
with native disclosure rows and dividers. Because released `LumenDisclosure` always owns its surface,
border, radius, and padding, placing those components inside the old card would have produced nested
surfaces and duplicate chrome. PostLens instead removed the wrapper and dividers and rendered the
three disclosures as sibling Lumen surfaces. The result is coherent and accessible, but less compact
than the grouped native composition. This reveals a separate component gap: Lumen needs either a
documented disclosure-group composition or a public grouped/flush surface style when several related
disclosures should share one visual container. The locked fixture also showed that a visible SF
Symbol lock in a custom label was not included reliably in the disclosure button's accessible name.
PostLens hid the decorative symbol and supplied an explicit localized “Opens PostLens Supporter”
label suffix, so the premium state is conveyed without depending on symbol-derived semantics. Its
first locked-state fixture also mounted the disclosure view without the host-owned Supporter sheet;
the nested action changed application state but nothing appeared. Disclosure examples and preview
fixtures must include the host presentation boundary when proving nested navigation or modal actions.

Layout Builder then migrated its last production-native disclosure, an expanded fine-tune surface
containing three independently adjustable geometry sliders. The released component preserved the
external expansion binding and cleanly separated the toggle from the sliders, but using its owned
surface inside an inset `List` required the consumer to clear the native row background, separator,
and insets. Without that integration recipe, a consumer gets nested row chrome around Lumen's border
and padding. A deterministic fixture verified one 44-point toggle, separately named zoom, horizontal,
and vertical sliders with localized percentage values, stable collapse and re-expansion, and a real
zoom edit. The sliders remain host-owned for the `CGFloat` and Dynamic Type reasons above.

Acceptance criteria:

- Document `LumenDisclosure` as the preferred surface when expanded content contains independent
  controls, and warn against wrapping that composition in an action-backed card.
- Keep one disclosure toggle with a stable accessible name, expanded state, focus position, and
  minimum target when a custom label contains icons or status text.
- Make `LumenDisclosure` guarantee that 44-point minimum target itself for both its standard and
  custom-label initializers so consumers do not need to repair the component's interactive frame.
- Document that standalone `LumenDisclosure` instances must not be nested inside another card merely
  to group them; use sibling surfaces until a supported grouped composition exists.
- Provide a documented `List` and `Form` integration recipe or public row style that removes native
  row background, separator, and insets without requiring every consumer to rediscover the complete
  modifier set.
- Evaluate a `LumenDisclosureGroup` or public grouped/flush surface style that preserves one outer
  container, row dividers, rounded first and last rows, and independent disclosure semantics without
  asking consumers to recreate Lumen's border and padding internals.
- Keep buttons, links, and form controls in expanded content as separate semantic elements with
  their own names, disabled states, roles, and activation results.
- In custom-label examples, treat status icons as decorative and demonstrate an explicit localized
  accessible label or value for locked, unavailable, warning, and completion states.
- Keep navigation, sheets, alerts, and external handoffs owned by the host application, but make
  disclosure integration fixtures mount those presentation boundaries before claiming the nested
  action is covered end to end.
- Test collapsed and expanded states inside standalone stacks, `List`, and `Form`; keyboard and
  VoiceOver activation; focus return after nested dialogs; large localized labels; Dynamic Type;
  and available versus unavailable content.
- Provide an example where the nested action opens a platform-owned consent alert without making
  Lumen responsible for the alert or external handoff.

## SwiftUI text-input character-limit contract

A complete export audit corrected an earlier consumer assumption: released SwiftUI Lumen already
provides `LumenTextarea`, so Between Contractions migrated both its contraction notes and macOS
feedback details editors. The feedback form still owns a separate `0/2,000` counter and truncating
`onChange` handler because the component has no maximum-length or character-count contract.
PostLens exposes the same gap across both Lumen text primitives: its support form must separately
truncate a 120-character subject, 2,000-character details field, and 254-character email address
after each binding change because neither `LumenTextField` nor `LumenTextarea` accepts a limit.
Its production posting-plan editor now also shares one domain wrapper around `LumenTextarea` across
the create and edit flows. Lumen owns the persistent label, bordered surface, local-only description,
and field accessibility, while PostLens owns the 2,200-character policy, live count, AI caption
action, and persistence. Consumers with an in-app locale must pass already-resolved textarea copy as
`.verbatim(L10n.string(...))`; rebuilding that string as a localization key can incorrectly look it
up again in the host bundle. `LumenTextField` differs usefully: its public `String` initializer
already maps the title and error message to verbatim content, so consumers do not need an explicit
wrapper unless they want the content mode visible at the call site.

The posting-plan migration also exposed a composition gap. Placing the AI action over the editor
would compete with text, selection controls, right-to-left layout, and larger Dynamic Type, but
`LumenTextarea` has no supported header or trailing-accessory slot. PostLens therefore keeps the AI
action in a separate footer row beside the count. The underlying `TextEditor` also changes XCTest's
element type from `textFields` to `textViews`, so integration tests should prefer a stable semantic
identifier over a placeholder query or an assumed native control class.

Acceptance criteria:

- Accept an optional maximum length on `LumenTextField` and `LumenTextarea` without changing
  existing unlimited behavior.
- Provide a localized visible count or a composable count slot owned by the same field contract.
- Evaluate a header or trailing-accessory slot that keeps actions outside the editable text region,
  preserves a stable accessibility order, and reflows without overlap at large text sizes and in
  right-to-left layouts.
- Define whether excess input is rejected, truncated, or reported, and expose that behavior to
  assistive technology instead of silently changing the bound text.
- Keep helper and error messages readable alongside the count at narrow widths and large text.
- Keep semantic identifiers attached to the editable control and document that SwiftUI textarea UI
  tests surface it as a text view rather than a text field.
- Test empty and filled values, keyboard input, paste, dictation, programmatic AI updates, undo,
  VoiceOver announcements, right-to-left layout, Dynamic Type, and boundary values on macOS and iOS.

## SwiftUI phone-input in-app localization

Between Contractions can supply localized labels, descriptions, validation text, country-picker
titles, and search labels to `LumenPhoneInput`, but its country sheet still hard-codes `Done` as a
`LocalizedStringKey`. The app deliberately switches English and Spanish independently of the
system locale, so that final system-locale string prevents a faithful migration of the care-team
phone field even though the parsing and E.164 contract otherwise fits.

Acceptance criteria:

- Accept a localized or verbatim country-picker completion label through the public initializer.
- Audit all internal phone-input strings so none bypass a consumer-controlled in-app locale.
- Keep default labels source-compatible for applications that follow the system locale.
- Test English and Spanish in-app locale overrides while macOS and iOS use the opposite system
  locale.
- Document a complete bilingual initializer example, including invalid-number guidance and country
  search.

## Native status-bar message reflow

Between Contractions uses `LumenStatusBar` to pair an on-device privacy statement with its Analyze
action. The SwiftUI implementation forces the message to one line, so narrow resized windows,
longer Spanish copy, and larger Accessibility text can truncate essential status information when
a trailing action is present.

Acceptance criteria:

- Allow SwiftUI, Compose, and React Native status messages to wrap when one line does not fit.
- Keep the default desktop presentation on one line when sufficient width is available.
- Reflow the message and trailing action without overlap, clipping, or horizontal scrolling.
- Keep representative Spanish copy readable at 200% text scaling.
- Preserve accessibility order from status message to its related action.

## SwiftUI compact stat density

Between Contractions uses a 360-point macOS menu-bar window with two small metrics side by side.
`LumenStat` always uses title typography, large padding, and a vertically stacked icon regardless
of `lumenControlDensity`, making the released metric contract too tall for this compact surface.
The consumer can reuse a muted `LumenCard`, spacing, and semantic colors, but it must keep its own
compact metric content instead of adopting the complete stat primitive.

Acceptance criteria:

- Make `LumenStat` respond to `LumenControlDensity` or accept an explicit compact presentation.
- Preserve the current regular layout and typography as the source-compatible default.
- Keep value, label, optional icon, and optional detail combined into one accessible metric.
- Fit two representative compact stats side by side in a 360-point macOS menu-bar window without
  truncating short English or Spanish labels.
- Test compact and regular metrics in light and dark themes, at larger accessibility text sizes,
  and with unusually long values.

## SwiftUI skeleton theme inheritance and media composition

PostLens uses `LumenSkeleton` for generic text bars and badge-shaped placeholders while its gallery
and Studio libraries load. An early wrapper selected `LumenTheme.light` or `.dark` from the local
color scheme for every bar. That made the placeholder appear adaptive, but it silently replaced the
branded `PostLensLumenTheme` already installed at the application root. Removing the leaf override
lets every skeleton inherit the same semantic surface color as the rest of the product, including
custom accent themes and future theme changes that are not reducible to light versus dark.

The migration also clarified the boundary of the primitive. Lumen's circle shape cleanly replaces
generic score or action-badge placeholders, and its text shape owns generic metadata bars. Photo
panels remain host-owned because they mirror the eventual media grid, aspect ratios, multi-photo
carousel anatomy, and recognizable photo glyphs. Treating the entire media card as one rectangle
skeleton would make the loading layout less representative rather than more consistent.

Each loading region owns one localized progress status. The individual `LumenSkeleton` instances
remain unlabeled and accessibility-hidden so a grid containing many placeholders does not flood
assistive technology with duplicate loading announcements. Visible copy may still repeat when it
reserves the exact space of a pinned header; tests should verify the named progress region and
rendered geometry instead of counting every matching visible string as an announcement defect.

Acceptance criteria:

- Document that `LumenSkeleton` inherits `lumenTheme` from the nearest composition root and warn
  against installing generic light or dark themes on individual placeholders.
- Provide a branded-theme example containing text, circle, and rectangle shapes in both color
  schemes so custom semantic surface colors are visibly exercised.
- Keep an unlabeled skeleton decorative and accessibility-hidden; allow an explicit label only when
  the skeleton itself is the single progress region rather than a child of one.
- Document the composition boundary between generic placeholder geometry and domain-specific media
  anatomy, including a gallery card that keeps host-owned aspect ratio and photo affordances.
- Test nested skeleton grids with one parent progress announcement, large Dynamic Type, right-to-left
  layout, reduced motion, light and dark appearances, and a non-default branded theme.
- Keep circle sizing deterministic when only height is supplied so badge and avatar placeholders do
  not require a redundant width or a raw `Circle` fallback.

## SwiftUI transient status actions and resolved localization

PostLens migrated Publishing Studio's temporary removal-and-undo bar to a `LumenAlert` contained
inside the app's bottom safe-area material. The generic alert content closure was the right released
contract because it lets the consumer render an already-resolved plural string with `Text` and keep
the Undo command as a separate 44-point button. Lumen now owns the semantic surface color, border,
radius, and padding, while PostLens continues to own bottom placement, the eight-second lifetime,
task cancellation when state changes, and the domain operation that restores the hidden picks.

`LumenBanner` and `LumenToast` initially look more specific for this composition, but their SwiftUI
initializers accept only `LocalizedStringKey` titles and descriptions. PostLens selects English or
Spanish in-app and resolves count-aware copy before rendering, independently of the system locale.
Reconstructing a localization key from that result would re-enter SwiftUI localization and makes the
language boundary ambiguous. The generic `LumenAlert` avoids that correctness risk, but consumers
should not have to choose a less specific component solely to preserve verbatim or prelocalized
content.

The rendered migration also confirmed that the safe-area host and the alert are separate layers.
The full-width material prevents scrolling photography from showing through the home-indicator area;
the inset, rounded Lumen surface communicates the temporary result and groups it with Undo. Moving
the material or timeout into `LumenAlert` would incorrectly couple a reusable status primitive to
application navigation and lifecycle policy.

PostLens then reused the same generic alert contract for the persistent hidden-picks summary. Its
plural count and destination-scoped explanation remain consumer-localized, and Review remains an
independent command that opens the platform-owned recovery sheet. The migration removed a custom
card without moving navigation, restoration state, or photo-library policy into Lumen. It also
confirmed a composition boundary: PostLens's shared button contract, rather than the generic alert,
continues to guarantee the Review action's minimum hit target. Rendered XCTest reports that 44-point
frame as 43.67 points on a 3x simulator because coordinates are quantized to physical pixels, so the
assertion allows one pixel of tolerance. Lumen cannot guarantee the hit target or adaptive layout of
arbitrary content supplied to its generic closure.

Acceptance criteria:

- Add `LumenTextContent` or equivalent localized-versus-verbatim overloads for SwiftUI
  `LumenBanner` and `LumenToast` titles and descriptions while preserving existing initializers.
- Document `LumenAlert` as a generic contained status surface whose content closure can preserve
  already-resolved plural copy and independent action semantics.
- Keep safe-area placement, auto-dismiss timing, cancellation, undo state, and domain recovery owned
  by the host application rather than the visual primitive.
- Provide a status-with-action example where a bottom safe-area host contains one alert, a wrapping
  count-aware message, and a separately focusable 44-point Undo button.
- Add a persistent status-with-recovery example where the alert preserves dynamic plural copy and
  the host owns navigation to a review sheet plus Restore and Restore All behavior.
- Test singular and plural copy, an in-app locale opposite the system locale, narrow widths, large
  Dynamic Type, right-to-left layout, VoiceOver order, timeout cancellation, and successful Undo.
- Require composed alert actions to retain a 44-point hit target and reflow before text or controls
  compress at narrow widths and large Dynamic Type.
- Ensure banner and toast action layouts reflow vertically before localized content or controls
  truncate, overlap, or leave the viewport.

## SwiftUI informational card migration boundaries

PostLens migrated the five repeated containers on its About screen from a hand-built secondary
grouped background, 20-point corner radius, and 18-point inset to `LumenCard` with `.lg` padding
and a `.size2xl` radius. The rendered comparison made the contract change visible: Lumen replaces
approximate host values with its tokenized 16-point inset and adds the standard subtle card border.
That is a deliberate design-system normalization rather than pixel parity, so migration guidance
should tell consumers to compare hierarchy, wrapping, and rhythm instead of reproducing every old
number around the component.

The migration preserved an important semantic and ownership boundary. Each card is informational;
its heading remains static text and the container does not acquire a button trait. Branded app-icon
masking and the small tinted feature-symbol plaques stayed host-owned because they identify the
product and individual concepts rather than representing generic surface structure. Lumen owns the
repeated container treatment without absorbing app identity or flattening the accessibility tree.

Acceptance criteria:

- Add a SwiftUI migration example that replaces a manual grouped-background card with
  `LumenCard(padding: .lg, radius: .size2xl)` and calls out intentional token normalization.
- Document that `LumenCard` is a non-interactive presentation container and does not add button or
  link semantics to its title or content.
- Explain that branded imagery, app-icon masks, and concept-specific icon plaques can remain
  consumer-owned children even when Lumen owns the repeated outer surface.
- Include a rendered before-and-after check at a narrow iPhone width so long informational copy
  retains readable wrapping and consistent vertical rhythm.
- Test VoiceOver traversal, large Dynamic Type, light and dark appearances, and right-to-left layout
  with links and dividers nested in informational cards.
- Keep the content closure's existing accessibility elements independently discoverable unless the
  consumer explicitly combines them.

## SwiftUI sheet cards and scroll-to-action reachability

PostLens also migrated Gallery Score's selection snapshot, pending explanation, and Quick Prepare
groups from manual 14-point white panels to non-action `LumenCard` containers using `.md` padding
and an `.xl` radius. A compact sheet benefits from the tokenized 12-point inset because its
destination picker and primary action gain usable width, while the standard border keeps adjacent
cards legible on the grouped canvas. The action stays a separate `PostLensButton` child; omitting
the card's `action` closure prevents the entire explanatory group from acquiring button semantics.

The focused UI check caught a testing and documentation boundary. In the medium sheet detent,
Quick Prepare exists in the accessibility hierarchy before it is visible or hittable. Treating
existence as reachability would miss a clipped or non-scrollable composition. The consumer test now
scrolls until the action is hittable, verifies its minimum target, captures the bottom-sheet state,
and then completes the action. Lumen examples that place controls below explanatory content should
prove the same path instead of assuming that a successful layout at the large detent is sufficient.

Acceptance criteria:

- Add a compact SwiftUI sheet example with multiple non-action cards and one independently
  focusable primary action nested in the final card.
- Document that an `action: nil` card may contain controls without making the outer surface an
  additional button, link, or accessibility stop.
- Show when `.md` padding and `.xl` radius are appropriate for nested sheet cards, while framing
  the token choice as hierarchy and density rather than legacy pixel matching.
- Test both ready and pending content variants so conditional state does not fall back to a manual
  background or change the card's semantic role.
- At the medium detent, scroll until the final action is visible and hittable, verify a 44-point
  target, activate it, and assert the sheet dismisses or advances as intended.
- Repeat the composition at the large detent, accessibility text sizes, and a long translated copy
  set so card spacing does not make the final action unreachable.

## SwiftUI membership information cards and selection boundaries

PostLens migrated its Supporter status, included-benefits, fairness, workflow-preview, and loading
containers from hand-built rounded backgrounds to non-action `LumenCard` surfaces. The active
membership card still contains an independently focusable `LumenLink`; keeping the outer card
non-interactive avoids nested-button semantics while allowing the link to retain its destination
and external indicator. Branded hero artwork and tinted feature plaques remain consumer-owned
children because they express PostLens identity rather than generic card structure.

The remaining subscription option rows are an intentional boundary, not an incomplete mechanical
migration. They combine selected and unselected state, pricing, a recommended marker, disabled and
purchasing behavior, and radio-like mutual exclusion. Treating those rows as ordinary action cards
would underspecify their selection semantics. Lumen would benefit from a selectable-card or
radio-card contract that makes state, grouping, focus, and activation explicit across SwiftUI and
the other framework adapters.

The unavailable-plans path exposed a second composition gap. `LumenEmptyState` already owns a
24-point inset and a bounded height, so wrapping it in `LumenCard` can create a visibly double-padded
surface. Consumers need either a contained presentation option for the empty state or guidance for
placing it directly on a grouped canvas without adding another generic card solely for background
treatment.

Acceptance criteria:

- Add a SwiftUI example with a non-action membership card that contains an independently focusable
  `LumenLink`, and verify that the outer card does not acquire button or link traits.
- Define a selectable-card or radio-card contract with selected, unselected, recommended, disabled,
  loading, and mutually exclusive group states.
- Expose selection state through native accessibility values and traits without creating nested
  controls or duplicate activation stops.
- Document that branded heroes and concept-specific tinted plaques remain valid consumer-owned
  content inside Lumen-managed surfaces.
- Provide an empty-state containment option or documented grouped-canvas recipe that avoids stacking
  `LumenEmptyState`'s inset inside an additional card inset.
- Test active, loading, unavailable, and plan-selection states at narrow widths, large Dynamic Type,
  light and dark appearances, right-to-left layout, and long translated copy.
- Verify that membership links and plan actions remain reachable by scrolling and retain 44-point
  targets without making surrounding informational content interactive.

## Compose sheet locale and form presentation

Between Contractions split Android Partner Sync into a subscription overview and separate create
and join sheets. In rendered testing, a longer `LumenSheet` opened at the partial detent with its
restore and debug actions below the viewport, but the public contract provides no sheet-state,
expanded-detent, or scrolling policy. The same test also found that `stringResource` calls made
inside the sheet content could use the device's English locale while the app and sheet header were
Spanish. Resolving every string before entering the overlay corrected the consumer, but makes the
modal an unsafe boundary for apps with an in-app locale override. The consumer therefore retains a
full-height, vertically scrollable Material sheet while continuing to use Lumen controls inside it.

Acceptance criteria:

- Preserve consumer composition locals, including a context-backed in-app locale override, across
  the sheet header, content, and action slots.
- Allow callers to require an expanded initial state or provide a supported sheet-state contract.
- Provide a documented vertically scrollable form recipe that keeps actions reachable above the
  keyboard and system insets.
- Keep short sheets compact while long sheets remain usable at small heights and large font scales.
- Test an English device with Spanish selected in-app, then the inverse, with localized strings
  resolved both outside and inside the sheet content lambda.
- Add rendered Compose coverage for short content, long forms, the IME, and partial versus expanded
  presentation.

## Completion rule

An item can be removed from this file when its public contract and documentation exist, relevant
automated checks pass, and required external or device evidence is recorded. Product-specific
navigation, windowing, domain controls, safety policy, haptics, charts, widgets, and application
state are not backlog items merely because Lumen does not own them.
