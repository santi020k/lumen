export type NativePlatformId = 'android' | 'apple' | 'react-native'

export type NativeComponentCategory =
  | 'Actions' |
  'Data display' |
  'Feedback' |
  'Forms' |
  'Foundations' |
  'Layout' |
  'Navigation' |
  'WidgetKit' |
  'macOS utilities'

type AppleEcosystemTargetId =
  | 'ios' |
  'ipad' |
  'macos' |
  'tvos' |
  'visionos' |
  'watchos'

interface AppleEcosystemTarget {
  id: AppleEcosystemTargetId
  label: string
  minimumVersion: string
}

interface NativeApiRow {
  defaultValue: string
  description: string
  name: string
  values: string
}

interface NativeComponentImplementation {
  api: NativeApiRow[]
  appleAvailability?: AppleEcosystemTarget[]
  example: string
  exportName: string
  language: 'kotlin' | 'swift' | 'tsx'
  maturity: 'Experimental' | 'Supported'
  packageName?: 'LumenUI' | 'LumenWidgetUI'
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
  maturity?: Partial<Record<NativePlatformId, 'Experimental' | 'Supported'>>
  name: string
  properties: ComponentProperty[]
  platformProperties?: Partial<Record<NativePlatformId, ComponentProperty[]>>
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

const appleEcosystemTargets: Record<
  AppleEcosystemTargetId,
  AppleEcosystemTarget
> = {
  ios: { id: 'ios', label: 'iPhone', minimumVersion: 'iOS 16+' },
  ipad: { id: 'ipad', label: 'iPad', minimumVersion: 'iPadOS 16+' },
  macos: { id: 'macos', label: 'Mac', minimumVersion: 'macOS 13+' },
  tvos: { id: 'tvos', label: 'Apple TV', minimumVersion: 'tvOS 16+' },
  visionos: { id: 'visionos', label: 'Apple Vision', minimumVersion: 'visionOS 1+' },
  watchos: { id: 'watchos', label: 'Apple Watch', minimumVersion: 'watchOS 9+' }
}

const appleApplicationTargets = [
  appleEcosystemTargets.ios,
  appleEcosystemTargets.ipad,
  appleEcosystemTargets.macos,
  appleEcosystemTargets.tvos,
  appleEcosystemTargets.visionos,
  appleEcosystemTargets.watchos
]

const applePhoneTabletAndMacTargets = [
  appleEcosystemTargets.ios,
  appleEcosystemTargets.ipad,
  appleEcosystemTargets.macos,
  appleEcosystemTargets.visionos
]

const applePhoneAndTabletTargets = [
  appleEcosystemTargets.ios,
  appleEcosystemTargets.ipad
]

const applePhoneTabletAndMacOnlySlugs = new Set([
  'backdrop',
  'tree',
  'cascader',
  'qr-code',
  'calendar',
  'agenda',
  'schedule',
  'color-picker',
  'tree-select',
  'transfer',
  'tooltip',
  'carousel',
  'command',
  'tree-grid',
  'table',
  'data-table',
  'rating',
  'breadcrumb',
  'stepper',
  'timeline',
  'tour',
  'kanban-board',
  'kanban-column',
  'checkbox',
  'date-field',
  'date-range-field',
  'disclosure',
  'graphic',
  'illustration',
  'link',
  'phone-input',
  'picker',
  'radio-group',
  'search-field',
  'segmented-control',
  'settings-row',
  'skeleton',
  'slider',
  'range-slider',
  'multi-select',
  'time-field',
  'autocomplete',
  'number-field',
  'password-field',
  'input-otp',
  'image-comparison',
  'tabs',
  'textarea',
  'toggle'
])

const appleMacOnlySlugs = new Set(['shortcut-recorder', 'symbol-picker'])
const applePhoneOnlySlugs = new Set(['tab-accessory', 'tab-bar-minimization'])

const appleWidgetSlugs = new Set([
  'widget-badge',
  'widget-compact-stat',
  'widget-icon',
  'widget-text'
])

const getAppleAvailability = (slug: string): AppleEcosystemTarget[] => {
  if (slug === 'mentions') {
    return [appleEcosystemTargets.ios, appleEcosystemTargets.ipad, appleEcosystemTargets.visionos]
  }

  if (appleMacOnlySlugs.has(slug)) {
    return [appleEcosystemTargets.macos]
  }

  if (slug.startsWith('wearable-')) {
    return [appleEcosystemTargets.watchos]
  }

  if (appleWidgetSlugs.has(slug)) {
    return [
      appleEcosystemTargets.ios,
      appleEcosystemTargets.ipad,
      appleEcosystemTargets.macos,
      appleEcosystemTargets.watchos
    ]
  }

  if (applePhoneOnlySlugs.has(slug)) {
    return applePhoneAndTabletTargets
  }

  if (applePhoneTabletAndMacOnlySlugs.has(slug)) {
    return applePhoneTabletAndMacTargets
  }

  if (slug === 'menu') {
    return [
      ...applePhoneTabletAndMacTargets,
      { ...appleEcosystemTargets.tvos, minimumVersion: 'tvOS 17+' }
    ]
  }

  if (slug === 'share-button') {
    return [
      ...applePhoneTabletAndMacTargets,
      appleEcosystemTargets.watchos
    ]
  }

  return appleApplicationTargets
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

    let appleFields: Required<Pick<
      NativeComponentImplementation,
      'appleAvailability' | 'packageName'
    >> | Record<string, never> = {}

    if (platform === 'apple') {
      const packageName = appleWidgetSlugs.has(definition.slug) ?
        'LumenWidgetUI' :
        'LumenUI'

      appleFields = {
        appleAvailability: getAppleAvailability(definition.slug),
        packageName
      }
    }

    implementations[platform] = {
      api: (definition.platformProperties?.[platform] ?? definition.properties).map(item => ({
        defaultValue: platformValue(item.defaultValue, platform),
        description: item.description,
        name: platformValue(item.name, platform),
        values: platformValue(item.values, platform)
      })),
      ...appleFields,
      example,
      exportName,
      language: platformLanguages[platform],
      maturity: definition.maturity?.[platform] ?? 'Supported',
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

const chartDefinition = (
  name: string,
  slug: string,
  dataName: 'data' | 'series' | 'values',
  dataExample: string,
  summary: string,
  accessibility: string
): ComponentDefinition => {
  const symbol = `Lumen${name
    .split(' ')
    .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join('')}`

  return {
    accessibility,
    category: 'Data display',
    examples: {
      android: `${symbol}(\n    ${dataName} = ${dataExample},\n    label = "Quarterly revenue"\n)`,
      apple: `${symbol}(\n    label: "Quarterly revenue",\n    ${dataName}: ${dataExample}\n)`,
      'react-native': `<${symbol}\n  ${dataName}={${dataExample}}\n  label="Quarterly revenue"\n/>`
    },
    exports: {
      android: symbol,
      apple: symbol,
      'react-native': symbol
    },
    guidance:
      'Use canonical visualization tokens and keep the application data model explicit. Provide a concise factual label, and retain the readable native fallback supplied by the component.',
    name,
    properties: [
      property(
        'label',
        'String',
        'Required',
        'Provides the concise accessible name for the visualization.'
      ),
      property(
        dataName,
        'Typed native chart data',
        'Required',
        'Supplies finite values and stable identifiers through the shared chart contract.'
      )
    ],
    slug,
    summary
  }
}

const chartDefinitions: ComponentDefinition[] = [
  chartDefinition(
    'Sparkline',
    'sparkline',
    'values',
    '[12, 18, 15, 24]',
    'Render a compact tokenized trend line with optional area fill.',
    'Presents one concise image label without exposing decorative marks.'
  ),
  chartDefinition(
    'Line chart',
    'line-chart',
    'series',
    'revenueSeries',
    'Compare one or more categorical, numeric, or temporal line series.',
    'Provides a factual summary and navigable fallback data while decorative marks remain hidden.'
  ),
  chartDefinition(
    'Bar chart',
    'bar-chart',
    'series',
    'revenueSeries',
    'Compare grouped or stacked categorical magnitudes.',
    'Provides a factual summary and navigable fallback data while decorative marks remain hidden.'
  ),
  chartDefinition(
    'Pie chart',
    'pie-chart',
    'series',
    'revenueSeries',
    'Show a small positive part-to-whole breakdown as a pie or donut.',
    'Provides a factual summary and navigable fallback data while decorative marks remain hidden.'
  ),
  chartDefinition(
    'Scatter chart',
    'scatter-chart',
    'series',
    'relationshipSeries',
    'Plot numeric scatter and bubble relationships with semantic series tones.',
    'Provides a factual summary and readable fallback data while decorative marks remain hidden.'
  ),
  chartDefinition(
    'Waterfall chart',
    'waterfall-chart',
    'data',
    'balanceChanges',
    'Explain a balance using signed changes and explicit totals.',
    'Provides labeled axes, a factual summary, and expandable source values; invalid changes fail closed.'
  ),
  {
    name: 'Lollipop chart',
    slug: 'lollipop-chart',
    category: 'Data display',
    summary: 'Rank categories using a dot and a zero-based stem.',
    accessibility: 'Keeps category labels and exact values available independently of the decorative stems and dots.',
    guidance: 'Preserve missing measurements as null and provide a zero-inclusive domain. The application owns row ordering.',
    exports: { android: 'LumenLollipopChart', apple: 'LumenLollipopChart', 'react-native': 'LumenLollipopChart' },
    examples: {
      android: `LumenLollipopChart(
  data = listOf(LumenComparisonDatum("design", "Design", 88.0)),
  label = "Team scores, current quarter",
  domain = 0.0..100.0,
  heading = "Team performance",
  valueLabel = "Score"
)`,
      apple: `LumenLollipopChart(
  data: [.init(id: "design", label: "Design", value: 88)],
  label: "Team scores, current quarter",
  domain: 0...100,
  heading: "Team performance",
  valueLabel: "Score"
)`,
      'react-native': `<LumenLollipopChart
  label="Team scores, current quarter"
  heading="Team performance"
  data={[{ id: 'design', label: 'Design', value: 88 }]}
  domain={{ min: 0, max: 100 }}
  valueLabel="Score"
/>`
    },
    properties: [
      property('data', 'LumenComparisonDatum[]', 'Required', 'Unique id, category label, nullable finite value, optional reference and tone. Input order is preserved.'),
      property('label, heading, description', 'String', 'label required', 'Provides the accessible name and optional visible context.'),
      property('domain', 'Finite numeric range', 'Automatic', 'Includes zero and all displayed measurements. React Native uses { min, max }; SwiftUI and Compose use closed ranges.'),
      property('valueLabel, labels', 'Localized chart labels', 'English', 'Names the measure and localizes empty, missing, invalid, and disclosure text.'),
      property('formatValue / labels.formatValue', 'Number formatter', 'Platform default', 'React Native accepts formatValue; SwiftUI and Compose use labels.formatValue.'),
      property('showData', 'Boolean', 'true', 'Provides the expandable exact values.')
    ]
  },
  {
    name: 'Dumbbell chart',
    slug: 'dumbbell-chart',
    category: 'Data display',
    summary: 'Compare two measurements per category with connected dots.',
    accessibility: 'Keeps exact values available and uses filled and outlined dots for paired measurements.',
    guidance: 'Preserve missing measurements as null and provide a zero-inclusive domain. The application owns row ordering.',
    exports: { android: 'LumenDumbbellChart', apple: 'LumenDumbbellChart', 'react-native': 'LumenDumbbellChart' },
    examples: {
      android: `LumenDumbbellChart(
  data = listOf(
    LumenComparisonDatum("design", "Design", value = 88.0, reference = 62.0),
    LumenComparisonDatum("support", "Support", value = 74.0, reference = 81.0)
  ),
  label = "Team scores, previous and current quarter",
  domain = 0.0..100.0,
  heading = "Progress by team",
  referenceLabel = "Previous",
  valueLabel = "Current"
)`,
      apple: `LumenDumbbellChart(
  data: [
    .init(id: "design", label: "Design", value: 88, reference: 62),
    .init(id: "support", label: "Support", value: 74, reference: 81)
  ],
  label: "Team scores, previous and current quarter",
  domain: 0...100,
  heading: "Progress by team",
  referenceLabel: "Previous",
  valueLabel: "Current"
)`,
      'react-native': `<LumenDumbbellChart
  label="Team scores, previous and current quarter"
  heading="Progress by team"
  data={[
    { id: 'design', label: 'Design', value: 88, reference: 62 },
    { id: 'support', label: 'Support', value: 74, reference: 81 }
  ]}
  domain={{ min: 0, max: 100 }}
  referenceLabel="Previous"
  valueLabel="Current"
/>`
    },
    properties: [
      property('data', 'LumenComparisonDatum[]', 'Required', 'Unique id, category label, nullable finite value, optional reference and tone. Input order is preserved.'),
      property('label, heading, description', 'String', 'label required', 'Provides the accessible name and optional visible context.'),
      property('domain', 'Finite numeric range', 'Automatic', 'Includes zero and all displayed measurements. React Native uses { min, max }; SwiftUI and Compose use closed ranges.'),
      property('valueLabel, labels', 'Localized chart labels', 'English', 'Names the measure and localizes empty, missing, invalid, and disclosure text. DumbbellChart also accepts referenceLabel (Before).'),
      property('formatValue / labels.formatValue', 'Number formatter', 'Platform default', 'React Native accepts formatValue; SwiftUI and Compose use labels.formatValue.'),
      property('showData', 'Boolean', 'true', 'Provides the expandable exact values.')
    ]
  },
  {
    name: 'Calendar heatmap',
    slug: 'calendar-heatmap',
    category: 'Data display',
    summary: 'Shows daily activity with explicit missing dates and a numeric intensity legend.',
    accessibility: 'Retains exact date and value facts, including when the visible data list is hidden.',
    guidance: 'Use Gregorian date-only identities and an inclusive range of at most 3660 days. Missing days stay distinct from zero.',
    exports: { android: 'LumenCalendarHeatmap', apple: 'LumenCalendarHeatmap', 'react-native': 'LumenCalendarHeatmap' },
    examples: {
      android: 'LumenCalendarHeatmap(data = listOf(LumenCalendarHeatmapDatum("2026-08-01", 3.0)), label = "Daily activity", startDate = "2026-08-01", endDate = "2026-08-28")',
      apple: 'LumenCalendarHeatmap(data: [.init(date: "2026-08-01", value: 3)], label: "Daily activity", startDate: "2026-08-01", endDate: "2026-08-28")',
      'react-native': '<LumenCalendarHeatmap label="Daily activity" startDate="2026-08-01" endDate="2026-08-28" data={[{ date: "2026-08-01", value: 3 }]} />'
    },
    properties: [
      property('data', 'LumenCalendarHeatmapDatum[]', 'Required', 'Date-only identity and nullable finite value.'),
      property('startDate, endDate', 'YYYY-MM-DD', 'Required', 'Inclusive range. Duplicate, invalid or out-of-range dates fail closed.'),
      property('weekStartsOn', '0 or 1', '0', 'Sunday or Monday. weekdayLabels is always Sunday-indexed.'),
      property('formatDate, labels', 'Localized formatters and labels', 'Platform defaults', 'Formats dates and exact measurements consistently.'),
      property('showData', 'Boolean', 'true', 'Provides the visible expandable exact values.')
    ]
  },
  {
    name: 'Funnel chart',
    slug: 'funnel-chart',
    category: 'Data display',
    summary: 'Compares ordered nonnegative conversion stages with exact measurements.',
    accessibility: 'Visible values and an expandable data list distinguish missing stages from zero.',
    guidance: 'Preserve input order and use aligned cohorts. Applications own conversion percentages and aggregation.',
    exports: { android: 'LumenFunnelChart', apple: 'LumenFunnelChart', 'react-native': 'LumenFunnelChart' },
    examples: {
      android: 'LumenFunnelChart(data = listOf(LumenFunnelDatum("visits", "Visits", 4800.0)), label = "Activation funnel")',
      apple: 'LumenFunnelChart(data: [.init(id: "visits", label: "Visits", value: 4800)], label: "Activation funnel")',
      'react-native': '<LumenFunnelChart label="Activation funnel" data={[{ id: "visits", label: "Visits", value: 4800 }]} />'
    },
    properties: [property('data', 'LumenFunnelDatum[]', 'Required', 'Unique nonempty IDs, labels, nullable nonnegative finite values, and optional tone.'), property('labels', 'Localized chart labels', 'English', 'Formats exact values and empty/invalid/missing states.'), property('showData', 'Boolean', 'true', 'Provides the visible expandable exact values.')]
  },
  {
    name: 'Box plot',
    slug: 'box-plot',
    category: 'Data display',
    summary: 'Shows precomputed quartiles, whiskers and outliers on one numeric scale.',
    accessibility: 'Provides exact statistics with a contrasting median and outlined outliers.',
    guidance: 'Supply ordered statistics or five null values for a missing summary. Applications own statistical methods.',
    exports: { android: 'LumenBoxPlot', apple: 'LumenBoxPlot', 'react-native': 'LumenBoxPlot' },
    examples: {
      android: 'LumenBoxPlot(data = listOf(LumenBoxPlotDatum("north", "North", 12.0, 22.0, 31.0, 44.0, 61.0)), label = "Response distribution")',
      apple: 'LumenBoxPlot(data: [.init(id: "north", label: "North", min: 12, q1: 22, median: 31, q3: 44, max: 61)], label: "Response distribution")',
      'react-native': '<LumenBoxPlot label="Response distribution" data={[{ id: "north", label: "North", min: 12, q1: 22, median: 31, q3: 44, max: 61 }]} />'
    },
    properties: [property('data', 'LumenBoxPlotDatum[]', 'Required', 'Precomputed min/q1/median/q3/max plus optional finite outliers. min/max are whisker bounds.'), property('domain', 'Finite numeric range', 'Automatic', 'Encloses every statistic and outlier.'), property('statisticLabels, labels', 'Localized statistic names and formatting', 'English', 'Names quartiles, median, whiskers and outliers.'), property('showData', 'Boolean', 'true', 'Provides the visible expandable exact statistics.')]
  },
  {
    name: 'Bullet chart',
    slug: 'bullet-chart',
    category: 'Data display',
    summary: 'Compare an actual value with a target and labeled performance ranges.',
    accessibility: 'Exposes exact actual, target, and range values; missing values remain distinct from zero.',
    guidance: 'Use a domain that includes zero and every supplied measurement. Localize targetLabel and labels for the application.',
    exports: { android: 'LumenBulletChart', apple: 'LumenBulletChart', 'react-native': 'LumenBulletChart' },
    examples: {
      android: 'LumenBulletChart(value = 86.0, target = 95.0, label = "On-time delivery", domain = 0.0..100.0)',
      apple: 'LumenBulletChart(label: "On-time delivery", value: 86, target: 95, domain: 0...100)',
      'react-native': '<LumenBulletChart label="On-time delivery" value={86} target={95} domain={{ min: 0, max: 100 }} />'
    },
    properties: [
      property('value, target', 'Nullable measurement, finite target', 'Required', 'Null is unavailable; zero is a measured value.'),
      property('ranges', 'LumenBulletRange[]', '[]', 'Uses labeled finite range ends sorted without changing the source data.'),
      property('domain', 'Finite numeric range', 'Automatic', 'Includes zero, target, actual, and all ranges; invalid input fails closed.'),
      property('labels, targetLabel, valueLabel', 'Localized chart labels', 'English', 'Labels the summary, visible measurements, and exact data list.'),
      property('showData', 'Boolean', 'true', 'Provides the expandable actual, target, and range boundaries.')
    ]
  },
  chartDefinition(
    'Histogram',
    'histogram',
    'data',
    'responseTimeBins',
    'Show a distribution with explicit bins, accurate interval widths, and count or density.',
    'Provides labeled axes and expandable bin boundaries, plotted values, and original counts.'
  ),
  chartDefinition(
    'Heatmap',
    'heatmap',
    'data',
    'activityCells',
    'Encode a matrix with sequential or diverging color scales, labeled axes, and a numeric legend.',
    'Distinguishes missing cells from zero and provides an expandable list of exact measurements.'
  ),
  chartDefinition(
    'Range chart',
    'range-chart',
    'data',
    'forecastRanges',
    'Render ordered low-to-high intervals as a tokenized range band.',
    'Presents a concise summary while applications retain low and high values.'
  ),
  chartDefinition(
    'Combo chart',
    'combo-chart',
    'series',
    'mixedSeries',
    'Combine bar, line, and area series on one shared value domain.',
    'Provides a factual summary and readable fallback data while decorative marks remain hidden.'
  )
]

const sharedDefinitions: ComponentDefinition[] = [
  ...chartDefinitions,
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
        { android: 'requiredLabel', 'react-native': 'requiredLabel' },
        'String',
        'required',
        'Localizes the spoken required-field description. SwiftUI resolves the Required key through application localization.'
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
        'Prefers horizontal or vertical actions. Horizontal groups wrap or stack when space or accessibility text requires it.'
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
}`,
      'react-native': `<LumenPicker
  label="Profile"
  value={profile}
  options={profileOptions}
  onValueChange={setProfile}
/>`
    },
    exports: {
      android: 'LumenPicker',
      apple: 'LumenPicker',
      'react-native': 'LumenPicker'
    },
    guidance:
      'Use native menu or picker presentation for a compact single choice. Use Segmented control when a small peer set should remain visible.',
    name: 'Picker',
    properties: [
      property(
        { android: 'value', apple: 'selection', 'react-native': 'value' },
        {
          android: 'T',
          apple: 'Binding<SelectionValue>',
          'react-native': 'Value extends string | number'
        },
        'Required',
        'Stores the selected value.'
      ),
      property(
        { android: 'options', apple: 'content', 'react-native': 'options' },
        {
          android: 'List<LumenPickerOption<T>>',
          apple: '@ViewBuilder () -> Content',
          'react-native': 'readonly LumenPickerOption<Value>[]'
        },
        'Required',
        'Provides labeled native options.'
      ),
      property(
        { android: 'onValueChange', apple: 'Binding setter', 'react-native': 'onValueChange' },
        {
          android: '(T) -> Unit',
          apple: 'Binding setter',
          'react-native': '(value: Value) => void'
        },
        'Required',
        'Updates the selected value.'
      ),
      property(
        { android: 'enabled', apple: 'style', 'react-native': 'enabled' },
        {
          android: 'Boolean',
          apple: 'automatic · menu · segmented',
          'react-native': 'boolean'
        },
        { android: 'true', apple: 'automatic', 'react-native': 'true' },
        'Controls native availability or presentation.'
      )
    ],
    slug: 'picker',
    summary:
      'Choose one controlled value through native or accessible menu presentation.'
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
)`,
      'react-native': `<LumenSlider
  label="Minimum speed"
  value={minimumSpeed}
  min={1_000}
  max={5_000}
  step={100}
  valueLabel={String(minimumSpeed) + ' RPM'}
  onValueChange={setMinimumSpeed}
/>`
    },
    exports: {
      android: 'LumenSlider',
      apple: 'LumenSlider',
      'react-native': 'LumenSlider'
    },
    guidance:
      'Use for an approximate or continuously adjustable numeric value. Prefer TextField or Picker when exact entry is more important.',
    name: 'Slider',
    properties: [
      property(
        'value',
        { android: 'Float', apple: 'Binding<Double>', 'react-native': 'number' },
        'Required',
        'Stores the current numeric value.'
      ),
      property(
        { android: 'valueRange', apple: 'bounds', 'react-native': 'min / max' },
        {
          android: 'ClosedFloatingPointRange<Float>',
          apple: 'ClosedRange<Double>',
          'react-native': 'number'
        },
        'Required',
        'Defines the valid range.'
      ),
      property(
        { android: 'steps', apple: 'step', 'react-native': 'step' },
        { android: 'Int', apple: 'Double?', 'react-native': 'number' },
        { android: '0', apple: 'nil', 'react-native': '1% of range' },
        'Adds valid stepped increments when positive and finite.'
      ),
      property(
        'valueLabel',
        { android: 'String', apple: 'String?', 'react-native': 'string' },
        { android: 'value.toString()', apple: 'nil', 'react-native': 'String(value)' },
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
      'The country selector announces the localized country name and calling code. Flags supplement visible text and are never the only country identifier.',
    category: 'Forms',
    examples: {
      android: `@Composable
fun CareTeamPhoneField() {
    val defaultCountry = remember {
        requireNotNull(LumenPhoneCountries.forRegion("CO"))
    }
    var phone by remember {
        mutableStateOf(LumenPhoneNumber.empty(defaultCountry))
    }

    LumenPhoneInput(
        label = "Hospital or OB phone number",
        value = phone,
        onValueChange = { phone = it }
    )
}`,
      apple: `@State private var phone = LumenPhoneNumber.empty(
    country: LumenPhoneCountry(
        regionCode: "CO",
        callingCode: "+57",
        displayName: "Colombia"
    )
)

LumenPhoneInput(
    "Hospital or OB phone number",
    value: $phone
)`,
      'react-native': `const colombia = getLumenPhoneCountry('CO', { locale: 'en-US' })
if (!colombia) throw new Error('Missing Colombia metadata')

const [phone, setPhone] = useState(() =>
  createEmptyLumenPhoneNumber(colombia)
)

<LumenPhoneInput
  label="Hospital or OB phone number"
  value={phone}
  onValueChange={setPhone}
/>`
    },
    exports: {
      android: 'LumenPhoneInput',
      apple: 'LumenPhoneInput',
      'react-native': 'LumenPhoneInput'
    },
    guidance:
      'Use for international phone entry that needs discoverable country selection and a validated E.164 result. Persist or dial e164 only when isValid is true.',
    maturity: {
      android: 'Supported',
      apple: 'Supported',
      'react-native': 'Supported'
    },
    name: 'Phone input',
    properties: [
      property(
        'value / onValueChange',
        'LumenPhoneNumber / callback',
        'Required',
        'Controls the country, editable national number, validity, and normalized E.164 result.'
      ),
      property(
        'countries',
        'Platform country collection',
        'Generated metadata',
        'Populates the searchable country picker.'
      ),
      property(
        'locale',
        'Platform locale',
        'Current locale',
        'Localizes generated country names and international paste resolution.'
      ),
      property(
        'description / errorMessage',
        'String?',
        'null',
        'Provides supporting text or an application-owned validation message.'
      ),
      property(
        'invalidNumberMessage',
        'String',
        'Enter a complete phone number.',
        'Localizes metadata-backed invalid-number feedback.'
      ),
      property(
        'showValidationError',
        'Boolean',
        'true',
        'Lets the application defer invalid-number feedback until its chosen interaction boundary.'
      ),
      property(
        'enabled / required',
        'Boolean',
        'true / false',
        'Controls native disabled and required presentation.'
      )
    ],
    slug: 'phone-input',
    summary:
      'Enter an international phone number with searchable countries, calling codes, formatting, validation, and E.164 output.'
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
      'Every tab exposes selected and disabled state, the tab list has a readable name, and the active panel is announced when selection changes.',
    category: 'Navigation',
    examples: {
      android: `LumenTabs(
    label = "Workspace views",
    options = workspaceTabs,
    value = activeTab,
    onValueChange = ::setActiveTab
) { selected ->
    WorkspaceTabPanel(selected)
}`,
      apple: `LumenTabs(
    "Workspace views",
    selection: $activeTab,
    options: workspaceTabs
) { selected in
    WorkspaceTabPanel(selected)
}`,
      'react-native': `<LumenTabs
  label="Workspace views"
  options={workspaceTabs}
  value={activeTab}
  onValueChange={setActiveTab}
>
  <WorkspaceTabPanel value={activeTab} />
</LumenTabs>`
    },
    exports: {
      android: 'LumenTabs',
      apple: 'LumenTabs',
      'react-native': 'LumenTabs'
    },
    guidance:
      'Use for two to five peer content views whose panel changes in place. Keep URL history and nested destination navigation in the application router; use Navigation bar for top-level app destinations.',
    name: 'Tabs',
    properties: [
      property('label', 'String', 'Required', 'Names the tab list for assistive technology.'),
      property(
        { android: 'panelAccessibilityLabel', 'react-native': 'panelAccessibilityLabel' },
        'String?',
        'Selected tab label',
        'Names the active panel using application-localized text without appending an English role description.'
      ),
      property(
        'options',
        {
          android: 'List<LumenSelectionOption>',
          apple: '[LumenSelectionOption<Value>]',
          'react-native': 'readonly LumenSelectionOption[]'
        },
        'Required',
        'Provides stable tab values, short labels, and optional disabled state.'
      ),
      property(
        { android: 'value', apple: 'selection', 'react-native': 'value' },
        { android: 'String', apple: 'Binding<Value>', 'react-native': 'string' },
        'Required',
        'Stores the active tab.'
      ),
      property(
        'onValueChange',
        {
          android: '(String) -> Unit',
          apple: 'Binding setter',
          'react-native': '(string) => void'
        },
        'Required',
        'Updates controlled tab selection.'
      ),
      property(
        { android: 'content', apple: 'content', 'react-native': 'children' },
        'Native content view',
        'Required',
        'Renders the active panel while Lumen owns the tab list and panel relationship.'
      )
    ],
    slug: 'tabs',
    summary: 'Switch a controlled native content panel from an accessible tab list.'
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
      'The title is a heading, recovery actions retain native focus order, and React Native and Compose expose configurable live-region behavior.',
    category: 'Feedback',
    examples: {
      android: `LumenErrorState(
    title = "Could not load projects",
    description = "Check your connection and try again.",
    kind = LumenErrorStateKind.Offline,
    reference = "REQ-4F82",
    actions = { LumenButton(onClick = ::retry) { Text("Try again") } }
)`,
      apple: `LumenErrorState(
    "Could not load projects",
    description: "Check your connection and try again.",
    kind: .offline,
    reference: "REQ-4F82"
) {
    LumenButton("Try again", action: retry)
}`,
      'react-native': `<LumenErrorState
  kind="offline"
  title="Could not load projects"
  description="Check your connection and try again."
  reference="REQ-4F82"
  actions={<LumenButton onPress={retry}>Try again</LumenButton>}
/>`
    },
    exports: {
      android: 'LumenErrorState',
      apple: 'LumenErrorState',
      'react-native': 'LumenErrorState'
    },
    guidance:
      'Use when a region or page cannot show its primary content. Keep retry and request policy in application state; use Banner when existing content remains useful.',
    name: 'Error state',
    properties: [
      property(
        'title',
        {
          android: 'String',
          apple: 'LocalizedStringKey',
          'react-native': 'string'
        },
        'Required',
        'Names the unavailable content or failed operation.'
      ),
      property(
        'kind',
        {
          android: 'LumenErrorStateKind',
          apple: 'LumenErrorStateKind',
          'react-native': 'error | offline'
        },
        'error',
        'Selects error or offline context and its default illustration.'
      ),
      property(
        'layout',
        {
          android: 'LumenErrorStateLayout',
          apple: 'LumenErrorStateLayout',
          'react-native': 'compact | default | page'
        },
        'default',
        'Adapts spacing and whether the state fills its available page height.'
      ),
      property(
        'reference',
        {
          android: 'String?',
          apple: 'String?',
          'react-native': 'string'
        },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Shows a safe support reference without exposing technical details.'
      ),
      property(
        'actions',
        {
          android: '(@Composable () -> Unit)?',
          apple: '@ViewBuilder () -> Actions',
          'react-native': 'ReactNode'
        },
        { android: 'null', apple: 'EmptyView', 'react-native': 'undefined' },
        'Provides application-owned recovery actions.'
      )
    ],
    slug: 'error-state',
    summary:
      'Explain an unavailable region or page and offer application-owned recovery.'
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
)`,
      'react-native': `<LumenGauge
  label="Thermal pressure"
  value={48}
  valueLabel="Fair"
  tone="warning"
/>`
    },
    exports: {
      android: 'LumenGauge',
      apple: 'LumenGauge',
      'react-native': 'LumenGauge'
    },
    guidance:
      'Use for a current bounded metric, not task completion. Use Progress when the value represents work moving toward completion.',
    name: 'Gauge',
    properties: [
      property(
        'label',
        { android: 'String', apple: 'LocalizedStringKey', 'react-native': 'string' },
        'Required',
        'Names the bounded metric.'
      ),
      property(
        'value',
        { android: 'Float', apple: 'Double', 'react-native': 'number' },
        'Required',
        'Provides the current value.'
      ),
      property(
        'max',
        { android: 'Float', apple: 'Double', 'react-native': 'number' },
        '100',
        'Provides the positive maximum.'
      ),
      property(
        'valueLabel',
        { android: 'String', apple: 'String', 'react-native': 'string' },
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
      'Show a normalized circular native metric with a formatted accessible value.'
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
)`,
      android: `LumenDateField(
    label = "Release date",
    value = releaseDateMillis,
    onValueChange = { releaseDateMillis = it },
    minDateMillis = todayUtcMillis,
    description = "Choose when this version becomes available."
)`,
      'react-native': `<LumenDateField
  label="Release date"
  value={releaseDate}
  onValueChange={setReleaseDate}
  minimumDate={new Date()}
  description="Choose when this version becomes available."
/>`
    },
    exports: {
      android: 'LumenDateField',
      apple: 'LumenDateField',
      'react-native': 'LumenDateField'
    },
    guidance:
      'Use for native date input that needs Lumen supporting and validation context. SwiftUI also supports time and combined date-time input.',
    name: 'Date field',
    properties: [
      property(
        { android: 'label', apple: 'title', 'react-native': 'label' },
        { android: 'String', apple: 'LocalizedStringKey', 'react-native': 'string' },
        'Required',
        'Labels the native date picker.'
      ),
      property(
        { android: 'value / onValueChange', apple: 'selection', 'react-native': 'value / onValueChange' },
        { android: 'Long? / (Long) -> Unit', apple: 'Binding<Date>', 'react-native': 'Date | null / callback' },
        'Required',
        'Stores the selected native date value.'
      ),
      property(
        { apple: 'components' },
        { apple: 'date · dateAndTime · time' },
        { apple: 'date' },
        'Chooses the visible date and time parts.'
      ),
      property(
        { android: 'minDateMillis / maxDateMillis', apple: 'bounds', 'react-native': 'minimumDate / maximumDate' },
        {
          android: 'Long?',
          apple: 'unbounded · closed · from · through',
          'react-native': 'Date?'
        },
        { android: 'null', apple: 'unbounded', 'react-native': 'undefined' },
        'Constrains selection using native picker bounds.'
      ),
      property(
        'description / errorMessage',
        { android: 'String?', apple: 'LocalizedStringKey?', 'react-native': 'string?' },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Shows supporting text or a semantic danger validation message.'
      )
    ],
    slug: 'date-field',
    summary:
      'Select a native date with bounds and validation context.'
  },
  {
    accessibility:
      'The range and each native control remain labeled, and selection prevents an end date from preceding its start.',
    category: 'Forms',
    examples: {
      apple: `LumenDateRangeField(
    "Release window",
    start: $releaseStart,
    end: $releaseEnd,
    bounds: .from(.now),
    description: "Choose when this release is available."
)`,
      android: `LumenDateRangeField(
    label = "Release window",
    value = releaseRange,
    onValueChange = { releaseRange = it },
    minDateMillis = todayUtcMillis,
    description = "Choose when this release is available."
)`,
      'react-native': `<LumenDateRangeField
  label="Release window"
  value={releaseRange}
  onValueChange={setReleaseRange}
  minimumDate={new Date()}
  description="Choose when this release is available."
/>`
    },
    exports: {
      android: 'LumenDateRangeField',
      apple: 'LumenDateRangeField',
      'react-native': 'LumenDateRangeField'
    },
    guidance:
      'Use for an inclusive native date range. Keep values controlled and provide product-specific validation copy when additional rules apply.',
    name: 'Date range field',
    properties: [
      property(
        { android: 'label', apple: 'title', 'react-native': 'label' },
        { android: 'String', apple: 'LocalizedStringKey', 'react-native': 'string' },
        'Required',
        'Labels the inclusive date range.'
      ),
      property(
        { android: 'value / onValueChange', apple: 'start / end', 'react-native': 'value / onValueChange' },
        {
          android: 'LumenDateRangeSelection / callback',
          apple: 'Binding<Date> pair',
          'react-native': 'LumenDateRangeValue / callback'
        },
        'Required',
        'Stores the controlled start and end values.'
      ),
      property(
        { android: 'minDateMillis / maxDateMillis', apple: 'bounds', 'react-native': 'minimumDate / maximumDate' },
        {
          android: 'Long?',
          apple: 'unbounded · closed · from · through',
          'react-native': 'Date?'
        },
        { android: 'null', apple: 'unbounded', 'react-native': 'undefined' },
        'Constrains both dates using the native picker contract.'
      ),
      property(
        'description / errorMessage',
        { android: 'String?', apple: 'LocalizedStringKey?', 'react-native': 'string?' },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Shows supporting text or a semantic danger validation message.'
      )
    ],
    slug: 'date-range-field',
    summary:
      'Select an inclusive native date range with coordinated bounds and validation context.'
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
      'Localized or verbatim content preserves native Dynamic Type and adapts semantic tone to WidgetKit rendering modes.',
    category: 'WidgetKit',
    examples: {
      apple: `LumenWidgetText(
    .verbatim(statusTitle),
    style: .title,
    tone: .accent
)`
    },
    exports: { apple: 'LumenWidgetText' },
    guidance:
      'Use in WidgetKit extensions that need semantic text without linking the complete LumenUI catalog. Keep family-specific layout in the widget.',
    name: 'Widget text',
    properties: [
      property('content', 'LumenWidgetTextContent', 'Required', 'Preserves localized or verbatim text.'),
      property('style', 'body · caption · label · metric · title', 'body', 'Uses a native semantic font.'),
      property('tone', 'primary · secondary · accent · success · warning · danger', 'primary', 'Adapts color to the WidgetKit rendering mode.')
    ],
    slug: 'widget-text',
    summary: 'Render focused WidgetKit text with native scaling and semantic rendering-mode color.'
  },
  {
    accessibility:
      'The SF Symbol is decorative without a label and exposes the supplied accessible name when it conveys meaning.',
    category: 'WidgetKit',
    examples: {
      apple: `LumenWidgetIcon(
    systemName: "timer",
    label: .verbatim("Active timer"),
    tone: .accent
)`
    },
    exports: { apple: 'LumenWidgetIcon' },
    guidance:
      'Use for compact WidgetKit SF Symbols. Keep product artwork and asset catalogs in the application.',
    name: 'Widget icon',
    properties: [
      property('systemName', 'String', 'Required', 'Selects an application-approved SF Symbol.'),
      property('label', 'LumenWidgetTextContent?', 'nil', 'Names a meaningful icon.'),
      property('tone', 'LumenWidgetTone', 'accent', 'Adapts the symbol across rendering modes.'),
      property('size', 'CGFloat', '18', 'Sets the compact symbol dimension.')
    ],
    slug: 'widget-icon',
    summary: 'Render a labeled or decorative WidgetKit SF Symbol with semantic tone.'
  },
  {
    accessibility:
      'Icon and text combine into one concise status, while increased contrast strengthens the visible outline.',
    category: 'WidgetKit',
    examples: {
      apple: `LumenWidgetBadge(
    .verbatim("Ready"),
    iconSystemName: "checkmark.circle.fill",
    tone: .success
)`
    },
    exports: { apple: 'LumenWidgetBadge' },
    guidance:
      'Use for short WidgetKit status. Keep actions as native Button or App Intent interactions outside the badge.',
    name: 'Widget badge',
    properties: [
      property('label', 'LumenWidgetTextContent', 'Required', 'Provides the compact status text.'),
      property('iconSystemName', 'String?', 'nil', 'Adds a decorative SF Symbol.'),
      property('tone', 'LumenWidgetTone', 'accent', 'Selects the semantic status treatment.')
    ],
    slug: 'widget-badge',
    summary: 'Present a compact rendering-mode-aware WidgetKit status badge.'
  },
  {
    accessibility:
      'Label and value combine as one readable metric while native semantic fonts preserve accessibility text scaling.',
    category: 'WidgetKit',
    examples: {
      apple: `LumenWidgetCompactStat(
    label: .verbatim("Duration"),
    value: .verbatim("01:15"),
    iconSystemName: "timer"
)`
    },
    exports: { apple: 'LumenWidgetCompactStat' },
    guidance:
      'Use for one compact label and value pair. Keep charts, timelines, and domain formatting application-owned.',
    name: 'Widget compact stat',
    properties: [
      property('label', 'LumenWidgetTextContent', 'Required', 'Names the metric.'),
      property('value', 'LumenWidgetTextContent', 'Required', 'Provides the formatted metric value.'),
      property('iconSystemName', 'String?', 'nil', 'Adds a decorative semantic symbol.'),
      property('tone', 'LumenWidgetTone', 'accent', 'Selects the value tone.')
    ],
    slug: 'widget-compact-stat',
    summary: 'Compose a compact WidgetKit label and value with optional semantic icon.'
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
      'Images are decorative when their label is absent; a label exposes the complete image as one native accessibility element.',
    category: 'Data display',
    examples: {
      android: `LumenImage(
    painter = painterResource(R.drawable.mountain_valley),
    label = "Mountain valley at sunrise",
    aspectRatio = 16f / 9f,
    fit = LumenImageFit.Cover
)`,
      apple: `LumenImage(
    aspectRatio: 16 / 9,
    fit: .cover,
    label: "Mountain valley at sunrise"
) {
    Image("mountain-valley").resizable()
}`,
      'react-native': `<LumenImage
  aspectRatio={16 / 9}
  fit="cover"
  label="Mountain valley at sunrise"
  source={{ uri: imageUrl }}
/>`
    },
    exports: {
      android: 'LumenImage',
      apple: 'LumenImage',
      'react-native': 'LumenImage'
    },
    guidance:
      'Use for product imagery that needs shared fitting, aspect ratio, radius, and labeling. Keep decoding, caching, network policy, placeholders, retries, and optimizer behavior in the application or platform loader.',
    name: 'Image',
    properties: [
      property(
        { android: 'painter', apple: 'content', 'react-native': 'source' },
        'Native image source or content',
        'Required',
        'Supplies image pixels through the platform-native delivery path.'
      ),
      property(
        'fit',
        { android: 'Contain · Cover', apple: 'contain · cover', 'react-native': 'contain · cover' },
        'cover',
        'Controls how the image fits its available bounds.'
      ),
      property(
        'aspectRatio',
        { android: 'Float?', apple: 'CGFloat?', 'react-native': 'number' },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Reserves a positive finite width-to-height ratio when provided.'
      ),
      property(
        'radius',
        { android: 'None · Sm · Md · Lg · Full', apple: 'none · sm · md · lg · full', 'react-native': 'none · sm · md · lg · full' },
        'lg',
        'Clips the image with a shared semantic corner radius.'
      ),
      property(
        'label',
        { android: 'String?', apple: 'String?', 'react-native': 'string' },
        { android: 'null', apple: 'nil', 'react-native': 'undefined' },
        'Names meaningful imagery; omit only for decorative images.'
      )
    ],
    slug: 'image',
    summary:
      'Present native images with shared fit, ratio, radius, and accessibility behavior.'
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
      property('dismissible', 'Boolean', 'true', 'Allows platform gestures, back actions, and backdrop dismissal. Set false while application work requires the sheet to remain open.'),
      property('scrollable', 'Boolean', 'true', 'Scrolls content with reachable actions. Short windows and accessibility text sizes may scroll the complete sheet; set false for application-owned lazy or virtualized containers.'),
      property(
        { 'react-native': 'initialFocusRef / returnFocusRef' },
        'RefObject<HostInstance | null>',
        'undefined',
        'Optionally focuses an accessible application-owned control after presentation and restores its trigger after closing.'
      ),
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
      android: `@Composable
fun DurationMetric(elapsed: String) {
    LumenWearMetric(label = "Duration", value = elapsed, tone = LumenWearTone.Brand)
}`,
      apple: 'LumenWatchMetric("Duration", value: elapsed, tone: .brand)'
    },
    exports: { android: 'LumenWearMetric', apple: 'LumenWatchMetric' },
    guidance:
      'Use for one high-priority value with a short label. Avoid dashboard grids that overload small round screens.',
    maturity: { android: 'Supported' },
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
      android: `@Composable
fun TimerHistoryRow() {
    LumenWearListRow { TimerHistoryLabel() }
}`,
      apple: 'LumenWatchListRow { TimerHistoryLabel() }'
    },
    exports: { android: 'LumenWearListRow', apple: 'LumenWatchListRow' },
    guidance:
      'Use inside native wearable scrolling containers. Keep list state, selection, navigation, and rotary input in the application.',
    maturity: { android: 'Supported' },
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

