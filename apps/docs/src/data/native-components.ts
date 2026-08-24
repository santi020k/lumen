export type NativePlatformId = 'android' | 'apple' | 'react-native'

export type NativeComponentCategory =
  | 'Actions' |
  'Data display' |
  'Feedback' |
  'Forms' |
  'Foundations' |
  'Layout' |
  'Navigation' |
  'macOS utilities'

interface NativeApiRow {
  defaultValue: string
  description: string
  name: string
  values: string
}

interface NativeComponentImplementation {
  api: NativeApiRow[]
  example: string
  exportName: string
  language: 'kotlin' | 'swift' | 'tsx'
  platform: NativePlatformId
}

export interface NativeComponentDoc {
  accessibility: string
  category: NativeComponentCategory
  guidance: string
  implementations: Partial<
    Record<NativePlatformId, NativeComponentImplementation>
  >
  name: string
  slug: string
  summary: string
}

type PlatformValue = string | Partial<Record<NativePlatformId, string>>

interface ComponentProperty {
  defaultValue: PlatformValue
  description: string
  name: PlatformValue
  values: PlatformValue
}

interface ComponentDefinition {
  accessibility: string
  category: NativeComponentCategory
  examples: Partial<Record<NativePlatformId, string>>
  exports: Partial<Record<NativePlatformId, string>>
  guidance: string
  name: string
  properties: ComponentProperty[]
  slug: string
  summary: string
}

const platformLanguages: Record<
  NativePlatformId,
  NativeComponentImplementation['language']
> = {
  android: 'kotlin',
  apple: 'swift',
  'react-native': 'tsx'
}

const platformValue = (
  value: PlatformValue,
  platform: NativePlatformId
): string => (typeof value === 'string' ? value : (value[platform] ?? '—'))

const property = (
  name: PlatformValue,
  values: PlatformValue,
  defaultValue: PlatformValue,
  description: string
): ComponentProperty => ({ defaultValue, description, name, values })

const createComponent = (
  definition: ComponentDefinition
): NativeComponentDoc => {
  const implementations: NativeComponentDoc['implementations'] = {}

  for (const platform of ['react-native', 'apple', 'android'] as const) {
    const example = definition.examples[platform]
    const exportName = definition.exports[platform]

    if (!example || !exportName) continue

    implementations[platform] = {
      api: definition.properties.map(item => ({
        defaultValue: platformValue(item.defaultValue, platform),
        description: item.description,
        name: platformValue(item.name, platform),
        values: platformValue(item.values, platform)
      })),
      example,
      exportName,
      language: platformLanguages[platform],
      platform
    }
  }

  return {
    accessibility: definition.accessibility,
    category: definition.category,
    guidance: definition.guidance,
    implementations,
    name: definition.name,
    slug: definition.slug,
    summary: definition.summary
  }
}

