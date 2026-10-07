# Astro Setup

Install and load styles once:

```bash
pnpm add @santi020k/lumen-astro
```

```astro
---
import { Button, Card, Field, Input, Label } from '@santi020k/lumen-astro'
import UIPrimitives from '@santi020k/lumen-astro/runtime'
import '@santi020k/lumen-astro/styles.css'
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
