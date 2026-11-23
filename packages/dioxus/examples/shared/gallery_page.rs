//! The gallery page shared by the native example and the visual comparison.

use dioxus::prelude::*;
use lumen_dioxus::prelude::*;

/// Every first-wave component, in one scrolling page.
#[component]
pub fn Gallery() -> Element {
    let mut email = use_signal(String::new);
    let mut notifications = use_signal(|| true);
    let mut uploads = use_signal(|| 62.0);
    let name_invalid = email.read().is_empty();

    rsx! {
        main { style: "display: flex; flex-direction: column; gap: 24px; max-width: 560px; padding: 24px;",
            section {
                h2 { class: "ui-label", "Buttons" }
                div { style: "display: flex; flex-wrap: wrap; gap: 12px; align-items: center;",
                    Button { onclick: move |_| uploads.set((uploads() + 10.0) % 110.0), "Default" }
                    Button { variant: ButtonVariant::Secondary, "Secondary" }
                    Button { variant: ButtonVariant::Outline, "Outline" }
                    Button { variant: ButtonVariant::Ghost, "Ghost" }
                    Button { variant: ButtonVariant::Destructive, "Destructive" }
                    Button { variant: ButtonVariant::Link, "Link" }
                }
                div { style: "display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 12px;",
                    Button { size: ButtonSize::Sm, "Small" }
                    Button { size: ButtonSize::Lg, "Large" }
                    Button { disabled: true, "Disabled" }
                    Button { loading: true, "Loading" }
                }
            }

            Card {
                CardHeader {
                    CardTitle { "Workspace plan" }
                    CardDescription { "Upgrade to unlock shared libraries and audit logs." }
                }
                CardContent { "Billed yearly. Cancel anytime. Includes 10 seats." }
                CardFooter {
                    Button { variant: ButtonVariant::Secondary, "Compare plans" }
                    Button { "Upgrade" }
                }
            }

            section { style: "display: flex; flex-direction: column; gap: 16px;",
                Field { control_id: "email", invalid: name_invalid,
                    Label { r#for: "email", "Email" }
                    Input {
                        id: "email",
                        r#type: "email",
                        value: email(),
                        oninput: move |event: FormEvent| email.set(event.value()),
                    }
                    FieldError { message: name_invalid.then(|| "Enter an email address.".to_string()) }
                }
                Field { control_id: "bio",
                    Label { r#for: "bio", "Bio" }
                    Textarea { id: "bio", rows: 3, value: "Designer and maintainer." }
                }
                div { style: "display: flex; gap: 24px; align-items: center;",
                    label { style: "display: inline-flex; gap: 8px; align-items: center;",
                        Checkbox { default_checked: true, aria_label: "Remember me" }
                        "Remember me"
                    }
                    label { style: "display: inline-flex; gap: 8px; align-items: center;",
                        Switch {
                            checked: notifications(),
                            onchange: move |next| notifications.set(next),
                            aria_label: "Notifications",
                        }
                        if notifications() { "Notifications on" } else { "Notifications off" }
                    }
                }
            }

            Tabs { default_value: "overview",
                TabsList { aria_label: "Project sections",
                    TabsTrigger { value: "overview", "Overview" }
                    TabsTrigger { value: "activity", "Activity" }
                    TabsTrigger { value: "settings", "Settings" }
                }
                TabsPanel { value: "overview", "12 open issues, 3 releases this month." }
                TabsPanel { value: "activity", "Three pull requests merged today." }
                TabsPanel { value: "settings", "Notifications and members." }
            }

            section { style: "display: flex; flex-direction: column; gap: 16px;",
                div { style: "display: flex; flex-wrap: wrap; gap: 8px;",
                    Badge { "Default" }
                    Badge { variant: BadgeVariant::Secondary, "Secondary" }
                    Badge { variant: BadgeVariant::Outline, "Outline" }
                    Badge { variant: BadgeVariant::Success, "Success" }
                    Badge { variant: BadgeVariant::Warning, "Warning" }
                    Badge { variant: BadgeVariant::Destructive, "Destructive" }
                }
                Alert { strong { "Heads up. " } "A new version of Lumen is available." }
                Alert { variant: AlertVariant::Destructive, strong { "Build failed. " } "Check the logs." }
                Progress { value: uploads(), aria_label: "Upload progress" }
                div { style: "display: flex; gap: 12px; align-items: center;",
                    Spinner { aria_label: "Loading" }
                    Avatar { fallback: "SL", alt: "Santiago" }
                }
                Separator {}
            }
        }
    }
}