const advancedInputDefinitions: ComponentDefinition[] = [
  {
    accessibility: 'Names the selected time and native dialog actions; confirmation publishes the draft, cancellation preserves the value, and disabled or read-only fields cannot open selection.',
    category: 'Forms',
    examples: {
      'react-native': `import { useState } from 'react'
import { LumenTimeField, type LumenTimeSelection } from '@santi020k/lumen-react-native/datetime'

export function MeetingTime() {
  const [time, setTime] = useState<LumenTimeSelection | null>(null)
  return <LumenTimeField label="Meeting time" value={time} onValueChange={setTime}
    minTime={{ hour: 8, minute: 30 }} maxTime={{ hour: 17, minute: 0 }}
    confirmLabel="Confirm" dismissLabel="Cancel" />
}`,
      apple: `import LumenUI
import SwiftUI

struct MeetingTime: View {
    @State private var time: LumenTimeSelection? = nil
    var body: some View {
        LumenTimeField("Meeting time", selection: $time,
            minTime: LumenTimeSelection(hour: 8, minute: 30),
            maxTime: LumenTimeSelection(hour: 17, minute: 0))
    }
}`,
      android: `LumenTimeField(
    label = "Meeting time",
    value = meetingTime,
    onValueChange = { meetingTime = it },
    minTime = LumenTimeSelection(8, 30),
    maxTime = LumenTimeSelection(17, 0)
)` },
    exports: { android: 'LumenTimeField', apple: 'LumenTimeField', 'react-native': 'LumenTimeField' },
    guidance: 'Use a local wall-clock value rather than an epoch timestamp. Keep dates, time zones, overnight scheduling, and translated labels in the application.',
    name: 'Time field',
    platformProperties: {
      'react-native': [
        property('label', 'string', 'Required', 'Names the time field.'),
        property('value / onValueChange', 'LumenTimeSelection | null / (LumenTimeSelection) => void', 'Required', 'Controls confirmed local hour and minute.'),
        property('minTime / maxTime', 'LumenTimeSelection', 'undefined', 'Inclusive same-day bounds; minimum must not exceed maximum.'),
        property('is24Hour / locale', 'boolean / string', 'System preference / undefined', 'Formats the selected time.'),
        property('placeholder / confirmLabel / dismissLabel / rangeErrorLabel', 'string', 'Choose a time / Confirm / Cancel / Choose a time within the allowed range', 'Localizes empty, confirmation, cancellation and validation copy.'),
        property('safeAreaInsets', 'LumenSafeAreaInsets', 'Zero insets', 'Supplies application safe-area insets for the iOS sheet.'),
        property('description / errorMessage', 'string', 'undefined', 'Provides localized supporting copy or host validation.'),
        property('enabled / readOnly', 'boolean', 'true / false', 'Blocks changes without clearing controlled state.')
      ],
      apple: [
        property('_ label', 'String', 'Required', 'Names the time field.'),
        property('selection', 'Binding<LumenTimeSelection?>', 'Required', 'Controls confirmed hour and minute.'),
        property('minTime / maxTime', 'LumenTimeSelection?', 'nil', 'Inclusive same-day bounds; minimum must not exceed maximum.'),
        property('placeholder / confirmLabel / dismissLabel / rangeErrorLabel', 'String', 'Choose a time / Confirm / Cancel / Choose a time within the allowed range', 'Localizes empty, confirmation, cancellation and validation copy.'),
        property('.environment(\\.locale, ...)', 'Locale', 'Environment', 'Formats the selected time with the native locale.'),
        property('description / errorMessage', 'String?', 'nil', 'Provides localized supporting copy or host validation.'),
        property('readOnly / .disabled(...)', 'Bool', 'false', 'Blocks editing; disabled state comes from the SwiftUI environment.')
      ]
    },
    properties: [
      property('label', 'String', 'Required', 'Names the field and selection dialog.'),
      property('value / onValueChange', 'LumenTimeSelection? / (LumenTimeSelection) -> Unit', 'Required', 'Controls the confirmed local hour and minute.'),
      property('modifier', 'Modifier', 'Modifier', 'Applies layout and semantics to the field group.'),
      property('minTime / maxTime', 'LumenTimeSelection?', 'null', 'Inclusive same-day bounds; minimum must not exceed maximum.'),
      property('is24Hour', 'Boolean?', 'null', 'Follows the system preference unless explicitly set.'),
      property('description / errorMessage', 'String?', 'null', 'Shows supporting context or host validation.'),
      property('placeholder', 'String', 'Choose a time', 'Displays the empty state.'),
      property('confirmLabel / dismissLabel', 'String', 'Confirm / Cancel', 'Names the native confirmation and cancellation actions.'),
      property('inputLabel / dialLabel', 'String', 'Use keyboard / Use clock', 'Names the input mode switch.'),
      property('rangeErrorLabel', 'String', 'Choose a time within the allowed range', 'Explains invalid draft selection.'),
      property('enabled / readOnly', 'Boolean', 'true / false', 'Controls editing and dismisses open selection when editing becomes unavailable.')
    ],
    slug: 'time-field',
    summary: 'Choose a local time with native clock or keyboard input and explicit confirmation.'
  },
  {
    accessibility: 'Preserves native editable dropdown focus, selected and disabled option semantics, and announced loading, empty, and recovery states.',
    category: 'Forms',
    examples: {
      'react-native': `import { useState } from 'react'
import { LumenAutocomplete } from '@santi020k/lumen-react-native'

const projects = [{ value: 'lumen', label: 'Lumen' }, { value: 'studio', label: 'Studio' }]
export function ProjectSearch() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string>()
  const matches = projects.filter(option => option.label.toLowerCase().includes(query.toLowerCase()))
  return <LumenAutocomplete label="Project" query={query}
    onQueryChange={next => { setQuery(next); setSelected(undefined) }}
    options={matches} value={selected} onValueChange={setSelected}
    emptyLabel="No projects" dismissLabel="Close results" />
}`,
      apple: `import LumenUI
import SwiftUI

struct ProjectSearch: View {
    @State private var query = ""
    @State private var selected: String? = nil
    private let projects = [LumenAutocompleteOption(value: "lumen", label: "Lumen"),
                            LumenAutocompleteOption(value: "studio", label: "Studio")]
    var body: some View {
        LumenAutocomplete("Project", query: $query, selection: $selected,
            options: projects.filter { query.isEmpty || $0.label.localizedCaseInsensitiveContains(query) },
            emptyLabel: "No projects", dismissLabel: "Close results")
    }
}`,
      android: `LumenAutocomplete(
    label = "Project",
    query = query,
    onQueryChange = { query = it; selectedProject = null },
    options = matchingProjects,
    value = selectedProject,
    onValueChange = { selectedProject = it },
    loading = searching,
    resultsErrorMessage = searchError,
    onRetry = ::retrySearch
)` },
    exports: { android: 'LumenAutocomplete', apple: 'LumenAutocomplete', 'react-native': 'LumenAutocomplete' },
    guidance: 'The application supplies filtered results with unique non-null values, owns request cancellation, and clears stale selection after query edits. React Native and Compose selection emit the option label before the selected value; SwiftUI updates bindings directly.',
    name: 'Autocomplete',
    platformProperties: {
      'react-native': [
        property('label', 'string', 'Required', 'Names the search field.'),
        property('query / onQueryChange', 'string / (string) => void', 'Required', 'Controls query text; the host filters results.'),
        property('value / onValueChange', 'string | undefined / (string) => void', 'undefined / Required', 'Controls selection; clear stale selection in the query handler.'),
        property('options', 'readonly LumenAutocompleteOption[]', 'Required', 'Unique string values with label, description and disabled state.'),
        property('loading / resultsErrorMessage / onRetry', 'boolean / string / () => void', 'false / undefined / undefined', 'Hides stale results and offers application-owned recovery.'),
        property('loadingLabel / emptyLabel / retryLabel / dismissLabel', 'string', 'Loading results / No results / Retry / Close results', 'Localizes status and result dismissal.'),
        property('ref / TextInput props', 'LumenTextInputRef / TextInputProps', 'undefined', 'Forwards native input focus and supported input options.'),
        property('description / errorMessage', 'string', 'undefined', 'Provides localized supporting copy or host validation.'),
        property('enabled / readOnly', 'boolean', 'true / false', 'Blocks changes without clearing controlled state.')
      ],
      apple: [
        property('_ label', 'String', 'Required', 'Names the editable search field.'),
        property('query / selection', 'Binding<String> / Binding<Value?>', 'Required', 'Controls query and selected identity; the component clears selection on query edits.'),
        property('options', '[LumenAutocompleteOption<Value>]', 'Required', 'Unique Hashable values with label, description and disabled state.'),
        property('loading / resultsErrorMessage / onRetry', 'Bool / String? / (() -> Void)?', 'false / nil / nil', 'Hides stale results and offers application-owned recovery.'),
        property('loadingLabel / emptyLabel / retryLabel / dismissLabel', 'String', 'Loading results / No results / Retry / Close results', 'Localizes status and result dismissal.'),
        property('description / errorMessage', 'String?', 'nil', 'Provides localized supporting copy or host validation.'),
        property('readOnly / .disabled(...)', 'Bool', 'false', 'Blocks editing; disabled state comes from the SwiftUI environment.')
      ]
    },
    properties: [
      property('label', 'String', 'Required', 'Names the editable field.'),
      property('query / onQueryChange', 'String / (String) -> Unit', 'Required', 'Controls the editable search text.'),
      property('options', 'List<LumenAutocompleteOption<T>>', 'Required', 'Supplies current results with value, label, optional description, and enabled state.'),
      property('value / onValueChange', 'T? / (T) -> Unit', 'null / Required', 'Controls selected result identity; option values must be unique and non-null.'),
      property('modifier', 'Modifier', 'Modifier', 'Applies layout and semantics to the dropdown container.'),
      property('description / errorMessage', 'String?', 'null', 'Shows supporting text or field validation.'),
      property('loading', 'Boolean', 'false', 'Shows loading feedback instead of stale results.'),
      property('resultsErrorMessage / onRetry', 'String? / (() -> Unit)?', 'null', 'Shows a result failure and optional application-owned retry.'),
      property('loadingLabel / emptyLabel / retryLabel', 'String', 'Loading results / No results / Retry', 'Localizes result status and recovery.'),
      property('enabled / readOnly', 'Boolean', 'true / false', 'Controls query edits and dismisses open results when editing becomes unavailable.')
    ],
    slug: 'autocomplete',
    summary: 'Select from application-provided search results with loading, empty, and retry feedback.'
  },
  {
    accessibility: 'Labels the editable numeric draft and step actions, exposes invalid or out-of-range context, and disables unavailable or read-only steps.',
    category: 'Forms',
    examples: {
      'react-native': `import { useState } from 'react'
import { LumenNumberField } from '@santi020k/lumen-react-native'

export function Quantity() {
  const [draft, setDraft] = useState('1')
  return <LumenNumberField label="Quantity" value={draft} onValueChange={setDraft}
    min="0" max="10" step="0.5" locale="en-US"
    incrementLabel="Increase quantity" decrementLabel="Decrease quantity" />
}`,
      apple: `import LumenUI
import SwiftUI

struct Quantity: View {
    @State private var draft = "1"
    var body: some View {
        LumenNumberField("Quantity", text: $draft, min: "0", max: "10", step: "0.5",
            incrementLabel: "Increase quantity", decrementLabel: "Decrease quantity")
            .environment(\\.locale, Locale(identifier: "en_US"))
    }
}`,
      android: `LumenNumberField(
    label = "Quantity",
    value = quantityDraft,
    onValueChange = { quantityDraft = it },
    min = java.math.BigDecimal.ZERO,
    max = java.math.BigDecimal.TEN,
    step = java.math.BigDecimal("0.5")
)` },
    exports: { android: 'LumenNumberField', apple: 'LumenNumberField', 'react-native': 'LumenNumberField' },
    guidance: 'Preserve the raw localized String draft, including unfinished sign or decimal input. Grouping and exponent notation are unsupported. Keep currency, units, required validation, and submission parsing application-owned.',
    name: 'Number field',
    platformProperties: {
      'react-native': [
        property('label', 'string', 'Required', 'Names the numeric field.'),
        property('value / onValueChange', 'string / (string) => void', 'Required', 'Retains raw localized drafts; invalid drafts remain editable.'),
        property('min / max / step', 'string', 'undefined / undefined / 1', 'Uses exact decimal strings for inclusive bounds and positive steps.'),
        property('locale', 'string', 'undefined', 'Selects accepted decimal separator and digits.'),
        property('incrementLabel / decrementLabel', 'string', 'Increase value / Decrease value', 'Names step actions.'),
        property('invalidNumberLabel / outOfRangeLabel', 'string', 'Enter a valid number / Enter a number within the allowed range', 'Localizes draft validation.'),
        property('showStepper', 'boolean', 'true', 'Shows step actions.'),
        property('ref / TextInput props', 'LumenTextInputRef / TextInputProps', 'undefined', 'Forwards input focus and supported native options.'),
        property('description / errorMessage', 'string', 'undefined', 'Provides localized supporting copy or host validation.'),
        property('enabled / readOnly', 'boolean', 'true / false', 'Blocks changes without clearing controlled state.')
      ],
      apple: [
        property('_ label / text', 'String / Binding<String>', 'Required', 'Names the field and retains raw localized drafts.'),
        property('min / max / step', 'String? / String? / String', 'nil / nil / 1', 'Uses exact decimal strings; the application owns units and submission parsing.'),
        property('incrementLabel / decrementLabel', 'String', 'Increase value / Decrease value', 'Names step actions.'),
        property('invalidNumberLabel / outOfRangeLabel', 'String', 'Enter a valid number / Enter a number within the allowed range', 'Localizes draft validation.'),
        property('showStepper', 'Bool', 'true', 'Shows step actions.'),
        property('focused', 'FocusState<Bool>.Binding?', 'nil', 'Connects application-owned input focus.'),
        property('.environment(\\.locale, ...)', 'Locale', 'Environment', 'Selects decimal separator and displayed digits.'),
        property('description / errorMessage', 'String?', 'nil', 'Provides localized supporting copy or host validation.'),
        property('readOnly / .disabled(...)', 'Bool', 'false', 'Blocks editing; disabled state comes from the SwiftUI environment.')
      ]
    },
    properties: [
      property('label', 'String', 'Required', 'Names the numeric field.'),
      property('value / onValueChange', 'String / (String) -> Unit', 'Required', 'Controls raw localized ungrouped input; drafts beyond 128 characters are invalid.'),
      property('modifier', 'Modifier', 'Modifier', 'Applies layout to the field and step actions.'),
      property('min / max', 'java.math.BigDecimal?', 'null', 'Inclusive exact decimal bounds; minimum must not exceed maximum.'),
      property('step', 'java.math.BigDecimal', 'BigDecimal.ONE', 'Positive exact increment; precision and scale are bounded to 128.'),
      property('locale', 'java.util.Locale', 'Locale.getDefault()', 'Selects accepted decimal separator and displayed digits.'),
      property('description / errorMessage', 'String?', 'null', 'Shows supporting text; supplied errors take priority over draft validation.'),
      property('invalidNumberLabel / outOfRangeLabel', 'String', 'Enter a valid number / Enter a number within the allowed range', 'Localizes draft and bound errors.'),
      property('incrementLabel / decrementLabel', 'String', 'Increase value / Decrease value', 'Names step actions.'),
      property('showStepper', 'Boolean', 'true', 'Shows optional increment and decrement actions.'),
      property('enabled / readOnly', 'Boolean', 'true / false', 'Controls edits and steps without discarding the current value.')
    ],
    slug: 'number-field',
    summary: 'Edit localized numeric drafts with exact decimal steps and inclusive bounds.'
  },
  {
    accessibility: 'Provides a named refresh accessibility action alongside the native gesture, announces progress, and removes refresh actions while disabled or busy.',
    category: 'Feedback',
    examples: { android: `LumenPullToRefresh(
    isRefreshing = refreshing,
    onRefresh = ::refreshProjects,
    refreshLabel = "Refresh projects",
    refreshingLabel = "Refreshing projects"
) {
    LazyColumn { /* application-owned rows */ }
}` },
    exports: { android: 'LumenPullToRefresh' },
    guidance: 'Wrap the existing scrollable content. Keep requests, cancellation, retry policy, and completion in application code. Disabled state removes gestures while an already-running host operation retains feedback.',
    name: 'Pull to refresh',
    properties: [
      property('isRefreshing / onRefresh', 'Boolean / () -> Unit', 'Required', 'Controls progress and starts application-owned refresh work.'),
      property('modifier', 'Modifier', 'Modifier', 'Applies container layout and accessibility.'),
      property('enabled', 'Boolean', 'true', 'Enables the refresh gesture and accessible action when idle.'),
      property('refreshLabel / refreshingLabel', 'String', 'Refresh / Refreshing', 'Localizes the action and progress state.'),
      property('content', '@Composable BoxScope.() -> Unit', 'Required', 'Renders application-owned scrolling content.')
    ],
    slug: 'pull-to-refresh',
    summary: 'Refresh existing scrollable content with native gestures and accessible progress.'
  }
]

