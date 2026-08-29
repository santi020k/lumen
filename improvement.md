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
reconstruction.

The same consumer exposed a full-width composition boundary when migrating its primary `Adjust
Crop` action. `LumenButton(size: .lg)` was valid inside the SwiftUI `List`, but the initial media
preview left the 52-point row underneath a persistent `safeAreaInset` export bar. The accessibility
tree still contained the action even though a person could not see or tap it. PostLens fixed the
consumer layout by using its compact preview geometry for Crop and Sequence panels, then asserted
that the rendered button ends above the export bar before exercising the handoff. Lumen guidance
should make clear that component metrics cannot reserve space across sibling scroll and safe-area
containers; migration evidence must cover the final composed viewport, not only component presence.

PostLens also confirmed that Lumen's semantic types do not carry control metrics through a
consumer-owned native-treatment adapter. Mapping `LumenControlSize.md` to SwiftUI's `.regular`
control size produced a roughly 35-point bordered button in the accessibility tree until the
adapter explicitly applied the app's 44-point minimum target. This is valid composition, but the
API shape can make intent and size mapping look more complete than it is; adapter guidance should
require consumers to map both the visual recipe and platform hit-target policy. The posting-plan
composer also confirmed that the adapter must be applicable as a style to a system-owned `Menu`,
while the adjacent app-owned Reorder action can use the composed button. Wrapping the menu in a
replacement button would transfer disclosure ownership and change behavior. The editor review and
carousel readiness surfaces further showed that an app-owned composed action must accept structured
row content—a leading label, flexible space, and trailing disclosure icon—without losing the
semantic intent, full-width layout, or minimum target. XCTest also reported a nominal 44-point
accessibility frame as `43.99999999999994`; conformance tests should compare native geometry with a
subpixel or display-scale tolerance instead of treating floating-point representation as a product
failure.

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
- Add native-treatment adapter guidance that maps `LumenButtonIntent` and `LumenControlSize` while
  explicitly preserving the platform minimum interactive target, with an accessibility-frame test
  and a system-owned `Menu` beside an app-owned composed action.
- Include a full-width card-row example whose composed label has leading content and a trailing
  disclosure cue, and verify that activation, semantic intent, and the minimum target remain owned
  by the button.
- Define a native accessibility-frame assertion tolerance no larger than one physical pixel so a
  nominal 44-point target passes despite platform floating-point rounding, while materially smaller
  targets still fail.
- Document when a consumer must retain a native compact control because the surrounding system
  container owns hit testing or presentation.

## SwiftUI icon-button loading state

PostLens has an icon-only Apple Intelligence action that must remain visible, disabled, and
animated while an on-device caption request is running. `LumenButton` owns a loading state, but
`LumenIconButton` accepts only a fixed icon and disabled state. The consumer can apply the public
`LumenIconButtonStyle` to a native button to retain its existing spinner, but then it must recreate
the icon foreground treatment and loading semantics that the composed component normally owns.

Acceptance criteria:

- Allow `LumenIconButton` to display a loading state without replacing its accessible name.
- Disable repeated activation while loading and expose localized progress semantics.
- Preserve the selected intent's foreground, background, border, pressed, and disabled recipes for
  both the resting icon and progress indicator.
- Keep the button's dimensions stable when switching between the icon and spinner.
- Test primary, secondary, quiet, and danger intents in light and dark themes, including Reduce
  Motion and larger accessibility text settings.
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

Acceptance criteria:

- Add `LumenTextContent` initializers for `LumenEmptyState` and `LumenErrorState` title,
  description, and reference-label content while preserving current localized-key initializers.
- Render verbatim content without a second localization lookup and keep localized content using
  the system localization environment.
- Preserve generic action and graphic slots so consumer-owned recovery behavior remains intact.
- Test English selected in-app on a Spanish system and Spanish selected in-app on an English
  system, including compact and page layouts.

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

## SwiftUI text-input character-limit contract

A complete export audit corrected an earlier consumer assumption: released SwiftUI Lumen already
provides `LumenTextarea`, so Between Contractions migrated both its contraction notes and macOS
feedback details editors. The feedback form still owns a separate `0/2,000` counter and truncating
`onChange` handler because the component has no maximum-length or character-count contract.
PostLens exposes the same gap across both Lumen text primitives: its support form must separately
truncate a 120-character subject, 2,000-character details field, and 254-character email address
after each binding change because neither `LumenTextField` nor `LumenTextarea` accepts a limit.

Acceptance criteria:

- Accept an optional maximum length on `LumenTextField` and `LumenTextarea` without changing
  existing unlimited behavior.
- Provide a localized visible count or a composable count slot owned by the same field contract.
- Define whether excess input is rejected, truncated, or reported, and expose that behavior to
  assistive technology instead of silently changing the bound text.
- Keep helper and error messages readable alongside the count at narrow widths and large text.
- Test keyboard input, paste, dictation, VoiceOver announcements, and boundary values on macOS and
  iOS.

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
