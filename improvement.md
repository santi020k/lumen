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

PostLens could migrate ordinary primary, secondary, and quiet content actions to `LumenButton`,
and it could apply the public `LumenButtonStyle` to a `PhotosPicker` without wrapping or replacing
the system picker. Destructive and cancel actions could not migrate with the same confidence:
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

## Native spinner color in nested actions

Between Contractions migrated its Android and macOS Partner Sync actions to `LumenButton` while
preserving localized, immediate store progress states. The standalone Compose and SwiftUI
`LumenSpinner` implementations always paint with the theme brand color, so composing one inside a
primary brand button can remove the contrast needed to perceive progress. Android must retain a
Material progress indicator, while macOS cannot safely expose the same nested loading treatment,
even though Lumen otherwise owns the action recipes.

Acceptance criteria:

- `LumenSpinner` inherits the surrounding content color by default or accepts a semantic tint.
- A spinner remains visible inside primary, secondary, quiet, and danger buttons in light and dark
  themes without consumer-owned color overrides.
- Standalone use on canvas and surface backgrounds retains the existing brand treatment by default.
- The caller can provide a localized progress label without changing visual color behavior.
- Compose and SwiftUI screenshots and semantics tests cover both standalone and nested use.

## Native button hierarchy and semantic tone

Partner Sync has two destructive actions at different levels of emphasis. Ending the whole shared
group belongs in a prominent danger button behind confirmation, while removing one device is a
compact trailing row action. The released native danger intent always produces the filled danger
recipe, and the quiet and secondary intents cannot carry a danger tone. The row action therefore
cannot migrate without becoming visually dominant or losing its destructive meaning.

Acceptance criteria:

- Primary, secondary, and quiet hierarchies can opt into destructive semantics.
- Foreground, background, border, pressed, disabled, focus, and loading states retain contrast.
- A compact trailing destructive action fits a native list row without competing with the page
  action.
- Assistive technology receives the same accessible name and button role at every hierarchy.
- SwiftUI, Compose, and React Native document both a confirmed page-level delete and a row-level
  remove example.

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

## SwiftUI multiline text input contract

Between Contractions could migrate the subject and optional email controls in its macOS feedback
form to `LumenTextField`, but the detailed report still needs a consumer-styled `TextEditor`.
SwiftUI Lumen has no multiline field contract that can own the visible label, helper or validation
message, character limit, and platform focus treatment as one accessible component.

Acceptance criteria:

- Add a public multiline text-input component with localized and verbatim label support.
- Support helper text, error text, disabled and read-only states, and an optional character limit.
- Keep the visible count and maximum-length behavior synchronized without silently truncating text.
- Preserve native selection, scrolling, keyboard shortcuts, focus indication, and spell checking on
  macOS and iOS.
- Test VoiceOver naming, validation announcements, large text, long unbroken input, and light/dark
  themes in a real form.
- Document when a native `TextEditor` remains appropriate for rich or product-specific editing.

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

## Completion rule

An item can be removed from this file when its public contract and documentation exist, relevant
automated checks pass, and required external or device evidence is recorded. Product-specific
navigation, windowing, domain controls, safety policy, haptics, charts, widgets, and application
state are not backlog items merely because Lumen does not own them.
