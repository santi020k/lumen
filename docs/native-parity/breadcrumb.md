# Native Breadcrumb

Breadcrumb adapts Astro's labeled navigation trail: ancestors navigate through
host callbacks and the final item is the current page, without a navigation
action. Existing public APIs remain unchanged. Hosts supply stable item IDs,
localized labels and `currentLabel`; routing and persistence stay in the app.

Each adapter rejects a path containing blank or duplicate IDs, preserving the
labeled container while hiding ambiguous navigation. Empty paths are valid.
Repeated display labels are allowed when IDs differ. Disabled ancestors and
whole-trail disabled states block callbacks; the current item never navigates.
RN supplies an explicit localized current accessible name and web `aria-current`
because web does not expose React Native's accessibility value. SwiftUI and
Compose retain their selected/current native semantics.

Trails scroll horizontally on narrow screens. Ancestor actions retain at least
44-unit touch targets, separators are decorative, and native keyboard/focus
conventions apply. The three `BreadcrumbParityExample` fragments use synthetic
locations, a disabled ancestor, a long path, whole-trail disabling, English and
Spanish current-page labels, and host feedback showing the requested ID.

Focused regressions cover stable identity validation, empty and long paths,
disabled callback guards and current-page semantics. Browser interaction checks
exercise Enter/Space, horizontal containment and localized current semantics at
390px and 1280px in both themes. Physical-device screen-reader qualification and
release gates remain separate from these local checks.

Four RN behavioral tests, two Swift tests, strict RN package/playground type
checks and the actual Apple playground build passed. The four browser
width/theme cases passed keyboard activation, disabled/current guards, host-ID
feedback and horizontal reachability of the current page.
Two Compose identity tests and two actual Android emulator UI tests passed,
including disabled navigation, localized current semantics, long-path scrolling
and invalid-path guards. Instrumentation compilation and library lint passed.
The actual Android playground fragment compile also passed.
