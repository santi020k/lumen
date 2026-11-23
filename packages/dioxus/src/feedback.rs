//! Feedback and identity: `Progress`, `Spinner`, `Avatar`, and `Separator`.

use dioxus::prelude::*;

use crate::class::{Orientation, compose};

const DEFAULT_PROGRESS_MAX: f64 = 100.0;

/// The clamped values a [`Progress`] renders, matching `normalizeLumenProgress` in `lumen-core`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ProgressState {
    /// A finite maximum above zero; falls back to 100.
    pub max: f64,
    /// The value clamped to `0..=max`; non-finite values become 0.
    pub value: f64,
    /// `value / max * 100`.
    pub percentage: f64,
}

/// Clamp a progress value and maximum the same way every Lumen adapter does.
pub fn normalize_progress(max: f64, value: f64) -> ProgressState {
    let max = if max.is_finite() && max > 0.0 {
        max
    } else {
        DEFAULT_PROGRESS_MAX
    };
    let value = if value.is_finite() {
        value.clamp(0.0, max)
    } else {
        0.0
    };

    ProgressState {
        max,
        value,
        percentage: value / max * 100.0,
    }
}

/// Props for [`Progress`].
#[derive(Props, Clone, PartialEq)]
pub struct ProgressProps {
    /// Current value.
    #[props(default)]
    pub value: f64,
    /// Maximum value. Defaults to 100.
    #[props(default = DEFAULT_PROGRESS_MAX)]
    pub max: f64,
    /// Extra classes appended after the Lumen class.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<div>` or global attribute. Give the bar an `aria_label`.
    #[props(extends = GlobalAttributes, extends = div)]
    pub attributes: Vec<Attribute>,
}

/// A determinate progress bar with `progressbar` semantics.
#[component]
pub fn Progress(props: ProgressProps) -> Element {
    let state = normalize_progress(props.max, props.value);
    let class = compose([Some("ui-progress"), props.class.as_deref()]);

    rsx! {
        div {
            aria_valuemax: "{state.max}",
            aria_valuemin: "0",
            aria_valuenow: "{state.value}",
            class,
            role: "progressbar",
            ..props.attributes,
            span {
                class: "ui-progress__bar",
                "data-slot": "progress-indicator",
                style: "width: {state.percentage}%",
            }
        }
    }
}

fn has_name(value: Option<&str>) -> bool {
    value.is_some_and(|text| !text.trim().is_empty())
}

/// Props for [`Spinner`].
#[derive(Props, Clone, PartialEq)]
pub struct SpinnerProps {
    /// Accessible name. A named spinner gets `role="status"`; an unnamed one is hidden.
    #[props(into)]
    pub aria_label: Option<String>,
    /// Id of the element that names the spinner.
    #[props(into)]
    pub aria_labelledby: Option<String>,
    /// Overrides the computed role.
    #[props(into)]
    pub role: Option<String>,
    /// Overrides the computed `aria-hidden`.
    pub aria_hidden: Option<bool>,
    /// Extra classes appended after the Lumen class.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<span>` or global attribute.
    #[props(extends = GlobalAttributes, extends = span)]
    pub attributes: Vec<Attribute>,
}

/// An indeterminate loading indicator.
///
/// Follows `resolveLumenLoadingSemantics`: named spinners announce as `status`,
/// unnamed ones are decorative and hidden from assistive technology.
#[component]
pub fn Spinner(props: SpinnerProps) -> Element {
    let named = has_name(props.aria_label.as_deref()) || has_name(props.aria_labelledby.as_deref());
    let aria_hidden = match props.aria_hidden {
        Some(hidden) => Some(hidden.to_string()),
        None if named => None,
        None => Some("true".to_string()),
    };
    let role = match props.role {
        Some(role) => Some(role),
        None if named => Some("status".to_string()),
        None => None,
    };
    let class = compose([Some("ui-spinner"), props.class.as_deref()]);

    rsx! {
        span {
            aria_hidden,
            aria_label: props.aria_label,
            aria_labelledby: props.aria_labelledby,
            class,
            role,
            ..props.attributes,
        }
    }
}

/// Props for [`Avatar`].
#[derive(Props, Clone, PartialEq)]
pub struct AvatarProps {
    /// Image URL. Without it, the fallback renders.
    #[props(into)]
    pub src: Option<String>,
    /// Alternative text for the image.
    #[props(default, into)]
    pub alt: String,
    /// Text shown when there is no image, usually initials.
    #[props(default, into)]
    pub fallback: String,
    /// Extra classes appended after the Lumen class.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<span>` or global attribute.
    #[props(extends = GlobalAttributes, extends = span)]
    pub attributes: Vec<Attribute>,
    /// Extra content such as a status badge.
    pub children: Element,
}

/// A user or entity image with a text fallback.
#[component]
pub fn Avatar(props: AvatarProps) -> Element {
    let class = compose([Some("ui-avatar"), props.class.as_deref()]);

    rsx! {
        span { class, ..props.attributes,
            if let Some(src) = props.src {
                img { alt: props.alt, src }
            } else {
                span { {props.fallback} }
            }
            {props.children}
        }
    }
}

/// Props for [`Separator`].
#[derive(Props, Clone, PartialEq)]
pub struct SeparatorProps {
    /// Direction of the line.
    #[props(default)]
    pub orientation: Orientation,
    /// Extra classes appended after the Lumen classes.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<hr>` or global attribute.
    #[props(extends = GlobalAttributes, extends = hr)]
    pub attributes: Vec<Attribute>,
}

/// A thematic break between groups of content.
#[component]
pub fn Separator(props: SeparatorProps) -> Element {
    let orientation = props.orientation.as_str();
    let modifier = format!("ui-separator--{orientation}");
    let class = compose([
        Some("ui-separator"),
        Some(modifier.as_str()),
        props.class.as_deref(),
    ]);

    rsx! {
        hr {
            aria_orientation: orientation,
            class,
            "data-orientation": orientation,
            ..props.attributes,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::normalize_progress;

    #[test]
    fn progress_clamps_like_lumen_core() {
        let state = normalize_progress(100.0, 62.0);
        assert!((state.percentage - 62.0).abs() < f64::EPSILON);

        let over = normalize_progress(50.0, 80.0);
        assert!((over.value - 50.0).abs() < f64::EPSILON);
        assert!((over.percentage - 100.0).abs() < f64::EPSILON);

        let invalid = normalize_progress(f64::NAN, f64::INFINITY);
        assert!((invalid.max - 100.0).abs() < f64::EPSILON);
        assert!(invalid.value.abs() < f64::EPSILON);

        let negative = normalize_progress(-5.0, -10.0);
        assert!((negative.max - 100.0).abs() < f64::EPSILON);
        assert!(negative.value.abs() < f64::EPSILON);
    }
}