const authenticationAndMediaDefinitions: ComponentDefinition[] = [
  {
    accessibility: 'Preserves password semantics and native autofill hints; labels visibility actions and hides on blur or disabled state.',
    category: 'Forms',
    examples: {
      'react-native': `import { useState } from 'react'
import { LumenPasswordField } from '@santi020k/lumen-react-native'

export function RegistrationPassword() {
  const [password, setPassword] = useState('')
  return <LumenPasswordField label="Password" value={password} onValueChange={setPassword}
    newPassword showLabel="Show password" hideLabel="Hide password" />
}`,
      apple: `import LumenUI
import SwiftUI

struct RegistrationPassword: View {
    @State private var password = ""
    var body: some View {
        LumenPasswordField("Password", text: $password,
            showLabel: "Show password", hideLabel: "Hide password", newPassword: true)
    }
}`,
      android: `LumenPasswordField(
    label = "Password", value = password,
    onValueChange = { password = it },
    showLabel = "Show password", hideLabel = "Hide password"
)` },
    exports: { android: 'LumenPasswordField', apple: 'LumenPasswordField', 'react-native': 'LumenPasswordField' },
    guidance: 'Keep authentication and credential lifecycle in the application. Visibility is transient and never saved. Use newPassword for registration; provider autofill needs device configuration.',
    name: 'Password field',
    platformProperties: {
      'react-native': [
        property('label / value / onValueChange', 'string / string / (string) => void', 'Required', 'Names and controls secure entry.'),
        property('showLabel / hideLabel', 'string', 'Show password / Hide password', 'Names transient visibility actions.'),
        property('newPassword', 'boolean', 'false', 'Selects registration autofill hints.'),
        property('ref / onSubmitEditing / TextInput props', 'LumenTextInputRef / TextInputProps', 'undefined', 'Forwards input focus and native submission events; the host authenticates.'),
        property('description / errorMessage', 'string', 'undefined', 'Provides localized supporting copy or host validation.'),
        property('enabled / readOnly', 'boolean', 'true / false', 'Blocks changes without clearing controlled state.')
      ],
      apple: [
        property('_ label / text', 'String / Binding<String>', 'Required', 'Names and controls secure entry.'),
        property('showLabel / hideLabel', 'String', 'Show password / Hide password', 'Names visibility actions; visibility clears on blur or editing becoming unavailable.'),
        property('newPassword', 'Bool', 'false', 'Selects native registration autofill hints where supported.'),
        property('description / errorMessage', 'String?', 'nil', 'Provides localized supporting copy or host validation.'),
        property('readOnly / .disabled(...)', 'Bool', 'false', 'Blocks editing; disabled state comes from the SwiftUI environment.')
      ]
    },
    properties: [
      property('label / value / onValueChange', 'String / String / (String) -> Unit', 'Required', 'Names the native field and controls its value.'),
      property('modifier', 'Modifier', 'Modifier', 'Applies layout and semantics.'),
      property('description / errorMessage', 'String?', 'null', 'Provides translated help or validation.'),
      property('showLabel / hideLabel', 'String', 'Show password / Hide password', 'Names the visibility action.'),
      property('newPassword', 'Boolean', 'false', 'Uses Android new-password instead of existing-password autofill hints.'),
      property('onSubmit', '(() -> Unit)?', 'null', 'Handles the IME Done action without automatic authentication.'),
      property('enabled / readOnly', 'Boolean', 'true / false', 'Controls editing and visibility actions.')
    ],
    slug: 'password-field',
    summary: 'Enter passwords with transient visibility and native credential autofill hints.'
  },
  {
    accessibility: 'Uses one native input for paste, selection, deletion, and SMS code autofill; supports errors and optional masking.',
    category: 'Forms',
    examples: {
      'react-native': `import { useState } from 'react'
import { LumenInputOTP } from '@santi020k/lumen-react-native'

export function VerificationCode() {
  const [code, setCode] = useState('')
  return <LumenInputOTP label="Verification code" value={code} onValueChange={setCode}
    length={6} description="Enter or paste six digits" />
}`,
      apple: `import LumenUI
import SwiftUI

struct VerificationCode: View {
    @State private var code = ""
    var body: some View {
        LumenInputOTP("Verification code", text: $code, length: 6,
            description: "Enter or paste six digits")
    }
}`,
      android: `LumenInputOTP(
    label = "Verification code", value = code,
    onValueChange = { code = it }, length = 6,
    description = "Enter or paste six digits"
)` },
    exports: { android: 'LumenInputOTP', apple: 'LumenInputOTP', 'react-native': 'LumenInputOTP' },
    guidance: 'The application verifies codes and owns submission. Normalize localized digit input into ASCII; reject invalid or excess input without truncating. Never send or persist credentials from the component.',
    name: 'Input OTP',
    platformProperties: {
      'react-native': [
        property('label / value / onValueChange', 'string / string / (string) => void', 'Required', 'Controls at most length ASCII digits; localized edits normalize to ASCII.'),
        property('length', 'number', '6', 'Accepts code lengths from one through twelve.'),
        property('masked', 'boolean', 'false', 'Hides displayed digits.'),
        property('onComplete', '(string) => void', 'undefined', 'Reports a newly completed edit; the host verifies and submits.'),
        property('ref / TextInput props', 'LumenTextInputRef / TextInputProps', 'undefined', 'Preserves native paste, selection and focus.'),
        property('description / errorMessage', 'string', 'undefined', 'Provides localized supporting copy or host validation.'),
        property('enabled / readOnly', 'boolean', 'true / false', 'Blocks changes without clearing controlled state.')
      ],
      apple: [
        property('_ label / text', 'String / Binding<String>', 'Required', 'Controls at most length ASCII digits; localized edits normalize to ASCII.'),
        property('length', 'Int', '6', 'Accepts code lengths from one through twelve.'),
        property('masked', 'Bool', 'false', 'Hides displayed digits.'),
        property('onComplete', '(String) -> Void', 'Empty closure', 'Reports a newly completed edit; the host verifies and submits.'),
        property('description / errorMessage', 'String?', 'nil', 'Provides localized supporting copy or host validation.'),
        property('readOnly / .disabled(...)', 'Bool', 'false', 'Blocks editing; disabled state comes from the SwiftUI environment.')
      ]
    },
    properties: [
      property('label / value / onValueChange', 'String / String / (String) -> Unit', 'Required', 'Names the field and controls an ASCII digit value.'),
      property('modifier', 'Modifier', 'Modifier', 'Applies layout and semantics.'),
      property('length', 'Int', '6', 'Sets a bounded code length from one through twelve.'),
      property('description / errorMessage', 'String?', 'null', 'Provides translated help or validation.'),
      property('masked', 'Boolean', 'false', 'Hides displayed digits and applies password semantics.'),
      property('onComplete', '((String) -> Unit)?', 'null', 'Reports a newly completed edit without verifying or submitting.'),
      property('enabled / readOnly', 'Boolean', 'true / false', 'Controls native editing.')
    ],
    slug: 'input-otp',
    summary: 'Enter numeric verification codes with native paste and autofill integration.'
  },
  {
    accessibility: 'Keeps the anchor independently named and delegates long-press, pointer, and popup dismissal to Material.',
    category: 'Actions',
    examples: { apple: 'LumenTooltip("Project help", text: "Save this project", isPresented: $visible)', 'react-native': '<LumenTooltip label="Project help" text="Save this project" visible={visible} onVisibleChange={setVisible} />', android: `LumenTooltip("Save this project") {
    LumenIconButton(LumenIconName.Bookmark, "Save", onClick = ::saveProject, size = LumenControlSize.Lg)
}` },
    exports: { android: 'LumenTooltip', apple: 'LumenTooltip', 'react-native': 'LumenTooltip' },
    guidance: 'Use brief supplemental help. Essential instructions belong in visible content. Pass LumenTooltipState for explicit Compose show/dismiss controls; React Native uses visible/onVisibleChange and SwiftUI uses isPresented binding. Disabling dismisses help without removing the anchor.',
    name: 'Tooltip',
    properties: [
      property('text', 'String', 'Required', 'Provides non-empty translated contextual help.'),
      property('modifier', 'Modifier', 'Modifier', 'Applies anchor-container layout.'),
      property('state', 'LumenTooltipState', 'rememberLumenTooltipState()', 'Supports application-controlled visibility with Lumen state backed by Material.'),
      property('enabled', 'Boolean', 'true', 'Enables help and dismisses it when disabled.'),
      property('content', '@Composable () -> Unit', 'Required', 'Provides an independently labeled native anchor.')
    ],
    slug: 'tooltip',
    summary: 'Show native contextual help around an independently accessible anchor.'
  },
  {
    accessibility: 'Exposes a named native slider with localized percentage state for touch, keyboard, and screen-reader adjustment.',
    category: 'Data display',
    examples: {
      'react-native': `import { useState } from 'react'
import { LumenImageComparison } from '@santi020k/lumen-react-native'

export function CompareEdits() {
  const [position, setPosition] = useState(0.5)
  return <LumenImageComparison label="Compare edits"
    before={require('./before.png')} after={require('./after.png')}
    value={position} onValueChange={setPosition}
    beforeLabel="Before" afterLabel="After" />
}`,
      apple: `import LumenUI
import SwiftUI

struct CompareEdits: View {
    @State private var position = 0.5
    var body: some View {
        LumenImageComparison("Compare edits", value: $position,
            beforeLabel: "Before", afterLabel: "After") {
            Image("before").resizable().scaledToFill()
        } after: {
            Image("after").resizable().scaledToFill()
        }
    }
}`,
      android: `LumenImageComparison(
    label = "Compare edits", before = beforePainter, after = afterPainter,
    value = position, onValueChange = { position = it },
    beforeLabel = "Before", afterLabel = "After"
)` },
    exports: { android: 'LumenImageComparison', apple: 'LumenImageComparison', 'react-native': 'LumenImageComparison' },
    guidance: 'The value is the visible after fraction, clamped to zero through one; nonfinite input falls back to one half. The application owns image loading, errors, cache, fit and descriptions; provide React Native sources, SwiftUI content builders or Compose painters.',
    name: 'Image comparison',
    platformProperties: {
      'react-native': [
        property('label', 'string', 'Required', 'Names the adjustable reveal.'),
        property('before / after', 'ImageSourcePropType', 'Required', 'Application-owned sources; provide assets and loading policy.'),
        property('value / onValueChange', 'number / (number) => void', 'Required', 'Controls the visible after fraction, zero through one.'),
        property('beforeLabel / afterLabel', 'string', 'Before / After', 'Localizes image labels and adjustment state.'),
        property('aspectRatio', 'number', '16 / 9', 'Accepts 0.1 through 10; otherwise uses 16:9.'),
        property('fit', 'LumenImageFit', 'cover', 'Chooses cover or contain image behavior.'),
        property('locale', 'string', 'undefined', 'Formats the percentage.'),
        property('enabled', 'boolean', 'true', 'Disables adjustment while preserving images.'),
        property('style / View props', 'ViewProps', 'undefined', 'Applies native layout and accessibility props.')
      ],
      apple: [
        property('_ label', 'String', 'Required', 'Names the adjustable reveal.'),
        property('value', 'Binding<Double>', 'Required', 'Controls the visible after fraction, zero through one.'),
        property('before / after', '@ViewBuilder closures', 'Required', 'Provides application-owned SwiftUI image content and image fit modifiers.'),
        property('beforeLabel / afterLabel', 'String', 'Before / After', 'Localizes image labels and adjustment state.'),
        property('aspectRatio', 'CGFloat', '16 / 9', 'Accepts 0.1 through 10; otherwise uses 16:9.'),
        property('.environment(\\.locale, ...)', 'Locale', 'Environment', 'Formats the percentage.'),
        property('.disabled(...)', 'Bool', 'false', 'Disables the native slider while preserving images.')
      ]
    },
    properties: [
      property('label', 'String', 'Required', 'Names the comparison adjustment.'),
      property('before / after', 'Painter', 'Required', 'Provides native images with application-owned loading.'),
      property('value / onValueChange', 'Float / (Float) -> Unit', 'Required', 'Controls the visible after fraction from zero through one.'),
      property('modifier', 'Modifier', 'Modifier', 'Applies layout.'),
      property('beforeLabel / afterLabel', 'String', 'Before / After', 'Describes each image and the adjustment state.'),
      property('aspectRatio', 'Float', '16f / 9f', 'Uses ratios from 0.1 through 10; other input falls back to 16:9.'),
      property('fit', 'LumenImageFit', 'Cover', 'Chooses crop or contain behavior for both images.'),
      property('locale', 'Locale', 'Locale.getDefault()', 'Formats the visible fraction as a localized percentage.'),
      property('enabled', 'Boolean', 'true', 'Disables adjustment while retaining both images.')
    ],
    slug: 'image-comparison',
    summary: 'Compare two images with a controlled reveal and native adjustable slider.'
  }
]

