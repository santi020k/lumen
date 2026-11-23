//! Lumen component gallery on Dioxus Native (Blitz).
//!
//! ```sh
//! cargo run --example gallery --features native-example
//! ```

#[path = "shared/gallery_page.rs"]
mod gallery_page;

use dioxus::prelude::*;
use gallery_page::Gallery;
use lumen_dioxus::LumenStyles;

fn main() {
    dioxus::launch(App);
}

#[component]
fn App() -> Element {
    rsx! {
        LumenStyles {}
        Gallery {}
    }
}
