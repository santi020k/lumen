<h1 align="center">Lumen UI · Dioxus</h1>

<p align="center">Rust components · Web, desktop, and Dioxus Native · Shared Lumen CSS</p>

<p align="center">
  <a href="https://github.com/santi020k/lumen/tree/main/packages/dioxus"><img src="https://img.shields.io/badge/status-experimental-c2410c?style=flat-square" alt="Experimental"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

**Crate:** `lumen-dioxus` · **Status:** experimental, 0.x

`lumen-dioxus` brings Lumen components to [Dioxus](https://dioxuslabs.com) 0.7. The components
render the same classes and attributes as `@santi020k/lumen-react` and share Lumen's stylesheet, so
they look the same in a browser, in a desktop webview, and in **Dioxus Native**, which draws HTML
and CSS with the [Blitz](https://github.com/DioxusLabs/blitz) engine instead of a webview.

**On this page:** [Install](#install) · [Usage](#usage) · [Components](#components) ·
[Dioxus Native support](#dioxus-native-support) · [Development](#development)

## Install

```sh
cargo add lumen-dioxus
```

Pick the renderer in your app's own `dioxus` dependency, for example `features = ["native"]` for
Dioxus Native or `features = ["web"]` for the browser. `lumen-dioxus` only depends on Dioxus's
component, HTML, signal, and hook APIs.

## Usage

Render `LumenStyles` once near the root, then compose components:

```rust
use dioxus::prelude::*;
use lumen_dioxus::prelude::*;

fn main() {
    dioxus::launch(App);
}

#[component]
fn App() -> Element {
    let mut notifications = use_signal(|| true);

    rsx! {
        LumenStyles {}
        Card {
            CardHeader {
                CardTitle { "Workspace plan" }
                CardDescription { "Shared libraries and audit logs." }
            }
            CardContent {
                label {
                    Switch {
                        checked: notifications(),
                        onchange: move |next| notifications.set(next),
                        aria_label: "Notifications",
                    }
                    "Notifications"
                }
            }
            CardFooter {
                Button { variant: ButtonVariant::Secondary, "Compare plans" }
                Button { onclick: move |_| {}, "Upgrade" }
            }
        }
    }
}
```

`LumenStyles` embeds the complete stylesheet in a `<style>` element. If you load styles another
way, `lumen_dioxus::LUMEN_CSS` holds the same CSS as a string.

Every component also accepts `class` (appended after the Lumen classes) and any attribute its HTML
element accepts, such as `id`, `aria_label`, or `r#for`.

## Components

| Component | Notes |
| --- | --- |
| `Button` | `variant`, `size`, `disabled`, `loading` (spinner, `aria-busy`), `r#type` (defaults to `button`) |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `density`, `variant`, `glass` |
| `Badge` | `variant` |
| `Alert` | `variant`, `glass` |
| `Progress` | `value`, `max`; clamped like every Lumen adapter |
| `Spinner` | Named spinners get `role="status"`; unnamed ones are hidden from assistive technology |
| `Avatar` | `src`, `alt`, `fallback` |
| `Separator` | `orientation` |
| `Label`, `Input`, `Textarea` | `Input` has `visual_size`; both forward `oninput` |
| `Field`, `FieldError` | An invalid `Field` sets `aria-invalid` on its control and links the error with `aria-describedby` |
| `Checkbox`, `Switch` | Controlled (`checked`) or uncontrolled (`default_checked`); `indeterminate` shows the mixed state; `onchange` receives the new state |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsPanel` | Arrow keys, Home, and End move the selection; disabled tabs are skipped |

Option enums (`ButtonVariant`, `BadgeVariant`, `CardVariant`, `Glass`, and so on) live in the
prelude.

## Dioxus Native support

The gallery example was rendered in Chrome and in two Blitz versions and compared pixel by pixel:

| Renderer | Pixels that differ from Chrome | What still differs |
| --- | --- | --- |
| Blitz 0.3 beta (Dioxus 0.8 line) | 1.3% | Text anti-aliasing, no textarea resize grip |
| Blitz 0.2 (Dioxus Native 0.7) | 4.6% | Tab list does not draw, checkbox check mark and switch thumb missing, a space after bold text collapses |

Dioxus Native 0.7 users get working buttons, cards, badges, alerts, progress, and form fields today;
tabs, checkboxes, and switches need the newer Blitz that ships with Dioxus 0.8. On every renderer:

- **Checkbox and Switch** are `<button role="checkbox">` and `<button role="switch">` with
  `aria-checked`, because Blitz ignores `appearance: none` on native inputs. A named, checked
  control also renders a hidden input so forms still submit its value.
- **Placeholders** do not show in Blitz yet.
- **Glass** (`glass`, `CardVariant::Glass`) needs `backdrop-filter`, which Blitz draws only with
  its Skia renderer.
- **Text truncation** clips without an ellipsis.

The component list covers the first wave of Lumen components. More follow as Blitz support grows;
the [roadmap](https://github.com/santi020k/lumen/blob/main/docs/feature-roadmap.md#open-backlog)
tracks them.

## Development

From the repository root:

```sh
pnpm run generate:dioxus-css        # rebuild assets/lumen.css from the Lumen stylesheet
pnpm run generate:dioxus-fixtures   # rebuild lumen-react markup fixtures (needs built packages)
```

From `packages/dioxus`:

```sh
cargo test                                            # unit, parity, and doc tests
cargo clippy --all-targets -- -D warnings
cargo run --example gallery --features native-example # every component on Dioxus Native
```

`assets/lumen.css` is generated: edit the canonical CSS in `packages/lumen/styles.css` instead.
The parity tests in `tests/parity.rs` render each component with Dioxus SSR and compare it with
the lumen-react fixture, so the two adapters keep producing the markup Lumen's CSS expects.

## License

[MIT](https://github.com/santi020k/lumen/blob/main/LICENSE)
