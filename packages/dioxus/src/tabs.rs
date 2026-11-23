//! `Tabs`, `TabsList`, `TabsTrigger`, and `TabsPanel`.

use std::cell::Cell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::atomic::{AtomicUsize, Ordering};

use dioxus::prelude::*;

use crate::class::{Glass, Orientation, compose};

static NEXT_TABS_ID: AtomicUsize = AtomicUsize::new(0);

#[derive(Clone)]
struct TabsContext {
    id: Rc<str>,
    orientation: Orientation,
    selected: Signal<String>,
    /// Render-order counter, so triggers can be sorted without reading the DOM.
    next_order: Rc<Cell<usize>>,
    /// `(order, value, disabled)` for every mounted trigger.
    triggers: Signal<Vec<(usize, String, bool)>>,
    mounted: Signal<HashMap<String, Rc<MountedData>>>,
    on_change: Signal<Option<EventHandler<String>>>,
}

impl TabsContext {
    fn activate(&self, value: &str) {
        let mut selected = self.selected;

        if *selected.peek() == value {
            return;
        }

        selected.set(value.to_string());

        if let Some(handler) = *self.on_change.peek() {
            handler.call(value.to_string());
        }
    }

    fn trigger_id(&self, value: &str) -> String {
        format!("{}-tab-{value}", self.id)
    }

    fn panel_id(&self, value: &str) -> String {
        format!("{}-panel-{value}", self.id)
    }

    /// Enabled trigger values in render order.
    fn enabled_values(&self) -> Vec<String> {
        let mut triggers = self.triggers.peek().clone();
        triggers.sort_by_key(|(order, _, _)| *order);
        triggers
            .into_iter()
            .filter(|(_, _, disabled)| !disabled)
            .map(|(_, value, _)| value)
            .collect()
    }
}

fn use_tabs(component: &str) -> TabsContext {
    try_use_context::<TabsContext>()
        .unwrap_or_else(|| panic!("{component} must be used inside its matching Lumen Tabs root."))
}

/// Props for [`Tabs`].
#[derive(Props, Clone, PartialEq)]
pub struct TabsProps {
    /// The initially selected tab value.
    #[props(default, into)]
    pub default_value: String,
    /// Called with the newly selected value.
    pub on_value_change: Option<EventHandler<String>>,
    /// Arrow-key direction of the tab list. Read once, when the tabs mount.
    #[props(default)]
    pub orientation: Orientation,
    /// Base id for the generated tab and panel ids. Read once, when the tabs mount;
    /// generated when unset.
    #[props(into)]
    pub id: Option<String>,
    /// Glass intensity.
    #[props(default, into)]
    pub glass: Glass,
    /// Extra classes appended after the Lumen classes.
    #[props(into)]
    pub class: Option<String>,
    /// Any other `<div>` or global attribute.
    #[props(extends = GlobalAttributes, extends = div)]
    pub attributes: Vec<Attribute>,
    /// A [`TabsList`] and its [`TabsPanel`]s.
    pub children: Element,
}

/// Tabs with roving focus and arrow-key navigation, following the WAI-ARIA tabs pattern.
///
/// Arrow keys move and select, like `@santi020k/lumen-react`. Tab and panel ids are
/// `{id}-tab-{value}` and `{id}-panel-{value}`.
#[component]
pub fn Tabs(props: TabsProps) -> Element {
    let generated =
        use_hook(|| format!("ui-tabs-{}", NEXT_TABS_ID.fetch_add(1, Ordering::Relaxed)));
    let base_id = props.id.clone().unwrap_or(generated);
    let mut on_change = use_signal(|| props.on_value_change);

    use_context_provider(|| TabsContext {
        id: Rc::from(base_id.as_str()),
        orientation: props.orientation,
        selected: Signal::new(props.default_value.clone()),
        next_order: Rc::new(Cell::new(0)),
        triggers: Signal::new(Vec::new()),
        mounted: Signal::new(HashMap::new()),
        on_change,
    });

    use_effect(use_reactive((&props.on_value_change,), move |(handler,)| {
        on_change.set(handler);
    }));

    let glass = props.glass.class("ui-tabs");
    let class = compose([Some("ui-tabs"), glass.as_deref(), props.class.as_deref()]);

    rsx! {
        div { "data-ui-tabs": "true", class, ..props.attributes, {props.children} }
    }
}

/// Props for [`TabsList`].
#[derive(Props, Clone, PartialEq)]
pub struct TabsListProps {
    /// Any other `<div>` or global attribute. Name the list with `aria_label`.
    #[props(extends = GlobalAttributes, extends = div)]
    pub attributes: Vec<Attribute>,
    /// The [`TabsTrigger`]s.
    pub children: Element,
}

/// The `tablist` that holds the triggers.
#[component]
pub fn TabsList(props: TabsListProps) -> Element {
    let tabs = use_tabs("TabsList");
    let orientation = tabs.orientation.as_str();

    rsx! {
        div { aria_orientation: orientation, role: "tablist", ..props.attributes, {props.children} }
    }
}

