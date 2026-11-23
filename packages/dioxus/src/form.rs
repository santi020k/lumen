//! Form primitives: `Label`, `Input`, `Textarea`, `Field`, `FieldError`, `Checkbox`, and `Switch`.

use dioxus::prelude::*;

use crate::class::{Glass, compose};

/// Field state shared with the controls and error inside a [`Field`].
#[derive(Clone, Debug, PartialEq)]
struct FieldContext {
    control_id: Option<String>,
    invalid: bool,
}

impl FieldContext {
    fn error_id(&self) -> Option<String> {
        self.control_id.as_ref().map(|id| format!("{id}-error"))
    }
}

fn use_field() -> Option<FieldContext> {
    try_use_context::<Signal<FieldContext>>().map(|field| field.read().clone())
}

/// `aria-invalid` and `aria-describedby` for a control inside a [`Field`], mirroring what the
/// Lumen web runtime sets after hydration.
fn use_field_control_aria() -> (Option<&'static str>, Option<String>) {
    match use_field() {
        Some(field) if field.invalid => (Some("true"), field.error_id()),
        _ => (None, None),
    }
}

/// Props for [`Label`].
#[derive(Props, Clone, PartialEq)]
pub struct LabelProps {
    /// Extra classes appended after the Lumen class.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<label>` or global attribute, such as `r#for`.
    #[props(extends = GlobalAttributes, extends = label)]
    pub attributes: Vec<Attribute>,
    /// Label text.
    pub children: Element,
}

/// A form label.
#[component]
pub fn Label(props: LabelProps) -> Element {
    let class = compose([Some("ui-label"), props.class.as_deref()]);

    rsx! {
        label { class, ..props.attributes, {props.children} }
    }
}

/// Height of a text control.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum ControlSize {
    /// Default control height.
    #[default]
    Default,
    /// Compact control.
    Sm,
    /// Large control.
    Lg,
}

impl ControlSize {
    fn input_class(self) -> Option<&'static str> {
        match self {
            Self::Default => None,
            Self::Sm => Some("ui-input--sm"),
            Self::Lg => Some("ui-input--lg"),
        }
    }
}

/// Props for [`Input`].
#[derive(Props, Clone, PartialEq)]
pub struct InputProps {
    /// The native input type. Defaults to `text`.
    #[props(default = "text".to_string(), into)]
    pub r#type: String,
    /// Control height.
    #[props(default)]
    pub visual_size: ControlSize,
    /// Extra classes appended after the Lumen classes.
    #[props(into)]
    pub class: Option<String>,
    /// Fires on every edit.
    pub oninput: Option<EventHandler<FormEvent>>,
    /// Fires when the value is committed.
    pub onchange: Option<EventHandler<FormEvent>>,
    /// Any other `<input>` or global attribute, such as `id`, `value`, or `placeholder`.
    #[props(extends = GlobalAttributes, extends = input)]
    pub attributes: Vec<Attribute>,
}

/// A single-line text input.
#[component]
pub fn Input(props: InputProps) -> Element {
    let (aria_invalid, aria_describedby) = use_field_control_aria();
    let class = compose([
        Some("ui-input"),
        props.visual_size.input_class(),
        props.class.as_deref(),
    ]);
    let (oninput, onchange) = (props.oninput, props.onchange);

    rsx! {
        input {
            aria_describedby,
            aria_invalid,
            class,
            r#type: props.r#type,
            oninput: move |event| {
                if let Some(handler) = oninput {
                    handler.call(event);
                }
            },
            onchange: move |event| {
                if let Some(handler) = onchange {
                    handler.call(event);
                }
            },
            ..props.attributes,
        }
    }
}

/// Props for [`Textarea`].
#[derive(Props, Clone, PartialEq)]
pub struct TextareaProps {
    /// Visible rows. Defaults to 4.
    #[props(default = 4)]
    pub rows: u32,
    /// Extra classes appended after the Lumen class.
    #[props(into)]
    pub class: Option<String>,
    /// Fires on every edit.
    pub oninput: Option<EventHandler<FormEvent>>,
    /// Any other `<textarea>` or global attribute, such as `id` or `value`.
    #[props(extends = GlobalAttributes, extends = textarea)]
    pub attributes: Vec<Attribute>,
}

/// A multi-line text input.
#[component]
pub fn Textarea(props: TextareaProps) -> Element {
    let (aria_invalid, aria_describedby) = use_field_control_aria();
    let class = compose([Some("ui-textarea"), props.class.as_deref()]);
    let oninput = props.oninput;

    rsx! {
        textarea {
            aria_describedby,
            aria_invalid,
            class,
            rows: "{props.rows}",
            oninput: move |event| {
                if let Some(handler) = oninput {
                    handler.call(event);
                }
            },
            ..props.attributes,
        }
    }
}

/// Props for [`Field`].
#[derive(Props, Clone, PartialEq)]
pub struct FieldProps {
    /// Id of the control this field labels and validates.
    #[props(into)]
    pub control_id: Option<String>,
    /// Ids of descriptions for the control, added to `data-ui-field-describedby`.
    #[props(into)]
    pub described_by: Option<String>,
    /// `aria-describedby` of the field element itself; also added to `data-ui-field-describedby`.
    #[props(into)]
    pub aria_describedby: Option<String>,
    /// Marks the field and its control as invalid.
    #[props(default)]
    pub invalid: bool,
    /// Glass intensity.
    #[props(default, into)]
    pub glass: Glass,
    /// Extra classes appended after the Lumen classes.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<div>` or global attribute.
    #[props(extends = GlobalAttributes, extends = div)]
    pub attributes: Vec<Attribute>,
    /// Label, control, description, and error.
    pub children: Element,
}

