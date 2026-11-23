//! Surfaces: `Card` and its parts, `Badge`, and `Alert`.

use dioxus::prelude::*;

use crate::class::{Glass, compose};

/// Spacing inside a [`Card`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum CardDensity {
    /// Default padding.
    #[default]
    Comfortable,
    /// Tighter padding for dense layouts.
    Compact,
    /// Roomier padding for feature content.
    Spacious,
}

impl CardDensity {
    /// The class suffix and `data-density` value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Comfortable => "comfortable",
            Self::Compact => "compact",
            Self::Spacious => "spacious",
        }
    }
}

/// Visual treatment of a [`Card`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum CardVariant {
    /// Bordered surface.
    #[default]
    Default,
    /// Glass surface. Needs a renderer with `backdrop-filter` support.
    Glass,
    /// Hover and focus affordances for a whole-card action.
    Interactive,
    /// Quieter muted surface.
    Muted,
    /// No surface styling; keeps the card layout.
    Unstyled,
}

impl CardVariant {
    /// The `data-variant` value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Glass => "glass",
            Self::Interactive => "interactive",
            Self::Muted => "muted",
            Self::Unstyled => "unstyled",
        }
    }
}

/// Props for [`Card`].
#[derive(Props, Clone, PartialEq)]
pub struct CardProps {
    /// Inner spacing.
    #[props(default)]
    pub density: CardDensity,
    /// Visual treatment.
    #[props(default)]
    pub variant: CardVariant,
    /// Glass intensity. `CardVariant::Glass` turns on the default intensity.
    #[props(default, into)]
    pub glass: Glass,
    /// Extra classes appended after the Lumen classes.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<div>` or global attribute.
    #[props(extends = GlobalAttributes, extends = div)]
    pub attributes: Vec<Attribute>,
    /// Card parts.
    pub children: Element,
}

/// A grouped surface. Compose it with [`CardHeader`], [`CardTitle`], [`CardDescription`],
/// [`CardContent`], and [`CardFooter`].
#[component]
pub fn Card(props: CardProps) -> Element {
    let density = format!("ui-card--{}", props.density.as_str());
    let glass = if props.variant == CardVariant::Glass && !props.glass.is_on() {
        Glass::On
    } else {
        props.glass
    };
    let glass_class = glass.class("ui-card");
    let class = compose([
        Some("ui-card"),
        Some(density.as_str()),
        (props.variant == CardVariant::Muted).then_some("ui-card--muted"),
        (props.variant == CardVariant::Interactive).then_some("ui-card--interactive"),
        (props.variant == CardVariant::Unstyled).then_some("ui-card--unstyled"),
        glass_class.as_deref(),
        props.class.as_deref(),
    ]);

    rsx! {
        div {
            class,
            "data-density": props.density.as_str(),
            "data-slot": "card",
            "data-variant": props.variant.as_str(),
            ..props.attributes,
            {props.children}
        }
    }
}

/// Props shared by the card parts.
#[derive(Props, Clone, PartialEq)]
pub struct CardPartProps {
    /// Extra classes appended after the Lumen class.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<div>` or global attribute.
    #[props(extends = GlobalAttributes, extends = div)]
    pub attributes: Vec<Attribute>,
    /// Content.
    pub children: Element,
}

fn card_part(base: &str, slot: &str, props: CardPartProps) -> Element {
    let class = compose([Some(base), props.class.as_deref()]);

    rsx! {
        div { class, "data-slot": slot.to_string(), ..props.attributes, {props.children} }
    }
}

/// Header area of a [`Card`]: title, description, and header actions.
#[component]
pub fn CardHeader(props: CardPartProps) -> Element {
    card_part("ui-card__header", "card-header", props)
}

/// Title of a [`Card`].
#[component]
pub fn CardTitle(props: CardPartProps) -> Element {
    card_part("ui-card__title", "card-title", props)
}

/// Supporting text under a [`CardTitle`].
#[component]
pub fn CardDescription(props: CardPartProps) -> Element {
    card_part("ui-card__description", "card-description", props)
}

/// Main content of a [`Card`].
#[component]
pub fn CardContent(props: CardPartProps) -> Element {
    card_part("ui-card__content", "card-content", props)
}

/// Footer of a [`Card`], usually actions.
#[component]
pub fn CardFooter(props: CardPartProps) -> Element {
    card_part("ui-card__footer", "card-footer", props)
}

/// Tone of a [`Badge`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum BadgeVariant {
    /// Brand tone.
    #[default]
    Default,
    /// Quiet filled tone.
    Secondary,
    /// Bordered tone.
    Outline,
    /// Positive status.
    Success,
    /// Cautionary status.
    Warning,
    /// Error or destructive status.
    Destructive,
}

impl BadgeVariant {
    /// The class suffix and `data-variant` value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Secondary => "secondary",
            Self::Outline => "outline",
            Self::Success => "success",
            Self::Warning => "warning",
            Self::Destructive => "destructive",
        }
    }
}

/// Props for [`Badge`].
#[derive(Props, Clone, PartialEq)]
pub struct BadgeProps {
    /// Tone.
    #[props(default)]
    pub variant: BadgeVariant,
    /// Extra classes appended after the Lumen classes.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<span>` or global attribute.
    #[props(extends = GlobalAttributes, extends = span)]
    pub attributes: Vec<Attribute>,
    /// Badge label.
    pub children: Element,
}

/// A compact status or classification label.
#[component]
pub fn Badge(props: BadgeProps) -> Element {
    let variant = format!("ui-badge--{}", props.variant.as_str());
    let class = compose([
        Some("ui-badge"),
        Some(variant.as_str()),
        props.class.as_deref(),
    ]);

    rsx! {
        span {
            class,
            "data-variant": props.variant.as_str(),
            ..props.attributes,
            {props.children}
        }
    }
}

/// Tone of an [`Alert`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum AlertVariant {
    /// Neutral information.
    #[default]
    Default,
    /// Positive outcome.
    Success,
    /// Needs attention.
    Warning,
    /// Error or failure.
    Destructive,
}

impl AlertVariant {
    /// The class suffix and `data-variant` value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Success => "success",
            Self::Warning => "warning",
            Self::Destructive => "destructive",
        }
    }
}

/// Props for [`Alert`].
#[derive(Props, Clone, PartialEq)]
pub struct AlertProps {
    /// Tone.
    #[props(default)]
    pub variant: AlertVariant,
    /// Glass intensity.
    #[props(default, into)]
    pub glass: Glass,
    /// Extra classes appended after the Lumen classes.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<aside>` or global attribute.
    #[props(extends = GlobalAttributes, extends = aside)]
    pub attributes: Vec<Attribute>,
    /// Alert content.
    pub children: Element,
}

/// Inline feedback with a semantic tone.
#[component]
pub fn Alert(props: AlertProps) -> Element {
    let variant = (props.variant != AlertVariant::Default)
        .then(|| format!("ui-alert--{}", props.variant.as_str()));
    let glass = props.glass.class("ui-alert");
    let class = compose([
        Some("ui-alert"),
        variant.as_deref(),
        glass.as_deref(),
        props.class.as_deref(),
    ]);

    rsx! {
        aside {
            class,
            "data-variant": props.variant.as_str(),
            ..props.attributes,
            {props.children}
        }
    }
}
