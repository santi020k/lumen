//! Class-name helpers shared by every component.

/// Join the present class names with single spaces, like `composeClassName` in `lumen-core`.
pub(crate) fn compose<'a>(parts: impl IntoIterator<Item = Option<&'a str>>) -> String {
    let mut out = String::new();

    for part in parts.into_iter().flatten() {
        if part.is_empty() {
            continue;
        }

        if !out.is_empty() {
            out.push(' ');
        }

        out.push_str(part);
    }

    out
}

/// Glass treatment shared by surfaces such as cards, alerts, fields, and tabs.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Glass {
    /// No glass treatment.
    #[default]
    Off,
    /// The default glass intensity.
    On,
    /// A lighter glass treatment.
    Subtle,
    /// A stronger glass treatment.
    Strong,
}

impl From<bool> for Glass {
    fn from(value: bool) -> Self {
        if value { Self::On } else { Self::Off }
    }
}

impl Glass {
    /// `{base}--glass` plus the intensity class, or `None` when glass is off.
    pub(crate) fn class(self, base: &str) -> Option<String> {
        let intensity = match self {
            Self::Off => return None,
            Self::On => None,
            Self::Subtle => Some("ui-glass-subtle"),
            Self::Strong => Some("ui-glass-strong"),
        };

        let glass = format!("{base}--glass");

        Some(compose([Some(glass.as_str()), intensity]))
    }

    /// Whether any glass treatment is applied.
    pub(crate) fn is_on(self) -> bool {
        self != Self::Off
    }
}

/// Layout direction shared by separators and tab lists.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Orientation {
    /// Left to right.
    #[default]
    Horizontal,
    /// Top to bottom.
    Vertical,
}

impl Orientation {
    /// The DOM attribute value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Horizontal => "horizontal",
            Self::Vertical => "vertical",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{Glass, compose};

    #[test]
    fn compose_skips_missing_and_empty_parts() {
        assert_eq!(compose([Some("a"), None, Some(""), Some("b")]), "a b");
    }

    #[test]
    fn glass_classes_follow_lumen_react() {
        assert_eq!(Glass::Off.class("ui-card"), None);
        assert_eq!(
            Glass::On.class("ui-card").as_deref(),
            Some("ui-card--glass")
        );
        assert_eq!(
            Glass::Strong.class("ui-card").as_deref(),
            Some("ui-card--glass ui-glass-strong")
        );
    }
}