const composeProductDefinitions: ComponentDefinition[] = [
  {
    accessibility: 'Exposes a screen heading and preserves native navigation, action, and window-inset semantics.',
    category: 'Navigation',
    examples: { android: `val behavior = rememberLumenTopAppBarScrollBehavior(LumenTopAppBarScrollMode.EnterAlways)
// Attach Modifier.nestedScroll(behavior.nestedScrollConnection) to the screen container.
LumenTopAppBar("Projects", scrollBehavior = behavior,
    navigationIcon = { LumenIconButton(LumenIconName.ArrowLeft, "Back", onClick = ::goBack) })` },
    exports: { android: 'LumenTopAppBar' },
    guidance: 'Use a remembered scrolling behavior and attach its nested-scroll connection above native scroll content. The application owns routing and Scaffold content padding.',
    name: 'Top app bar',
    properties: [
      property('title', 'String', 'Required', 'Provides the visible screen heading.'),
      property('size', 'LumenTopAppBarSize', 'Small', 'Selects Small, Medium, or Large native geometry.'),
      property('scrollBehavior', 'LumenTopAppBarScrollBehavior?', 'null', 'Coordinates Pinned, EnterAlways, or ExitUntilCollapsed behavior.'),
      property('navigationIcon / actions', '@Composable slots', 'Empty', 'Provides independently named application actions.'),
      property('modifier', 'Modifier', 'Modifier', 'Applies bar layout.')
    ],
    slug: 'top-app-bar',
    summary: 'Present native screen titles, navigation, and scrolling app bars.'
  },
  {
    accessibility: 'Provides RTL-aware gestures, named custom accessibility actions, and visible keyboard-usable action buttons.',
    category: 'Actions',
    examples: { android: `LumenSwipeActions(
    startAction = LumenSwipeAction("Favorite", ::favorite),
    endAction = LumenSwipeAction("Delete", ::requestDeleteConfirmation, destructive = true)
) { LumenText("Quarterly report") }` },
    exports: { android: 'LumenSwipeActions' },
    guidance: 'Use stable record keys. Transient gesture state resets before callbacks and never restores an operation. The application owns confirmation, undo, removal, and persistence.',
    name: 'Swipe actions',
    properties: [
      property('startAction / endAction', 'LumenSwipeAction?', 'null', 'Provides a non-empty label, callback, enabled flag, and optional destructive intent.'),
      property('enabled', 'Boolean', 'true', 'Disables gestures, buttons, and custom actions while busy.'),
      property('modifier', 'Modifier', 'Modifier', 'Applies outer layout.'),
      property('content', '@Composable () -> Unit', 'Required', 'Provides native record content.')
    ],
    slug: 'swipe-actions',
    summary: 'Expose logical start and end row actions with gesture alternatives.'
  },
  {
    accessibility: 'Uses a native dialog with named checkbox options, removal actions, validation, and read-only or disabled behavior.',
    category: 'Forms',
    examples: {
      apple: 'LumenMultiSelect("Teams", values: $teams, query: $query, options: matchingTeams)',
      'react-native': `<LumenMultiSelect label="Teams" values={teams} onValuesChange={setTeams}
  query={query} onQueryChange={setQuery} options={matchingTeams} />`,
      android: `LumenMultiSelect(
    label = "Teams", options = matchingTeams, values = selectedTeams,
    onValuesChange = { selectedTeams = it }, query = query, onQueryChange = { query = it },
    loading = searching, resultsErrorMessage = searchError, onRetry = ::retrySearch
)` },
    exports: { android: 'LumenMultiSelect', apple: 'LumenMultiSelect', 'react-native': 'LumenMultiSelect' },
    guidance: 'Selection applies immediately. The host owns search, asynchronous results, cancellation, and persistence. Missing selected options retain their raw value as a chip label. Localize every string and count/removal formatter.',
    name: 'Multi select',
    properties: [
      property('label / options', { android: 'String / List<LumenSelectionOption>', apple: 'String / [LumenAutocompleteOption<String>]', 'react-native': 'string / readonly LumenAutocompleteOption[]' }, 'Required', 'Names the field and supplies uniquely identified, readable results.'),
      property({ android: 'values / onValuesChange', apple: 'values', 'react-native': 'values / onValuesChange' }, { android: 'Set<String> / (Set<String>) -> Unit', apple: 'Binding<Set<String>>', 'react-native': 'ReadonlySet<string> / (values: Set<string>) => void' }, 'Required', 'Controls selection independently from visible results.'),
      property({ android: 'query / onQueryChange', apple: 'query', 'react-native': 'query / onQueryChange' }, { android: 'String / (String) -> Unit', apple: 'Binding<String>', 'react-native': 'string / callback' }, 'Required', 'Controls caller-owned search.'),
      property('loading / resultsErrorMessage / onRetry', { android: 'Boolean / String? / (() -> Unit)?', apple: 'Bool / String? / (() -> Void)?', 'react-native': 'boolean / string / callback' }, 'false / null / null', 'Provides loading, safe error, and recovery states.'),
      property('description / errorMessage', { android: 'String?', apple: 'String?', 'react-native': 'string' }, 'None', 'Provides help and separate form validation.'),
      property({ android: 'enabled / readOnly', apple: 'disabled / readOnly', 'react-native': 'enabled / readOnly' }, { android: 'Boolean', apple: 'Bool', 'react-native': 'boolean' }, 'true / false', 'Blocks editing and dismisses selection.'),
      property('chooseLabel / searchLabel / clearSearchLabel / doneLabel', { android: 'String', apple: 'String', 'react-native': 'string' }, 'English defaults', 'Localizes selection and dialog actions.'),
      property('emptyLabel / loadingLabel / retryLabel', { android: 'String', apple: 'String', 'react-native': 'string' }, 'English defaults', 'Localizes result states.'),
      property('selectionLabel / removeLabel', { android: '(Int) -> String / (String) -> String', apple: '(Int) -> String / (String) -> String', 'react-native': '(count: number) => string / (label: string) => string' }, 'English formatters', 'Localizes counts and chip removal.'),
      property({ 'react-native': 'safeAreaInsets' }, { 'react-native': 'LumenSafeAreaInsets' }, 'None', 'Passes the application safe-area provider insets into the native sheet.'),
      property({ android: 'modifier' }, { android: 'Modifier' }, { android: 'Modifier' }, 'Applies field layout.')
    ],
    slug: 'multi-select',
    summary: 'Select multiple searchable options with controlled values and result states.'
  },
  {
    accessibility: 'Exposes separately named lower and upper native thumbs with formatted spoken values and keyboard adjustment.',
    category: 'Forms',
    examples: {
      apple: `LumenRangeSlider("Capacity", value: $capacity, in: 0...100, step: 10,
    formatValue: { "\\(Int($0))%" })`,
      'react-native': `<LumenRangeSlider label="Capacity" value={capacity} onValueChange={setCapacity}
  min={0} max={100} step={10} formatValue={value => String(value) + '%'} />`,
      android: `LumenRangeSlider("Capacity", capacity, { capacity = it },
    valueRange = 0f..100f, steps = 9, startLabel = "Minimum", endLabel = "Maximum",
    formatValue = { "\${it.toInt()}%" })` },
    exports: { android: 'LumenRangeSlider', apple: 'LumenRangeSlider', 'react-native': 'LumenRangeSlider' },
    guidance: 'Bounds must be finite, increasing, and have a finite span. Nonfinite values fall back to bounds; reversed endpoints reorder for display without changing host state. Keep exact financial arithmetic in the application.',
    name: 'Range slider',
    properties: [
      property({ android: 'label / value / onValueChange', apple: 'label / value', 'react-native': 'label / value / onValueChange' },
        { android: 'String / ClosedFloatingPointRange<Float> / callback', apple: 'LocalizedStringKey / Binding<ClosedRange<Double>>', 'react-native': 'string / readonly [number, number] / callback' },
        'Required',
        'Names and controls the numeric interval.'),
      property({ android: 'valueRange', apple: 'in', 'react-native': 'min / max' },
        { android: 'ClosedFloatingPointRange<Float>', apple: 'ClosedRange<Double>', 'react-native': 'number' },
        { android: '0f..1f', apple: '0...100', 'react-native': '0 / 100' },
        'Provides valid inclusive bounds.'),
      property({ android: 'steps', apple: 'step', 'react-native': 'step' },
        { android: 'Int', apple: 'Double?', 'react-native': 'number' },
        { android: '0', apple: 'nil', 'react-native': 'span / 100' },
        'Compose counts intermediate stops; Swift and React Native use positive increments.'),
      property('startLabel / endLabel / formatValue',
        { android: 'String / String / (Float) -> String', apple: 'LocalizedStringKey / LocalizedStringKey / (Double) -> String', 'react-native': 'string / string / (number) => string' },
        'Minimum / Maximum / numeric text',
        'Localizes both endpoint names and values.'),
      property({ android: 'enabled / readOnly', apple: 'disabled / readOnly', 'react-native': 'enabled / readOnly' },
        { android: 'Boolean', apple: 'Bool', 'react-native': 'boolean' },
        'Enabled / editable',
        'Blocks adjustment while retaining values.'),
      property({ android: 'onValueChangeFinished' }, { android: '(() -> Unit)?' }, { android: 'null' }, 'Reports the end of native adjustment.'),
      property({ android: 'modifier', 'react-native': 'style' },
        { android: 'Modifier', 'react-native': 'StyleProp<ViewStyle>' },
        'None',
        'Applies control layout.')
    ],
    slug: 'range-slider',
    summary: 'Choose bounded numeric intervals with independently adjustable native endpoints.'
  },
  {
    accessibility: 'Names both panes and exposes compact back navigation without owning application routing or selection.',
    category: 'Layout',
    examples: { android: `LumenAdaptiveListDetailScaffold(
    selectedKey = selectedKey, onBack = { selectedKey = null },
    listLabel = "Projects", detailLabel = "Project details",
    listPane = { ProjectList(onSelect = { selectedKey = it }) },
    emptyDetail = { LumenEmptyState("Choose a project") }
) { key, detailOnly ->
    BackHandler(enabled = detailOnly) { selectedKey = null }
    ProjectDetails(key)
}` },
    exports: { android: 'LumenAdaptiveListDetailScaffold' },
    guidance: 'Use as a full-window layout. Material adapts to window size and separating hinges. Save selection and pane state in the host; wire system BackHandler through detailOnly and apply screen content insets outside the scaffold.',
    name: 'Adaptive list detail scaffold',
    properties: [
      property('selectedKey / onBack', 'String? / () -> Unit', 'Required', 'Controls selection; null prioritizes the list.'),
      property('listLabel / detailLabel / backLabel', 'String', 'Required / Required / Back', 'Names panes and compact navigation.'),
      property('listPane / emptyDetail', '@Composable () -> Unit', 'Required', 'Provides native lists and wide-window empty detail.'),
      property('detailPane', '@Composable (String, Boolean) -> Unit', 'Required', 'Receives the selected key and whether detail is the only visible pane.'),
      property('modifier', 'Modifier', 'Modifier', 'Applies full-window layout.')
    ],
    slug: 'adaptive-list-detail-scaffold',
    summary: 'Arrange application-owned lists and details across phones, tablets, and foldable devices.'
  }
]

