# Web Components Setup

This bundled-app example targets Lumen 5. Load the foundation once, select component CSS and
register each required constructor. V4 consumers retain their existing stylesheet setup.

```bash
pnpm add @santi020k/lumen-elements
# Optional CLI for editable recipes and diagnostics
pnpm add -D @santi020k/lumen
```

```ts
import '@santi020k/lumen-elements/styles/foundation.css'
import '@santi020k/lumen-elements/styles/components/card.css'
import '@santi020k/lumen-elements/styles/components/button.css'
import { defineLumenCard } from '@santi020k/lumen-elements/components/card'
import { defineLumenButton } from '@santi020k/lumen-elements/components/button'

defineLumenCard()
defineLumenButton()
```

```html
<lumen-card><lumen-button>Continue</lumen-button></lumen-card>
```

Import CSS from a bundler entry, not a literal package path in an unbundled browser script. Full
styles.css and `defineLumenElements` remain available. Components without a public granular export
use a catalog fallback, which still traverses the catalog even when registering selected names.
Compound children need their own CSS and registration. Registered elements own their behavior;
do not add a parallel interaction library for the same primitive.

## Elements labels and dialogs

`lumen-input` owns an internal native control. Name that control using `aria-labelledby` pointing
at a visible label, or `aria-label` on the host. A native label's `for` pointing only at the custom
host does not name the internal input. Use the public `lumen-label` for visible label styling.
Do not type a custom host as `HTMLInputElement` or `HTMLButtonElement`; use its exported element
class and runtime narrowing when accessing element-specific methods.

Use `lumen-dialog` as the behavior owner. Its public methods are `show(trigger?)` and `close()`,
not `showModal()` on the custom host. A native `dialog` child is its documented modal contract:

```html
<lumen-button data-ui-dialog-trigger="profile-dialog">Edit profile</lumen-button>
<lumen-dialog id="profile-dialog">
  <dialog aria-labelledby="profile-title">
    <h2 id="profile-title">Profile settings</h2>
    <lumen-field>
      <lumen-label id="profile-name-label">Display name</lumen-label>
      <lumen-input aria-labelledby="profile-name-label" value="Ada"></lumen-input>
    </lumen-field>
    <lumen-button data-ui-dialog-close type="button">Cancel</lumen-button>
  </dialog>
</lumen-dialog>
```

For this dialog example, import the foundation and CSS for `Button`, `Dialog`, `Field`, `Input`,
and `Label`, then register those names through `defineLumenElements` before use.
The dialog behavior focuses its first focusable control, handles Escape, traps focus, and returns
focus to its trigger. Keep draft state in the form control or application; closing does not reset it.
Do not replace this behavior with a parallel native-dialog controller.
