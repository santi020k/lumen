# Project adoption guide

<!-- cspell:words Contrac Coolstead Difftale Fenix Workscene -->

This guide records the component audit of the sibling projects in the `santi020k` workspace and
turns it into an incremental Lumen adoption plan. The audit reflects the workspace on 2026-08-21;
rerun the checks against current source before starting a migration.

## Product boundary

Lumen owns reusable appearance, semantic tokens, accessibility behavior, and primitive interaction
contracts. A product owns its domain language, feature composition, navigation, data flow, and
brand token values.

That boundary keeps products recognizably themselves:

- Replace a locally styled button, card, alert, progress indicator, or field with the public Lumen
  component.
- Keep product components such as `PublishingStudioRecommendationCard`, `ManualFanControlCard`,
  `SiteHeader`, and `AdminPage`; compose them from Lumen primitives instead.
- Map each product palette to Lumen's semantic token roles. Do not copy product colors into Lumen or
  rebuild Lumen's visual rules with utility classes in the consumer.
- Keep platform-native navigation, menus, image handling, focus, and accessibility behavior.

## Workspace inventory

Twenty-three external package surfaces already depend directly on a Lumen web adapter.

| Adoption group | Projects | Current state |
| --- | --- | --- |
| Astro products | ContracTrack, Aaron web, Astro Doctor docs, Commitprompt docs, Coolstead website, Cult web, Dep Beacon docs, Difftale website, ESLint Config Basic docs, Fenix web, Observatory web, PostLens website, RoadScore web, Workscene website, and the root website | Direct `lumen-astro` consumers |
| Theme sites | Chrome, Codex, terminal, VS Code, main, and Zed sites in `santi020k-theme` | Direct `lumen-astro` consumers |
| React UI packages | `@aaronmgz/ui` and `@memudo/ui` | Partial `lumen-react` adoption behind stable product-facing wrappers |
| React Native | RoadScore mobile | Local primitives; Lumen adoption waits on a published native package and React Native 0.86 compatibility evidence |
| SwiftUI | PostLens iOS, Coolstead macOS, and Workscene macOS | Native product components; no `LumenUI` package dependency yet |
| Jetpack Compose | No active sibling consumer found | Keep the adapter contract-tested until a product needs it |

The website package in each native product already uses Lumen. Native adoption can therefore share
the same semantic language without forcing the website and app to use the same rendering model.

## What the local catalogs tell us

The two React UI packages contain roughly fifty familiar primitive wrappers each. Their recurring
names already have Lumen equivalents: accordion, alert dialog, alert, avatar, badge, breadcrumb,
button group, calendar, card, checkbox, command, dialog, drawer, dropdown menu, empty state, field,
input group, pagination, progress, radio group, select, separator, sheet, skeleton, slider, spinner,
switch, table, tabs, textarea, toggle group, and tooltip.

This is primarily an adoption and compatibility problem, not a request to add fifty new visual
components to Lumen.

| Migration shape | Examples | Approach |
| --- | --- | --- |
| Direct wrapper replacement | Alert, Badge, Button, Card, Input, Progress, Separator, Skeleton, Spinner, Textarea | Preserve the product export and delegate rendering and appearance to Lumen |
| Compatibility adapter | Avatar, Field, Select, Tabs | Keep the product API temporarily while adapting it to the closest Lumen contract |
| Controlled behavior migration | Alert Dialog, Dialog, Drawer, Dropdown Menu, Sheet | Migrate feature by feature because trigger, portal, focus, and controlled-state APIs differ |
| Product composition | Admin page, filter select, site header, publishing card, score badge, thermal card | Keep local and replace only the primitives inside it |

The most useful component ideas for Lumen are therefore contract improvements discovered during
migration:

1. Complete native-element ref support across the React primitives used by compatibility wrappers.
2. Document compound-to-Lumen migration recipes for overlays and selection controls.
3. Evaluate a compound Avatar compatibility surface without weakening the simpler Lumen API.
4. Validate `lumen-react-native` against RoadScore's Expo and React Native versions before widening
   the peer range.
5. Decide whether a success button intent is genuinely universal. RoadScore has a positive action
   style, but one product-specific use is not enough evidence to expand every adapter.
6. Add skeleton/loading compositions only after comparing the repeated PostLens loading patterns
   with the needs of another native product.

## Migration waves

### Wave 1: low-risk React wrappers

Use the existing product-facing exports so application imports stay stable. Aaron's Alert,
Progress, and Spinner wrappers have been converted as the first pilot; the UI package and its admin
consumer pass lint and type checking. Button, Badge, Card, Input, Skeleton, and Textarea were already
Lumen-backed.

After releasing the React ref contract update, convert Separator. Then repeat the direct-wrapper
set in `@memudo/ui` as those components become active in product screens. Avoid rewriting unused
generated wrappers merely to increase a migration count.

### Wave 2: compound React components

Start from actual call sites. Keep the current application contract at the package boundary and
replace its implementation in small groups. Test keyboard navigation, focus return, dismissal,
controlled state, and accessible naming for every overlay or selector. Avatar is the first useful
API-design probe because both React packages expose root, image, and fallback parts while Lumen
currently exposes one concise component.

### Wave 3: SwiftUI pilots

Begin with leaf surfaces that already match the shared native catalog:

- PostLens: progress/status surfaces, simple cards, alerts, badges, and loading indicators.
- Coolstead: reusable cards, status badges, and ordinary action buttons; keep thermal-state colors
  semantic and preserve all safety behavior.
- Workscene: organizer cards, count badges, and ordinary buttons; keep window-management behavior
  and AppKit-specific controls local.

Add the root Swift package dependency through Xcode or the project's supported package workflow;
do not hand-edit an Xcode project file. Establish each product's `LumenTheme` mapping before
replacing components so adoption preserves its current brand.

### Wave 4: React Native pilot

RoadScore's local `Screen` remains an application shell. Its Card, Pill, heading, muted text, and
most Button variants map to `LumenCard`, `LumenBadge`, `LumenText`, and `LumenButton`. Do not add the
dependency until the native package is published and a consumer smoke test proves compatibility
with the app's Expo and React Native versions. Resolve the positive/success action deliberately
rather than silently mapping it to another intent.

## Definition of done for one migrated component

- The consumer renders a public Lumen component instead of recreating its visual primitive.
- Product branding is expressed through semantic theme tokens.
- The product-facing API either stays compatible or has an explicit, reviewed migration.
- Accessible names, keyboard/focus behavior, disabled/loading state, and native semantics still
  work.
- The narrow package checks and at least one real consuming application check pass.
- The local wrapper is removed only when no compatibility or product-specific responsibility
  remains.

## Audit commands

Use source searches as evidence, not as an automatic rewrite:

```bash
rg -l '"@santi020k/lumen-(astro|react|elements|react-native)"' \
  ../*/package.json ../*/apps/*/package.json ../*/packages/*/package.json

rg --files ../aaronmgz/packages/ui ../memudo.ai/packages/ui \
  | rg '/components/ui/[^/]+\\.(tsx|ts)$'

rg --files ../postlens ../coolstead ../workspace-organizer -g '*.swift'
```

Always inspect the target repository's working tree and its nearest `AGENTS.md` before changing a
consumer. Never make a sibling repository's presence a Lumen CI requirement; published packages
and self-contained consumer fixtures remain the release gate.
