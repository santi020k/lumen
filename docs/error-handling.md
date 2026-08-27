# Error handling

Lumen provides presentation and accessibility contracts for failures while the application retains
ownership of exception handling, logging, privacy, retry policy, caching, and domain decisions. Map
technical failures to concise, user-safe content before rendering a Lumen component. Never place raw
stack traces, request bodies, credentials, or provider responses in the interface.

## Choose the smallest error surface

| Situation | Component | Behavior |
| --- | --- | --- |
| One invalid control | `FieldError` | Connect the message to the control with `aria-describedby` or the framework adapter. |
| Invalid submission | `ErrorSummary` | Summarize the problems and link to invalid controls. |
| Persistent problem that coexists with content | `Alert` | Keep the message in the page until it is no longer relevant. |
| Brief action or background failure | `Toast` | Use non-blocking feedback; do not hide required recovery in a disappearing toast. |
| A region or page cannot show its primary content | `ErrorState` | Explain the failure, preserve safe context, and provide an application-owned recovery action. |
| A destructive decision | `AlertDialog` | Confirm the consequence before the destructive action; this is not an error message. |

Use the offline kind only when the application knows connectivity is the relevant state. Do not
translate every unknown request failure into “offline.” Keep a successful empty result in `Empty`
or `LumenEmptyState`, not an error state.

## Shared ErrorState contract

- `title` is required. State what could not be shown in plain language, such as “Could not load
  projects.” Do not use an exception class or provider status as the title.
- `description` should give the next useful step. Avoid blaming the user or promising that a retry
  will succeed.
- The error kind is the default. Select offline only after the application has classified the
  failure as connectivity-related.
- The default layout fits a normal region. Use compact inside a bounded card or panel, and page when
  the state should occupy the available page height. The screen still owns scrolling, safe areas,
  and navigation.
- A `reference` is optional support context. Use an opaque, non-secret request or correlation
  identifier. Never expose a database key, token, authorization value, stack trace, provider
  payload, or personal data.
- The graphic is presentational by default and follows the error kind. A custom graphic should
  remain decorative unless it communicates information absent from the text.
- Prefer one primary recovery action. Add a secondary action only when it provides a genuinely
  different path, such as returning to a safe screen.

### Retry lifecycle

Treat retry as an application state transition, not a presentation callback with implicit network
behavior:

1. Guard against an already-running retry and mark the request as in flight.
2. Keep the error context visible or replace it with an intentional loading state. Disable the
   recovery action while retrying so repeated activation cannot duplicate work.
3. Cancel work when the owning screen disappears if its result is no longer useful.
4. On success, replace the error state with content and clear obsolete error data.
5. On failure, classify and map the latest failure again. Do not assume it has the same kind or
   user-safe description as the first failure.

Lumen does not implement automatic retries, exponential backoff, offline monitoring, request
cancellation, authentication refresh, or stale-cache selection. Those policies depend on the
application's data and lifecycle architecture.

### Announcements and focus

Static error content does not need a live-region announcement. Announce a newly inserted failure
once, preferably with a polite priority. Reserve assertive announcements for urgent failures that
require immediate attention, and do not announce the same event through an error state and a toast
or banner.

Lumen does not move focus automatically because routing, restoration, and the element being
replaced belong to the application. Preserve logical focus for an inline replacement. A web route
or major region may deliberately focus an error state with `tabindex="-1"` after navigation. Native
applications should follow their platform's focus model.

## Platform overview

| Platform | Package | Component | Default announcement |
| --- | --- | --- | --- |
| Astro | `@santi020k/lumen-astro` | `ErrorState` | Off |
| React | `@santi020k/lumen-react` | `ErrorState` | Off |
| Web Components | `@santi020k/lumen-elements` | `<lumen-error-state>` | Application-authored ARIA |
| React Native | `@santi020k/lumen-react-native` | `LumenErrorState` | Polite |
| SwiftUI | `LumenUI` | `LumenErrorState` | Application-owned platform announcement |
| Jetpack Compose | `com.santi020k:lumen-compose` | `LumenErrorState` | Polite |

## Astro

