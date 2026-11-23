//! `Button`.

use dioxus::prelude::*;

use crate::class::compose;

/// Visual treatment of a [`Button`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum ButtonVariant {
    /// Solid brand button for the primary action.
    #[default]
    Default,
    /// Quiet filled button.
    Secondary,
    /// Bordered button.
    Outline,
    /// Button without a border or fill.
    Ghost,
    /// Destructive action.
    Destructive,
    /// Text link styled as a button.
    Link,
}

impl ButtonVariant {
    /// The class suffix and `data-variant` value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Secondary => "secondary",
            Self::Outline => "outline",
            Self::Ghost => "ghost",
            Self::Destructive => "destructive",
            Self::Link => "link",
        }
    }
}

/// Size of a [`Button`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum ButtonSize {
    /// Default control height.
    #[default]
    Default,
    /// Compact control.
    Sm,
    /// Large control.
    Lg,
    /// Square icon-only control. Give it an `aria_label`.
    Icon,
}

impl ButtonSize {
    fn class(self) -> &'static str {
        match self {
            Self::Default => "ui-button--default-size",
            Self::Sm => "ui-button--sm",
            Self::Lg => "ui-button--lg",
            Self::Icon => "ui-button--icon",
        }
    }
}

/// Props for [`Button`].
#[derive(Props, Clone, PartialEq)]
pub struct ButtonProps {
    /// Visual treatment.
    #[props(default)]
    pub variant: ButtonVariant,
    /// Control size.
    #[props(default)]
    pub size: ButtonSize,
    /// Disables the button.
    #[props(default)]
    pub disabled: bool,
    /// Shows a spinner, sets `aria-busy`, and disables the button.
    #[props(default)]
    pub loading: bool,
    /// The native button type. Defaults to `button`, so it never submits a form by accident.
    #[props(default = "button".to_string(), into)]
    pub r#type: String,
    /// Extra classes appended after the Lumen classes.
    #[props(into)]
    pub class: Option<String>,
    /// Click handler.
    pub onclick: Option<EventHandler<MouseEvent>>,
    /// Any other `<button>` or global attribute.
    #[props(extends = GlobalAttributes, extends = button)]
    pub attributes: Vec<Attribute>,
    /// Button label and icons.
    pub children: Element,
}

/// A button with Lumen's variants, sizes, and loading state.
///
/// Renders the same markup as `Button` in `@santi020k/lumen-react`.
#[component]
pub fn Button(props: ButtonProps) -> Element {
    let is_disabled = props.disabled || props.loading;
    let variant = format!("ui-button--{}", props.variant.as_str());
    let class = compose([
        Some("ui-button"),
        Some(variant.as_str()),
        Some(props.size.class()),
        is_disabled.then_some("ui-button--disabled"),
        props.loading.then_some("ui-button--loading"),
        props.class.as_deref(),
    ]);
    let onclick = props.onclick;

    rsx! {
        button {
            aria_busy: props.loading.then_some("true"),
            class,
            "data-slot": "button",
            disabled: is_disabled,
            r#type: props.r#type,
            onclick: move |event| {
                if let Some(handler) = onclick {
                    handler.call(event);
                }
            },
            ..props.attributes,
            if props.loading {
                span { aria_hidden: "true", class: "ui-spinner" }
            }
            span { class: "ui-button__content", {props.children} }
        }
    }
}
