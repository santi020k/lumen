# Astro Setup

This example targets Lumen 5. Components import their own CSS and shared foundation automatically.
For v4, retain the full stylesheet at the app boundary until upgrading. Install the runtime adapter:

```bash
pnpm add @santi020k/lumen-astro
```

```astro
---
import { Button, Card, Field, Input, Label } from '@santi020k/lumen-astro'
import UIPrimitives from '@santi020k/lumen-astro/runtime'
---

<UIPrimitives />

<Card>
  <Field>
    <Label for="email">Email</Label>
    <Input id="email" name="email" type="email" required />
  </Field>
  <Button type="submit">Continue</Button>
</Card>
```

Mount `UIPrimitives` once in the root layout when the app uses enhanced interactions. Do not place
it beside every primitive. Use public `data-ui-*` attributes documented by the selected component
for triggers and relationships. `CodeTabs` receives its persistence and synchronized keyboard
behavior from this single runtime instance.

V5 enhancement is asynchronous. Await `window.LumenInitUiPrimitives(scope)` before relying on
newly inserted markup; `ui:ready` signals completion and `ui:runtime-error` reports failed automatic
initialization. Toast creation returns an ID before the lazy controller renders the toast. Keep
native recovery paths for failed chunks. Full styles.css remains a convenience option; manually
created or Markdown markup needs its declared styles. Install the CLI separately with
`pnpm add -D @santi020k/lumen` when using `lumen add`, `doctor`, or migration commands.