/// Props for [`TabsTrigger`].
#[derive(Props, Clone, PartialEq)]
pub struct TabsTriggerProps {
    /// The value this trigger selects. Must match a [`TabsPanel`] value.
    #[props(into)]
    pub value: String,
    /// Skips the trigger during selection and keyboard navigation.
    #[props(default)]
    pub disabled: bool,
    /// Any other `<button>` or global attribute.
    #[props(extends = GlobalAttributes, extends = button)]
    pub attributes: Vec<Attribute>,
    /// Trigger label.
    pub children: Element,
}

fn next_index(key: &Key, current: usize, len: usize, orientation: Orientation) -> Option<usize> {
    let (previous, next) = match orientation {
        Orientation::Horizontal => (Key::ArrowLeft, Key::ArrowRight),
        Orientation::Vertical => (Key::ArrowUp, Key::ArrowDown),
    };

    match key {
        key if *key == next => Some((current + 1) % len),
        key if *key == previous => Some((current + len - 1) % len),
        Key::Home => Some(0),
        Key::End => Some(len - 1),
        _ => None,
    }
}

/// A `tab` button. Click, arrow keys, Home, and End move the selection.
#[component]
pub fn TabsTrigger(props: TabsTriggerProps) -> Element {
    let tabs = use_tabs("TabsTrigger");
    let value = props.value.clone();
    let disabled = props.disabled;
    let order = use_hook(|| {
        let order = tabs.next_order.get();
        tabs.next_order.set(order + 1);
        order
    });

    let mut triggers = tabs.triggers;
    use_effect(use_reactive(
        (&value, &disabled),
        move |(value, disabled)| {
            let mut list = triggers.write();
            list.retain(|(entry, _, _)| *entry != order);
            list.push((order, value, disabled));
        },
    ));
    use_drop(move || {
        triggers.write().retain(|(entry, _, _)| *entry != order);
    });

    let selected = *tabs.selected.read() == value;
    let (click_tabs, key_tabs) = (tabs.clone(), tabs.clone());
    let click_value = value.clone();
    let key_value = value.clone();
    let mount_value = value.clone();
    let mut mounted = tabs.mounted;

    rsx! {
        button {
            aria_controls: tabs.panel_id(&value),
            aria_selected: if selected { "true" } else { "false" },
            disabled,
            id: tabs.trigger_id(&value),
            role: "tab",
            tabindex: if selected { "0" } else { "-1" },
            r#type: "button",
            "data-value": value,
            onclick: move |_| click_tabs.activate(&click_value),
            onkeydown: move |event| {
                let enabled = key_tabs.enabled_values();

                if enabled.is_empty() {
                    return;
                }

                let current = enabled.iter().position(|entry| *entry == key_value).unwrap_or(0);

                if let Some(index) =
                    next_index(&event.key(), current, enabled.len(), key_tabs.orientation)
                {
                    event.prevent_default();
                    let next = enabled[index].clone();
                    key_tabs.activate(&next);

                    if let Some(node) = key_tabs.mounted.peek().get(&next).cloned() {
                        spawn(async move {
                            let _ = node.set_focus(true).await;
                        });
                    }
                }
            },
            onmounted: move |event| {
                mounted.write().insert(mount_value.clone(), event.data());
            },
            ..props.attributes,
            {props.children}
        }
    }
}

/// Props for [`TabsPanel`].
#[derive(Props, Clone, PartialEq)]
pub struct TabsPanelProps {
    /// The trigger value that shows this panel.
    #[props(into)]
    pub value: String,
    /// Any other `<div>` or global attribute.
    #[props(extends = GlobalAttributes, extends = div)]
    pub attributes: Vec<Attribute>,
    /// Panel content.
    pub children: Element,
}

/// The `tabpanel` shown while its trigger is selected.
#[component]
pub fn TabsPanel(props: TabsPanelProps) -> Element {
    let tabs = use_tabs("TabsPanel");
    let selected = *tabs.selected.read() == props.value;

    rsx! {
        div {
            aria_labelledby: tabs.trigger_id(&props.value),
            hidden: !selected,
            id: tabs.panel_id(&props.value),
            role: "tabpanel",
            tabindex: "0",
            ..props.attributes,
            {props.children}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{Key, Orientation, next_index};

    #[test]
    fn arrow_keys_loop_through_tabs() {
        let h = Orientation::Horizontal;
        assert_eq!(next_index(&Key::ArrowRight, 2, 3, h), Some(0));
        assert_eq!(next_index(&Key::ArrowLeft, 0, 3, h), Some(2));
        assert_eq!(next_index(&Key::Home, 2, 3, h), Some(0));
        assert_eq!(next_index(&Key::End, 0, 3, h), Some(2));
        assert_eq!(next_index(&Key::ArrowDown, 0, 3, h), None);
        assert_eq!(
            next_index(&Key::ArrowDown, 0, 3, Orientation::Vertical),
            Some(1)
        );
    }
}
