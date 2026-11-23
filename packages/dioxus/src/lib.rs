//! Lumen UI components for [Dioxus](https://dioxuslabs.com).
//!
//! The components render the same classes and attributes as `@santi020k/lumen-react`, so they
//! share Lumen's stylesheet. They work with every Dioxus renderer: web, desktop (webview), and
//! Dioxus Native, which draws HTML and CSS with the Blitz engine instead of a webview.
//!
//! Render [`LumenStyles`] once near the root of the app, then use the components:
//!
//! ```
//! use dioxus::prelude::*;
//! use lumen_dioxus::prelude::*;
//!
//! #[component]
//! fn App() -> Element {
//!     rsx! {
//!         LumenStyles {}
//!         Card {
//!             CardHeader {
//!                 CardTitle { "Workspace plan" }
//!                 CardDescription { "Shared libraries and audit logs." }
//!             }
//!             CardFooter {
//!                 Button { variant: ButtonVariant::Secondary, "Compare plans" }
//!                 Button { onclick: move |_| {}, "Upgrade" }
//!             }
//!         }
//!     }
//! }
//! ```
//!
//! On Dioxus Native, `Checkbox` and `Switch` render as ARIA buttons, glass needs a renderer with
//! `backdrop-filter` support, and placeholders do not show yet. The package README lists the
//! current renderer gaps.

mod button;
mod class;
mod feedback;
mod form;
mod surface;
mod tabs;

use dioxus::prelude::*;

pub use button::{Button, ButtonProps, ButtonSize, ButtonVariant};
pub use class::{Glass, Orientation};
pub use feedback::{
    Avatar, AvatarProps, Progress, ProgressProps, ProgressState, Separator, SeparatorProps,
    Spinner, SpinnerProps, normalize_progress,
};
pub use form::{
    Checkbox, ControlSize, Field, FieldError, FieldErrorProps, FieldProps, Input, InputProps,
    Label, LabelProps, Switch, Textarea, TextareaProps, ToggleProps,
};
pub use surface::{
    Alert, AlertProps, AlertVariant, Badge, BadgeProps, BadgeVariant, Card, CardContent,
    CardDensity, CardDescription, CardFooter, CardHeader, CardPartProps, CardProps, CardTitle,
    CardVariant,
};
pub use tabs::{
    Tabs, TabsList, TabsListProps, TabsPanel, TabsPanelProps, TabsProps, TabsTrigger,
    TabsTriggerProps,
};

/// Lumen's complete stylesheet, generated from `@santi020k/lumen-core`.
///
/// Use it when you load styles yourself; otherwise render [`LumenStyles`].
pub const LUMEN_CSS: &str = include_str!("../assets/lumen.css");

/// Embeds [`LUMEN_CSS`] in a `<style>` element. Render it once, near the root of the app.
#[component]
pub fn LumenStyles() -> Element {
    rsx! {
        style { {LUMEN_CSS} }
    }
}

/// Everything needed to build a Lumen interface: components, their option enums, and [`LumenStyles`].
pub mod prelude {
    pub use crate::{
        Alert, AlertVariant, Avatar, Badge, BadgeVariant, Button, ButtonSize, ButtonVariant, Card,
        CardContent, CardDensity, CardDescription, CardFooter, CardHeader, CardTitle, CardVariant,
        Checkbox, ControlSize, Field, FieldError, Glass, Input, Label, LumenStyles, Orientation,
        Progress, Separator, Spinner, Switch, Tabs, TabsList, TabsPanel, TabsTrigger, Textarea,
    };
}