const sharedDefinitions: ComponentDefinition[] = [
  {
    accessibility:
      'The active color scheme follows the platform environment unless the application chooses an explicit light or dark mode.',
    category: 'Foundations',
    examples: {
      android: `LumenTheme(darkTheme = false) {
    AppContent()
}`,
      apple: `AppContent()
    .lumenTheme(.light)`,
      'react-native': `<LumenProvider scheme="system">
  <AppContent />
</LumenProvider>`
    },
    exports: {
      android: 'LumenTheme',
      apple: '.lumenTheme',
      'react-native': 'LumenProvider'
    },
    guidance:
      'Mount the theme once near the application root. Read semantic roles from the native theme object instead of copying hexadecimal values into feature code.',
    name: 'Theme',
    properties: [
      property(
        { android: 'darkTheme', apple: 'theme', 'react-native': 'scheme' },
        {
          android: 'Boolean',
          apple: 'LumenTheme',
          'react-native': '"light" | "dark" | "system"'
        },
        {
          android: 'System setting',
          apple: '.light',
          'react-native': '"system"'
        },
        'Selects the active native color scheme.'
      ),
      property(
        { android: 'content', apple: 'content', 'react-native': 'children' },
        {
          android: '@Composable () -> Unit',
          apple: 'View',
          'react-native': 'ReactNode'
        },
        'Required',
        'Provides Lumen theme values to the descendant tree.'
      )
    ],
    slug: 'theme',
    summary:
      'Provide generated semantic colors, spacing, radii, typography, motion, and elevation to native components.'
  },
  {
    accessibility:
      'Text remains native text, supports platform font scaling, and preserves the semantic meaning supplied by its surrounding view.',
    category: 'Foundations',
    examples: {
      android: `LumenText(
    "Welcome back",
    variant = LumenTextVariant.Title,
    tone = LumenTextTone.Default
)`,
      apple: `LumenText(
    "Welcome back",
    variant: .title,
    tone: .default
)`,
      'react-native': `<LumenText variant="title" tone="default">
  Welcome back
</LumenText>`
    },
    exports: {
      android: 'LumenText',
      apple: 'LumenText',
      'react-native': 'LumenText'
    },
    guidance:
      'Use the title and label roles for hierarchy, not as substitutes for application navigation semantics. Prefer the muted and soft tones for supporting copy.',
    name: 'Text',
    properties: [
      property(
        { android: 'text', apple: 'content', 'react-native': 'children' },
        'String / native text content',
        'Required',
        'The text content.'
      ),
      property(
        'variant',
        'body · caption · label · title',
        'body',
        'Selects the shared typography role.'
      ),
      property(
        'tone',
        'default · soft · muted · success · warning · danger',
        'default',
        'Selects a semantic foreground role.'
      ),
      property(
        {
          android: 'modifier',
          apple: 'SwiftUI modifiers',
          'react-native': 'style'
        },
        'Native layout or text styling',
        '—',
        'Adds platform-native layout and presentation overrides.'
      )
    ],
    slug: 'text',
    summary:
      'Render native text with shared typography variants and semantic color tones.'
  },
  {
    accessibility:
      'A surface does not add an accessibility role by itself. Descendant controls and content retain their native semantics.',
    category: 'Layout',
    examples: {
      android: `LumenSurface(
    tone = LumenSurfaceTone.Muted,
    padding = LumenSurfacePadding.Lg
) {
    LumenText("Workspace")
}`,
      apple: `LumenSurface(tone: .muted, padding: .lg) {
    LumenText("Workspace")
}`,
      'react-native': `<LumenSurface tone="muted" padding="lg">
  <LumenText>Workspace</LumenText>
</LumenSurface>`
    },
    exports: {
      android: 'LumenSurface',
      apple: 'LumenSurface',
      'react-native': 'LumenSurface'
    },
    guidance:
      'Use surfaces to express hierarchy through semantic canvas, surface, muted, and strong roles. Do not hardcode a parallel set of background colors.',
    name: 'Surface',
    properties: [
      property(
        'tone',
        'canvas · surface · muted · strong',
        'surface',
        'Selects the semantic background role.'
      ),
      property(
        'padding',
        'none · sm · md · lg',
        'md',
        'Applies generated platform spacing.'
      ),
      property(
        'radius',
        'none · sm · md · lg',
        'md',
        'Applies a generated corner radius.'
      ),
      property(
        { android: 'modifier', apple: 'content', 'react-native': 'style' },
        'Native composition API',
        '—',
        'Composes or lays out the surface with native APIs.'
      )
    ],
    slug: 'surface',
    summary:
      'Compose content on semantic native backgrounds with shared padding and radius roles.'
  },
  {
    accessibility:
      'Standalone icons are decorative when no label or content description is supplied. Meaningful icons require a concise accessible name.',
    category: 'Data display',
    examples: {
      android: `LumenIcon(
    name = LumenIconName.Search,
    contentDescription = "Search",
    size = LumenIconSize.Md
)

LumenIcon(
    name = LumenIconName.BrandGithub,
    contentDescription = "GitHub"
)`,
      apple: `LumenIcon(
    name: .search,
    size: .md,
    label: "Search"
)

LumenIcon(name: .brandGithub, label: "GitHub")`,
      'react-native': `<LumenIcon
  name="search"
  label="Search"
  size="md"
/>

<LumenIcon name="brand:github" label="GitHub" />`
    },
    exports: {
      android: 'LumenIcon',
      apple: 'LumenIcon',
      'react-native': 'LumenIcon'
    },
    guidance:
      'Prefer a generated Lumen name when an interface or brand icon should remain consistent across platforms. Use an SF Symbol, ImageVector, or React Native graphic component when the operating system or product owns the artwork.',
    name: 'Icon',
    properties: [
      property(
        {
          android: 'name or imageVector',
          apple: 'name or systemName',
          'react-native': 'name or icon'
        },
        {
          android: 'LumenIconName or ImageVector',
          apple: 'LumenIconName or SF Symbol name',
          'react-native': 'LumenIconName or LumenIconGraphic'
        },
        'Exactly one required',
        'Selects a generated catalog icon or a platform-specific custom graphic.'
      ),
      property(
        {
          android: 'contentDescription',
          apple: 'label',
          'react-native': 'label'
        },
        'String?',
        'nil',
        'Names a meaningful icon for assistive technology.'
      ),
      property(
        'size',
        'sm · md · lg',
        'md',
        'Uses a 16, 20, or 24 unit icon size.'
      ),
      property(
        { android: 'tint', apple: 'color', 'react-native': 'color' },
        'Native color',
        'ink',
        'Overrides the semantic icon color.'
      )
    ],
    slug: 'icon',
    summary:
      'Display the complete shared interface and brand catalog, with platform-native escape hatches.'
  },
  {
    accessibility:
      'The accessible label is required and becomes the native button name. Touch targets remain at least 44 units on mobile.',
    category: 'Actions',
    examples: {
      android: `LumenIconButton(
    name = LumenIconName.Settings,
    contentDescription = "Settings",
    onClick = ::openSettings
)`,
      apple: `LumenIconButton(
    name: .settings,
    label: "Settings",
    action: openSettings
)`,
      'react-native': `<LumenIconButton
  name="settings"
  label="Settings"
  onPress={openSettings}
/>`
    },
    exports: {
      android: 'LumenIconButton',
      apple: 'LumenIconButton',
      'react-native': 'LumenIconButton'
    },
    guidance:
      'Use for compact, familiar actions. Prefer a text button when the icon alone would make the action difficult to understand.',
    name: 'Icon button',
    properties: [
      property(
        {
          android: 'name or imageVector',
          apple: 'name or systemName',
          'react-native': 'name or icon'
        },
        {
          android: 'LumenIconName or ImageVector',
          apple: 'LumenIconName or SF Symbol name',
          'react-native': 'LumenIconName or LumenIconGraphic'
        },
        'Exactly one required',
        'Selects a generated catalog icon or a platform-specific custom graphic.'
      ),
      property(
        {
          android: 'contentDescription',
          apple: 'label',
          'react-native': 'label'
        },
        'String',
        'Required',
        'Provides the accessible action name.'
      ),
      property(
        { android: 'onClick', apple: 'action', 'react-native': 'onPress' },
        'Callback',
        'Required',
        'Runs the action.'
      ),
      property(
        'intent',
        'primary · secondary · quiet · danger',
        'quiet',
        'Selects the semantic action treatment.'
      ),
      property(
        'size',
        'sm · md · lg',
        'md',
        'Selects shared icon and control metrics.'
      ),
      property(
        {
          android: 'enabled',
          apple: 'SwiftUI .disabled',
          'react-native': 'disabled'
        },
        'Boolean',
        { android: 'true', apple: 'false', 'react-native': 'false' },
        'Controls native disabled state.'
      )
    ],
    slug: 'icon-button',
    summary:
      'Trigger a native action with a required accessible label and platform icon.'
  },
  {
    accessibility:
      'Disabled and loading buttons expose native state and cannot trigger their action. The visible label supplies the accessible name.',
    category: 'Actions',
    examples: {
      android: `LumenButton(
    onClick = ::continueFlow,
    intent = LumenButtonIntent.Primary
) {
    Text("Continue")
}`,
      apple: `LumenButton(
    "Continue",
    intent: .primary,
    action: continueFlow
)`,
      'react-native': `<LumenButton
  intent="primary"
  onPress={continueFlow}
>
  Continue
</LumenButton>`
    },
    exports: {
      android: 'LumenButton',
      apple: 'LumenButton',
      'react-native': 'LumenButton'
    },
    guidance:
      'Use primary sparingly for the main action, secondary for alternatives, quiet for low-emphasis actions, and danger for destructive operations.',
    name: 'Button',
    properties: [
      property(
        { android: 'onClick', apple: 'action', 'react-native': 'onPress' },
        'Callback',
        'Required',
        'Runs the button action.'
      ),
      property(
        'intent',
        'primary · secondary · quiet · danger',
        'primary',
        'Selects semantic emphasis.'
      ),
      property(
        'size',
        'sm · md · lg',
        'md',
        'Selects shared control height and padding.'
      ),
      property(
        'loading',
        'Boolean',
        'false',
        'Shows native progress and prevents activation.'
      ),
      property(
        {
          android: 'enabled',
          apple: 'SwiftUI .disabled',
          'react-native': 'disabled'
        },
        'Boolean',
        { android: 'true', apple: 'false', 'react-native': 'false' },
        'Controls native disabled state.'
      ),
      property(
        { android: 'content', apple: 'label', 'react-native': 'children' },
        'Native content',
        'Required',
        'Provides the visible button label.'
      )
    ],
    slug: 'button',
    summary:
      'Run native actions with shared intent, size, loading, and disabled contracts.'
  },
  {
    accessibility:
      'The field remains a native input with platform focus, keyboard, autofill, and screen-reader behavior. Errors use native invalid-state semantics where available.',
    category: 'Forms',
    examples: {
      android: `LumenTextField(
    value = email,
    onValueChange = { email = it },
    label = "Email address"
)`,
      apple: `LumenTextField(
    "Email address",
    text: $email
)`,
      'react-native': `<LumenTextField
  accessibilityLabel="Email address"
  onChangeText={setEmail}
  value={email}
/>`
    },
    exports: {
      android: 'LumenTextField',
      apple: 'LumenTextField',
      'react-native': 'LumenTextField'
    },
    guidance:
      'Keep a stable label even when placeholder text is present. Pair error styling with useful explanatory text rather than relying on color alone.',
    name: 'Text field',
    properties: [
      property(
        { android: 'value', apple: 'text', 'react-native': 'value' },
        'Bound String',
        'Required',
        'Stores the current native input value.'
      ),
      property(
        {
          android: 'onValueChange',
          apple: 'Binding',
          'react-native': 'onChangeText'
        },
        'Value callback / binding',
        'Required',
        'Updates application state.'
      ),
      property(
        {
          android: 'label',
          apple: 'title',
          'react-native': 'accessibilityLabel'
        },
        'String',
        'Required',
        'Names the field.'
      ),
      property('size', 'sm · md · lg', 'md', 'Selects shared control metrics.'),
      property(
        'error',
        'Boolean',
        'false',
        'Applies the semantic invalid treatment.'
      ),
      property(
        {
          android: 'enabled',
          apple: 'SwiftUI .disabled',
          'react-native': 'editable'
        },
        'Boolean',
        { android: 'true', apple: 'false', 'react-native': 'true' },
        'Controls native editing state.'
      )
    ],
    slug: 'text-field',
    summary:
      'Collect a single line of text using each platform’s native input and focus behavior.'
  },
  {
    accessibility:
      'Badge text remains available to assistive technology. Do not encode status only through tone.',
    category: 'Data display',
    examples: {
      android: `LumenBadge(
    text = "Active",
    tone = LumenBadgeTone.Success
)`,
      apple: 'LumenBadge("Active", tone: .success)',
      'react-native': '<LumenBadge tone="success">Active</LumenBadge>'
    },
    exports: {
      android: 'LumenBadge',
      apple: 'LumenBadge',
      'react-native': 'LumenBadge'
    },
    guidance:
      'Use short status or classification labels. Prefer normal text for sentences, instructions, and frequently changing numeric values.',
    name: 'Badge',
    properties: [
      property(
        { android: 'text', apple: 'content', 'react-native': 'children' },
        'String / native text',
        'Required',
        'Provides the visible badge label.'
      ),
      property(
        'tone',
        'neutral · accent · success · warning · danger',
        'neutral',
        'Selects the semantic status treatment.'
      ),
      property(
        {
          android: 'modifier',
          apple: 'SwiftUI modifiers',
          'react-native': 'style'
        },
        'Native layout API',
        '—',
        'Adds platform-native layout adjustments.'
      )
    ],
    slug: 'badge',
    summary:
      'Display compact native status and classification labels using semantic tones.'
  },
  {
    accessibility:
      'The divider is decorative and is hidden from assistive technology.',
    category: 'Layout',
    examples: {
      android: 'LumenDivider()',
      apple: 'LumenDivider()',
      'react-native': '<LumenDivider />'
    },
    exports: {
      android: 'LumenDivider',
      apple: 'LumenDivider',
      'react-native': 'LumenDivider'
    },
    guidance:
      'Use a divider only when spacing and grouping are insufficient to communicate a boundary. Avoid creating dense grids of lines.',
    name: 'Divider',
    properties: [
      property(
        {
          android: 'modifier',
          apple: 'SwiftUI modifiers',
          'react-native': 'style'
        },
        'Native layout API',
        '—',
        'Controls placement and length.'
      ),
      property(
        'color',
        'Semantic line role',
        'line',
        'Uses the generated divider color.'
      )
    ],
    slug: 'divider',
    summary:
      'Separate related native content with the shared semantic line role.'
  },
  {
    accessibility:
      'The spinner exposes a native progress role and an accessible loading label.',
    category: 'Feedback',
    examples: {
      android: 'LumenSpinner(label = "Loading projects")',
      apple: 'LumenSpinner(label: "Loading projects")',
      'react-native': '<LumenSpinner accessibilityLabel="Loading projects" />'
    },
    exports: {
      android: 'LumenSpinner',
      apple: 'LumenSpinner',
      'react-native': 'LumenSpinner'
    },
    guidance:
      'Use for indeterminate waits. If progress can be measured, prefer Progress and report the current value.',
    name: 'Spinner',
    properties: [
      property(
        {
          android: 'label',
          apple: 'label',
          'react-native': 'accessibilityLabel'
        },
        'String',
        'Loading',
        'Names the operation for assistive technology.'
      ),
      property(
        'color',
        'Native color',
        'brand',
        'Overrides the semantic progress color.'
      ),
      property(
        {
          android: 'modifier',
          apple: 'SwiftUI modifiers',
          'react-native': 'size'
        },
        'Native presentation API',
        '—',
        'Adjusts native size or layout.'
      )
    ],
    slug: 'spinner',
    summary:
      'Communicate an indeterminate native loading state with a semantic brand treatment.'
  },
  {
    accessibility:
      'Supplying an action gives the card native button semantics. Avoid nesting an interactive card inside another control.',
    category: 'Layout',
    examples: {
      android: `LumenCard(variant = LumenCardVariant.Muted) {
    LumenText("Team workspace")
}`,
      apple: `LumenCard(variant: .muted) {
    LumenText("Team workspace")
}`,
      'react-native': `<LumenCard variant="muted">
  <LumenText>Team workspace</LumenText>
</LumenCard>`
    },
    exports: {
      android: 'LumenCard',
      apple: 'LumenCard',
      'react-native': 'LumenCard'
    },
    guidance:
      'Use default and muted cards for grouped content, and restrained semantic variants when the surface conveys a real state. Provide a card-level action only when the entire card performs one action.',
    name: 'Card',
    properties: [
      property(
        'variant',
        'default · muted · accent · success · warning · destructive',
        'default',
        'Selects the native surface treatment.'
      ),
      property(
        { android: 'onClick', apple: 'action', 'react-native': 'onPress' },
        'Optional callback',
        'nil',
        'Makes the whole card interactive.'
      ),
      property(
        { android: 'content', apple: 'content', 'react-native': 'children' },
        'Native content',
        'Required',
        'Composes the card body.'
      ),
      property(
        {
          android: 'modifier',
          apple: 'SwiftUI modifiers',
          'react-native': 'style'
        },
        'Native layout API',
        '—',
        'Controls card placement and sizing.'
      )
    ],
    slug: 'card',
    summary:
      'Group related native content on a bordered semantic surface with optional card-level action.'
  },
  {
    accessibility:
      'An alert is a styled container, not an automatic live announcement. Applications decide when asynchronous content needs a platform announcement.',
    category: 'Feedback',
    examples: {
      android: `LumenAlert(variant = LumenAlertVariant.Success) {
    Text("Profile synced")
}`,
      apple: `LumenAlert(variant: .success) {
    Text("Profile synced")
}`,
      'react-native': `<LumenAlert variant="success">
  <LumenAlertTitle>Profile synced</LumenAlertTitle>
  <LumenAlertDescription>Available offline.</LumenAlertDescription>
</LumenAlert>`
    },
    exports: {
      android: 'LumenAlert',
      apple: 'LumenAlert',
      'react-native': 'LumenAlert'
    },
    guidance:
      'Use default for neutral notices and semantic variants for outcomes or risk. Keep the message actionable and avoid presenting routine information as an alert.',
    name: 'Alert',
    properties: [
      property(
        'variant',
        'default · destructive · success · warning',
        'default',
        'Selects the semantic foreground, border, and tint.'
      ),
      property(
        { android: 'content', apple: 'content', 'react-native': 'children' },
        'Native content',
        'Required',
        'Provides alert content.'
      ),
      property(
        {
          android: 'modifier',
          apple: 'SwiftUI modifiers',
          'react-native': 'style'
        },
        'Native layout API',
        '—',
        'Controls placement and sizing.'
      ),
      property(
        {
          android: 'Text',
          apple: 'Text',
          'react-native': 'LumenAlertTitle / LumenAlertDescription'
        },
        'Platform text composition',
        '—',
        'React Native uses explicit text roles because View does not inherit text color.'
      )
    ],
    slug: 'alert',
    summary:
      'Present inline native feedback using shared neutral, destructive, success, and warning treatments.'
  },
  {
    accessibility:
      'Progress exposes normalized minimum, maximum, and current values. Provide a label when surrounding text does not name the operation.',
    category: 'Feedback',
    examples: {
      android: `LumenProgress(
    value = 72f,
    label = "Profile completion"
)`,
      apple: `LumenProgress(
    value: 72,
    label: "Profile completion"
)`,
      'react-native': `<LumenProgress
  value={72}
  label="Profile completion"
/>`
    },
    exports: {
      android: 'LumenProgress',
      apple: 'LumenProgress',
      'react-native': 'LumenProgress'
    },
    guidance:
      'Use only for determinate progress. Values are clamped into the valid range; invalid maximum values fall back to 100.',
    name: 'Progress',
    properties: [
      property(
        'value',
        { android: 'Float', apple: 'Double', 'react-native': 'number' },
        '0',
        'Provides the current determinate value.'
      ),
      property(
        'max',
        { android: 'Float', apple: 'Double', 'react-native': 'number' },
        '100',
        'Provides the positive maximum value.'
      ),
      property('label', 'String?', 'nil', 'Names the progress operation.'),
      property(
        {
          android: 'modifier',
          apple: 'SwiftUI modifiers',
          'react-native': 'color / style'
        },
        'Native presentation API',
        '—',
        'Adjusts native layout or optional indicator color.'
      )
    ],
    slug: 'progress',
    summary:
      'Show normalized determinate progress with native accessibility semantics.'
  },
  {
    accessibility:
      'The placeholder is decorative by default. A concise label exposes one indeterminate loading state when surrounding content does not already do so.',
    category: 'Feedback',
    examples: {
      android: `LumenSkeleton(
    height = 16.dp,
    label = "Loading profile"
)`,
      apple: `LumenSkeleton(
    height: 16,
    label: "Loading profile"
)`,
      'react-native': `<LumenSkeleton
  height={16}
  label="Loading profile"
/>`
    },
    exports: {
      android: 'LumenSkeleton',
      apple: 'LumenSkeleton',
      'react-native': 'LumenSkeleton'
    },
    guidance:
      'Use several decorative shapes inside one labeled loading region, or label a single skeleton when it is the only loading indicator. Do not announce every placeholder line.',
    name: 'Skeleton',
    properties: [
      property(
        'shape',
        'text · rectangle · circle',
        'text',
        'Selects the placeholder geometry.'
      ),
      property(
        'width',
        { android: 'Dp?', apple: 'CGFloat?', 'react-native': 'DimensionValue' },
        { android: 'Fill width', apple: 'Fill width', 'react-native': '100%' },
        'Controls native width; circles use their height when omitted.'
      ),
      property(
        'height',
        { android: 'Dp', apple: 'CGFloat', 'react-native': 'number' },
        '16',
        'Provides a positive finite height; invalid values normalize to 16.'
      ),
      property(
        'label',
        'String?',
        'nil',
        'Exposes an indeterminate loading state instead of decorative content.'
      )
    ],
    slug: 'skeleton',
    summary:
      'Represent loading text, rectangles, and circles with quiet semantic placeholders.'
  },
  {
    accessibility:
      'The native trigger exposes expanded or collapsed state. Collapsed content leaves the accessibility and focus trees.',
    category: 'Layout',
    examples: {
      android: `LumenDisclosure(
    title = "Implementation notes",
    expanded = expanded,
    onExpandedChange = ::setExpanded
) {
    LumenText("Native details")
}`,
      apple: `LumenDisclosure(
    "Implementation notes",
    isExpanded: $isExpanded
) {
    LumenText("Native details")
}`,
      'react-native': `<LumenDisclosure
  title="Implementation notes"
  expanded={expanded}
  onExpandedChange={setExpanded}
>
  <LumenText>Native details</LumenText>
</LumenDisclosure>`
    },
    exports: {
      android: 'LumenDisclosure',
      apple: 'LumenDisclosure',
      'react-native': 'LumenDisclosure'
    },
    guidance:
      'Use for optional supporting detail within the current screen. Keep navigation and multi-step application structure in platform navigation containers.',
    name: 'Disclosure',
    properties: [
      property('title', 'String', 'Required', 'Names the disclosure trigger.'),
      property(
        {
          android: 'expanded',
          apple: 'isExpanded',
          'react-native': 'expanded'
        },
        {
          android: 'Boolean',
          apple: 'Binding<Bool>',
          'react-native': 'boolean'
        },
        'Required',
        'Stores the controlled expanded state.'
      ),
      property(
        {
          android: 'onExpandedChange',
          apple: 'Binding setter',
          'react-native': 'onExpandedChange'
        },
        '(Boolean) -> Unit',
        'Required',
        'Updates the controlled state.'
      ),
      property(
        'description',
        'String?',
        'nil',
        'Adds concise supporting copy to the trigger.'
      ),
      property(
        { android: 'enabled', apple: 'isEnabled', 'react-native': 'disabled' },
        'Boolean',
        { android: 'true', apple: 'true', 'react-native': 'false' },
        'Controls native disabled state.'
      ),
      property(
        { android: 'content', apple: 'content', 'react-native': 'children' },
        'Native content',
        'Required',
        'Provides content that is mounted only while expanded.'
      )
    ],
    slug: 'disclosure',
    summary:
      'Reveal optional native content through a controlled, accessible disclosure trigger.'
  },
  {
    accessibility:
      'Supply a label when the avatar conveys identity. Omit it when the same name appears adjacent and the image is decorative.',
    category: 'Data display',
    examples: {
      android: `LumenAvatar(
    fallback = "SM",
    size = LumenAvatarSize.Lg,
    label = "Santiago Molina"
)`,
      apple: `LumenAvatar(
    fallback: "SM",
    size: .lg,
    label: "Santiago Molina"
)`,
      'react-native': `<LumenAvatar
  fallback="SM"
  size="lg"
  label="Santiago Molina"
/>`
    },
    exports: {
      android: 'LumenAvatar',
      apple: 'LumenAvatar',
      'react-native': 'LumenAvatar'
    },
    guidance:
      'Keep image sources native to the platform. Use initials or a short fallback when no image is available.',
    name: 'Avatar',
    properties: [
      property(
        { android: 'painter', apple: 'image', 'react-native': 'source' },
        {
          android: 'Painter?',
          apple: 'Image?',
          'react-native': 'ImageSourcePropType?'
        },
        'nil',
        'Provides the platform-native image source.'
      ),
      property(
        'fallback',
        'String',
        '?',
        'Provides fallback text, normally initials.'
      ),
      property(
        'size',
        'sm · md · lg',
        'md',
        'Uses a 32, 40, or 56 unit diameter.'
      ),
      property('label', 'String?', 'nil', 'Names an identity-bearing avatar.')
    ],
    slug: 'avatar',
    summary:
      'Display a native image or fallback identity at shared avatar sizes.'
  },
  {
    accessibility:
      'The native multiline editor keeps platform text-entry behavior, exposes its visible label, and presents supporting or error context without replacing the current value.',
    category: 'Forms',
    examples: {
      android: `LumenTextarea(
    value = notes,
    onValueChange = ::setNotes,
    label = "Release notes",
    description = "Summarize the visible changes."
)`,
      apple: `LumenTextarea(
    "Release notes",
    text: $notes,
    description: "Summarize the visible changes."
)`,
      'react-native': `<LumenTextarea
  label="Release notes"
  value={notes}
  onChangeText={setNotes}
  description="Summarize the visible changes."
/>`
    },
    exports: {
      android: 'LumenTextarea',
      apple: 'LumenTextarea',
      'react-native': 'LumenTextarea'
    },
    guidance:
      'Use for multi-line freeform input. Prefer Text field for short single-line values and keep validation messages concise.',
    name: 'Textarea',
    properties: [
      property(
        'label',
        'String',
        'Required',
        'Provides the visible and accessible label.'
      ),
      property(
        { android: 'value', apple: 'text', 'react-native': 'value' },
        {
          android: 'String',
          apple: 'Binding<String>',
          'react-native': 'string'
        },
        'Required',
        'Stores the controlled text value.'
      ),
      property(
        {
          android: 'onValueChange',
          apple: 'Binding setter',
          'react-native': 'onChangeText'
        },
        '(String) -> Unit',
        'Required',
        'Updates the controlled text value.'
      ),
      property(
        'description',
        'String?',
        'nil',
        'Adds supporting input guidance.'
      ),
      property(
        'errorMessage',
        'String?',
        'nil',
        'Marks and explains an invalid value.'
      )
    ],
    slug: 'textarea',
    summary:
      'Capture multiline native text with shared labeling, supporting copy, and error treatment.'
  },
  {
    accessibility:
      'The label and messages provide context without merging the semantics of contained native controls or their actions.',
    category: 'Forms',
    examples: {
      android: `LumenFieldGroup(
    label = "Notification channels",
    description = "Choose every channel the team should use.",
    required = true
) {
    NotificationControls()
}`,
      apple: `LumenFieldGroup(
    "Notification channels",
    description: "Choose every channel the team should use.",
    required: true
) {
    NotificationControls()
}`,
      'react-native': `<LumenFieldGroup
  label="Notification channels"
  description="Choose every channel the team should use."
  required
>
  <NotificationControls />
</LumenFieldGroup>`
    },
    exports: {
      android: 'LumenFieldGroup',
      apple: 'LumenFieldGroup',
      'react-native': 'LumenFieldGroup'
    },
    guidance:
      'Use when several controls share one label or validation message. Do not use it to duplicate a label already owned by one Text field or Textarea.',
    name: 'Field group',
    properties: [
      property(
        'label',
        'String',
        'Required',
        'Names the grouped field controls.'
      ),
      property(
        'description',
        'String?',
        'nil',
        'Adds shared supporting guidance.'
      ),
      property(
        'errorMessage',
        'String?',
        'nil',
        'Adds a shared validation message.'
      ),
      property(
        'required',
        'Boolean',
        'false',
        'Shows that the grouped answer is required.'
      ),
      property(
        'content',
        'Native content',
        'Required',
        'Provides independently accessible controls.'
      )
    ],
    slug: 'field-group',
    summary:
      'Compose related native controls under one label, description, required state, and validation message.'
  },
  {
    accessibility:
      'A selectable chip reports selected and disabled state. Its optional removal action remains separately named and operable.',
    category: 'Actions',
    examples: {
      android: `LumenChip(
    label = "Design",
    selected = selected,
    onClick = { selected = !selected },
    onRemove = ::removeDesign
)`,
      apple: `LumenChip(
    "Design",
    selected: selected,
    removeLabel: "Remove Design",
    onPress: { selected.toggle() },
    onRemove: removeDesign
)`,
      'react-native': `<LumenChip
  label="Design"
  selected={selected}
  onPress={() => setSelected(!selected)}
  onRemove={removeDesign}
/>`
    },
    exports: {
      android: 'LumenChip',
      apple: 'LumenChip',
      'react-native': 'LumenChip'
    },
    guidance:
      'Use for compact filters, assigned values, or removable tokens. Use Badge for display-only status and Segmented control for mutually exclusive peer choices.',
    name: 'Chip',
    properties: [
      property('label', 'String', 'Required', 'Provides visible chip text.'),
      property('selected', 'Boolean', 'false', 'Exposes selected state.'),
      property(
        { android: 'onClick', apple: 'onPress', 'react-native': 'onPress' },
        'Callback?',
        'nil',
        'Makes the chip selectable or actionable.'
      ),
      property(
        'onRemove',
        'Callback?',
        'nil',
        'Adds a separate removal action.'
      ),
      property(
        'removeLabel',
        'String',
        'Remove label',
        'Names the removal action.'
      )
    ],
    slug: 'chip',
    summary:
      'Represent compact selected, actionable, or removable values with native interaction semantics.'
  },
  {
    accessibility:
      'The group contains each native button without combining action names or changing activation behavior.',
    category: 'Layout',
    examples: {
      android: `LumenButtonGroup {
    LumenButton(onClick = ::save) { Text("Save") }
    LumenButton(onClick = ::cancel, intent = LumenButtonIntent.Secondary) { Text("Cancel") }
}`,
      apple: `LumenButtonGroup {
    LumenButton("Save", action: save)
    LumenButton("Cancel", intent: .secondary, action: cancel)
}`,
      'react-native': `<LumenButtonGroup>
  <LumenButton onPress={save}>Save</LumenButton>
  <LumenButton intent="secondary" onPress={cancel}>Cancel</LumenButton>
</LumenButtonGroup>`
    },
    exports: {
      android: 'LumenButtonGroup',
      apple: 'LumenButtonGroup',
      'react-native': 'LumenButtonGroup'
    },
    guidance:
      'Use for a small set of related actions. Do not use it for single selection; use Segmented control or Radio group instead.',
    name: 'Button group',
    properties: [
      property(
        'orientation',
        'horizontal · vertical',
        'horizontal',
        'Controls action layout.'
      ),
      property(
        'content',
        'Native buttons',
        'Required',
        'Provides independently operable actions.'
      )
    ],
    slug: 'button-group',
    summary:
      'Lay out a small set of related native actions horizontally or vertically.'
  },
  {
    accessibility:
      'The toast announces concise feedback while optional action and dismissal controls keep independent native labels.',
    category: 'Feedback',
    examples: {
      android: `LumenToast(
    title = "Changes saved",
    description = "The workspace is up to date.",
    variant = LumenBannerVariant.Success,
    onDismiss = ::dismissToast
)`,
      apple: `LumenToast(
    "Changes saved",
    description: "The workspace is up to date.",
    variant: .success,
    onDismiss: dismissToast
)`,
      'react-native': `<LumenToast
  title="Changes saved"
  description="The workspace is up to date."
  variant="success"
  onDismiss={dismissToast}
/>`
    },
    exports: {
      android: 'LumenToast',
      apple: 'LumenToast',
      'react-native': 'LumenToast'
    },
    guidance:
      'Use for brief feedback after an operation. Application state owns presentation and timing so navigation and lifecycle behavior remain native.',
    name: 'Toast',
    properties: [
      property('title', 'String', 'Required', 'Provides concise feedback.'),
      property(
        'description',
        'String?',
        'nil',
        'Adds short supporting context.'
      ),
      property(
        'variant',
        'default · destructive · success · warning',
        'default',
        'Selects semantic feedback tone.'
      ),
      property(
        'action',
        'Native action content',
        'nil',
        'Provides one optional recovery action.'
      ),
      property(
        'onDismiss',
        'Callback?',
        'nil',
        'Adds a labeled dismissal action.'
      )
    ],
    slug: 'toast',
    summary:
      'Present app-controlled transient native feedback with semantic tone and optional actions.'
  }
]

