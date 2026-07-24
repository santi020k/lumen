# @santi020k/lumen-astro

## 0.1.0

### Minor Changes

- [`b30a72a`](https://github.com/santi020k/lumen/commit/b30a72aec1742b0ce39214fbf299099011d1a510) - Add `AnimatedNumber` and `RevealGroup`, and extend `ScrollReveal` with shared duration, delay,
  threshold, and repeat controls across Astro, React, Elements, metadata, runtime behavior, and
  standalone styles. Overlay entrances now use the canonical Lumen motion tokens.
  Astro `ButtonLink` controls now share the same subtle CSS hover lift as `Button`, while directional
  arrow motion remains as a navigation cue.

- [`aed151a`](https://github.com/santi020k/lumen/commit/aed151a6ef9f2bf9558dadac328f8f439e73b8c3) - Generalize AnimatedLogo into an accessible wrapper for arbitrary inline SVG logos, with shared reveal and opt-in sequenced animation styles plus reduced-motion support.

- [`26053f4`](https://github.com/santi020k/lumen/commit/26053f437784f4f771a7af8ddee8426c5bfc8cc5) Thanks [@santi020k](https://github.com/santi020k)! - Add competitor-informed product primitives, AI discovery docs, shared behavior helpers, and registry
  installation tooling.

  The shared catalog now includes scheduling, advanced data collection, theme builder, rich text
  editor, and advanced form field surfaces. Astro, React, and Web Components expose matching class and
  data contracts, and the docs app includes examples for each new primitive.

  The core package now includes reusable schedule, data-view, and theme helpers for state
  serialization, persistence, virtual ranges, scheduling conflicts and resize math, server request
  adapters, and contrast-safe theme tuning. The umbrella package exposes a `lumen` CLI that can add
  recipes, merge conflicts deterministically, and load token-authenticated private registries.

- [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654) - Expand rich text editors with value-bearing commands, keyboard shortcuts, active toolbar states,
  HTML and text change events, accessible editable props, and richer toolbar/content styling.

- [`b6f7d70`](https://github.com/santi020k/lumen/commit/b6f7d7091f099e964371fd75844eb645e858e866) Thanks [@santi020k](https://github.com/santi020k)! - Add a Lucide-backed Icon primitive with shared full-catalog icon names across Astro, React, and Web Components. Credit the upstream Lucide and Feather creators and ship their license notices with the core package.

- [`4760e13`](https://github.com/santi020k/lumen/commit/4760e13631d7c5f84540eaf5013c22325481a2b7) - Preserve framework-native image optimization, lazy-load native images by default, and add opt-in
  dark-theme inversion for monochrome artwork.

- [`255e9fd`](https://github.com/santi020k/lumen/commit/255e9fd43b1d367418d3b3112bc973f510143356) - Add sixteen components to close the gap with enterprise UI libraries (Ant Design, MUI, Mantine, Chakra, React Aria): Stepper, FileUpload, Tour, Anchor, Segmented, Toolbar, Descriptions, Popconfirm, Transfer, Cascader, TreeSelect, Mentions, QRCode, Watermark, Affix, and SpeedDial. Each ships as a thin, token-driven wrapper across Astro (reference), React, and Web Components, with shared CSS and progressive-enhancement runtime for the interactive primitives (FileUpload drag-and-drop, Anchor scroll-spy, Tour step navigation, Transfer list movement, Mentions autocomplete, Cascader and TreeSelect value selection). Toolbar reuses the existing roving-focus runtime and Popconfirm/Cascader/TreeSelect reuse the popover disclosure runtime.

- [`ac7dec7`](https://github.com/santi020k/lumen/commit/ac7dec76563830f218511b223bf5e38d7027d387) Thanks [@santi020k](https://github.com/santi020k)! - Polish primitives after a full component audit.

  Fixes: Textarea no longer injects whitespace into its value (placeholder now shows), Button
  `loading` disables the button, Skeleton is `aria-hidden` by default unless labeled, AlertDialog
  sets `role="alertdialog"`, Autocomplete drops the redundant explicit combobox role, AspectRatio
  validates the `ratio` string, and Select is now a thin alias of NativeSelect instead of a
  duplicated implementation.

  New runtime behavior: ContextMenu opens at the pointer via right-click or Shift+F10 when an
  element references it with `data-ui-context-menu-trigger="<menu id>"` (static rendering is
  unchanged without a trigger), and DateRangePicker keeps its start/end date inputs mutually
  consistent.

- [`0b0c038`](https://github.com/santi020k/lumen/commit/0b0c03827675cbe9763a15e1e885a4648ea273e8) - Improve SpeedDial with rendered action icons, polished directional motion, an initial-open option,
  and complete click, dismissal, and keyboard menu behavior.

- [`520ee2d`](https://github.com/santi020k/lumen/commit/520ee2d830354a4e2575fd4d4655879ea98c993d) Thanks [@santi020k](https://github.com/santi020k)! - Expand ThemeBuilder runtime controls for scoped playground previews, manual colors, schemes, and CSS/Figma/token exports.

### Patch Changes

- [`1df25dc`](https://github.com/santi020k/lumen/commit/1df25dce01ef07b91a0e54c76abead493e7a5570) Thanks [@santi020k](https://github.com/santi020k)! - Center the checked checkbox icon and render messages as compact avatar-and-bubble rows with balanced directional surfaces.

- [`1df25dc`](https://github.com/santi020k/lumen/commit/1df25dce01ef07b91a0e54c76abead493e7a5570) Thanks [@santi020k](https://github.com/santi020k)! - Center dialog and alert dialog surfaces when opened.

- [`bf6ea87`](https://github.com/santi020k/lumen/commit/bf6ea8786fdb307bf7b3fc2313e5a2850bfdf579) Thanks [@santi020k](https://github.com/santi020k)! - Add shared Astro prop helpers for class/className merging and glass alias resolution, and standardize Astro overlays on the glass prop while keeping surface="glass" as a deprecated compatibility alias.

- [`0b0c038`](https://github.com/santi020k/lumen/commit/0b0c03827675cbe9763a15e1e885a4648ea273e8) - Complete glass surface support for DatePicker and Select across framework adapters, intensity
  variants, fallback styles, documentation, and examples.

- [`f5c36ab`](https://github.com/santi020k/lumen/commit/f5c36ab1b22daf6f532869c576be97fa22474a43) Thanks [@santi020k](https://github.com/santi020k)! - Improve dark theme readability for docs and primitives.

  Dark glass surfaces now use dark aliases instead of inheriting light glass fills, selected and status controls use higher-contrast foreground pairs, generated dark themes produce more readable muted text, and the ThemeBuilder runtime initializes independently from generic component bindings.

- [`a32b14d`](https://github.com/santi020k/lumen/commit/a32b14ddaac5cd8fcc939ae26008c84479e1ad0f) - Restore the AnimatedPortrait badge surfaces and replace square border-image artifacts with responsive elliptical portrait orbits.

- [`cce1501`](https://github.com/santi020k/lumen/commit/cce1501aa26f1b72d166b331fc4fe5d59ab4cc6d) - Prevent closed top-layer floating panels from intercepting pointer interactions, and keep Cascader columns ordered, resettable, and keyboard navigable.

- [`8b02a95`](https://github.com/santi020k/lumen/commit/8b02a957d301db9b66ca613b7b7dc80e2abce626) Thanks [@santi020k](https://github.com/santi020k)! - Fix Combobox option positioning and make the ScrollArea example visibly scroll.

- [`0fd7938`](https://github.com/santi020k/lumen/commit/0fd793833f470373da6e74a5cd22496953ebe402) - Repeat Watermark labels across protected content at the configured gap and rotation instead of rendering a single centered label.

- [`cd98d3b`](https://github.com/santi020k/lumen/commit/cd98d3bb582be6c2019188bf40604141ebf11ce3) - Render button primitives with native semantics, make `BackToTop` functional with the Astro runtime,
  support named dark themes in the `ThemeToggle` icon state, and restore standalone Particles,
  ScrollReveal, and GradientDivider presentation.

- [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654) - Replace the FileUpload placeholder with a clear upload icon and improve its focus, drag, disabled,
  selected-file, and responsive visual states.

- [`1df25dc`](https://github.com/santi020k/lumen/commit/1df25dce01ef07b91a0e54c76abead493e7a5570) Thanks [@santi020k](https://github.com/santi020k)! - Add glass surface tokens, boolean glass props and attributes, and documentation for supported glass surfaces. Expand glass support across layout, data display, feedback, navigation, and editor-style container primitives with matching Astro, React, and Elements examples.

- [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654) - Replace the browser-native DatePicker surface with Lumen's accessible Calendar popover, including localized display values, keyboard navigation, form-backed values, and matching Astro, React, and Elements behavior.

- [`f1c8e13`](https://github.com/santi020k/lumen/commit/f1c8e13c1f075f6e54bd82bbfe801e4b35a54ee0) Thanks [@santi020k](https://github.com/santi020k)! - Polish checkbox and data table sort indicators with Lucide-aligned icon masks.

- [`bf6ea87`](https://github.com/santi020k/lumen/commit/bf6ea8786fdb307bf7b3fc2313e5a2850bfdf579) Thanks [@santi020k](https://github.com/santi020k)! - Add data-ui-form validation enhancement that reflects native Constraint Validation API state into Field error slots, emits validation lifecycle events, and supports custom constraint copy.

  Expand Toast and Sonner with a runtime create/update/dismiss API, action buttons, placement-aware viewports, duration pause handling, max stack counts, and ARIA live-region defaults.

- [`5ae75c5`](https://github.com/santi020k/lumen/commit/5ae75c5f60b4fb4382bba9c0634bef8c0721fa96) Thanks [@santi020k](https://github.com/santi020k)! - Polish Code block layout so headers avoid control overlap, inline code uses the component palette, framed examples preserve multiline formatting without inheriting global pre borders, and the Astro/React Code components can render a normalized `code` string with lightweight theme-aware token colors.

- [`ae13d36`](https://github.com/santi020k/lumen/commit/ae13d363b21dc677dc9a8c16120ae7a07f269390) - Improve dark-theme segmented-control contrast and make radio-group arrow navigation update the selected value while emitting native input and change events.

- [`ffe0107`](https://github.com/santi020k/lumen/commit/ffe0107d26ae36c4e5434f538fdc056e467f2eb9) - Present DateRangePicker as a cohesive responsive pair of custom Calendar-backed fields, expose range state for styling, and synchronize composed React DatePicker children automatically.

- [`971c892`](https://github.com/santi020k/lumen/commit/971c8927b143e84241a83c5e9068314b01a88fde) - Expose the shared stylesheet through every framework package so consumers only install and import
  from their selected adapter. Keep `@santi020k/lumen/styles.css` available for umbrella-package
  consumers.

- [`24990c5`](https://github.com/santi020k/lumen/commit/24990c52f458b4a157d22e197e520fc6eec72ce8) Thanks [@santi020k](https://github.com/santi020k)! - Include glass surface variables in generated ThemeBuilder tokens, CSS exports, scoped previews, Figma color variables, and design-token JSON.

- Updated dependencies [[`b30a72a`](https://github.com/santi020k/lumen/commit/b30a72aec1742b0ce39214fbf299099011d1a510), [`a32b14d`](https://github.com/santi020k/lumen/commit/a32b14ddaac5cd8fcc939ae26008c84479e1ad0f), [`aed151a`](https://github.com/santi020k/lumen/commit/aed151a6ef9f2bf9558dadac328f8f439e73b8c3), [`26053f4`](https://github.com/santi020k/lumen/commit/26053f437784f4f771a7af8ddee8426c5bfc8cc5), [`bf6ea87`](https://github.com/santi020k/lumen/commit/bf6ea8786fdb307bf7b3fc2313e5a2850bfdf579), [`0b0c038`](https://github.com/santi020k/lumen/commit/0b0c03827675cbe9763a15e1e885a4648ea273e8), [`f5c36ab`](https://github.com/santi020k/lumen/commit/f5c36ab1b22daf6f532869c576be97fa22474a43), [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654), [`d802296`](https://github.com/santi020k/lumen/commit/d80229694b15c0c23e8846ed68780fce5222f2dd), [`a32b14d`](https://github.com/santi020k/lumen/commit/a32b14ddaac5cd8fcc939ae26008c84479e1ad0f), [`0fd7938`](https://github.com/santi020k/lumen/commit/0fd793833f470373da6e74a5cd22496953ebe402), [`7c6ad35`](https://github.com/santi020k/lumen/commit/7c6ad35e4d55c8a080bee93e58e5260a4258653a), [`0fd7938`](https://github.com/santi020k/lumen/commit/0fd793833f470373da6e74a5cd22496953ebe402), [`0b6f99e`](https://github.com/santi020k/lumen/commit/0b6f99edf2c3858683ac2370eead964cc618a965), [`64b69c1`](https://github.com/santi020k/lumen/commit/64b69c1ffee89fa43bee7b446ba045a0ffd5f01e), [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654), [`1df25dc`](https://github.com/santi020k/lumen/commit/1df25dce01ef07b91a0e54c76abead493e7a5570), [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654), [`a32b14d`](https://github.com/santi020k/lumen/commit/a32b14ddaac5cd8fcc939ae26008c84479e1ad0f), [`b6f7d70`](https://github.com/santi020k/lumen/commit/b6f7d7091f099e964371fd75844eb645e858e866), [`4760e13`](https://github.com/santi020k/lumen/commit/4760e13631d7c5f84540eaf5013c22325481a2b7), [`255e9fd`](https://github.com/santi020k/lumen/commit/255e9fd43b1d367418d3b3112bc973f510143356), [`5ae75c5`](https://github.com/santi020k/lumen/commit/5ae75c5f60b4fb4382bba9c0634bef8c0721fa96), [`ae13d36`](https://github.com/santi020k/lumen/commit/ae13d363b21dc677dc9a8c16120ae7a07f269390), [`ffe0107`](https://github.com/santi020k/lumen/commit/ffe0107d26ae36c4e5434f538fdc056e467f2eb9), [`bf6ea87`](https://github.com/santi020k/lumen/commit/bf6ea8786fdb307bf7b3fc2313e5a2850bfdf579), [`0fd7938`](https://github.com/santi020k/lumen/commit/0fd793833f470373da6e74a5cd22496953ebe402), [`0b0c038`](https://github.com/santi020k/lumen/commit/0b0c03827675cbe9763a15e1e885a4648ea273e8), [`160fd16`](https://github.com/santi020k/lumen/commit/160fd16ca51104c3d2b217f333b548f6dbc5f37c), [`ffe0107`](https://github.com/santi020k/lumen/commit/ffe0107d26ae36c4e5434f538fdc056e467f2eb9), [`4760e13`](https://github.com/santi020k/lumen/commit/4760e13631d7c5f84540eaf5013c22325481a2b7), [`e5dcf54`](https://github.com/santi020k/lumen/commit/e5dcf54cb2635406a66ca65cfa53d99423d6235a), [`971c892`](https://github.com/santi020k/lumen/commit/971c8927b143e84241a83c5e9068314b01a88fde), [`4760e13`](https://github.com/santi020k/lumen/commit/4760e13631d7c5f84540eaf5013c22325481a2b7), [`5aab08e`](https://github.com/santi020k/lumen/commit/5aab08e1e765444d16f5e41956dca486128e812f), [`24990c5`](https://github.com/santi020k/lumen/commit/24990c52f458b4a157d22e197e520fc6eec72ce8)]:
  - @santi020k/lumen@0.1.0
  - @santi020k/lumen-core@0.1.0
