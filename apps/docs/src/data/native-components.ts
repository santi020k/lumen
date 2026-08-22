export type NativePlatformId = 'android' | 'apple' | 'react-native'

export type NativeComponentCategory =
  'Actions' |
  'Data display' |
  'Feedback' |
  'Forms' |
  'Foundations' |
  'Layout' |
  'macOS utilities'

export interface NativeApiRow {
  defaultValue: string
  description: string
  name: string
  values: string
}

export interface NativeComponentImplementation {
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
  implementations: Partial<Record<NativePlatformId, NativeComponentImplementation>>
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

const platformLanguages: Record<NativePlatformId, NativeComponentImplementation['language']> = {
  android: 'kotlin',
  apple: 'swift',
  'react-native': 'tsx'
}

const platformValue = (value: PlatformValue, platform: NativePlatformId): string => typeof value === 'string' ?
  value :
  value[platform] ?? '—'

const property = (
  name: PlatformValue,
  values: PlatformValue,
  defaultValue: PlatformValue,
  description: string
): ComponentProperty => ({ defaultValue, description, name, values })

const createComponent = (definition: ComponentDefinition): NativeComponentDoc => {
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
    accessibility: 'The active color scheme follows the platform environment unless the application chooses an explicit light or dark mode.',
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
    guidance: 'Mount the theme once near the application root. Read semantic roles from the native theme object instead of copying hexadecimal values into feature code.',
    name: 'Theme',
    properties: [
      property(
        { android: 'darkTheme', apple: 'theme', 'react-native': 'scheme' },
        { android: 'Boolean', apple: 'LumenTheme', 'react-native': '"light" | "dark" | "system"' },
        { android: 'System setting', apple: '.light', 'react-native': '"system"' },
        'Selects the active native color scheme.'
      ),
      property(
        { android: 'content', apple: 'content', 'react-native': 'children' },
        { android: '@Composable () -> Unit', apple: 'View', 'react-native': 'ReactNode' },
        'Required',
        'Provides Lumen theme values to the descendant tree.'
      )
    ],
    slug: 'theme',
    summary: 'Provide generated semantic colors, spacing, radii, typography, motion, and elevation to native components.'
  },
  {
    accessibility: 'Text remains native text, supports platform font scaling, and preserves the semantic meaning supplied by its surrounding view.',
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
    exports: { android: 'LumenText', apple: 'LumenText', 'react-native': 'LumenText' },
    guidance: 'Use the title and label roles for hierarchy, not as substitutes for application navigation semantics. Prefer the muted and soft tones for supporting copy.',
    name: 'Text',
    properties: [
      property({ android: 'text', apple: 'content', 'react-native': 'children' }, 'String / native text content', 'Required', 'The text content.'),
      property('variant', 'body · caption · label · title', 'body', 'Selects the shared typography role.'),
      property('tone', 'default · soft · muted · success · warning · danger', 'default', 'Selects a semantic foreground role.'),
      property({ android: 'modifier', apple: 'SwiftUI modifiers', 'react-native': 'style' }, 'Native layout or text styling', '—', 'Adds platform-native layout and presentation overrides.')
    ],
    slug: 'text',
    summary: 'Render native text with shared typography variants and semantic color tones.'
  },
  {
    accessibility: 'A surface does not add an accessibility role by itself. Descendant controls and content retain their native semantics.',
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
    exports: { android: 'LumenSurface', apple: 'LumenSurface', 'react-native': 'LumenSurface' },
    guidance: 'Use surfaces to express hierarchy through semantic canvas, surface, muted, and strong roles. Do not hardcode a parallel set of background colors.',
    name: 'Surface',
    properties: [
      property('tone', 'canvas · surface · muted · strong', 'surface', 'Selects the semantic background role.'),
      property('padding', 'none · sm · md · lg', 'md', 'Applies generated platform spacing.'),
      property('radius', 'none · sm · md · lg', 'md', 'Applies a generated corner radius.'),
      property({ android: 'modifier', apple: 'content', 'react-native': 'style' }, 'Native composition API', '—', 'Composes or lays out the surface with native APIs.')
    ],
    slug: 'surface',
    summary: 'Compose content on semantic native backgrounds with shared padding and radius roles.'
  },
  {
    accessibility: 'Standalone icons are decorative when no label or content description is supplied. Meaningful icons require a concise accessible name.',
    category: 'Data display',
    examples: {
      android: `LumenIcon(
    imageVector = Icons.Default.Search,
    contentDescription = "Search",
    size = LumenIconSize.Md
)`,
      apple: `LumenIcon(
    systemName: "magnifyingglass",
    size: .md,
    label: "Search"
)`,
      'react-native': `<LumenIcon
  icon={Search}
  label="Search"
  size="md"
/>`
    },
    exports: { android: 'LumenIcon', apple: 'LumenIcon', 'react-native': 'LumenIcon' },
    guidance: 'Use SF Symbols on Apple, ImageVector values in Compose, and native graphic components in React Native. The application owns icon selection.',
    name: 'Icon',
    properties: [
      property({ android: 'imageVector', apple: 'systemName', 'react-native': 'icon' }, { android: 'ImageVector', apple: 'SF Symbol name', 'react-native': 'LumenIconGraphic' }, 'Required', 'Provides the platform-native icon graphic.'),
      property({ android: 'contentDescription', apple: 'label', 'react-native': 'label' }, 'String?', 'nil', 'Names a meaningful icon for assistive technology.'),
      property('size', 'sm · md · lg', 'md', 'Uses a 16, 20, or 24 unit icon size.'),
      property({ android: 'tint', apple: 'color', 'react-native': 'color' }, 'Native color', 'ink', 'Overrides the semantic icon color.')
    ],
    slug: 'icon',
    summary: 'Display platform-native icons at shared sizes without forcing one image system across platforms.'
  },
  {
    accessibility: 'The accessible label is required and becomes the native button name. Touch targets remain at least 44 units on mobile.',
    category: 'Actions',
    examples: {
      android: `LumenIconButton(
    imageVector = Icons.Default.Settings,
    contentDescription = "Settings",
    onClick = ::openSettings
)`,
      apple: `LumenIconButton(
    systemName: "gearshape",
    label: "Settings",
    action: openSettings
)`,
      'react-native': `<LumenIconButton
  icon={Settings}
  label="Settings"
  onPress={openSettings}
/>`
    },
    exports: { android: 'LumenIconButton', apple: 'LumenIconButton', 'react-native': 'LumenIconButton' },
    guidance: 'Use for compact, familiar actions. Prefer a text button when the icon alone would make the action difficult to understand.',
    name: 'Icon button',
    properties: [
      property({ android: 'imageVector', apple: 'systemName', 'react-native': 'icon' }, 'Native icon graphic', 'Required', 'Provides the platform-native icon.'),
      property({ android: 'contentDescription', apple: 'label', 'react-native': 'label' }, 'String', 'Required', 'Provides the accessible action name.'),
      property({ android: 'onClick', apple: 'action', 'react-native': 'onPress' }, 'Callback', 'Required', 'Runs the action.'),
      property('intent', 'primary · secondary · quiet · danger', 'quiet', 'Selects the semantic action treatment.'),
      property('size', 'sm · md · lg', 'md', 'Selects shared icon and control metrics.'),
      property({ android: 'enabled', apple: 'SwiftUI .disabled', 'react-native': 'disabled' }, 'Boolean', { android: 'true', apple: 'false', 'react-native': 'false' }, 'Controls native disabled state.')
    ],
    slug: 'icon-button',
    summary: 'Trigger a native action with a required accessible label and platform icon.'
  },
  {
    accessibility: 'Disabled and loading buttons expose native state and cannot trigger their action. The visible label supplies the accessible name.',
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
    exports: { android: 'LumenButton', apple: 'LumenButton', 'react-native': 'LumenButton' },
    guidance: 'Use primary sparingly for the main action, secondary for alternatives, quiet for low-emphasis actions, and danger for destructive operations.',
    name: 'Button',
    properties: [
      property({ android: 'onClick', apple: 'action', 'react-native': 'onPress' }, 'Callback', 'Required', 'Runs the button action.'),
      property('intent', 'primary · secondary · quiet · danger', 'primary', 'Selects semantic emphasis.'),
      property('size', 'sm · md · lg', 'md', 'Selects shared control height and padding.'),
      property('loading', 'Boolean', 'false', 'Shows native progress and prevents activation.'),
      property({ android: 'enabled', apple: 'SwiftUI .disabled', 'react-native': 'disabled' }, 'Boolean', { android: 'true', apple: 'false', 'react-native': 'false' }, 'Controls native disabled state.'),
      property({ android: 'content', apple: 'label', 'react-native': 'children' }, 'Native content', 'Required', 'Provides the visible button label.')
    ],
    slug: 'button',
    summary: 'Run native actions with shared intent, size, loading, and disabled contracts.'
  },
  {
    accessibility: 'The field remains a native input with platform focus, keyboard, autofill, and screen-reader behavior. Errors use native invalid-state semantics where available.',
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
    exports: { android: 'LumenTextField', apple: 'LumenTextField', 'react-native': 'LumenTextField' },
    guidance: 'Keep a stable label even when placeholder text is present. Pair error styling with useful explanatory text rather than relying on color alone.',
    name: 'Text field',
    properties: [
      property({ android: 'value', apple: 'text', 'react-native': 'value' }, 'Bound String', 'Required', 'Stores the current native input value.'),
      property({ android: 'onValueChange', apple: 'Binding', 'react-native': 'onChangeText' }, 'Value callback / binding', 'Required', 'Updates application state.'),
      property({ android: 'label', apple: 'title', 'react-native': 'accessibilityLabel' }, 'String', 'Required', 'Names the field.'),
      property('size', 'sm · md · lg', 'md', 'Selects shared control metrics.'),
      property('error', 'Boolean', 'false', 'Applies the semantic invalid treatment.'),
      property({ android: 'enabled', apple: 'SwiftUI .disabled', 'react-native': 'editable' }, 'Boolean', { android: 'true', apple: 'false', 'react-native': 'true' }, 'Controls native editing state.')
    ],
    slug: 'text-field',
    summary: 'Collect a single line of text using each platform’s native input and focus behavior.'
  },
  {
    accessibility: 'Badge text remains available to assistive technology. Do not encode status only through tone.',
    category: 'Data display',
    examples: {
      android: `LumenBadge(
    text = "Active",
    tone = LumenBadgeTone.Success
)`,
      apple: 'LumenBadge("Active", tone: .success)',
      'react-native': '<LumenBadge tone="success">Active</LumenBadge>'
    },
    exports: { android: 'LumenBadge', apple: 'LumenBadge', 'react-native': 'LumenBadge' },
    guidance: 'Use short status or classification labels. Prefer normal text for sentences, instructions, and frequently changing numeric values.',
    name: 'Badge',
    properties: [
      property({ android: 'text', apple: 'content', 'react-native': 'children' }, 'String / native text', 'Required', 'Provides the visible badge label.'),
      property('tone', 'neutral · accent · success · warning · danger', 'neutral', 'Selects the semantic status treatment.'),
      property({ android: 'modifier', apple: 'SwiftUI modifiers', 'react-native': 'style' }, 'Native layout API', '—', 'Adds platform-native layout adjustments.')
    ],
    slug: 'badge',
    summary: 'Display compact native status and classification labels using semantic tones.'
  },
  {
    accessibility: 'The divider is decorative and is hidden from assistive technology.',
    category: 'Layout',
    examples: {
      android: 'LumenDivider()',
      apple: 'LumenDivider()',
      'react-native': '<LumenDivider />'
    },
    exports: { android: 'LumenDivider', apple: 'LumenDivider', 'react-native': 'LumenDivider' },
    guidance: 'Use a divider only when spacing and grouping are insufficient to communicate a boundary. Avoid creating dense grids of lines.',
    name: 'Divider',
    properties: [
      property({ android: 'modifier', apple: 'SwiftUI modifiers', 'react-native': 'style' }, 'Native layout API', '—', 'Controls placement and length.'),
      property('color', 'Semantic line role', 'line', 'Uses the generated divider color.')
    ],
    slug: 'divider',
    summary: 'Separate related native content with the shared semantic line role.'
  },
  {
    accessibility: 'The spinner exposes a native progress role and an accessible loading label.',
    category: 'Feedback',
    examples: {
      android: 'LumenSpinner(label = "Loading projects")',
      apple: 'LumenSpinner(label: "Loading projects")',
      'react-native': '<LumenSpinner accessibilityLabel="Loading projects" />'
    },
    exports: { android: 'LumenSpinner', apple: 'LumenSpinner', 'react-native': 'LumenSpinner' },
    guidance: 'Use for indeterminate waits. If progress can be measured, prefer Progress and report the current value.',
    name: 'Spinner',
    properties: [
      property({ android: 'label', apple: 'label', 'react-native': 'accessibilityLabel' }, 'String', 'Loading', 'Names the operation for assistive technology.'),
      property('color', 'Native color', 'brand', 'Overrides the semantic progress color.'),
      property({ android: 'modifier', apple: 'SwiftUI modifiers', 'react-native': 'size' }, 'Native presentation API', '—', 'Adjusts native size or layout.')
    ],
    slug: 'spinner',
    summary: 'Communicate an indeterminate native loading state with a semantic brand treatment.'
  },
  {
    accessibility: 'Supplying an action gives the card native button semantics. Avoid nesting an interactive card inside another control.',
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
    exports: { android: 'LumenCard', apple: 'LumenCard', 'react-native': 'LumenCard' },
    guidance: 'Use default and muted cards for grouped content, and restrained semantic variants when the surface conveys a real state. Provide a card-level action only when the entire card performs one action.',
    name: 'Card',
    properties: [
      property('variant', 'default · muted · accent · success · warning · destructive', 'default', 'Selects the native surface treatment.'),
      property({ android: 'onClick', apple: 'action', 'react-native': 'onPress' }, 'Optional callback', 'nil', 'Makes the whole card interactive.'),
      property({ android: 'content', apple: 'content', 'react-native': 'children' }, 'Native content', 'Required', 'Composes the card body.'),
      property({ android: 'modifier', apple: 'SwiftUI modifiers', 'react-native': 'style' }, 'Native layout API', '—', 'Controls card placement and sizing.')
    ],
    slug: 'card',
    summary: 'Group related native content on a bordered semantic surface with optional card-level action.'
  },
  {
    accessibility: 'An alert is a styled container, not an automatic live announcement. Applications decide when asynchronous content needs a platform announcement.',
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
    exports: { android: 'LumenAlert', apple: 'LumenAlert', 'react-native': 'LumenAlert' },
    guidance: 'Use default for neutral notices and semantic variants for outcomes or risk. Keep the message actionable and avoid presenting routine information as an alert.',
    name: 'Alert',
    properties: [
      property('variant', 'default · destructive · success · warning', 'default', 'Selects the semantic foreground, border, and tint.'),
      property({ android: 'content', apple: 'content', 'react-native': 'children' }, 'Native content', 'Required', 'Provides alert content.'),
      property({ android: 'modifier', apple: 'SwiftUI modifiers', 'react-native': 'style' }, 'Native layout API', '—', 'Controls placement and sizing.'),
      property({ android: 'Text', apple: 'Text', 'react-native': 'LumenAlertTitle / LumenAlertDescription' }, 'Platform text composition', '—', 'React Native uses explicit text roles because View does not inherit text color.')
    ],
    slug: 'alert',
    summary: 'Present inline native feedback using shared neutral, destructive, success, and warning treatments.'
  },
  {
    accessibility: 'Progress exposes normalized minimum, maximum, and current values. Provide a label when surrounding text does not name the operation.',
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
    exports: { android: 'LumenProgress', apple: 'LumenProgress', 'react-native': 'LumenProgress' },
    guidance: 'Use only for determinate progress. Values are clamped into the valid range; invalid maximum values fall back to 100.',
    name: 'Progress',
    properties: [
      property('value', { android: 'Float', apple: 'Double', 'react-native': 'number' }, '0', 'Provides the current determinate value.'),
      property('max', { android: 'Float', apple: 'Double', 'react-native': 'number' }, '100', 'Provides the positive maximum value.'),
      property('label', 'String?', 'nil', 'Names the progress operation.'),
      property({ android: 'modifier', apple: 'SwiftUI modifiers', 'react-native': 'color / style' }, 'Native presentation API', '—', 'Adjusts native layout or optional indicator color.')
    ],
    slug: 'progress',
    summary: 'Show normalized determinate progress with native accessibility semantics.'
  },
  {
    accessibility: 'Supply a label when the avatar conveys identity. Omit it when the same name appears adjacent and the image is decorative.',
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
    exports: { android: 'LumenAvatar', apple: 'LumenAvatar', 'react-native': 'LumenAvatar' },
    guidance: 'Keep image sources native to the platform. Use initials or a short fallback when no image is available.',
    name: 'Avatar',
    properties: [
      property({ android: 'painter', apple: 'image', 'react-native': 'source' }, { android: 'Painter?', apple: 'Image?', 'react-native': 'ImageSourcePropType?' }, 'nil', 'Provides the platform-native image source.'),
      property('fallback', 'String', '?', 'Provides fallback text, normally initials.'),
      property('size', 'sm · md · lg', 'md', 'Uses a 32, 40, or 56 unit diameter.'),
      property('label', 'String?', 'nil', 'Names an identity-bearing avatar.')
    ],
    slug: 'avatar',
    summary: 'Display a native image or fallback identity at shared avatar sizes.'
  }
]