Import `ErrorState` and the recovery controls from the Astro adapter. Load the package stylesheet
once at the application boundary. The default slot accepts supporting detail, while `graphic` and
`actions` are named slots.

```astro
---
import { Button, ErrorState } from '@santi020k/lumen-astro'

const retrying = false
---

<ErrorState
  id="projects-error"
  announce="polite"
  description="Check your connection and try again."
  headingLevel={2}
  kind="offline"
  layout="page"
  reference="REQ-4F82"
  title="Could not load projects"
>
  <Button
    slot="actions"
    data-retry-projects
    loading={retrying}
    type="button"
  >
    Try again
  </Button>
</ErrorState>
```

Astro renders the semantic error surface; an Astro Action, client script, or hydrated application
is responsible for the retry. Preserve submitted form values and use `ErrorSummary` plus field
feedback for validation instead of replacing the form with `ErrorState`.

`announce` defaults to `off`. Polite maps to a status live region and assertive maps to an alert.
Choose a `headingLevel` that follows the page hierarchy. When the state has an `id`, Lumen labels
the section with its visible heading; without one, it uses the title as the accessible label.

Verify the server-rendered result, keyboard activation of the recovery control, focus after a route
replacement, and behavior both with and without client JavaScript when progressive enhancement is
part of the product contract.

## React

Load the React stylesheet once and render `ErrorState` from an application or router error boundary,
query state, or route state. Lumen presents the fallback but does not catch the exception.

```tsx
import { Button, ErrorState } from '@santi020k/lumen-react'

<ErrorState
  actions={
    <Button loading={retrying} onClick={reload}>
      Try again
    </Button>
  }
  announce="polite"
  description="Check your connection and try again."
  headingLevel={2}
  id="projects-error"
  kind="offline"
  layout="page"
  reference="REQ-4F82"
  title="Could not load projects"
/>
```

The boundary or data layer must sanitize the exception, record diagnostics through the existing
observability system, decide whether retrying or resetting is safe, and prevent a retry while one is
already in flight. Pass `graphic={false}` to remove the default illustration or provide an
application-owned React node to replace it.

`announce` defaults to `off` and follows the same polite/status and assertive/alert mapping as
Astro. Native section props such as `tabIndex`, `aria-describedby`, and event handlers pass through
to the rendered `<section>`. Test initial static fallback, failure after loading, repeated retry
activation, boundary reset, focus restoration, and unmount cancellation.

## Web Components

Load the Elements stylesheet and call `defineLumenElements()` once before using the element. The
custom element supplies the container classes and kind/layout variants; its meaningful content
stays in light DOM so the application controls native headings, actions, links, and ARIA.

```html
<lumen-error-state
  id="projects-error"
  kind="offline"
  layout="page"
  role="status"
  aria-labelledby="projects-error-title"
  aria-live="polite"
>
  <lumen-illustration
    aria-hidden="true"
    data-slot="error-state-graphic"
    variant="offline"
  ></lumen-illustration>
  <div data-slot="error-state-content">
    <h2 id="projects-error-title" data-slot="error-state-title">
      Could not load projects
    </h2>
    <p data-slot="error-state-description">Check your connection and try again.</p>
    <p data-slot="error-state-reference">Reference: <code>REQ-4F82</code></p>
  </div>
  <div data-slot="error-state-actions">
    <lumen-button data-retry-projects>Try again</lumen-button>
  </div>
</lumen-error-state>
```

The Elements adapter does not synthesize the visible content or announcement policy. Author
`aria-labelledby`, `aria-live`, and `role` only when the state is inserted dynamically and needs an
announcement; omit live-region attributes for static initial content. Application code owns the
request, disabled/loading behavior, and transition back to content.

Verify registration before first use, the light-DOM heading relationship, keyboard operation of the
native control, attribute changes for error/offline and layout variants, and the state in every host
framework that consumes the custom element.

## React Native

Use `LumenAlert` or `LumenBanner` when content remains available. Use `LumenErrorState` when a
collection, region, or screen cannot show its primary content.

```tsx
import {
  LumenButton,
  LumenErrorState
} from '@santi020k/lumen-react-native'

<LumenErrorState
  actions={
    <LumenButton loading={retrying} onPress={retry}>
      Try again
    </LumenButton>
  }
  announcement="polite"
  description="Check your connection and try again."
  kind="offline"
  layout="page"
  reference="REQ-4F82"
  title="Could not load projects"
/>
```

