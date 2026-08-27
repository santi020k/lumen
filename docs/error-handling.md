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

Use `kind="offline"` only when the application knows connectivity is the relevant state. Do not
translate every unknown request failure into “offline.” Keep a successful empty result in `Empty`,
not `ErrorState`.

## Recovery and announcements

The application owns every action passed to `ErrorState`. A retry handler should respect its own
in-flight, cancellation, backoff, stale-data, and authorization rules. Disable or replace the action
while retrying rather than allowing duplicate work.

Static error content does not need a live-region announcement. `ErrorState` therefore defaults to
`announce="off"`. Use `announce="polite"` when a failure replaces content after background work,
and reserve `announce="assertive"` for an urgent failure that requires immediate attention. Do not
combine an assertive state with a separate assertive toast for the same event.

When a submitted form fails, preserve entered values, render field feedback and `ErrorSummary`, and
move focus to the summary when the framework integration supports it. When a route or major region
fails, applications may move focus to an `ErrorState` with `tabindex="-1"`; Lumen does not move focus
automatically because navigation and restoration belong to the host framework.

## Astro

```astro
---
import { Button, ErrorState } from '@santi020k/lumen-astro'
---

<ErrorState
  id="projects-error"
  title="Could not load projects"
  description="Check your connection and try again."
  reference="REQ-4F82"
  announce="polite"
>
  <Button slot="actions" type="button">Try again</Button>
</ErrorState>
```

## React

```tsx
import { Button, ErrorState } from '@santi020k/lumen-react'

<ErrorState
  actions={<Button onClick={reload}>Try again</Button>}
  description="Check your connection and try again."
  id="projects-error"
  reference="REQ-4F82"
  title="Could not load projects"
/>
```

An application or router error boundary may render this component as its fallback. The boundary
must sanitize the exception, record diagnostics through the application's established observability
system, and decide whether resetting or retrying is safe. Lumen intentionally does not catch errors
or install a logging provider.

## Web Components

The Elements adapter keeps content in light DOM so headings, actions, and links retain native
semantics. Label the region with the visible heading and use the documented `data-slot` hooks.

```html
<lumen-error-state id="projects-error" aria-labelledby="projects-error-title">
  <lumen-illustration
    aria-hidden="true"
    data-slot="error-state-graphic"
    variant="error"
  ></lumen-illustration>
  <div data-slot="error-state-content">
    <h2 id="projects-error-title" data-slot="error-state-title">Could not load projects</h2>
    <p data-slot="error-state-description">Check your connection and try again.</p>
    <p data-slot="error-state-reference">Reference: <code>REQ-4F82</code></p>
  </div>
  <div data-slot="error-state-actions">
    <lumen-button>Try again</lumen-button>
  </div>
</lumen-error-state>
```

## Native applications

Use `LumenAlert` or `LumenBanner` when content remains available. For a blocking collection or page
failure, compose the platform-native error/offline `LumenIllustration`, a heading, supporting text,
and Lumen actions in the same centered state layout used by `LumenEmptyState`. Keep retry behavior
and accessibility announcements in SwiftUI, Compose, or React Native application state. A dedicated
native `LumenErrorState` should be introduced only after maintained consumers establish a shared
native contract rather than copying the web API mechanically.
