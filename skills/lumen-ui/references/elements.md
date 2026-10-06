# Web Components Setup

Install, load styles, and register once:

```bash
pnpm add @santi020k/lumen-elements
```

```html
<script type="module">
  import '@santi020k/lumen-elements/styles.css'
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements()
</script>

<lumen-card>
  <lumen-label id="email-label">Email</lumen-label>
  <lumen-input aria-labelledby="email-label" id="email" name="email" type="email" required></lumen-input>
  <lumen-button type="submit">Continue</lumen-button>
</lumen-card>
```

In a bundled app, prefer importing `@santi020k/lumen-elements/styles.css` from the global CSS or
entry module instead of writing a literal package path in HTML. Registered elements provide the
matching behavior layer; do not add a parallel interaction library for the same primitive.

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

Register `Button`, `Dialog`, `Field`, `Input`, and `Label` through `defineLumenElements` before use.
The dialog behavior focuses its first focusable control, handles Escape, traps focus, and returns
focus to its trigger. Keep draft state in the form control or application; closing does not reset it.
Do not replace this behavior with a parallel native-dialog controller.