`kind` accepts `error` and `offline`; `layout` accepts `compact`, `default`, and `page`.
`announcement` accepts `off`, `polite`, and `assertive` and defaults to polite. Set it to off when
the state is present initially or a parent surface announces the same failure. Use `graphic` for a
custom React node, `actions` for recovery controls, and `style` for native layout composition.

The application owns request cancellation, connectivity classification, navigation, cached data,
and retry state. `LumenButton loading` exposes busy state and disables duplicate activation. Verify
VoiceOver and TalkBack order, large font sizes, switch or keyboard activation where supported,
screen replacement, and retry cancellation on unmount.

## SwiftUI

Import `LumenUI` and place `LumenErrorState` inside the application's native navigation, scrolling,
or adaptive layout. The component supports shared defaults plus SwiftUI view builders for custom
graphics and actions.

```swift
import LumenUI

LumenErrorState(
    "Could not load projects",
    description: "Check your connection and try again.",
    kind: .offline,
    layout: .page,
    reference: "REQ-4F82"
) {
    LumenButton("Try again", loading: retrying, action: retry)
}
```

`kind` accepts `.error` and `.offline`; `layout` accepts `.compact`, `.default`, and `.page`.
Provide `referenceLabel` when localizing the support label. Use the full generic initializer when a
custom `graphic` view is needed, and apply ordinary SwiftUI modifiers around the component for
screen composition.

SwiftUI intentionally does not post an announcement during ordinary view recomputation. When
failed content is replaced dynamically, the application should post one platform accessibility
announcement at the state transition, not from `body`. It also owns task cancellation, reachability
classification, navigation, and retry state. `LumenButton(loading:)` prevents duplicate activation.

Verify VoiceOver on iOS and macOS, Dynamic Type, keyboard and Full Keyboard Access paths, page and
compact sizing, task cancellation when the view disappears, and the transition back to content.

## Jetpack Compose

Place `LumenErrorState` inside the application's Material-native screen or collection state. Custom
graphics and actions remain composable slots.

```kotlin
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenErrorState
import com.santi020k.lumen.LumenErrorStateAnnouncement
import com.santi020k.lumen.LumenErrorStateKind
import com.santi020k.lumen.LumenErrorStateLayout
import androidx.compose.material3.Text

LumenErrorState(
    title = "Could not load projects",
    description = "Check your connection and try again.",
    kind = LumenErrorStateKind.Offline,
    layout = LumenErrorStateLayout.Page,
    announcement = LumenErrorStateAnnouncement.Polite,
    reference = "REQ-4F82",
    actions = {
        LumenButton(onClick = ::retry, loading = retrying) {
            Text("Try again")
        }
    }
)
```

Kinds are `Error` and `Offline`; layouts are `Compact`, `Default`, and `Page`; announcements are
`Off`, `Polite`, and `Assertive`. Announcements default to polite. Select off for initial static
content or when a parent semantic node owns the announcement. Use `graphic` and `actions` for
composable content and `modifier` for placement in the surrounding layout.

The screen or state holder owns coroutine cancellation, connectivity classification, navigation,
cached data, and retry state. `LumenButton(loading = true)` disables duplicate activation. Verify
TalkBack traversal and announcement priority, font scaling, keyboard and switch access, recomposition
without repeated announcements, configuration changes, and coroutine cancellation.

## Safe diagnostics and shipping checklist

Render only information safe for the current user. Record the technical exception, request
metadata, and correlation context through the application's existing privacy-reviewed observability
boundary. A visible reference may match a server-side correlation identifier only when it grants no
access and reveals no sensitive implementation detail. Lumen does not log, redact, report, or
capture exceptions.

Before shipping on any platform, verify:

- The successful retry path and repeated-activation protection.
- Cancellation or screen-dismissal behavior.
- Error and offline classification, including offline-to-online recovery.
- Long localized content and the support-reference label.
- Screen-reader order, announcement count, focus behavior, and large text.
- That visible and recorded diagnostics contain no secrets or unnecessary personal data.
