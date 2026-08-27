# Native contract review

This record reviews the semantic contract behind the public inventories in the [Native API
audit](native-api-audit.md). It does not require identical syntax or rendering across React Native,
SwiftUI, and Compose. It identifies the behavior that consumers may rely on and the behavior that
must remain native or application-owned.

## Shared decisions

These decisions apply to every supported native component unless a component-specific reference
says otherwise:

- state-changing components are controlled by the application; Lumen reports intent through a
  callback or binding and does not become the source of truth for product state;
- disabled or loading actions do not invoke application callbacks;
- default visual values use the neutral or primary semantic role, medium control or artwork size,
  and a non-error, non-loading, enabled state;
- determinate values are finite and clamped to their declared range; invalid maxima fall back to
  the documented safe range;
- unlabeled decorative artwork stays out of the accessibility tree, while interactive controls and
  meaningful status content require or derive a readable native label;
- platform text, focus, input, menu, dialog, sheet, and accessibility behavior remains native;
- navigation paths, destination content, persistence, validation policy, permissions, network
  work, and product lifecycle remain application-owned; and
- platform-native spelling and types are intentional: lower-case string unions in TypeScript,
  lower-case Swift enum cases, and upper-camel Kotlin enum entries express the same semantic role.

## Cross-adapter disposition

Every shared registry component is covered once below. “Aligned” means the shared behavioral
default and ownership boundary agree; it does not mean the implementations have identical layout,
animation, or host-language signatures.

| Contract family | Registry components | Reviewed disposition |
| --- | --- | --- |
| Foundations and passive primitives | `theme`, `text`, `icon`, `surface`, `divider` | Aligned. Light/dark environment selection, semantic text and surface roles, medium icon sizing, decorative-by-default icons, and decorative separators are shared. Font metrics, color objects, image/vector escape hatches, and environment propagation stay native. |
| Actions | `icon-button`, `button`, `button-group`, `share-button` | Aligned. Primary intent and medium size are the defaults; loading implies disabled action semantics. Groups only arrange independent controls. Share content is application-owned and presentation uses the operating-system share surface. |
| Inputs and selection | `text-field`, `textarea`, `field-group`, `toggle`, `search-field`, `checkbox`, `radio-group`, `segmented-control`, `chip`, `picker`, `slider` | Aligned. Values and validation are controlled by the application. Error, supporting, selected, required, and disabled state is explicit. Native editors, switches, menus, pickers, keyboard configuration, and focus remain adapter concerns. |
| Feedback and loading | `badge`, `spinner`, `alert`, `toast`, `progress`, `skeleton`, `banner`, `status-bar`, `gauge` | Aligned. Default or neutral tone is the baseline, semantic success/warning/danger roles agree, and progress or gauge values are clamped. Applications own toast timing, alert recovery, async work, and status lifecycle. Skeletons are decorative placeholders rather than status announcements. |
| Content and structure | `card`, `graphic`, `backdrop`, `illustration`, `avatar`, `empty-state`, `list-row`, `stat`, `section-header`, `settings-row` | Aligned. Components provide semantic presentation and flexible content slots without taking ownership of navigation or product state. Optional actions retain independent native control semantics. Decorative graphics remain hidden unless labeled. |
| Disclosure and overlays | `disclosure`, `alert-dialog`, `sheet`, `menu` | Aligned. Expanded or presented state is controlled, confirmation/loading/disabled states are explicit, and dismissal is reported to the application. Focus movement, escape/back behavior, anchoring, and platform presentation remain native. |
| Navigation | `navigation-bar` | Aligned. Selection, destinations, badges, and re-selection callbacks are shared; navigation stacks, routes, scroll-to-top behavior, and destination lifecycle remain application-owned. The default accessible name is “Primary navigation.” |
| Wearable primitives | `wearable-action`, `wearable-progress`, `wearable-status`, `wearable-metric`, `wearable-list-row` | Aligned between SwiftUI watchOS and the separate Compose Wear artifact. Values and actions remain controlled, layouts use wearable-safe bounds, and phone applications must not acquire Wear-only dependencies. React Native has no claimed wearable surface. |

## Platform availability disposition

Availability is part of the supported contract, not an implementation detail:

- SwiftUI declarations are supported only on the Apple targets where their underlying native types
  exist. `LumenTextarea` is unavailable on tvOS and watchOS, and system share or menu presentation
  must retain their source availability guards.
- Wearable components are separate from the phone surface: watchOS declarations compile only for
  watchOS, and Compose consumers install `lumen-compose-wear` explicitly.
- Material adaptive navigation, nested-scroll behavior, and floating actions remain Compose-only;
  React Native navigation accessories and refresh behavior remain React-Native-only; macOS shortcut
  and symbol selection remain SwiftUI-only.

The target-specific Swift symbol baseline and the separate Compose/Wear binary dumps enforce these
boundaries. The published `v1.6.0` Swift tag predates the corrected tvOS guards and therefore cannot
satisfy the clean tagged-consumer gate; the correction requires a new immutable patch tag.

The Swift surface-scale expansion is the only reviewed source break from `v1.6.0`: exhaustive
switches must account for the new semantic padding and radius cases. Published Card, StatusBar, and
theme-modifier signatures remain source-compatible, and the release canary rejects any diagnostic
outside the reviewed Lumen 2 contract.

## Remaining freeze evidence

The semantic disposition is accepted as the review baseline. Native contract freeze still requires:

1. migration notes for any further Beta correction;
2. an immutable Swift patch release containing the target-availability correction;
3. two consecutive ordinary-release stability iterations with unchanged Supported baselines; and
4. consumer and physical-device evidence showing that the documented behavior holds in product
   flows.
