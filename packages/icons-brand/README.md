# @santi020k/lumen-icons-brand

Optional brand icons for Lumen UI. The pack keeps company marks separate from Lumen's default
Lucide catalog and renders them through the same `Icon` component in Astro, React, and Web
Components.

## Install

```bash
pnpm add @santi020k/lumen-icons-brand
```

Register the pack once before rendering brand icons:

```ts
import { registerLumenBrandIcons } from '@santi020k/lumen-icons-brand'

registerLumenBrandIcons()
```

Then use namespaced names with the framework adapter already installed by the application:

```astro
---
import { Icon } from '@santi020k/lumen-astro'
---

<Icon name="brand:github" label="GitHub" />
<Icon name="brand:linkedin" decorative />
```

The package includes the complete Font Awesome Free brand catalog: more than 570 marks such as
`apple`, `discord`, `figma`, `github`, `linkedin`, `medium`, `whatsapp`, `x-twitter`, and
`youtube`. `brand:x` is also available as a convenient alias for `brand:x-twitter`.

Brand icons inherit `currentColor`, Lumen sizing, alignment, and the existing accessibility
contract. Their recognizable filled paths are preserved rather than redrawn in Lucide's outline
style. This means brand and interface icons share the same visual system without altering protected
brand geometry.

Use the exported `lumenBrandIconNames` array to build a picker or inspect every available
namespaced name programmatically.

Brand paths come from
[Font Awesome Free](https://github.com/FortAwesome/Font-Awesome), whose icons are licensed under
CC BY 4.0. Read each brand's usage guidelines before publishing brand marks.