const additionalDefinitions: ComponentDefinition[] = [
  {
    accessibility: 'The visible label and native switch expose standard platform state and activation behavior.',
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
    exports: { android: 'LumenToggle', apple: 'LumenToggle', 'react-native': 'LumenToggle' },
    guidance: 'Use for an immediately applied Boolean setting. Use a button when an action does not represent persistent on/off state.',
    name: 'Toggle',
    properties: [
      property(
        { android: 'checked', apple: 'isOn', 'react-native': 'value' },
        { android: 'Boolean', apple: 'Binding<Bool>', 'react-native': 'boolean' },
        'Required',
        'Stores native on/off state.'
      ),
      property('label', { android: 'String', apple: 'LocalizedStringKey or custom View', 'react-native': 'string' }, 'Required', 'Provides the visible and accessible label.'),
      property(
        { android: 'onCheckedChange', apple: 'Binding setter', 'react-native': 'onValueChange' },
        '(Boolean) -> Unit',
        'Required',
        'Updates the controlled state.'
      ),
      property(
        { android: 'showLabel', apple: '.labelsHidden()', 'react-native': 'showLabel' },
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
    accessibility: 'The explanatory copy and trailing control remain contained while the control preserves independent focus and semantics.',
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
    exports: { android: 'LumenSettingsRow', apple: 'LumenSettingsRow', 'react-native': 'LumenSettingsRow' },
    guidance: 'Use to align repeated settings rows. The trailing content should be a compact native control rather than unrelated actions.',
    name: 'Settings row',
    properties: [
      property('title', { android: 'String', apple: 'LocalizedStringKey', 'react-native': 'string' }, 'Required', 'Names the setting.'),
      property('description', { android: 'String?', apple: 'LocalizedStringKey?', 'react-native': 'string' }, { android: 'null', apple: 'nil', 'react-native': 'undefined' }, 'Adds supporting explanation.'),
      property(
        { android: 'graphic', apple: 'systemName', 'react-native': 'graphic' },
        { android: '(@Composable () -> Unit)?', apple: 'SF Symbol name?', 'react-native': 'ReactNode' },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Adds an optional leading graphic.'
      ),
      property('control', { android: '@Composable () -> Unit', apple: '@ViewBuilder () -> Control', 'react-native': 'ReactNode' }, 'Required', 'Provides the trailing native control.')
    ],
    slug: 'settings-row',
    summary: 'Align a setting title and explanation with an optional graphic and trailing native control.'
  },
  {
    accessibility: 'The picker retains native selection semantics, keyboard behavior, and VoiceOver announcements for its selected value.',
    category: 'Forms',
    examples: {
      apple: `LumenPicker("Profile", selection: $profile, style: .segmented) {
    Text("Quiet").tag(Profile.quiet)
    Text("Balanced").tag(Profile.balanced)
}`
    },
    exports: { apple: 'LumenPicker' },
    guidance: 'Use segmented style for a small set of peer options and menu style when compact presentation matters. Keep the label visible unless context already names the selection.',
    name: 'Picker',
    properties: [
      property('selection', 'Binding<SelectionValue>', 'Required', 'Stores the selected tagged value.'),
      property('style', 'automatic · menu · segmented', 'automatic', 'Selects native picker presentation.'),
      property('showsLabel', 'Bool', 'true', 'Controls visible label presentation.'),
      property('content', '@ViewBuilder () -> Content', 'Required', 'Provides tagged native options.')
    ],
    slug: 'picker',
    summary: 'Choose one tagged value with automatic, menu, or segmented SwiftUI presentation.'
  },
  {
    accessibility: 'The native slider reports its label and current value. A visible formatted value helps people understand the current setting.',
    category: 'Forms',
    examples: {
      apple: `LumenSlider(
    "Minimum speed",
    value: $minimumSpeed,
    in: 1_000...5_000,
    step: 100,
    valueLabel: "\\(Int(minimumSpeed)) RPM"
)`
    },
    exports: { apple: 'LumenSlider' },
    guidance: 'Use for an approximate or continuously adjustable numeric value. Prefer TextField or Picker when exact entry is more important.',
    name: 'Slider',
    properties: [
      property('value', 'Binding<Double>', 'Required', 'Stores the current numeric value.'),
      property('bounds', 'ClosedRange<Double>', 'Required', 'Defines the valid range.'),
      property('step', 'Double?', 'nil', 'Adds valid stepped increments when positive and finite.'),
      property('valueLabel', 'String?', 'nil', 'Shows a formatted current value.')
    ],
    slug: 'slider',
    summary: 'Adjust a continuous or stepped numeric value with a visible formatted label.'
  },
  {
    accessibility: 'The field uses native text input and provides a labeled clear button whenever text is present.',
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
    exports: { android: 'LumenSearchField', apple: 'LumenSearchField', 'react-native': 'LumenSearchField' },
    guidance: 'Use for filtering an existing collection. Keep search results and empty states close to the field so focus changes remain understandable.',
    name: 'Search field',
    properties: [
      property('prompt', 'String', 'Search', 'Provides placeholder and field context.'),
      property({ android: 'value', apple: 'text', 'react-native': 'value' }, { android: 'String', apple: 'Binding<String>', 'react-native': 'string' }, 'Required', 'Stores the current search query.'),
      property({ android: 'onValueChange', apple: 'Binding setter', 'react-native': 'onChangeText' }, '(String) -> Unit', 'Required', 'Updates the controlled query.'),
      property({ android: 'enabled', apple: 'isEnabled', 'react-native': 'editable' }, 'Boolean', 'true', 'Controls native disabled presentation.'),
      property('clearLabel', 'String', 'Clear search', 'Names the clear action.')
    ],
    slug: 'search-field',
    summary: 'Filter native content with a density-aware search field and clear action.'
  },
  {
    accessibility: 'The title, description, optional graphic, and recovery actions remain in a readable native order.',
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
    exports: { android: 'LumenEmptyState', apple: 'LumenEmptyState', 'react-native': 'LumenEmptyState' },
    guidance: 'Explain why the state is empty and offer one useful next action when recovery is possible. Do not use for loading or error states.',
    name: 'Empty state',
    properties: [
      property('title', { android: 'String', apple: 'LocalizedStringKey', 'react-native': 'string' }, 'Required', 'Names the empty state.'),
      property(
        { android: 'graphic', apple: 'systemName', 'react-native': 'graphic' },
        { android: '(@Composable () -> Unit)?', apple: 'SF Symbol name', 'react-native': 'ReactNode' },
        { android: 'null', apple: 'Required', 'react-native': 'undefined' },
        'Provides an optional platform-native supporting graphic.'
      ),
      property('description', { android: 'String?', apple: 'LocalizedStringKey?', 'react-native': 'string' }, { android: 'null', apple: 'nil', 'react-native': 'undefined' }, 'Explains the state or next step.'),
      property('actions', { android: '(@Composable () -> Unit)?', apple: '@ViewBuilder () -> Actions', 'react-native': 'ReactNode' }, { android: 'null', apple: 'EmptyView', 'react-native': 'undefined' }, 'Provides optional recovery actions.')
    ],
    slug: 'empty-state',
    summary: 'Explain missing content with supporting copy, an optional graphic, and a recovery action.'
  },
  {
    accessibility: 'Leading identity, main content, and trailing actions remain contained while interactive descendants keep their own semantics.',
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
    exports: { android: 'LumenListRow', apple: 'LumenListRow', 'react-native': 'LumenListRow' },
    guidance: 'Use for repeated rows with a stable leading/content/trailing structure. Continue using native collection components for scrolling, selection, and navigation.',
    name: 'List row',
    properties: [
      property('leading', { android: '(@Composable () -> Unit)?', apple: '@ViewBuilder () -> Leading', 'react-native': 'ReactNode' }, { android: 'null', apple: 'Required', 'react-native': 'undefined' }, 'Provides identity or a leading visual.'),
      property({ android: 'content', apple: 'content', 'react-native': 'children' }, { android: '@Composable () -> Unit', apple: '@ViewBuilder () -> Content', 'react-native': 'ReactNode' }, 'Required', 'Provides the primary row content.'),
      property('trailing', { android: '(@Composable () -> Unit)?', apple: '@ViewBuilder () -> Trailing', 'react-native': 'ReactNode' }, { android: 'null', apple: 'EmptyView', 'react-native': 'undefined' }, 'Provides status or compact actions.')
    ],
    slug: 'list-row',
    summary: 'Compose a flexible native row with leading identity, content, and trailing actions.'
  },
  {
    accessibility: 'A banner is inline content, not a live announcement. The application decides whether newly inserted content needs a platform announcement.',
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
    exports: { android: 'LumenBanner', apple: 'LumenBanner', 'react-native': 'LumenBanner' },
    guidance: 'Use for persistent inline notices with optional action and dismissal. Prefer Alert for compact semantic content without banner structure.',
    name: 'Banner',
    properties: [
      property('title', { android: 'String', apple: 'LocalizedStringKey', 'react-native': 'string' }, 'Required', 'Names the notice.'),
      property('description', { android: 'String?', apple: 'LocalizedStringKey?', 'react-native': 'string' }, { android: 'null', apple: 'nil', 'react-native': 'undefined' }, 'Adds supporting detail.'),
      property('variant', 'default · accent · destructive · success · warning', 'default', 'Selects semantic presentation.'),
      property('onDismiss', '(() -> Void)?', { android: 'null', apple: 'nil', 'react-native': 'undefined' }, 'Adds a labeled dismiss action.'),
      property('actions', { android: '(@Composable () -> Unit)?', apple: '@ViewBuilder () -> Actions', 'react-native': 'ReactNode' }, { android: 'null', apple: 'EmptyView', 'react-native': 'undefined' }, 'Provides optional inline actions.')
    ],
    slug: 'banner',
    summary: 'Present a structured semantic notice with optional actions and dismissal.'
  },
  {
    accessibility: 'Metric content is combined into a concise readable unit. The value must remain meaningful without relying on color or icon alone.',
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
    exports: { android: 'LumenStat', apple: 'LumenStat', 'react-native': 'LumenStat' },
    guidance: 'Use for a compact product metric. Avoid decorative dashboard numbers that do not support a decision or task.',
    name: 'Stat',
    properties: [
      property('label', { android: 'String', apple: 'LocalizedStringKey', 'react-native': 'string' }, 'Required', 'Names the metric.'),
      property('value', 'String', 'Required', 'Provides the formatted metric value.'),
      property('detail', { android: 'String?', apple: 'LocalizedStringKey?', 'react-native': 'string' }, { android: 'null', apple: 'nil', 'react-native': 'undefined' }, 'Adds supporting context.'),
      property(
        { android: 'graphic', apple: 'systemName', 'react-native': 'graphic' },
        { android: '(@Composable () -> Unit)?', apple: 'SF Symbol name?', 'react-native': 'ReactNode' },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Adds an optional semantic graphic.'
      ),
      property('tone', 'neutral · brand · accent · success · warning · danger', 'brand', 'Selects semantic emphasis.')
    ],
    slug: 'stat',
    summary: 'Display a compact product metric with semantic tone and optional supporting context.'
  },
  {
    accessibility: 'The visual ring is replaced by one accessible label and formatted value. Invalid values are normalized into the valid range.',
    category: 'Data display',
    examples: {
      apple: `LumenGauge(
    "Thermal pressure",
    value: 48,
    valueLabel: "Fair",
    systemName: "thermometer.medium",
    tone: .warning
)`
    },
    exports: { apple: 'LumenGauge' },
    guidance: 'Use for a current bounded metric, not task completion. Use Progress when the value represents work moving toward completion.',
    name: 'Gauge',
    properties: [
      property('label', 'LocalizedStringKey', 'Required', 'Names the bounded metric.'),
      property('value', 'Double', 'Required', 'Provides the current value.'),
      property('max', 'Double', '100', 'Provides the positive maximum.'),
      property('valueLabel', 'String', 'Required', 'Provides the visible and accessible formatted value.'),
      property('tone', 'neutral · brand · accent · success · warning · danger', 'brand', 'Selects semantic emphasis.')
    ],
    slug: 'gauge',
    summary: 'Show a normalized circular Apple-platform metric with a formatted accessible value.'
  },
  {
    accessibility: 'The section identity, optional count, and actions remain a contained group while actions preserve their own labels.',
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
    exports: { android: 'LumenSectionHeader', apple: 'LumenSectionHeader', 'react-native': 'LumenSectionHeader' },
    guidance: 'Use above a native section or collection. Keep actions compact and directly related to the section.',
    name: 'Section header',
    properties: [
      property('title', { android: 'String', apple: 'LocalizedStringKey', 'react-native': 'string' }, 'Required', 'Names the section.'),
      property('subtitle', { android: 'String?', apple: 'LocalizedStringKey?', 'react-native': 'string' }, { android: 'null', apple: 'nil', 'react-native': 'undefined' }, 'Adds supporting context.'),
      property('count', { android: 'String?', apple: 'String?', 'react-native': 'string' }, { android: 'null', apple: 'nil', 'react-native': 'undefined' }, 'Shows an optional count badge.'),
      property('actions', { android: '(@Composable () -> Unit)?', apple: '@ViewBuilder () -> Actions', 'react-native': 'ReactNode' }, { android: 'null', apple: 'EmptyView', 'react-native': 'undefined' }, 'Provides trailing section actions.')
    ],
    slug: 'section-header',
    summary: 'Identify a native section with optional supporting copy, count, and trailing actions.'
  },
  {
    accessibility: 'The visible status dot is decorative; the message carries status meaning in text. Trailing controls retain independent semantics.',
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
    exports: { android: 'LumenStatusBar', apple: 'LumenStatusBar', 'react-native': 'LumenStatusBar' },
    guidance: 'Use for compact persistent application status. Do not replace system status bars or navigation chrome.',
    name: 'Status bar',
    properties: [
      property('message', { android: 'String', apple: 'LocalizedStringKey', 'react-native': 'string' }, 'Required', 'Provides the textual status.'),
      property('tone', 'neutral · brand · accent · success · warning · danger', 'neutral', 'Selects the semantic dot color.'),
      property('trailing', { android: '(@Composable () -> Unit)?', apple: '@ViewBuilder () -> Trailing', 'react-native': 'ReactNode' }, { android: 'null', apple: 'EmptyView', 'react-native': 'undefined' }, 'Provides optional trailing content.')
    ],
    slug: 'status-bar',
    summary: 'Present compact textual application status with optional trailing content.'
  },
  {
    accessibility: 'Recording, current shortcut, validation error, cancel, change, and clear states all have visible native labels.',
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
    guidance: 'Use only on macOS. Applications own conflict validation and command registration; Lumen handles capture and presentation.',
    name: 'Shortcut recorder',
    properties: [
      property('label', 'LocalizedStringKey', 'Required', 'Names the command being configured.'),
      property('shortcut', 'Binding<LumenShortcut?>', 'Required', 'Stores the current keyboard shortcut.'),
      property('validation', '((LumenShortcut) -> String?)?', 'nil', 'Returns an application conflict message or nil.'),
      property('platform', 'macOS', 'Required', 'Uses NSEvent keyboard capture and macOS modifier glyphs.')
    ],
    slug: 'shortcut-recorder',
    summary: 'Capture, validate, change, and clear native macOS keyboard shortcuts.'
  },
  {
    accessibility: 'Every symbol option has a readable label and selected state. Search and empty states use native controls and focus behavior.',
    category: 'macOS utilities',
    examples: {
      apple: `LumenSymbolPickerButton(
    "Workspace symbol",
    selectedName: $symbolName
)`
    },
    exports: { apple: 'LumenSymbolPicker / LumenSymbolPickerButton' },
    guidance: 'Use only on macOS. Supply product-specific symbol options when the built-in common set is broader than the task requires.',
    name: 'Symbol picker',
    properties: [
      property('title / label', 'LocalizedStringKey', 'Choose a symbol', 'Names the picker or popover trigger.'),
      property('selectedName', 'Binding<String>', 'Required', 'Stores the selected SF Symbol name.'),
      property('options', '[LumenSymbolOption]', '.common', 'Provides labeled, categorized symbol choices.'),
      property('presentation', 'Inline picker / popover button', 'Inline', 'Selects the full picker or compact popover trigger.')
    ],
    slug: 'symbol-picker',
    summary: 'Search and choose from labeled, categorized SF Symbols in a native macOS picker.'
  }
]

export const nativeComponentDocs = [...sharedDefinitions, ...additionalDefinitions]
  .map(createComponent)

export const nativeComponentCategories: NativeComponentCategory[] = [
  'Foundations',
  'Actions',
  'Forms',
  'Layout',
  'Data display',
  'Feedback',
  'macOS utilities'
]

export const getNativeComponentsForPlatform = (
  platform: NativePlatformId
): NativeComponentDoc[] => nativeComponentDocs.filter(component => component.implementations[platform])

export const getNativeComponent = (
  platform: NativePlatformId,
  slug: string
): NativeComponentDoc | undefined => nativeComponentDocs.find(
  component => component.slug === slug && component.implementations[platform]
)