/// Groups a label, a control, and its validation message.
///
/// Controls inside an invalid field get `aria-invalid="true"` and point `aria-describedby`
/// at the [`FieldError`], which is what the web runtime does after hydration.
#[component]
pub fn Field(props: FieldProps) -> Element {
    let context = FieldContext {
        control_id: props.control_id.clone(),
        invalid: props.invalid,
    };
    let mut shared = use_context_provider(|| Signal::new(context.clone()));

    use_effect(use_reactive((&context,), move |(context,)| {
        if *shared.peek() != context {
            shared.set(context);
        }
    }));

    let glass = props.glass.class("ui-field");
    let class = compose([Some("ui-field"), glass.as_deref(), props.class.as_deref()]);
    let field_described_by = Some(compose([
        props.aria_describedby.as_deref(),
        props.described_by.as_deref(),
    ]))
    .filter(|ids| !ids.is_empty());

    rsx! {
        div {
            aria_describedby: props.aria_describedby,
            class,
            "data-invalid": props.invalid.then_some("true"),
            "data-ui-field": "true",
            "data-ui-field-control": props.control_id,
            "data-ui-field-describedby": field_described_by,
            ..props.attributes,
            {props.children}
        }
    }
}

/// Props for [`FieldError`].
#[derive(Props, Clone, PartialEq)]
pub struct FieldErrorProps {
    /// The validation message. The element is hidden while there is no message.
    #[props(into)]
    pub message: Option<String>,
    /// Extra classes appended after the Lumen class.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<p>` or global attribute.
    #[props(extends = GlobalAttributes, extends = p)]
    pub attributes: Vec<Attribute>,
}

/// The validation message of a [`Field`].
#[component]
pub fn FieldError(props: FieldErrorProps) -> Element {
    let id = use_field().and_then(|field| field.error_id());
    let class = compose([Some("ui-field-error"), props.class.as_deref()]);
    let hidden = props.message.as_deref().is_none_or(str::is_empty);

    rsx! {
        p {
            class,
            "data-ui-field-error": "true",
            hidden,
            id,
            ..props.attributes,
            if let Some(message) = props.message {
                "{message}"
            }
        }
    }
}

/// Props for [`Checkbox`] and [`Switch`].
#[derive(Props, Clone, PartialEq)]
pub struct ToggleProps {
    /// Controlled state. Leave unset to let the control manage itself.
    pub checked: Option<bool>,
    /// Initial state when uncontrolled.
    #[props(default)]
    pub default_checked: bool,
    /// Shows the mixed state (`aria-checked="mixed"`), as for a "select all" row. Activating the
    /// control still reports `true`; clear this prop when the app resolves the mix.
    #[props(default)]
    pub indeterminate: bool,
    /// Disables the control.
    #[props(default)]
    pub disabled: bool,
    /// Form field name. When set and checked, a hidden input submits `value`.
    #[props(into)]
    pub name: Option<String>,
    /// Submitted value when checked. Defaults to `on`, like a native checkbox.
    #[props(default = "on".to_string(), into)]
    pub value: String,
    /// Called with the new checked state.
    pub onchange: Option<EventHandler<bool>>,
    /// Extra classes appended after the Lumen class.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<button>` or global attribute. Name the control with `aria_label`,
    /// `aria_labelledby`, or a wrapping `<label>`.
    #[props(extends = GlobalAttributes, extends = button)]
    pub attributes: Vec<Attribute>,
}

fn toggle(base: &'static str, role: &'static str, props: ToggleProps) -> Element {
    let mut internal = use_signal(|| props.default_checked);
    let controlled = props.checked;
    let checked = controlled.unwrap_or_else(|| *internal.read());
    let aria_checked = match (props.indeterminate, checked) {
        (true, _) => "mixed",
        (false, true) => "true",
        (false, false) => "false",
    };
    let (aria_invalid, aria_describedby) = use_field_control_aria();
    let class = compose([Some(base), props.class.as_deref()]);
    let onchange = props.onchange;
    let disabled = props.disabled;
    let indeterminate = props.indeterminate;
    let submitted = props.name.filter(|_| checked && !indeterminate);

    rsx! {
        button {
            aria_checked,
            aria_describedby,
            aria_invalid,
            class,
            disabled,
            role,
            r#type: "button",
            onclick: move |_| {
                if disabled {
                    return;
                }

                let next = indeterminate || !checked;

                if controlled.is_none() {
                    internal.set(next);
                }

                if let Some(handler) = onchange {
                    handler.call(next);
                }
            },
            ..props.attributes,
        }
        if let Some(name) = submitted {
            input { r#type: "hidden", name, value: props.value }
        }
    }
}

/// A checkbox that renders the same in browsers and in Dioxus Native.
///
/// It is a `<button role="checkbox">` with `aria-checked`, because Blitz does not yet support
/// `appearance: none` on native inputs. Space and click toggle it.
#[component]
pub fn Checkbox(props: ToggleProps) -> Element {
    toggle("ui-checkbox", "checkbox", props)
}

/// An on/off switch, rendered as `<button role="switch">` for the same reason as [`Checkbox`].
#[component]
pub fn Switch(props: ToggleProps) -> Element {
    toggle("ui-switch", "switch", props)
}