const additionalDefinitions: ComponentDefinition[] = [
  {
    accessibility:
      'The visible label and native switch expose standard platform state and activation behavior.',
    category: 'Forms',
    examples: {
      android: `LumenToggle(
    label = "Automatic updates",
    checked = automaticUpdates,
    onCheckedChange = ::setAutomaticUpdates
)`,
      apple: 'LumenToggle("Automatic updates", isOn: $automaticUpdates)',
      'react-native': `<LumenToggle
  label="Automatic updates"
  value={automaticUpdates}
  onValueChange={setAutomaticUpdates}
/>`
    },
    exports: {
      android: 'LumenToggle',
      apple: 'LumenToggle',
      'react-native': 'LumenToggle'
    },
    guidance:
      'Use for an immediately applied Boolean setting. Use a button when an action does not represent persistent on/off state.',
    name: 'Toggle',
    properties: [
      property(
        { android: 'checked', apple: 'isOn', 'react-native': 'value' },
        {
          android: 'Boolean',
          apple: 'Binding<Bool>',
          'react-native': 'boolean'
        },
        'Required',
        'Stores native on/off state.'
      ),
      property(
        'label',
        {
          android: 'String',
          apple: 'LocalizedStringKey or custom View',
          'react-native': 'string'
        },
        'Required',
        'Provides the visible and accessible label.'
      ),
      property(
        {
          android: 'onCheckedChange',
          apple: 'Binding setter',
          'react-native': 'onValueChange'
        },
        '(Boolean) -> Unit',
        'Required',
        'Updates the controlled state.'
      ),
      property(
        {
          android: 'showLabel',
          apple: '.labelsHidden()',
          'react-native': 'showLabel'
        },
        'Boolean',
        'true',
        'Can visually hide a repeated label while preserving its accessible name.'
      ),
      property('enabled', 'Boolean', 'true', 'Controls native disabled state.')
    ],
    slug: 'toggle',
    summary: 'Present a labeled native switch with Lumen brand tint.'
  },
  {
    accessibility:
      'The explanatory copy and trailing control remain contained while the control preserves independent focus and semantics.',
    category: 'Forms',
    examples: {
      android: `LumenSettingsRow(
    title = "Automatic updates",
    description = "Download stable updates automatically.",
    control = {
        LumenToggle(
            label = "Automatic updates",
            checked = automaticUpdates,
            showLabel = false,
            onCheckedChange = ::setAutomaticUpdates
        )
    }
)`,
      apple: `LumenSettingsRow(
    "Automatic updates",
    description: "Download stable updates automatically.",
    systemName: "arrow.triangle.2.circlepath"
) {
    LumenToggle("Automatic updates", isOn: $automaticUpdates)
        .labelsHidden()
}`,
      'react-native': `<LumenSettingsRow
  title="Automatic updates"
  description="Download stable updates automatically."
  control={
    <LumenToggle
      label="Automatic updates"
      value={automaticUpdates}
      showLabel={false}
      onValueChange={setAutomaticUpdates}
    />
  }
/>`
    },
    exports: {
      android: 'LumenSettingsRow',
      apple: 'LumenSettingsRow',
      'react-native': 'LumenSettingsRow'
    },
    guidance:
      'Use to align repeated settings rows. The trailing content should be a compact native control rather than unrelated actions.',
    name: 'Settings row',
    properties: [
      property(
        'title',
        {
          android: 'String',
          apple: 'LocalizedStringKey',
          'react-native': 'string'
        },
        'Required',
        'Names the setting.'
      ),
      property(
        'description',
        {
          android: 'String?',
          apple: 'LocalizedStringKey?',
          'react-native': 'string'
        },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Adds supporting explanation.'
      ),
      property(
        { android: 'graphic', apple: 'systemName', 'react-native': 'graphic' },
        {
          android: '(@Composable () -> Unit)?',
          apple: 'SF Symbol name?',
          'react-native': 'ReactNode'
        },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Adds an optional leading graphic.'
      ),
      property(
        'control',
        {
          android: '@Composable () -> Unit',
          apple: '@ViewBuilder () -> Control',
          'react-native': 'ReactNode'
        },
        'Required',
        'Provides the trailing native control.'
      )
    ],
    slug: 'settings-row',
    summary:
      'Align a setting title and explanation with an optional graphic and trailing native control.'
  },
  {
    accessibility:
      'The picker retains native selection semantics, keyboard behavior, and assistive-technology announcements for its selected value.',
    category: 'Forms',
    examples: {
      android: `LumenPicker(
    label = "Profile",
    value = profile,
    options = profileOptions,
    onValueChange = ::setProfile
)`,
      apple: `LumenPicker("Profile", selection: $profile, style: .segmented) {
    Text("Quiet").tag(Profile.quiet)
    Text("Balanced").tag(Profile.balanced)
}`
    },
    exports: { android: 'LumenPicker', apple: 'LumenPicker' },
    guidance:
      'Use native menu or picker presentation for a compact single choice. Use Segmented control when a small peer set should remain visible.',
    name: 'Picker',
    properties: [
      property(
        { android: 'value', apple: 'selection' },
        { android: 'T', apple: 'Binding<SelectionValue>' },
        'Required',
        'Stores the selected value.'
      ),
      property(
        { android: 'options', apple: 'content' },
        {
          android: 'List<LumenPickerOption<T>>',
          apple: '@ViewBuilder () -> Content'
        },
        'Required',
        'Provides labeled native options.'
      ),
      property(
        { android: 'onValueChange', apple: 'Binding setter' },
        '(T) -> Unit',
        'Required',
        'Updates the selected value.'
      ),
      property(
        { android: 'enabled', apple: 'style' },
        { android: 'Boolean', apple: 'automatic · menu · segmented' },
        { android: 'true', apple: 'automatic' },
        'Controls native availability or presentation.'
      )
    ],
    slug: 'picker',
    summary:
      'Choose one value through native SwiftUI or Material selection presentation.'
  },
  {
    accessibility:
      'The native slider reports its label and current value. A visible formatted value helps people understand the current setting.',
    category: 'Forms',
    examples: {
      android: `LumenSlider(
    label = "Minimum speed",
    value = minimumSpeed,
    onValueChange = ::setMinimumSpeed,
    valueRange = 1_000f..5_000f,
    steps = 39,
    valueLabel = "\${minimumSpeed.toInt()} RPM"
)`,
      apple: `LumenSlider(
    "Minimum speed",
    value: $minimumSpeed,
    in: 1_000...5_000,
    step: 100,
    valueLabel: "\\(Int(minimumSpeed)) RPM"
)`
    },
    exports: { android: 'LumenSlider', apple: 'LumenSlider' },
    guidance:
      'Use for an approximate or continuously adjustable numeric value. Prefer TextField or Picker when exact entry is more important.',
    name: 'Slider',
    properties: [
      property(
        'value',
        { android: 'Float', apple: 'Binding<Double>' },
        'Required',
        'Stores the current numeric value.'
      ),
      property(
        { android: 'valueRange', apple: 'bounds' },
        {
          android: 'ClosedFloatingPointRange<Float>',
          apple: 'ClosedRange<Double>'
        },
        'Required',
        'Defines the valid range.'
      ),
      property(
        { android: 'steps', apple: 'step' },
        { android: 'Int', apple: 'Double?' },
        { android: '0', apple: 'nil' },
        'Adds valid stepped increments when positive and finite.'
      ),
      property(
        'valueLabel',
        'String?',
        'nil',
        'Shows a formatted current value.'
      )
    ],
    slug: 'slider',
    summary:
      'Adjust a continuous or stepped numeric value with a visible formatted label.'
  },
  {
    accessibility:
      'The field uses native text input and provides a labeled clear button whenever text is present.',
    category: 'Forms',
    examples: {
      android: `LumenSearchField(
    value = query,
    onValueChange = ::setQuery,
    prompt = "Search workspaces"
)`,
      apple: 'LumenSearchField("Search workspaces", text: $query)',
      'react-native': `<LumenSearchField
  value={query}
  onChangeText={setQuery}
  prompt="Search workspaces"
/>`
    },
    exports: {
      android: 'LumenSearchField',
      apple: 'LumenSearchField',
      'react-native': 'LumenSearchField'
    },
    guidance:
      'Use for filtering an existing collection. Keep search results and empty states close to the field so focus changes remain understandable.',
    name: 'Search field',
    properties: [
      property(
        'prompt',
        'String',
        'Search',
        'Provides placeholder and field context.'
      ),
      property(
        { android: 'value', apple: 'text', 'react-native': 'value' },
        {
          android: 'String',
          apple: 'Binding<String>',
          'react-native': 'string'
        },
        'Required',
        'Stores the current search query.'
      ),
      property(
        {
          android: 'onValueChange',
          apple: 'Binding setter',
          'react-native': 'onChangeText'
        },
        '(String) -> Unit',
        'Required',
        'Updates the controlled query.'
      ),
      property(
        { android: 'enabled', apple: 'isEnabled', 'react-native': 'editable' },
        'Boolean',
        'true',
        'Controls native disabled presentation.'
      ),
      property(
        'clearLabel',
        'String',
        'Clear search',
        'Names the clear action.'
      )
    ],
    slug: 'search-field',
    summary:
      'Filter native content with a density-aware search field and clear action.'
  },
  {
    accessibility:
      'The full labeled row is a native checkbox target and exposes checked and disabled state without duplicating the visual indicator.',
    category: 'Forms',
    examples: {
      android: `LumenCheckbox(
    label = "Share analytics",
    checked = sharesAnalytics,
    onCheckedChange = ::setSharesAnalytics
)`,
      apple: `LumenCheckbox(
    "Share analytics",
    isChecked: $sharesAnalytics
)`,
      'react-native': `<LumenCheckbox
  label="Share analytics"
  checked={sharesAnalytics}
  onCheckedChange={setSharesAnalytics}
/>`
    },
    exports: {
      android: 'LumenCheckbox',
      apple: 'LumenCheckbox',
      'react-native': 'LumenCheckbox'
    },
    guidance:
      'Use for an independently selectable Boolean choice. Prefer Toggle when changing the value applies immediately as a setting.',
    name: 'Checkbox',
    properties: [
      property(
        'label',
        'String',
        'Required',
        'Provides the visible and accessible label.'
      ),
      property(
        { android: 'checked', apple: 'isChecked', 'react-native': 'checked' },
        {
          android: 'Boolean',
          apple: 'Binding<Bool>',
          'react-native': 'boolean'
        },
        'Required',
        'Stores the controlled checked state.'
      ),
      property(
        {
          android: 'onCheckedChange',
          apple: 'Binding setter',
          'react-native': 'onCheckedChange'
        },
        '(Boolean) -> Unit',
        'Required',
        'Updates the controlled state.'
      ),
      property(
        'description',
        'String?',
        'nil',
        'Adds optional supporting text.'
      ),
      property(
        {
          android: 'enabled',
          apple: '.disabled()',
          'react-native': 'disabled'
        },
        'Boolean',
        { android: 'true', apple: 'false', 'react-native': 'false' },
        'Controls native disabled state.'
      )
    ],
    slug: 'checkbox',
    summary:
      'Capture a controlled Boolean choice with a generous native target and supporting text.'
  },
  {
    accessibility:
      'Options expose native radio semantics inside a named single-selection group, including selected and disabled states.',
    category: 'Forms',
    examples: {
      android: `LumenRadioGroup(
    label = "Density",
    options = densityOptions,
    value = density,
    onValueChange = ::setDensity
)`,
      apple: `LumenRadioGroup(
    "Density",
    selection: $density,
    options: densityOptions
)`,
      'react-native': `<LumenRadioGroup
  label="Density"
  options={densityOptions}
  value={density}
  onValueChange={setDensity}
/>`
    },
    exports: {
      android: 'LumenRadioGroup',
      apple: 'LumenRadioGroup',
      'react-native': 'LumenRadioGroup'
    },
    guidance:
      'Use when every option should remain visible and supporting descriptions help the decision. Use Segmented control for a small compact peer set.',
    name: 'Radio group',
    properties: [
      property(
        'label',
        'String',
        'Required',
        'Names the single-selection group.'
      ),
      property(
        'options',
        {
          android: 'List<LumenSelectionOption>',
          apple: '[LumenSelectionOption<Value>]',
          'react-native': 'readonly LumenSelectionOption[]'
        },
        'Required',
        'Provides labeled values with optional descriptions and disabled state.'
      ),
      property(
        { android: 'value', apple: 'selection', 'react-native': 'value' },
        {
          android: 'String',
          apple: 'Binding<Value>',
          'react-native': 'string'
        },
        'Required',
        'Stores the selected value.'
      ),
      property(
        'onValueChange',
        {
          android: '(String) -> Unit',
          apple: 'Binding setter',
          'react-native': '(string) => void'
        },
        'Required',
        'Updates the selected value.'
      )
    ],
    slug: 'radio-group',
    summary:
      'Choose one value from a visible, labeled group of native radio options.'
  },
  {
    accessibility:
      'Segments expose radio-style single-selection semantics inside a named group while retaining selected and disabled state.',
    category: 'Forms',
    examples: {
      android: `LumenSegmentedControl(
    label = "View",
    options = viewOptions,
    value = view,
    onValueChange = ::setView
)`,
      apple: `LumenSegmentedControl(
    "View",
    selection: $view,
    options: viewOptions
)`,
      'react-native': `<LumenSegmentedControl
  label="View"
  options={viewOptions}
  value={view}
  onValueChange={setView}
/>`
    },
    exports: {
      android: 'LumenSegmentedControl',
      apple: 'LumenSegmentedControl',
      'react-native': 'LumenSegmentedControl'
    },
    guidance:
      'Use for two to four short peer options that fit comfortably on one row. Use Radio group for longer labels, descriptions, or larger sets.',
    name: 'Segmented control',
    properties: [
      property(
        'label',
        'String',
        'Required',
        'Names the single-selection group.'
      ),
      property(
        'options',
        {
          android: 'List<LumenSelectionOption>',
          apple: '[LumenSelectionOption<Value>]',
          'react-native': 'readonly LumenSelectionOption[]'
        },
        'Required',
        'Provides the short labeled segment values.'
      ),
      property(
        { android: 'value', apple: 'selection', 'react-native': 'value' },
        {
          android: 'String',
          apple: 'Binding<Value>',
          'react-native': 'string'
        },
        'Required',
        'Stores the selected value.'
      ),
      property(
        'onValueChange',
        {
          android: '(String) -> Unit',
          apple: 'Binding setter',
          'react-native': '(string) => void'
        },
        'Required',
        'Updates the selected value.'
      ),
      property(
        {
          android: 'showLabel',
          apple: 'showsLabel',
          'react-native': 'showLabel'
        },
        'Boolean',
        'true',
        'Controls visible label presentation while preserving the accessible group name.'
      )
    ],
    slug: 'segmented-control',
    summary: 'Choose one value from a compact row of short peer options.'
  },
  {
    accessibility:
      'The group has a readable navigation label and every destination exposes selected and disabled state through native tab semantics.',
    category: 'Navigation',
    examples: {
      android: `LumenNavigationBar(
    items = destinations,
    selectedValue = destination,
    onValueChange = ::setDestination,
    onReselect = ::scrollDestinationToTop
)`,
      apple: `LumenNavigationBar(
    selection: $destination,
    items: destinations,
    onReselect: scrollDestinationToTop
)`,
      'react-native': `<LumenNavigationBar
  items={destinations}
  value={destination}
  onValueChange={setDestination}
  onReselect={scrollDestinationToTop}
/>`
    },
    exports: {
      android: 'LumenNavigationBar',
      apple: 'LumenNavigationBar',
      'react-native': 'LumenNavigationBar'
    },
    guidance:
      'Use for a small set of peer app destinations. Keep hierarchical navigation, history, deep links, restoration, and screen rendering in the application router or native navigation stack.',
    name: 'Navigation bar',
    properties: [
      property(
        'items',
        {
          android: 'List<LumenNavigationItem<Value>>',
          apple: '[LumenNavigationItem<Selection>]',
          'react-native': 'readonly LumenNavigationItem[]'
        },
        'Required',
        'Provides destination values, short labels, native icons, disabled state, and optional dot, text, or capped count badges.'
      ),
      property(
        {
          android: 'selectedValue',
          apple: 'selection',
          'react-native': 'value'
        },
        {
          android: 'Value',
          apple: 'Binding<Selection>',
          'react-native': 'string'
        },
        'Required',
        'Stores the active destination.'
      ),
      property(
        'onValueChange',
        {
          android: '(Value) -> Unit',
          apple: 'Binding setter',
          'react-native': '(string) => void'
        },
        'Required',
        'Requests a destination change without owning navigation history.'
      ),
      property(
        'onReselect',
        {
          android: '((Value) -> Unit)?',
          apple: '((Selection) -> Void)?',
          'react-native': '((value: string) => void)?'
        },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Handles a second activation of the selected destination, such as scrolling to top or popping its stack.'
      ),
      property(
        {
          android: 'accessibilityLabel',
          apple: 'label',
          'react-native': 'accessibilityLabel'
        },
        'String',
        'Primary navigation',
        'Names the destination group for assistive technology.'
      )
    ],
    slug: 'navigation-bar',
    summary:
      'Select among peer application destinations with native visuals and controlled state.'
  },
  {
    accessibility:
      'The title, description, optional graphic, and recovery actions remain in a readable native order.',
    category: 'Feedback',
    examples: {
      android: `LumenEmptyState(
    title = "No saved workspaces",
    description = "Create a workspace to get started.",
    actions = { LumenButton(onClick = ::createWorkspace) { Text("Create") } }
)`,
      apple: `LumenEmptyState(
    "No saved workspaces",
    systemName: "rectangle.stack",
    description: "Create a workspace to get started."
) {
    LumenButton("Create Workspace", action: createWorkspace)
}`,
      'react-native': `<LumenEmptyState
  title="No saved workspaces"
  description="Create a workspace to get started."
  actions={<LumenButton onPress={createWorkspace}>Create</LumenButton>}
/>`
    },
    exports: {
      android: 'LumenEmptyState',
      apple: 'LumenEmptyState',
      'react-native': 'LumenEmptyState'
    },
    guidance:
      'Explain why the state is empty and offer one useful next action when recovery is possible. Do not use for loading or error states.',
    name: 'Empty state',
    properties: [
      property(
        'title',
        {
          android: 'String',
          apple: 'LocalizedStringKey',
          'react-native': 'string'
        },
        'Required',
        'Names the empty state.'
      ),
      property(
        { android: 'graphic', apple: 'systemName', 'react-native': 'graphic' },
        {
          android: '(@Composable () -> Unit)?',
          apple: 'SF Symbol name',
          'react-native': 'ReactNode'
        },
        { android: 'null', apple: 'Required', 'react-native': 'undefined' },
        'Provides an optional platform-native supporting graphic.'
      ),
      property(
        'description',
        {
          android: 'String?',
          apple: 'LocalizedStringKey?',
          'react-native': 'string'
        },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Explains the state or next step.'
      ),
      property(
        'actions',
        {
          android: '(@Composable () -> Unit)?',
          apple: '@ViewBuilder () -> Actions',
          'react-native': 'ReactNode'
        },
        { android: 'null', apple: 'EmptyView', 'react-native': 'undefined' },
        'Provides optional recovery actions.'
      )
    ],
    slug: 'empty-state',
    summary:
      'Explain missing content with supporting copy, an optional graphic, and a recovery action.'
  },
  {
    accessibility:
      'Leading identity, main content, and trailing actions remain contained while interactive descendants keep their own semantics.',
    category: 'Layout',
    examples: {
      android: `LumenListRow(
    leading = { LumenAvatar(fallback = "SM") },
    trailing = { LumenBadge("Admin") }
) {
    LumenText("Santiago", variant = LumenTextVariant.Label)
}`,
      apple: `LumenListRow {
    LumenAvatar(fallback: "SM")
} content: {
    LumenText("Santiago", variant: .label)
} trailing: {
    LumenBadge("Admin")
}`,
      'react-native': `<LumenListRow
  leading={<LumenAvatar fallback="SM" />}
  trailing={<LumenBadge>Admin</LumenBadge>}
>
  <LumenText variant="label">Santiago</LumenText>
</LumenListRow>`
    },
    exports: {
      android: 'LumenListRow',
      apple: 'LumenListRow',
      'react-native': 'LumenListRow'
    },
    guidance:
      'Use for repeated rows with a stable leading/content/trailing structure. Continue using native collection components for scrolling, selection, and navigation.',
    name: 'List row',
    properties: [
      property(
        'leading',
        {
          android: '(@Composable () -> Unit)?',
          apple: '@ViewBuilder () -> Leading',
          'react-native': 'ReactNode'
        },
        { android: 'null', apple: 'Required', 'react-native': 'undefined' },
        'Provides identity or a leading visual.'
      ),
      property(
        { android: 'content', apple: 'content', 'react-native': 'children' },
        {
          android: '@Composable () -> Unit',
          apple: '@ViewBuilder () -> Content',
          'react-native': 'ReactNode'
        },
        'Required',
        'Provides the primary row content.'
      ),
      property(
        'trailing',
        {
          android: '(@Composable () -> Unit)?',
          apple: '@ViewBuilder () -> Trailing',
          'react-native': 'ReactNode'
        },
        { android: 'null', apple: 'EmptyView', 'react-native': 'undefined' },
        'Provides status or compact actions.'
      )
    ],
    slug: 'list-row',
    summary:
      'Compose a flexible native row with leading identity, content, and trailing actions.'
  },
  {
    accessibility:
      'A banner is inline content, not a live announcement. The application decides whether newly inserted content needs a platform announcement.',
    category: 'Feedback',
    examples: {
      android: `LumenBanner(
    title = "Workspace assigned automatically",
    description = "Moved the app to Documentation.",
    variant = LumenBannerVariant.Accent,
    onDismiss = ::dismissAssignment
)`,
      apple: `LumenBanner(
    "Workspace assigned automatically",
    description: "Moved Safari to Documentation.",
    variant: .accent,
    onDismiss: dismissAssignment
) {
    LumenButton("Undo", intent: .quiet, size: .sm, action: undo)
}`,
      'react-native': `<LumenBanner
  title="Workspace assigned automatically"
  description="Moved the app to Documentation."
  variant="accent"
  onDismiss={dismissAssignment}
/>`
    },
    exports: {
      android: 'LumenBanner',
      apple: 'LumenBanner',
      'react-native': 'LumenBanner'
    },
    guidance:
      'Use for persistent inline notices with optional action and dismissal. Prefer Alert for compact semantic content without banner structure.',
    name: 'Banner',
    properties: [
      property(
        'title',
        {
          android: 'String',
          apple: 'LocalizedStringKey',
          'react-native': 'string'
        },
        'Required',
        'Names the notice.'
      ),
      property(
        'description',
        {
          android: 'String?',
          apple: 'LocalizedStringKey?',
          'react-native': 'string'
        },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Adds supporting detail.'
      ),
      property(
        'variant',
        'default · accent · destructive · success · warning',
        'default',
        'Selects semantic presentation.'
      ),
      property(
        'onDismiss',
        '(() -> Void)?',
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Adds a labeled dismiss action.'
      ),
      property(
        'actions',
        {
          android: '(@Composable () -> Unit)?',
          apple: '@ViewBuilder () -> Actions',
          'react-native': 'ReactNode'
        },
        { android: 'null', apple: 'EmptyView', 'react-native': 'undefined' },
        'Provides optional inline actions.'
      )
    ],
    slug: 'banner',
    summary:
      'Present a structured semantic notice with optional actions and dismissal.'
  },
  {
    accessibility:
      'Metric content is combined into a concise readable unit. The value must remain meaningful without relying on color or icon alone.',
    category: 'Data display',
    examples: {
      android: `LumenStat(
    label = "Open windows",
    value = "12",
    detail = "Across 3 workspaces",
    tone = LumenMetricTone.Accent
)`,
      apple: `LumenStat(
    "Open windows",
    value: "12",
    detail: "Across 3 workspaces",
    systemName: "macwindow",
    tone: .accent
)`,
      'react-native': `<LumenStat
  label="Open windows"
  value="12"
  detail="Across 3 workspaces"
  tone="accent"
/>`
    },
    exports: {
      android: 'LumenStat',
      apple: 'LumenStat',
      'react-native': 'LumenStat'
    },
    guidance:
      'Use for a compact product metric. Avoid decorative dashboard numbers that do not support a decision or task.',
    name: 'Stat',
    properties: [
      property(
        'label',
        {
          android: 'String',
          apple: 'LocalizedStringKey',
          'react-native': 'string'
        },
        'Required',
        'Names the metric.'
      ),
      property(
        'value',
        'String',
        'Required',
        'Provides the formatted metric value.'
      ),
      property(
        'detail',
        {
          android: 'String?',
          apple: 'LocalizedStringKey?',
          'react-native': 'string'
        },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Adds supporting context.'
      ),
      property(
        { android: 'graphic', apple: 'systemName', 'react-native': 'graphic' },
        {
          android: '(@Composable () -> Unit)?',
          apple: 'SF Symbol name?',
          'react-native': 'ReactNode'
        },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Adds an optional semantic graphic.'
      ),
      property(
        'tone',
        'neutral · brand · accent · success · warning · danger',
        'brand',
        'Selects semantic emphasis.'
      )
    ],
    slug: 'stat',
    summary:
      'Display a compact product metric with semantic tone and optional supporting context.'
  },
  {
    accessibility:
      'The visual ring is replaced by one accessible label and formatted value. Invalid values are normalized into the valid range.',
    category: 'Data display',
    examples: {
      android: `LumenGauge(
    label = "Thermal pressure",
    value = 48f,
    valueLabel = "Fair",
    tone = LumenMetricTone.Warning
)`,
      apple: `LumenGauge(
    "Thermal pressure",
    value: 48,
    valueLabel: "Fair",
    systemName: "thermometer.medium",
    tone: .warning
)`
    },
    exports: { android: 'LumenGauge', apple: 'LumenGauge' },
    guidance:
      'Use for a current bounded metric, not task completion. Use Progress when the value represents work moving toward completion.',
    name: 'Gauge',
    properties: [
      property(
        'label',
        { android: 'String', apple: 'LocalizedStringKey' },
        'Required',
        'Names the bounded metric.'
      ),
      property(
        'value',
        { android: 'Float', apple: 'Double' },
        'Required',
        'Provides the current value.'
      ),
      property(
        'max',
        { android: 'Float', apple: 'Double' },
        '100',
        'Provides the positive maximum.'
      ),
      property(
        'valueLabel',
        'String',
        'Required',
        'Provides the visible and accessible formatted value.'
      ),
      property(
        'tone',
        'neutral · brand · accent · success · warning · danger',
        'brand',
        'Selects semantic emphasis.'
      )
    ],
    slug: 'gauge',
    summary:
      'Show a normalized circular SwiftUI or Material metric with a formatted accessible value.'
  },
  {
    accessibility:
      'The section identity, optional count, and actions remain a contained group while actions preserve their own labels.',
    category: 'Layout',
    examples: {
      android: `LumenSectionHeader(
    title = "Workspaces",
    subtitle = "Recently used",
    count = "4"
)`,
      apple: `LumenSectionHeader(
    "Workspaces",
    subtitle: "Recently used",
    count: "4"
) {
    LumenButton("Add", intent: .quiet, size: .sm, action: addWorkspace)
}`,
      'react-native': `<LumenSectionHeader
  title="Workspaces"
  subtitle="Recently used"
  count="4"
/>`
    },
    exports: {
      android: 'LumenSectionHeader',
      apple: 'LumenSectionHeader',
      'react-native': 'LumenSectionHeader'
    },
    guidance:
      'Use above a native section or collection. Keep actions compact and directly related to the section.',
    name: 'Section header',
    properties: [
      property(
        'title',
        {
          android: 'String',
          apple: 'LocalizedStringKey',
          'react-native': 'string'
        },
        'Required',
        'Names the section.'
      ),
      property(
        'subtitle',
        {
          android: 'String?',
          apple: 'LocalizedStringKey?',
          'react-native': 'string'
        },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Adds supporting context.'
      ),
      property(
        'count',
        { android: 'String?', apple: 'String?', 'react-native': 'string' },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Shows an optional count badge.'
      ),
      property(
        'actions',
        {
          android: '(@Composable () -> Unit)?',
          apple: '@ViewBuilder () -> Actions',
          'react-native': 'ReactNode'
        },
        { android: 'null', apple: 'EmptyView', 'react-native': 'undefined' },
        'Provides trailing section actions.'
      )
    ],
    slug: 'section-header',
    summary:
      'Identify a native section with optional supporting copy, count, and trailing actions.'
  },
  {
    accessibility:
      'The visible status dot is decorative; the message carries status meaning in text. Trailing controls retain independent semantics.',
    category: 'Feedback',
    examples: {
      android: `LumenStatusBar(
    message = "All changes saved",
    tone = LumenMetricTone.Success
)`,
      apple: `LumenStatusBar("All changes saved", tone: .success) {
    Text("Just now")
}`,
      'react-native': `<LumenStatusBar
  message="All changes saved"
  tone="success"
  trailing={<LumenText variant="caption">Just now</LumenText>}
/>`
    },
    exports: {
      android: 'LumenStatusBar',
      apple: 'LumenStatusBar',
      'react-native': 'LumenStatusBar'
    },
    guidance:
      'Use for compact persistent application status. Do not replace system status bars or navigation chrome.',
    name: 'Status bar',
    properties: [
      property(
        'message',
        {
          android: 'String',
          apple: 'LocalizedStringKey',
          'react-native': 'string'
        },
        'Required',
        'Provides the textual status.'
      ),
      property(
        'tone',
        'neutral · brand · accent · success · warning · danger',
        'neutral',
        'Selects the semantic dot color.'
      ),
      property(
        'trailing',
        {
          android: '(@Composable () -> Unit)?',
          apple: '@ViewBuilder () -> Trailing',
          'react-native': 'ReactNode'
        },
        { android: 'null', apple: 'EmptyView', 'react-native': 'undefined' },
        'Provides optional trailing content.'
      )
    ],
    slug: 'status-bar',
    summary:
      'Present compact textual application status with optional trailing content.'
  },
  {
    accessibility:
      'Hidden destinations stop receiving pointer input and are removed from the accessibility tree. The application keeps native list and router ownership.',
    category: 'Navigation',
    examples: {
      'react-native': `const navigation = useLumenNavigationBarVisibility()

<FlatList
  data={items}
  onScroll={navigation.onScroll}
  scrollEventThrottle={16}
  renderItem={renderItem}
/>
<LumenCollapsibleNavigationBar
  items={destinations}
  value={destination}
  visible={navigation.visible}
  onValueChange={setDestination}
/>`
    },
    exports: { 'react-native': 'LumenCollapsibleNavigationBar' },
    guidance:
      'Use with the visibility hook when more content space is valuable during deliberate vertical scrolling. Keep safe areas, virtualization, and routing in application code.',
    name: 'Collapsible navigation bar',
    properties: [
      property(
        'visible',
        'boolean',
        'Required',
        'Controls the animated expanded or collapsed state.'
      ),
      property(
        'items',
        'readonly LumenNavigationItem[]',
        'Required',
        'Defines peer destinations.'
      ),
      property(
        'value',
        'string',
        'Required',
        'Identifies the selected destination.'
      ),
      property(
        'onValueChange',
        '(value: string) => void',
        'Required',
        'Requests destination selection.'
      ),
      property(
        'containerStyle',
        'StyleProp<ViewStyle>',
        'undefined',
        'Styles the animated outer container without replacing its collapse dimensions.'
      ),
      property(
        'accessory',
        'ReactNode',
        'undefined',
        'Adds compact application-owned content that collapses with the navigation bar.'
      )
    ],
    slug: 'collapsible-navigation-bar',
    summary:
      'Animate a React Native destination bar in response to native vertical scroll travel.'
  },
  {
    accessibility:
      'The container preserves the semantics of its application-owned status and actions. When supplied to the collapsible bar, it leaves the accessibility tree with navigation.',
    category: 'Navigation',
    examples: {
      'react-native': `<LumenCollapsibleNavigationBar
  accessory={(
    <LumenText variant="label">Uploading 3 files</LumenText>
  )}
  items={destinations}
  value={destination}
  visible={navigation.visible}
  onValueChange={setDestination}
/>`
    },
    exports: { 'react-native': 'LumenNavigationAccessory' },
    guidance:
      'Use for one compact persistent activity such as playback, upload, recording, or an active call. Keep safe-area padding and domain state in the application.',
    name: 'Navigation accessory',
    properties: [
      property(
        'children',
        'ReactNode',
        'Required',
        'Provides compact status or independently accessible actions.'
      ),
      property(
        'style',
        'StyleProp<ViewStyle>',
        'undefined',
        'Extends the fixed compact native container.'
      )
    ],
    slug: 'navigation-accessory',
    summary: 'Place compact application status or actions above React Native bottom navigation.'
  },
  {
    accessibility:
      'The behavior observes but does not consume nested-scroll input. After exit, the Material navigation bar is absent from layout and semantics.',
    category: 'Navigation',
    examples: {
      android: `val navigationScrollState = rememberLumenNavigationBarScrollState()

Scaffold(
    modifier = Modifier.lumenNavigationBarScrollBehavior(navigationScrollState),
    bottomBar = {
        LumenNavigationBar(
            items = destinations,
            selectedValue = destination,
            onValueChange = ::setDestination,
            scrollState = navigationScrollState
        )
    }
) { padding ->
    LazyColumn(contentPadding = padding) { /* application content */ }
}`
    },
    exports: { android: 'LumenNavigationBarScrollState' },
    guidance:
      'Attach the modifier above a vertical lazy or scrollable child and pass the same state to the bottom bar. Keep Scaffold, navigation, and collection state application-owned.',
    name: 'Navigation bar scroll behavior',
    properties: [
      property(
        'initiallyVisible',
        'Boolean',
        'true',
        'Sets the remembered initial visibility.'
      ),
      property(
        'threshold',
        'Dp',
        '16.dp',
        'Sets deliberate travel required before visibility changes.'
      ),
      property(
        'show()',
        'function',
        'Available',
        'Reveals navigation for application-owned events.'
      ),
      property(
        'hide()',
        'function',
        'Available',
        'Hides navigation for application-owned events.'
      )
    ],
    slug: 'navigation-bar-scroll-behavior',
    summary:
      'Coordinate Material bottom navigation visibility through the Compose nested-scroll chain.'
  },
  {
    accessibility:
      'Application-owned content retains its native semantics and exits the layout together with hidden bottom navigation.',
    category: 'Navigation',
    examples: {
      android: `LumenNavigationBarAccessory(scrollState = navigationScrollState) {
    LumenText("Uploading 3 files", variant = LumenTextVariant.Label)
}`
    },
    exports: { android: 'LumenNavigationBarAccessory' },
    guidance:
      'Place directly above LumenNavigationBar for one compact activity such as playback, upload, recording, or an active call. Keep domain state and actions application-owned.',
    name: 'Navigation bar accessory',
    properties: [
      property(
        'scrollState',
        'LumenNavigationBarScrollState?',
        'null',
        'Coordinates entry and exit with scroll-responsive navigation.'
      ),
      property(
        'content',
        '@Composable () -> Unit',
        'Required',
        'Provides compact status or independently accessible actions.'
      )
    ],
    slug: 'navigation-bar-accessory',
    summary: 'Place compact application status or actions above Material bottom navigation.'
  },
  {
    accessibility:
      'Material supplies navigation bar or rail semantics, selected and disabled state, keyboard traversal, and badge placement while destination content remains application-owned.',
    category: 'Navigation',
    examples: {
      android: `LumenAdaptiveNavigationScaffold(
    items = destinations,
    selectedValue = destination,
    onValueChange = ::setDestination,
    onReselect = ::scrollDestinationToTop
) {
    DestinationContent(destination)
}`
    },
    exports: { android: 'LumenAdaptiveNavigationScaffold' },
    guidance:
      'Use as the primary app surface when navigation should change between a bottom bar and rail across phones, tablets, folding devices, split screen, and desktop windows. Keep routing and destination state controlled.',
    name: 'Adaptive navigation scaffold',
    properties: [
      property(
        'items',
        'List<LumenNavigationItem<Value>>',
        'Required',
        'Provides controlled destinations, badges, icons, and disabled state.'
      ),
      property(
        'selectedValue',
        'Value',
        'Required',
        'Identifies the active application-owned destination.'
      ),
      property(
        'onValueChange / onReselect',
        'callbacks',
        'Application-provided',
        'Separates destination changes from repeated activation.'
      ),
      property(
        'content',
        '@Composable () -> Unit',
        'Required',
        'Renders the selected destination without transferring router ownership.'
      )
    ],
    slug: 'adaptive-navigation-scaffold',
    summary: 'Adapt Material primary navigation between bottom bar and rail as the window changes.'
  },
  {
    accessibility:
      'The native refresh gesture remains owned by the scroll container. Supply an accessibility label that describes the refreshed content.',
    category: 'Feedback',
    examples: {
      'react-native': `<ScrollView
  refreshControl={(
    <LumenRefreshControl
      accessibilityLabel="Refresh projects"
      refreshing={refreshing}
      onRefresh={refreshProjects}
    />
  )}
>
  {content}
</ScrollView>`
    },
    exports: { 'react-native': 'LumenRefreshControl' },
    guidance:
      'Attach to a React Native ScrollView or compatible list. Keep refresh state and completion in application code.',
    name: 'Refresh control',
    properties: [
      property(
        'refreshing',
        'boolean',
        'Required',
        'Reports whether the native indicator is active.'
      ),
      property(
        'onRefresh',
        '() => void',
        'Required',
        'Starts the application refresh operation.'
      ),
      property(
        'indicatorTone',
        'brand · accent · neutral',
        'brand',
        'Selects the semantic native indicator color.'
      ),
      property(
        'accessibilityLabel',
        'string',
        'Application-provided',
        'Names the content refreshed by the gesture.'
      )
    ],
    slug: 'refresh-control',
    summary:
      'Apply Lumen semantic colors to React Native pull-to-refresh behavior.'
  },
  {
    accessibility:
      'The native picker retains its label and adjustable behavior. Supporting or validation text remains visible in the same contained group.',
    category: 'Forms',
    examples: {
      apple: `LumenDateField(
    "Release date",
    selection: $releaseDate,
    components: .dateAndTime,
    bounds: .from(.now),
    description: "Choose when this version becomes available."
)`
    },
    exports: { apple: 'LumenDateField' },
    guidance:
      'Use for Apple date or time input that needs Lumen supporting and validation context. Keep calendar and locale behavior native.',
    name: 'Date field',
    properties: [
      property(
        'title',
        'LocalizedStringKey',
        'Required',
        'Labels the native date picker.'
      ),
      property(
        'selection',
        'Binding<Date>',
        'Required',
        'Stores the selected native date value.'
      ),
      property(
        'components',
        'date · dateAndTime · time',
        'date',
        'Chooses the visible date and time parts.'
      ),
      property(
        'bounds',
        'unbounded · closed · from · through',
        'unbounded',
        'Constrains selection using native picker bounds.'
      ),
      property(
        'description / errorMessage',
        'LocalizedStringKey?',
        'nil',
        'Shows supporting text or a semantic danger validation message.'
      )
    ],
    slug: 'date-field',
    summary:
      'Select an Apple-native date or time with bounds and validation context.'
  },
  {
    accessibility:
      'The required content description names the icon-only action while the control preserves native Material button semantics.',
    category: 'Actions',
    examples: {
      android: `LumenFloatingActionButton(
    imageVector = Icons.Default.Add,
    contentDescription = "Create project",
    onClick = ::createProject,
    scrollState = navigationScrollState,
    navigationBehavior = LumenFloatingActionButtonNavigationBehavior.HideWithNavigation
)`
    },
    exports: { android: 'LumenFloatingActionButton' },
    guidance:
      'Use for one prominent Material screen action. Keep navigation bars and scaffold placement in application code.',
    name: 'Floating action button',
    properties: [
      property(
        'imageVector',
        'ImageVector',
        'Required',
        'Renders the native action glyph.'
      ),
      property(
        'contentDescription',
        'String',
        'Required',
        'Names the icon-only action.'
      ),
      property(
        'onClick',
        '() -> Unit',
        'Required',
        'Runs the primary screen action.'
      ),
      property(
        'intent',
        'brand · accent · danger',
        'brand',
        'Selects a semantic action palette.'
      ),
      property(
        'size',
        'regular · small',
        'regular',
        'Selects Material-native FAB geometry.'
      ),
      property(
        'navigationBehavior',
        'alwaysVisible · hideWithNavigation · followNavigation',
        'alwaysVisible',
        'Keeps, hides, or repositions the action as scroll-responsive navigation changes.'
      ),
      property(
        'scrollState',
        'LumenNavigationBarScrollState?',
        'null',
        'Supplies the navigation visibility used by coordinated behavior.'
      )
    ],
    slug: 'floating-action-button',
    summary:
      'Present a prominent Material-native action using Lumen semantic intent.'
  },
  {
    accessibility:
      'SwiftUI preserves the native link role, visible label, keyboard focus, disabled state, and URL-opening behavior.',
    category: 'Actions',
    examples: {
      apple: `LumenLink(
    "Read privacy policy",
    destination: privacyPolicyURL,
    showsExternalIndicator: true
)`
    },
    exports: { apple: 'LumenLink' },
    guidance:
      'Use for external or system URL actions that need Lumen semantic treatment. Keep in-app routing and URL policy in application code.',
    name: 'Link',
    properties: [
      property(
        'label',
        'LocalizedStringKey or custom View',
        'Required',
        'Provides visible link content.'
      ),
      property(
        'destination',
        'URL',
        'Required',
        'Provides the native URL destination.'
      ),
      property(
        'showsExternalIndicator',
        'Bool',
        'false',
        'Adds a decorative external-destination symbol without changing the accessible label.'
      )
    ],
    slug: 'link',
    summary:
      'Open an Apple URL using native SwiftUI behavior and Lumen semantic styling.'
  },
  {
    accessibility:
      'SwiftUI retains native tab focus, safe-area adjustment, animation, and reduced-motion behavior while the application owns selection and navigation state.',
    category: 'Navigation',
    examples: {
      apple: `TabView(selection: $selection) {
    FeedView().tabItem { Label("Feed", systemImage: "rectangle.stack") }
    ProfileView().tabItem { Label("Profile", systemImage: "person") }
}
.lumenTabBarMinimizeBehavior(.onScrollDown)`
    },
    exports: { apple: 'lumenTabBarMinimizeBehavior' },
    guidance:
      'Apply to a native TabView. iOS 26 uses system minimization on iPhone; earlier supported releases retain the normal tab bar without a custom imitation.',
    name: 'Tab bar minimization',
    properties: [
      property(
        'behavior',
        'automatic · never · onScrollDown · onScrollUp',
        'Required',
        'Selects the native minimization policy.'
      ),
      property(
        'availability',
        'iOS 16 or newer',
        'Required',
        'Uses native minimization on iOS 26 and a no-op compatibility fallback before iOS 26.'
      )
    ],
    slug: 'tab-bar-minimization',
    summary:
      'Let an iPhone native tab bar minimize and expand in response to scrolling.'
  },
  {
    accessibility:
      'Expanded and compact content preserve their own readable labels, controls, and traversal order while SwiftUI owns placement changes.',
    category: 'Navigation',
    examples: {
      apple: `TabView {
    FeedView().tabItem { Label("Feed", systemImage: "rectangle.stack") }
}
.lumenTabViewBottomAccessory {
    LumenTabAccessory {
        ExpandedUploadStatus()
    } compact: {
        CompactUploadStatus()
    }
}`
    },
    exports: { apple: 'LumenTabAccessory' },
    guidance:
      'Use for a mini player, call, upload, recording, or persistent status. Keep accessory domain state and actions application-owned.',
    name: 'Tab accessory',
    properties: [
      property(
        'expanded',
        '@ViewBuilder () -> View',
        'Required',
        'Provides content displayed above a regular-size tab bar.'
      ),
      property(
        'compact',
        '@ViewBuilder () -> View',
        'Required',
        'Provides reduced content displayed inline with a minimized tab bar.'
      ),
      property(
        'isEnabled',
        'Bool',
        'true',
        'Controls whether the surrounding tab accessory modifier presents content.'
      )
    ],
    slug: 'tab-accessory',
    summary:
      'Adapt application-owned accessory content to expanded and inline tab-bar placement.'
  },
  {
    accessibility:
      'Recording, current shortcut, validation error, cancel, change, and clear states all have visible native labels.',
    category: 'macOS utilities',
    examples: {
      apple: `LumenShortcutRecorder(
    "Quick switch",
    shortcut: $shortcut
) { candidate in
    reserved.contains(candidate) ? "Already in use." : nil
}`
    },
    exports: { apple: 'LumenShortcutRecorder' },
    guidance:
      'Use only on macOS. Applications own conflict validation and command registration; Lumen handles capture and presentation.',
    name: 'Shortcut recorder',
    properties: [
      property(
        'label',
        'LocalizedStringKey',
        'Required',
        'Names the command being configured.'
      ),
      property(
        'shortcut',
        'Binding<LumenShortcut?>',
        'Required',
        'Stores the current keyboard shortcut.'
      ),
      property(
        'validation',
        '((LumenShortcut) -> String?)?',
        'nil',
        'Returns an application conflict message or nil.'
      ),
      property(
        'platform',
        'macOS',
        'Required',
        'Uses NSEvent keyboard capture and macOS modifier glyphs.'
      )
    ],
    slug: 'shortcut-recorder',
    summary:
      'Capture, validate, change, and clear native macOS keyboard shortcuts.'
  },
  {
    accessibility:
      'Every symbol option has a readable label and selected state. Search and empty states use native controls and focus behavior.',
    category: 'macOS utilities',
    examples: {
      apple: `LumenSymbolPickerButton(
    "Workspace symbol",
    selectedName: $symbolName
)`
    },
    exports: { apple: 'LumenSymbolPicker / LumenSymbolPickerButton' },
    guidance:
      'Use only on macOS. Supply product-specific symbol options when the built-in common set is broader than the task requires.',
    name: 'Symbol picker',
    properties: [
      property(
        'title / label',
        'LocalizedStringKey',
        'Choose a symbol',
        'Names the picker or popover trigger.'
      ),
      property(
        'selectedName',
        'Binding<String>',
        'Required',
        'Stores the selected SF Symbol name.'
      ),
      property(
        'options',
        '[LumenSymbolOption]',
        '.common',
        'Provides labeled, categorized symbol choices.'
      ),
      property(
        'presentation',
        'Inline picker / popover button',
        'Inline',
        'Selects the full picker or compact popover trigger.'
      )
    ],
    slug: 'symbol-picker',
    summary:
      'Search and choose from labeled, categorized SF Symbols in a native macOS picker.'
  },
  {
    accessibility:
      'Decorative graphics stay hidden from assistive technology; an optional label exposes the complete composition as one image.',
    category: 'Data display',
    examples: {
      android: `LumenGraphic(
    variant = LumenGraphicVariant.Orbit,
    label = "Project overview"
) {
    ProjectArtwork()
}`,
      apple: `LumenGraphic(
    variant: .orbit,
    label: "Project overview"
) {
    ProjectArtwork()
}`,
      'react-native': `<LumenGraphic variant="orbit" label="Project overview">
  <ProjectArtwork />
</LumenGraphic>`
    },
    exports: {
      android: 'LumenGraphic',
      apple: 'LumenGraphic',
      'react-native': 'LumenGraphic'
    },
    guidance:
      'Use to frame meaningful application artwork with a restrained token-aware preset. Leave the label absent when the surrounding content already communicates the same meaning.',
    name: 'Graphic',
    properties: [
      property(
        'variant',
        'glow · grid · orbit',
        'orbit',
        'Selects the decorative composition.'
      ),
      property(
        'size',
        'sm · md · lg',
        'md',
        'Selects a shared native dimension.'
      ),
      property(
        'tone',
        'brand · accent · neutral',
        'brand',
        'Selects the semantic decoration color.'
      ),
      property(
        'label',
        {
          android: 'String?',
          apple: 'LocalizedStringKey?',
          'react-native': 'string'
        },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Optionally exposes the composition as one labeled image.'
      )
    ],
    slug: 'graphic',
    summary:
      'Frame application-provided artwork with token-aware glow, grid, or orbit decoration.'
  },
  {
    accessibility:
      'The ambient layer has no accessibility semantics; child content keeps its native reading order, names, and controls.',
    category: 'Data display',
    examples: {
      android: `LumenBackdrop(
    intensity = LumenBackdropIntensity.Medium,
    variant = LumenBackdropVariant.Aurora
) {
    ProjectOverview()
}`,
      apple: `LumenBackdrop(
    intensity: .medium,
    variant: .aurora
) {
    ProjectOverview()
}`,
      'react-native': `<LumenBackdrop intensity="medium" variant="aurora">
  <ProjectOverview />
</LumenBackdrop>`
    },
    exports: {
      android: 'LumenBackdrop',
      apple: 'LumenBackdrop',
      'react-native': 'LumenBackdrop'
    },
    guidance:
      'Use behind meaningful hero, empty-state, or highlighted content. Keep child surfaces and text on semantic tokens so contrast does not depend on the decoration.',
    name: 'Backdrop',
    properties: [
      property(
        'variant',
        'aurora · dots · grid · rays',
        'aurora',
        'Selects the ambient pattern.'
      ),
      property(
        'tone',
        'brand · accent · neutral',
        'brand',
        'Selects the semantic decoration color.'
      ),
      property(
        'intensity',
        'subtle · medium · strong',
        'medium',
        'Controls only the decoration opacity.'
      ),
      property(
        'content',
        'Native view content',
        'Required',
        'Renders meaningful content above the decorative layer.'
      )
    ],
    slug: 'backdrop',
    summary:
      'Place a token-aware ambient pattern behind native application content.'
  },
  {
    accessibility:
      'Illustrations are decorative by default; an optional label exposes the complete scene as one image.',
    category: 'Feedback',
    examples: {
      android: `LumenIllustration(
    variant = LumenIllustrationVariant.Success,
    label = "Saved successfully"
)`,
      apple: `LumenIllustration(
    variant: .success,
    label: "Saved successfully"
)`,
      'react-native': `<LumenIllustration
  label="Saved successfully"
  variant="success"
/>`
    },
    exports: {
      android: 'LumenIllustration',
      apple: 'LumenIllustration',
      'react-native': 'LumenIllustration'
    },
    guidance:
      'Use the built-in scene when its state matches the product message. Keep it decorative when the adjacent heading and description already communicate the same status.',
    name: 'Illustration',
    properties: [
      property(
        'variant',
        'empty · success · error · offline',
        'empty',
        'Selects the semantic scene.'
      ),
      property(
        'tone',
        'auto · brand · accent · neutral',
        'auto',
        'Uses the state color automatically or an explicit portable tone.'
      ),
      property(
        'size',
        'sm · md · lg',
        'md',
        'Selects the shared 96, 128, or 176 unit dimension.'
      ),
      property(
        { android: 'label', apple: 'label', 'react-native': 'label' },
        { android: 'String?', apple: 'String?', 'react-native': 'string' },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Optionally exposes the illustration as one labeled image.'
      )
    ],
    slug: 'illustration',
    summary:
      'Render a built-in empty, success, error, or offline semantic scene.'
  },
  {
    accessibility:
      'Native modal focus stays inside the confirmation surface and cancel and confirm remain independently named actions.',
    category: 'Feedback',
    examples: {
      android: `LumenAlertDialog(
    visible = showConfirmation,
    title = "Delete report?",
    confirmLabel = "Delete",
    destructive = true,
    onConfirm = ::deleteReport,
    onDismiss = { showConfirmation = false }
)`,
      apple: `content.lumenAlertDialog(
    isPresented: $showConfirmation,
    title: "Delete report?",
    confirmLabel: "Delete",
    confirmRole: .destructive,
    onConfirm: deleteReport
)`,
      'react-native': `<LumenAlertDialog
  visible={showConfirmation}
  title="Delete report?"
  confirmLabel="Delete"
  destructive
  onConfirm={deleteReport}
  onDismiss={() => setShowConfirmation(false)}
/>`
    },
    exports: {
      android: 'LumenAlertDialog',
      apple: 'lumenAlertDialog',
      'react-native': 'LumenAlertDialog'
    },
    guidance:
      'Use for short consequential confirmations. Keep visibility and mutation state in the application and reserve destructive styling for irreversible or difficult-to-recover actions.',
    name: 'Alert dialog',
    properties: [
      property(
        { android: 'visible', apple: 'isPresented', 'react-native': 'visible' },
        {
          android: 'Boolean',
          apple: 'Binding<Bool>',
          'react-native': 'boolean'
        },
        'Required',
        'Controls native modal presentation.'
      ),
      property(
        'title / description',
        'Native localized text',
        'Description optional',
        'Explains the decision.'
      ),
      property(
        'confirmLabel / cancelLabel',
        'Native localized text',
        'Cancel label: Cancel',
        'Names both actions.'
      ),
      property(
        {
          android: 'destructive',
          apple: 'confirmRole',
          'react-native': 'destructive'
        },
        { android: 'Boolean', apple: 'ButtonRole?', 'react-native': 'boolean' },
        { android: 'false', apple: 'nil', 'react-native': 'false' },
        'Communicates whether the confirm action is destructive.'
      ),
      property(
        {
          android: 'confirmEnabled',
          apple: 'confirmDisabled',
          'react-native': 'confirmDisabled'
        },
        { android: 'Boolean', apple: 'Bool', 'react-native': 'boolean' },
        { android: 'true', apple: 'false', 'react-native': 'false' },
        'Controls whether the confirm action can be activated.'
      ),
      property(
        'confirmLoading',
        { android: 'Boolean', apple: 'Bool', 'react-native': 'boolean' },
        'false',
        'Communicates asynchronous confirmation progress.'
      )
    ],
    slug: 'alert-dialog',
    summary:
      'Request a controlled native confirmation with explicit cancel and confirm states.'
  },
  {
    accessibility:
      'The native modal presentation contains focus while preserving the semantics and reading order of application-owned content.',
    category: 'Layout',
    examples: {
      android: `LumenSheet(
    visible = showEditor,
    onDismiss = { showEditor = false },
    title = "Edit report"
) {
    ReportEditor()
}`,
      apple: `content.lumenSheet(
    isPresented: $showEditor,
    title: "Edit report"
) {
    ReportEditor()
}`,
      'react-native': `<LumenSheet
  visible={showEditor}
  title="Edit report"
  onDismiss={() => setShowEditor(false)}
>
  <ReportEditor />
</LumenSheet>`
    },
    exports: {
      android: 'LumenSheet',
      apple: 'lumenSheet',
      'react-native': 'LumenSheet'
    },
    guidance:
      'Use for supplemental editing or detail that should not replace the current screen. Keep form state and dismissal decisions application-owned.',
    name: 'Sheet',
    properties: [
      property(
        { android: 'visible', apple: 'isPresented', 'react-native': 'visible' },
        {
          android: 'Boolean',
          apple: 'Binding<Bool>',
          'react-native': 'boolean'
        },
        'Required',
        'Controls native sheet presentation.'
      ),
      property(
        'title / description',
        'Native localized text',
        'nil / undefined',
        'Provides optional heading context.'
      ),
      property(
        'onDismiss',
        '() -> Void',
        'Required',
        'Returns presentation ownership to the application.'
      ),
      property(
        'content / actions',
        'Native view slots',
        'Actions optional',
        'Composes application-owned content and actions.'
      )
    ],
    slug: 'sheet',
    summary:
      'Present supplemental application content in a controlled native sheet.'
  },
  {
    accessibility:
      'The trigger exposes expanded state and each native menu action reports its label, disabled state, and destructive role.',
    category: 'Actions',
    examples: {
      android: `LumenMenu(
    expanded = showMenu,
    onDismissRequest = { showMenu = false },
    items = actions
)`,
      apple: `LumenMenu(items: actions) {
    Label("More", systemImage: "ellipsis")
}`,
      'react-native': `<LumenMenu
  accessibilityLabel="More actions"
  trigger={<MoreIcon />}
  items={actions}
/>`
    },
    exports: {
      android: 'LumenMenu',
      apple: 'LumenMenu',
      'react-native': 'LumenMenu'
    },
    guidance:
      'Use for a short set of contextual actions. Keep labels unique and concise, and do not hide a screen\'s only primary action inside a menu.',
    name: 'Menu',
    properties: [
      property(
        'items',
        'Native Lumen menu item collection',
        'Required',
        'Provides labeled actions and states.'
      ),
      property(
        {
          android: 'expanded',
          apple: 'Native Menu state',
          'react-native': 'Internal trigger state'
        },
        { android: 'Boolean', apple: 'Native', 'react-native': 'Native Modal' },
        'Collapsed',
        'Controls or reports native menu presentation.'
      ),
      property(
        'disabled',
        'Boolean',
        'false',
        'Keeps an unavailable item readable but inactive.'
      ),
      property(
        'destructive / role',
        'Destructive action role',
        'false / nil',
        'Marks a destructive action semantically and visually.'
      )
    ],
    slug: 'menu',
    summary:
      'Present a native anchored action menu with shared item-state semantics.'
  },
  {
    accessibility:
      'The trigger remains a native labeled button and destination selection is delegated to the operating system share surface.',
    category: 'Actions',
    examples: {
      android: `LumenShareButton(
    payload = LumenSharePayload(text = reportText),
    chooserTitle = "Share report"
)`,
      apple: 'LumenShareButton("Share report", item: reportText)',
      'react-native': `<LumenShareButton
  label="Share report"
  content={{ message: reportText }}
/>`
    },
    exports: {
      android: 'LumenShareButton',
      apple: 'LumenShareButton',
      'react-native': 'LumenShareButton'
    },
    guidance:
      'Use to share application-owned text, URLs, or files through the operating system. Keep content generation, file permissions, completion feedback, and error handling in the application.',
    name: 'Share button',
    properties: [
      property(
        { android: 'payload', apple: 'item', 'react-native': 'content' },
        {
          android: 'LumenSharePayload',
          apple: 'Transferable',
          'react-native': 'ShareContent'
        },
        'Required',
        'Supplies application-owned share content.'
      ),
      property(
        {
          android: 'chooserTitle',
          apple: 'Native share title',
          'react-native': 'options'
        },
        {
          android: 'String',
          apple: 'System-provided',
          'react-native': 'ShareOptions'
        },
        {
          android: 'Required',
          apple: 'System-provided',
          'react-native': 'undefined'
        },
        'Configures the native share presentation.'
      ),
      property(
        'label',
        'Native localized text',
        'Share',
        'Names the trigger action.'
      ),
      property(
        {
          android: 'onFailure',
          apple: 'Native ShareLink result',
          'react-native': 'onError / onShared'
        },
        'Platform callback',
        'No-op',
        'Lets the application report sharing outcomes where the platform exposes them.'
      )
    ],
    slug: 'share-button',
    summary:
      'Open the operating system share surface from a token-aware native action.'
  },
  {
    accessibility:
      'Requires one concise action label, preserves native button semantics, and exposes disabled state without duplicating visible content.',
    category: 'Actions',
    examples: {
      android: `LumenWearActionButton(
    accessibilityLabel = "Start contraction",
    onClick = ::startContraction
) { TimerLabel() }`,
      apple: `LumenWatchActionButton("Start contraction", action: startContraction) {
    TimerLabel()
}`
    },
    exports: {
      android: 'LumenWearActionButton',
      apple: 'LumenWatchActionButton'
    },
    guidance:
      'Use for one essential wrist action. Keep haptics, health or safety policy, synchronization, and command handling in the application.',
    name: 'Wearable action',
    properties: [
      property(
        'accessibilityLabel',
        'Native localized text',
        'Required',
        'Names the essential action.'
      ),
      property(
        { android: 'onClick', apple: 'action' },
        '() -> Unit',
        'Required',
        'Runs application-owned behavior.'
      ),
      property(
        'tone',
        'brand · accent · success · warning · danger · neutral',
        'brand',
        'Applies semantic intent.'
      ),
      property(
        'dimension',
        'Native display units',
        '120',
        'Clamps the round target to wearable-safe bounds.'
      ),
      property(
        'enabled',
        'Boolean',
        'true',
        'Controls action and disabled presentation.'
      )
    ],
    slug: 'wearable-action',
    summary:
      'Present one at-a-glance, round primary action on watchOS or Wear OS.'
  },
  {
    accessibility:
      'Exposes a normalized progress range while application-owned inner content retains its own readable semantics.',
    category: 'Data display',
    examples: {
      android: `LumenWearProgressRing(value = elapsed, maximum = threshold) {
    TimerLabel()
}`,
      apple: `LumenWatchProgressRing(value: elapsed, maximum: threshold) {
    TimerLabel()
}`
    },
    exports: {
      android: 'LumenWearProgressRing',
      apple: 'LumenWatchProgressRing'
    },
    guidance:
      'Use for short at-a-glance progress. Keep long-running background work, Always On policy, and timeline updates application-owned.',
    name: 'Wearable progress',
    properties: [
      property(
        'value',
        'Finite numeric value',
        'Required',
        'Provides current progress.'
      ),
      property(
        'maximum',
        'Positive numeric value',
        '1',
        'Defines the upper bound.'
      ),
      property(
        'tone',
        'brand · accent · success · warning · danger · neutral',
        'brand',
        'Applies semantic progress color.'
      ),
      property(
        'lineWidth',
        'Native display units',
        '4',
        'Controls the clamped ring stroke.'
      ),
      property(
        'content',
        'Native view slot',
        'Required',
        'Provides application-owned center content.'
      )
    ],
    slug: 'wearable-progress',
    summary:
      'Surround wearable content with clamped semantic circular progress.'
  },
  {
    accessibility:
      'Keeps status meaning in concise text instead of relying on semantic color alone.',
    category: 'Feedback',
    examples: {
      android:
        'LumenWearStatus(text = "Phone unavailable", tone = LumenWearTone.Warning)',
      apple:
        'LumenWatchStatus("5-1-1", systemName: "cross.case.fill", tone: .danger)'
    },
    exports: { android: 'LumenWearStatus', apple: 'LumenWatchStatus' },
    guidance:
      'Use for a short, high-value wrist status. Do not use a badge as the only representation of an urgent notification.',
    name: 'Wearable status',
    properties: [
      property(
        { android: 'text', apple: 'title' },
        'Native localized text',
        'Required',
        'Provides concise status meaning.'
      ),
      property(
        'tone',
        'brand · accent · success · warning · danger · neutral',
        'neutral',
        'Applies semantic emphasis.'
      ),
      property(
        { android: 'leading', apple: 'systemName' },
        'Optional native visual',
        'nil',
        'Adds a supporting wearable glyph.'
      )
    ],
    slug: 'wearable-status',
    summary: 'Show a compact, text-first semantic status on the wrist.'
  },
  {
    accessibility:
      'Combines label, value, and optional detail into one concise readable metric.',
    category: 'Data display',
    examples: {
      android:
        'LumenWearMetric(label = "Duration", value = elapsed, tone = LumenWearTone.Brand)',
      apple: 'LumenWatchMetric("Duration", value: elapsed, tone: .brand)'
    },
    exports: { android: 'LumenWearMetric', apple: 'LumenWatchMetric' },
    guidance:
      'Use for one high-priority value with a short label. Avoid dashboard grids that overload small round screens.',
    name: 'Wearable metric',
    properties: [
      property(
        'label',
        'Native localized text',
        'Required',
        'Names the metric.'
      ),
      property('value', 'String', 'Required', 'Provides the formatted value.'),
      property(
        'detail',
        'Optional native localized text',
        'nil',
        'Adds brief supporting context.'
      ),
      property(
        'tone',
        'brand · accent · success · warning · danger · neutral',
        'neutral',
        'Applies semantic value color.'
      )
    ],
    slug: 'wearable-metric',
    summary:
      'Present one at-a-glance wearable label, value, and optional detail.'
  },
  {
    accessibility:
      'Preserves child actions and content in native traversal order without collapsing distinct controls.',
    category: 'Layout',
    examples: {
      android: 'LumenWearListRow { TimerHistoryLabel() }',
      apple: 'LumenWatchListRow { TimerHistoryLabel() }'
    },
    exports: { android: 'LumenWearListRow', apple: 'LumenWatchListRow' },
    guidance:
      'Use inside native wearable scrolling containers. Keep list state, selection, navigation, and rotary input in the application.',
    name: 'Wearable list row',
    properties: [
      property(
        'leading',
        'Optional native view slot',
        'nil / EmptyView',
        'Provides compact identity.'
      ),
      property(
        'content',
        'Native view slot',
        'Required',
        'Provides primary row content.'
      ),
      property(
        'trailing',
        'Optional native view slot',
        'nil / EmptyView',
        'Provides short status or actions.'
      )
    ],
    slug: 'wearable-list-row',
    summary: 'Compose a compact wearable row with flexible content slots.'
  }
]

export const nativeComponentDocs = [
  ...sharedDefinitions,
  ...additionalDefinitions
].map(createComponent)

export const nativeComponentCategories: NativeComponentCategory[] = [
  'Foundations',
  'Actions',
  'Forms',
  'Layout',
  'Navigation',
  'Data display',
  'Feedback',
  'macOS utilities'
]

export const getNativeComponentsForPlatform = (
  platform: NativePlatformId
): NativeComponentDoc[] => nativeComponentDocs.filter(
  component => component.implementations[platform]
)