const catalogParityDefinitions: ComponentDefinition[] = [
  {
    accessibility: 'Named multiline input and enabled suggestion actions with controlled selection.',
    category: 'Forms',
    examples: { apple: 'LumenMentions("Message", value: $value, options: options)', android: 'LumenMentions("Message", value, onValueChange, options)', 'react-native': '<LumenMentions label="Message" value={value} onValueChange={setValue} options={options} />' },
    exports: { apple: 'LumenMentions', android: 'LumenMentions', 'react-native': 'LumenMentions' },
    guidance: 'Hosts control text and UTF-16 selection atomically. Native iOS and Android composition is preserved; React Native hosts supply isComposing when available. ASCII mention values use literal filtering and safe token boundaries.',
    name: 'Mentions',
    slug: 'mentions',
    summary: 'Insert literal mention suggestions into controlled native multiline text.',
    properties: [property('value / options / trigger', 'Controlled text and selection / stable suggestions / literal trigger', 'Required / required / @', 'Preserves host state and inserts enabled validated suggestions.')]
  },
  {
    accessibility: 'Named native guidance with measured target highlights and always usable dismissal.',
    category: 'Navigation',
    examples: { apple: 'LumenTour("Guide", steps: steps, anchors: anchors, open: $open, index: $index, onFinish: finish) { content }', android: 'LumenTour("Guide", steps, anchors, open, onOpenChange, index, onIndexChange, finish) { content() }', 'react-native': '<LumenTour label="Guide" steps={steps} anchors={anchors} open={open} onOpenChange={setOpen} index={index} onIndexChange={setIndex} onFinish={finish}>{content}</LumenTour>' },
    exports: { apple: 'LumenTour', android: 'LumenTour', 'react-native': 'LumenTour' },
    guidance: 'Hosts measure targets relative to the native Tour container. Missing or offscreen targets retain dismissible guidance. Controlled indices and host data are never rewritten.',
    name: 'Tour',
    slug: 'tour',
    summary: 'Guide users through controlled steps around measured native targets.',
    properties: [property('steps / anchors / open / index', 'Stable steps / measured rectangles / controlled state', 'Required', 'Controls guidance around host-native layout targets.')]
  },
  {
    accessibility: 'Host-formatted stable records in phone-friendly labeled cells.',
    category: 'Data display',
    examples: { apple: 'LumenTable("Packages", columns: columns, rows: rows)', android: 'LumenTable("Packages", columns, rows)', 'react-native': '<LumenTable label="Packages" columns={columns} rows={rows} />' },
    exports: { apple: 'LumenTable', android: 'LumenTable', 'react-native': 'LumenTable' },
    guidance: 'Host-formatted stable records in phone-friendly labeled cells. Hosts own application state and business actions.',
    name: 'Table',
    properties: [property('host content and state', 'Adapter-specific public contract', 'Required', 'Keeps application data and behavior in the host.')],
    slug: 'table',
    summary: 'Host-formatted stable records in phone-friendly labeled cells.'
  },
  {
    accessibility: 'Controlled sorting and selection retain hidden IDs and respect disabled rows.',
    category: 'Data display',
    examples: { apple: 'LumenDataTable("Packages", columns: columns, rows: rows, sort: $sort, selection: $selectedIds)', android: 'LumenDataTable("Packages", columns, rows, sort = sort, onSortChange = onSortChange, selectedIds = selectedIds, onSelectionChange = onSelectionChange)', 'react-native': '<LumenDataTable label="Packages" columns={columns} rows={rows} sort={sort} onSortChange={setSort} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />' },
    exports: { apple: 'LumenDataTable', android: 'LumenDataTable', 'react-native': 'LumenDataTable' },
    guidance: 'Controlled sorting and selection retain hidden IDs and respect disabled rows. Hosts own application state and business actions.',
    name: 'Data table',
    properties: [property('host content and state', 'Adapter-specific public contract', 'Required', 'Keeps application data and behavior in the host.')],
    slug: 'data-table',
    summary: 'Controlled sorting and selection retain hidden IDs and respect disabled rows.'
  },
  {
    accessibility: 'Named whole-number rating options with controlled values and read-only support.',
    category: 'Forms',
    examples: { apple: 'LumenRating("Rating", value: $rating)', android: 'LumenRating("Rating", rating, onValueChange)', 'react-native': '<LumenRating label="Rating" value={rating} onValueChange={setRating} />' },
    exports: { apple: 'LumenRating', android: 'LumenRating', 'react-native': 'LumenRating' },
    guidance: 'Named whole-number rating options with controlled values and read-only support. Hosts own application state and business actions.',
    name: 'Rating',
    properties: [property('host content and state', 'Adapter-specific public contract', 'Required', 'Keeps application data and behavior in the host.')],
    slug: 'rating',
    summary: 'Named whole-number rating options with controlled values and read-only support.'
  },
  {
    accessibility: 'Named ancestor navigation with a noninteractive current destination.',
    category: 'Navigation',
    examples: { apple: 'LumenBreadcrumb("Path", items: items, onNavigate: navigate)', android: 'LumenBreadcrumb("Path", items, navigate)', 'react-native': '<LumenBreadcrumb label="Path" items={items} onNavigate={navigate} />' },
    exports: { apple: 'LumenBreadcrumb', android: 'LumenBreadcrumb', 'react-native': 'LumenBreadcrumb' },
    guidance: 'Named ancestor navigation with a noninteractive current destination. Hosts own application state and business actions.',
    name: 'Breadcrumb',
    properties: [property('host content and state', 'Adapter-specific public contract', 'Required', 'Keeps application data and behavior in the host.')],
    slug: 'breadcrumb',
    summary: 'Named ancestor navigation with a noninteractive current destination.'
  },
  {
    accessibility: 'Host-owned step progress with localized complete, current and upcoming states.',
    category: 'Feedback',
    examples: { apple: 'LumenStepper("Progress", steps: steps, currentStep: currentStep)', android: 'LumenStepper("Progress", steps, currentStep)', 'react-native': '<LumenStepper label="Progress" steps={steps} currentStep={currentStep} />' },
    exports: { apple: 'LumenStepper', android: 'LumenStepper', 'react-native': 'LumenStepper' },
    guidance: 'Host-owned step progress with localized complete, current and upcoming states. Hosts own application state and business actions.',
    name: 'Stepper',
    properties: [property('host content and state', 'Adapter-specific public contract', 'Required', 'Keeps application data and behavior in the host.')],
    slug: 'stepper',
    summary: 'Host-owned step progress with localized complete, current and upcoming states.'
  },
  {
    accessibility: 'Named chronological content retaining host controls and decorative connectors.',
    category: 'Data display',
    examples: { apple: 'LumenTimeline("Activity") { LumenTimelineItem { LumenText("Created") } }', android: 'LumenTimeline("Activity") { LumenTimelineItem { LumenText("Created") } }', 'react-native': '<LumenTimeline label="Activity"><LumenTimelineItem><LumenText>Created</LumenText></LumenTimelineItem></LumenTimeline>' },
    exports: { apple: 'LumenTimeline', android: 'LumenTimeline', 'react-native': 'LumenTimeline' },
    guidance: 'Named chronological content retaining host controls and decorative connectors. Hosts own application state and business actions.',
    name: 'Timeline',
    properties: [property('host content and state', 'Adapter-specific public contract', 'Required', 'Keeps application data and behavior in the host.')],
    slug: 'timeline',
    summary: 'Named chronological content retaining host controls and decorative connectors.'
  },
  {
    accessibility: 'Named command search, enabled highlight navigation and a usable close path.',
    category: 'Actions',
    examples: { apple: 'LumenCommand("Commands", groups: groups, open: $open, query: $query, activeId: $activeId, onSelect: run)', android: 'LumenCommand("Commands", groups, open, onOpenChange, query, onQueryChange, activeId, onActiveIdChange, run)', 'react-native': '<LumenCommand label="Commands" groups={groups} open={open} query={query} activeId={activeId} onOpenChange={setOpen} onQueryChange={setQuery} onActiveIdChange={setActiveId} onSelect={run} />' },
    exports: { apple: 'LumenCommand', android: 'LumenCommand', 'react-native': 'LumenCommand' },
    guidance: 'Hosts own execution and modal presentation. Grouped literal search retains controlled query and highlight; disabled or stale commands cannot execute.',
    name: 'Command',
    properties: [property('controlled state', 'Stable records and host state', 'Required', 'Retains host values and emits intentional user changes.')],
    slug: 'command',
    summary: 'Named command search, enabled highlight navigation and a usable close path.'
  },
  {
    accessibility: 'Named hierarchical disclosures and labeled cells with inherited disabled state.',
    category: 'Data display',
    examples: { apple: 'LumenTreeGrid("Status", columns: columns, records: records, expandedIds: $expandedIds)', android: 'LumenTreeGrid("Status", columns, records, expandedIds, onExpandedChange)', 'react-native': '<LumenTreeGrid label="Status" columns={columns} records={records} expandedIds={expandedIds} onExpandedChange={setExpandedIds} />' },
    exports: { apple: 'LumenTreeGrid', android: 'LumenTreeGrid', 'react-native': 'LumenTreeGrid' },
    guidance: 'Hosts format cells and control expansion. Unknown and hidden expansion IDs are retained. Custom interactive cells must honor disabled/read-only context.',
    name: 'Tree grid',
    properties: [property('controlled state', 'Stable records and host state', 'Required', 'Retains host values and emits intentional user changes.')],
    slug: 'tree-grid',
    summary: 'Named hierarchical disclosures and labeled cells with inherited disabled state.'
  },
  {
    accessibility: 'Localized slide positions, named previous/next and selected indicators with native paging.',
    category: 'Data display',
    examples: {
      apple: 'LumenCarousel("Project slides", slides: slides, index: $index) { slide, _ in LumenText(.verbatim(slide.label)) }',
      android: 'LumenCarousel("Project slides", slides, index, { index = it }) { slide, _ -> LumenText(slide.label) }',
      'react-native': '<LumenCarousel label="Project slides" slides={slides} index={index} onIndexChange={setIndex} renderSlide={slide => <LumenText>{slide.label}</LumenText>} />'
    },
    exports: { apple: 'LumenCarousel', android: 'LumenCarousel', 'react-native': 'LumenCarousel' },
    guidance: 'Hosts own stable slide identities and rich content. Native paging requests bounded index changes; there is no autoplay or wrapping. Invalid host indices show recovery without rewriting state.',
    name: 'Carousel',
    properties: [
      property('slides / index', 'Stable LumenCarouselSlide records / controlled integer', 'Required', 'Controls the dataset and current visible page.'),
      property('height / disabled / status', 'Numeric height / boolean / ready-loading-error', '200 / false / ready', 'Bounds the viewport and guards native paging and result states.')
    ],
    slug: 'carousel',
    summary: 'Page through controlled native slides with accessible navigation.'
  },
  {
    accessibility: 'Localized selected/checked and disabled controls with guarded native actions and safe status presentation.',
    category: 'Forms',
    examples: { apple: 'LumenTransfer("Project access", items: items, value: $value)', android: 'LumenTransfer("Project access", items, value, { value = it })', 'react-native': '<LumenTransfer label="Project access" items={items} value={value} onValueChange={setValue} />' },
    exports: { apple: 'LumenTransfer', android: 'LumenTransfer', 'react-native': 'LumenTransfer' },
    guidance: 'The host controls membership and staged checks atomically. Moves preserve unknown and disabled IDs and clear only moved checks. The reference provides bidirectional selection and moves.',
    name: 'Transfer',
    properties: [property('value', 'LumenTransferValue', 'Required controlled value', 'Retains host state and emits intentional user changes.')],
    slug: 'transfer',
    summary: 'Select controlled native transfer values with stable identities.'
  },
  {
    accessibility: 'Localized selected/checked and disabled controls with guarded native actions and safe status presentation.',
    category: 'Forms',
    examples: { apple: 'LumenTreeSelect("Destination", nodes: nodes, value: $value)', android: 'LumenTreeSelect("Destination", nodes, value, { value = it })', 'react-native': '<LumenTreeSelect label="Destination" nodes={nodes} value={value} onValueChange={setValue} />' },
    exports: { apple: 'LumenTreeSelect', android: 'LumenTreeSelect', 'react-native': 'LumenTreeSelect' },
    guidance: 'All hierarchy levels are selectable when enabled. The host retains unknown values; read-only permits browsing. Use the existing validated Tree graph and localize option paths.',
    name: 'Tree select',
    properties: [property('value', 'Nullable stable ID', 'Required controlled value', 'Retains host state and emits intentional user changes.')],
    slug: 'tree-select',
    summary: 'Select controlled native tree select values with stable identities.'
  },
  {
    accessibility: 'Localized channel and palette names, validation feedback and native disabled/read-only controls.',
    category: 'Forms',
    examples: {
      apple: 'LumenColorPicker("Accent color", value: $color)',
      android: 'LumenColorPicker("Accent color", color, { color = it })',
      'react-native': '<LumenColorPicker label="Accent color" value={color} onValueChange={setColor} />'
    },
    exports: { apple: 'LumenColorPicker', android: 'LumenColorPicker', 'react-native': 'LumenColorPicker' },
    guidance: 'Use bounded hex or rgba values; unsupported CSS strings remain visible as invalid drafts. Hosts own the value and optional named palette. Enable alpha explicitly; latent hue survives black or gray channel edits.',
    name: 'Color picker',
    properties: [
      property('value / onValueChange', 'Controlled color text / native binding or callback', 'Required', 'Requests canonical color changes without replacing invalid host input.'),
      property('allowAlpha / palette / labels', 'Boolean / named swatches / localized labels', 'false / empty / English', 'Controls opacity support and accessible channel names.')
    ],
    slug: 'color-picker',
    summary: 'Edit controlled native colors with validated text, channels and optional alpha.'
  },
  {
    accessibility: 'Localized event day/time names, collision-safe native targets and accessible move controls.',
    category: 'Data display',
    examples: {
      apple: 'LumenSchedule("Project schedule", selectedDay: $day, events: events)',
      android: 'LumenSchedule("Project schedule", day, { day = it }, events)',
      'react-native': '<LumenSchedule label="Project schedule" selectedDay={day} onSelectedDayChange={setDay} events={events} />'
    },
    exports: { apple: 'LumenSchedule', android: 'LumenSchedule', 'react-native': 'LumenSchedule' },
    guidance: 'Hosts own civil-day conversion and rescheduling. Timed overlaps occupy lanes with minimum touch rectangles; dense days scroll horizontally. Accessible move requests are available; pointer drag rescheduling is absent.',
    name: 'Schedule',
    properties: [
      property('selectedDay / events', 'Controlled civil day / LumenAgendaEvent records', 'Required', 'Controls the first day and host event dataset.'),
      property('dayCount / startHour / endHour', 'Bounded integers', '7 / 8 / 18', 'Sets a one-to-seven-day civil wall-clock window.'),
      property('onEventPress / onEventMove', 'Optional callbacks', 'Static presentation', 'Requests host detail or rescheduling actions without dataset mutation.')
    ],
    slug: 'schedule',
    summary: 'Present timed native day columns with all-day bands and overlap lanes.'
  },
  {
    accessibility: 'Localized labels, native controls, selected or disabled state and safe loading/error/empty presentation.',
    category: 'Forms',
    examples: { apple: 'LumenCalendar("Project calendar", visibleMonth: $month, selectedDay: $day)', android: 'LumenCalendar("Project calendar", month, { month = it }, selectedDay = day, onSelectedDayChange = { day = it })', 'react-native': '<LumenCalendar label="Project calendar" visibleMonth={month} onVisibleMonthChange={setMonth} selectedDay={day} onSelectedDayChange={setDay} />' },
    exports: { apple: 'LumenCalendar', android: 'LumenCalendar', 'react-native': 'LumenCalendar' },
    guidance: 'Hosts control visibleMonth and selectedDay. Civil date models avoid guessed timezone conversion; localize every date formatter.',
    name: 'Calendar',
    properties: [property('visibleMonth / selectedDay', 'Controlled civil day / optional civil day', 'Required', 'Retains host ownership of stable values and callbacks.')],
    slug: 'calendar',
    summary: 'Select bounded Gregorian civil dates in a controlled month grid.'
  },
  {
    accessibility: 'Localized labels, native controls, selected or disabled state and safe loading/error/empty presentation.',
    category: 'Data display',
    examples: { apple: 'LumenAgenda("Project agenda", selectedDay: $day, events: events)', android: 'LumenAgenda("Project agenda", day, { day = it }, events)', 'react-native': '<LumenAgenda label="Project agenda" selectedDay={day} onSelectedDayChange={setDay} events={events} />' },
    exports: { apple: 'LumenAgenda', android: 'LumenAgenda', 'react-native': 'LumenAgenda' },
    guidance: 'Hosts control the first selectedDay, event dataset and timezone conversion. Timed interval ends are exclusive; all-day civil endpoints are inclusive.',
    name: 'Agenda',
    properties: [property('selectedDay / events', 'Controlled civil day / LumenAgendaEvent records', 'Required', 'Retains host ownership of stable values and callbacks.')],
    slug: 'agenda',
    summary: 'Present chronological timed and all-day events under civil-day headings.'
  },
  {
    accessibility: 'Localized labels, native controls, selected or disabled state and safe loading/error/empty presentation.',
    category: 'Data display',
    examples: { apple: 'LumenKanbanBoard("Project board", columns: $columns)', android: 'LumenKanbanBoard("Project board", columns, { columns = it })', 'react-native': '<LumenKanbanBoard label="Project board" columns={columns} onColumnsChange={setColumns} />' },
    exports: { apple: 'LumenKanbanBoard', android: 'LumenKanbanBoard', 'react-native': 'LumenKanbanBoard' },
    guidance: 'Hosts own immutable columns and persistence. Invalid IDs and full targets reject moves. Accessible move controls reach columns outside the viewport; drag auto-scrolling is unavailable.',
    name: 'Kanban board',
    properties: [property('columns', 'Controlled LumenKanbanColumnData records', 'Required', 'Retains host ownership of stable values and callbacks.')],
    slug: 'kanban-board',
    summary: 'Move controlled cards between capacity-limited native board columns.'
  },
  {
    accessibility: 'Localized labels, native controls, selected or disabled state and safe loading/error/empty presentation.',
    category: 'Data display',
    examples: { apple: 'LumenKanbanColumn(column: $column)', android: 'LumenKanbanColumn(column, { column = it })', 'react-native': '<LumenKanbanColumn column={column} onColumnChange={setColumn} />' },
    exports: { apple: 'LumenKanbanColumn', android: 'LumenKanbanColumn', 'react-native': 'LumenKanbanColumn' },
    guidance: 'Use stable card identities and capacity. Native dragging and localized reorder actions request host state changes. Read-only blocks mutations while allowing details.',
    name: 'Kanban column',
    properties: [property('column', 'Controlled LumenKanbanColumnData', 'Required', 'Retains host ownership of stable values and callbacks.')],
    slug: 'kanban-column',
    summary: 'Reorder rich native cards within a controlled standalone column.'
  },
  {
    accessibility: 'Named image value, visible caption and localized error recovery with scanner-safe contrast.',
    category: 'Data display',
    examples: {
      apple: 'LumenQRCode("Project link", value: "https://lumen.santi020k.com")',
      android: 'LumenQRCode(value = "https://lumen.santi020k.com", label = "Project link")',
      'react-native': '<LumenQRCode label="Project link" value="https://lumen.santi020k.com" />'
    },
    exports: { android: 'LumenQRCode', apple: 'LumenQRCode', 'react-native': 'LumenQRCode' },
    guidance: 'Encoding stays offline. Keep the four-module quiet zone and high contrast; hosts own navigation and scanning. Capacity errors retain the input value. See the native QRCode contract for correction levels and matrix APIs.',
    name: 'QR code',
    properties: [
      property('label / value', 'String / string', 'Required', 'Names and controls the locally encoded value.'),
      property('size / quietZone', 'Numeric size / integer modules', '160 / 4', 'Keeps a bounded image size and standards-compatible border.'),
      property('correction / errorLabel / showValue', 'Platform correction enum / text / boolean', 'M / English error / true', 'Controls error correction and accessible recovery.')
    ],
    slug: 'qr-code',
    summary: 'Render accessible offline QR codes from controlled Unicode values.'
  },
  {
    accessibility: 'Localized disclosure and depth with native selection controls and inherited disabled state.',
    category: 'Data display',
    examples: {
      apple: 'LumenTree("Files", nodes: nodes, expandedIds: $expanded, selectedIds: $selected)',
      android: 'LumenTree("Files", nodes, expanded, { expanded = it }, selectedIds = selected, onSelectionChange = { selected = it })',
      'react-native': '<LumenTree label="Files" nodes={nodes} expandedIds={expanded} onExpandedChange={setExpanded} selectedIds={selected} onSelectionChange={setSelected} />'
    },
    exports: { android: 'LumenTree', apple: 'LumenTree', 'react-native': 'LumenTree' },
    guidance: 'Use stable flat graph identities. Invalid graphs fail closed; state edits retain unknown host IDs. Read-only selection still permits disclosure. Localize depth and disclosure formatters.',
    name: 'Tree',
    properties: [
      property('nodes', 'LumenTreeNode records', 'Required', 'Defines stable identity, parent, label and disabled/selectable state.'),
      property('expandedIds / selectedIds', 'Controlled sets', 'Required expansion / optional selection', 'Preserves host state through hidden and unavailable nodes.'),
      property('loading / error / readOnly', 'Platform state values', 'Ready / no error / editable', 'Hides stale controls during result states and guards mutations.')
    ],
    slug: 'tree',
    summary: 'Browse hierarchical records with controlled disclosure and selection.'
  },
  {
    accessibility: 'Localized branch and back navigation with controlled leaf selection and safe status states.',
    category: 'Forms',
    examples: {
      apple: 'LumenCascader("Destination", nodes: nodes, selectedPath: $path)',
      android: 'LumenCascader("Destination", nodes, path, { path = it })',
      'react-native': '<LumenCascader label="Destination" nodes={nodes} selectedPath={path} onSelectionChange={setPath} />'
    },
    exports: { android: 'LumenCascader', apple: 'LumenCascader', 'react-native': 'LumenCascader' },
    guidance: 'Branches browse and enabled selectable leaves emit full canonical paths. Retain unknown paths until the host replaces them. Read-only selection permits browsing; app routing stays in the host.',
    name: 'Cascader',
    properties: [
      property('nodes / selectedPath', 'LumenTreeNode records / controlled ordered IDs', 'Required', 'Controls a canonical path over the validated shared tree model.'),
      property('readOnly / loading / error', 'Platform state values', 'Editable / ready / no error', 'Guards selection and hides stale result controls.'),
      property('backLabel / formatDisclosure', 'Localized text / formatter', 'English defaults', 'Names native drill-down navigation.')
    ],
    slug: 'cascader',
    summary: 'Select a stable leaf path through native branch drill-down.'
  }
]

export const nativeComponentDocs = [
  ...sharedDefinitions,
  ...additionalDefinitions,
  ...advancedInputDefinitions,
  ...authenticationAndMediaDefinitions,
  ...composeProductDefinitions,
  ...catalogParityDefinitions
].map(createComponent)

export const nativeComponentCategories: NativeComponentCategory[] = [
  'Foundations',
  'Actions',
  'Forms',
  'Layout',
  'Navigation',
  'Data display',
  'Feedback',
  'WidgetKit',
  'macOS utilities'
]

export const getNativeComponentsForPlatform = (
  platform: NativePlatformId
): NativeComponentDoc[] => nativeComponentDocs.filter(
  component => component.implementations[platform]
)
