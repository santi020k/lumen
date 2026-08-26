import {
  type ReactElement,
  type ReactNode,
  useMemo,
  useState
} from 'react'
import {
  Linking,
  Platform,
  ScrollView,
  type StyleProp,
  StyleSheet,
  useColorScheme,
  View,
  type ViewStyle
} from 'react-native'
import {
  SafeAreaProvider,
  SafeAreaView
} from 'react-native-safe-area-context'

import {
  createEmptyLumenPhoneNumber,
  createLumenTheme,
  getLumenIconGraphic,
  getLumenPhoneCountry,
  LumenAlert,
  LumenAlertDescription,
  LumenAlertDialog,
  LumenAlertTitle,
  LumenAvatar,
  LumenBackdrop,
  LumenBadge,
  LumenBanner,
  LumenBarChart,
  LumenButton,
  LumenButtonGroup,
  LumenCard,
  LumenCheckbox,
  LumenChip,
  LumenCollapsibleNavigationBar,
  LumenComboChart,
  LumenDateField,
  LumenDateRangeField,
  type LumenDateRangeValue,
  LumenDisclosure,
  LumenDivider,
  LumenEmptyState,
  LumenFieldGroup,
  LumenGraphic,
  LumenHeatmap,
  LumenIcon,
  LumenIconButton,
  LumenIllustration,
  LumenImage,
  LumenLineChart,
  LumenListRow,
  LumenMenu,
  LumenNavigationAccessory,
  LumenNavigationBar,
  LumenPhoneInput,
  type LumenPhoneNumber,
  LumenPieChart,
  LumenProgress,
  LumenProvider,
  LumenRadioGroup,
  LumenRangeChart,
  LumenRefreshControl,
  LumenScatterChart,
  LumenSearchField,
  LumenSectionHeader,
  LumenSegmentedControl,
  LumenSettingsRow,
  LumenShareButton,
  LumenSheet,
  LumenSkeleton,
  LumenSparkline,
  LumenSpinner,
  LumenStat,
  LumenStatusBar,
  LumenSurface,
  LumenTabs,
  LumenText,
  LumenTextarea,
  LumenTextField,
  type LumenTheme,
  LumenToast,
  LumenToggle,
  useLumenTheme
} from '@santi020k/lumen-react-native'
import { StatusBar as ExpoStatusBar } from 'expo-status-bar'

type AppDestination = 'about' | 'components' | 'home'

type ColorScheme = 'dark' | 'light' | 'system'

type ThemePreset = 'lumen' | 'santi020k'

const resolvePlaygroundScheme = (
  preference: ColorScheme,
  systemScheme: ReturnType<typeof useColorScheme>
): 'dark' | 'light' => {
  if (preference === 'dark' || preference === 'light') return preference

  return systemScheme === 'dark' ? 'dark' : 'light'
}

const santi020kColorPalettes: Record<'dark' | 'light', LumenTheme['colors']> = {
  light: {
    canvas: '#FAF9FB',
    surface: '#FFFFFF',
    surfaceMuted: '#F5F3F7',
    surfaceStrong: '#E5E2E9',
    line: '#D6D0DC',
    ink: '#332E38',
    inkSoft: '#5B5463',
    inkMuted: '#47434C',
    brand: '#620AE6',
    brandSolid: '#5709CE',
    brandSoft: '#EEE7F9',
    onBrand: '#FFFFFF',
    accent: '#7D29FA',
    success: '#16A249',
    warning: '#F59F0A',
    danger: '#EF4343',
    onDanger: '#000000'
  },
  dark: {
    canvas: '#110C1D',
    surface: '#1C1528',
    surfaceMuted: '#231D30',
    surfaceStrong: '#322B40',
    line: '#494158',
    ink: '#DFDDE3',
    inkSoft: '#B6B2BD',
    inkMuted: '#8D8896',
    brand: '#A56EF7',
    brandSolid: '#6F16F3',
    brandSoft: '#2A1943',
    onBrand: '#FFFFFF',
    accent: '#9F64F7',
    success: '#21C45D',
    warning: '#F6A823',
    danger: '#F15B5B',
    onDanger: '#110C1D'
  }
}

const createPlaygroundTheme = (preset: ThemePreset, scheme: 'dark' | 'light'): LumenTheme => {
  const theme = createLumenTheme(scheme)

  if (preset === 'lumen') return theme

  return {
    ...theme,
    colors: santi020kColorPalettes[scheme]
  }
}

interface ComponentSectionProps {
  children: ReactNode
  description: string
  title: string
}

const componentNames = [
  'Theme',
  'Text',
  'Surface',
  'Icon',
  'Icon button',
  'Button',
  'Button group',
  'Text field',
  'Textarea',
  'Field group',
  'Toggle',
  'Settings row',
  'Search field',
  'Date field',
  'Date range field',
  'Phone input',
  'Checkbox',
  'Radio group',
  'Segmented control',
  'Tabs',
  'Chip',
  'Badge',
  'Divider',
  'Spinner',
  'Card',
  'Alert',
  'Toast',
  'Progress',
  'Refresh control',
  'Skeleton',
  'Graphic',
  'Backdrop',
  'Illustration',
  'Image',
  'Sparkline',
  'Line chart',
  'Bar chart',
  'Pie chart',
  'Scatter chart',
  'Heatmap',
  'Range chart',
  'Combo chart',
  'Disclosure',
  'Avatar',
  'Empty state',
  'List row',
  'Banner',
  'Stat',
  'Section header',
  'Status bar',
  'Alert dialog',
  'Sheet',
  'Menu',
  'Share button',
  'Navigation bar',
  'Navigation accessory',
  'Collapsible navigation bar'
]

const componentIcon = getLumenIconGraphic('blocks')
const homeIcon = getLumenIconGraphic('house')
const settingsIcon = getLumenIconGraphic('settings')
const updatesIcon = getLumenIconGraphic('bell')
const defaultPhoneCountry = getLumenPhoneCountry('CO', { locale: 'en-US' })

if (!defaultPhoneCountry) throw new Error('Expected Colombia phone metadata')

const sampleImage = {
  uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFUlEQVR42mNUSX7NgA0wMeAAg1MCACR8AYLZ4VNSAAAAAElFTkSuQmCC'
}

const appNavigationItems = [
  { icon: homeIcon, label: 'Home', value: 'home' },
  { icon: componentIcon, label: 'Components', value: 'components' },
  { icon: settingsIcon, label: 'About', value: 'about' }
] as const

const demoNavigationItems = [
  { badge: 3, icon: componentIcon, label: 'Components', value: 'components' },
  { badge: true, icon: updatesIcon, label: 'Updates', value: 'updates' },
  { disabled: true, icon: settingsIcon, label: 'Settings', value: 'settings' }
] as const

const getWebQueryParameter = (name: string): string => {
  if (Platform.OS !== 'web' || typeof globalThis.location === 'undefined') return ''

  return new URLSearchParams(globalThis.location.search).get(name) ?? ''
}

const getInitialComponentQuery = (): string => getWebQueryParameter('component')
const isEmbeddedPreview = (): boolean => getWebQueryParameter('embed') === 'true'

const getInitialColorScheme = (): ColorScheme => {
  const scheme = getWebQueryParameter('scheme')

  return scheme === 'dark' || scheme === 'light' || scheme === 'system' ? scheme : 'system'
}

const getInitialThemePreset = (): ThemePreset => (
  getWebQueryParameter('theme') === 'santi020k' ? 'santi020k' : 'lumen'
)

const getInitialDestination = (): AppDestination => (
  isEmbeddedPreview() || getInitialComponentQuery() ? 'components' : 'home'
)

const getVisibleComponentNames = (query: string, embedded: boolean): string[] => {
  const normalizedQuery = query.trim().toLowerCase()

  return componentNames.filter(name => embedded && normalizedQuery.length > 0 ?
    name.toLowerCase() === normalizedQuery :
    name.toLowerCase().includes(normalizedQuery))
}

const openExternalURL = (url: string): void => {
  Linking.openURL(url).catch(() => undefined)
}

const styles = StyleSheet.create({
  app: {
    flex: 1
  },
  appBody: {
    flex: 1
  },
  appNavigation: {
    flexShrink: 0
  },
  catalogMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  content: {
    alignSelf: 'center',
    gap: 16,
    maxWidth: 760,
    padding: 20,
    paddingBottom: 48,
    width: '100%'
  },
  embeddedContent: {
    padding: 16,
    paddingBottom: 16
  },
  examples: {
    display: 'flex'
  },
  hero: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingTop: 12
  },
  heroCopy: {
    flex: 1,
    gap: 8
  },
  homeHero: {
    alignItems: 'flex-start'
  },
  homeHeroGraphic: {
    marginBottom: 4
  },
  linkActions: {
    alignItems: 'stretch',
    gap: 10
  },
  safeArea: {
    flex: 1
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statItem: {
    flexBasis: 180,
    flexGrow: 1
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  screen: {
    flex: 1,
    minHeight: '100%'
  },
  visualCard: {
    alignItems: 'center',
    flex: 1,
    minWidth: 220,
    overflow: 'hidden'
  },
  visualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  section: {
    gap: 16
  },
  sectionHeading: {
    gap: 4
  },
  stack: {
    gap: 12
  }
})

const Visibility = ({ children, visible }: { children: ReactNode, visible: boolean }): ReactNode => (
  visible ? children : null
)

const getPlaygroundContentStyle = (embedded: boolean): StyleProp<ViewStyle> => (
  embedded ? [styles.content, styles.embeddedContent] : styles.content
)

const ComponentSection = ({
  children,
  description,
  title
}: ComponentSectionProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <LumenCard style={styles.section}>
      <View style={styles.sectionHeading}>
        <LumenText variant="label">{title}</LumenText>
        <LumenText tone="muted">{description}</LumenText>
      </View>
      <LumenDivider />
      <View style={[styles.examples, { gap: theme.spacing.md }]}>{children}</View>
    </LumenCard>
  )
}

const getThemeToggleState = (scheme: ColorScheme): {
  icon: 'moon' | 'sun'
  label: string
  scheme: ColorScheme
} => {
  const nextScheme = scheme === 'dark' ? 'light' : 'dark'

  return {
    icon: nextScheme === 'dark' ? 'moon' : 'sun',
    label: `Use ${nextScheme} theme`,
    scheme: nextScheme
  }
}

const isAppDestination = (value: string): value is AppDestination => (
  value === 'about' || value === 'components' || value === 'home'
)

const isColorScheme = (value: string): value is ColorScheme => (
  value === 'dark' || value === 'light' || value === 'system'
)

const isThemePreset = (value: string): value is ThemePreset => (
  value === 'lumen' || value === 'santi020k'
)

const HomeScreen = ({
  onBrowse,
  onOpenAbout
}: {
  onBrowse: () => void
  onOpenAbout: () => void
}): ReactElement => {
  const theme = useLumenTheme()

  return (
    <LumenSurface padding="none" radius="none" style={styles.screen} tone="canvas">
      <ScrollView contentContainerStyle={styles.content}>
        <LumenCard style={styles.homeHero} variant="accent">
          <LumenGraphic
            label="Lumen package graphic"
            size="sm"
            style={styles.homeHeroGraphic}
            tone="brand"
            variant="orbit"
          >
            <LumenIcon decorative name="package-open" size="lg" />
          </LumenGraphic>
          <View style={styles.row}>
            <LumenBadge tone="accent">Expo preview</LumenBadge>
            <LumenBadge tone="success">No account required</LumenBadge>
          </View>
          <View style={styles.sectionHeading}>
            <LumenText variant="title">Explore Lumen on a real device</LumenText>
            <LumenText tone="soft">
              Test accessible React Native primitives, responsive layouts, themes, forms, charts,
              and native interaction patterns in one focused playground.
            </LumenText>
          </View>
          <View style={styles.linkActions}>
            <LumenButton onPress={onBrowse}>Browse all components</LumenButton>
            <LumenButton intent="secondary" onPress={onOpenAbout}>About this preview</LumenButton>
          </View>
        </LumenCard>

        <View style={styles.statGrid}>
          <LumenStat
            detail="Searchable examples"
            label="Components"
            style={styles.statItem}
            tone="accent"
            value={String(componentNames.length)}
          />
          <LumenStat
            detail="Light, dark, and system"
            label="Appearance"
            style={styles.statItem}
            tone="success"
            value="3 modes"
          />
        </View>

        <LumenCard>
          <LumenSectionHeader
            subtitle="Everything stays local to this playground."
            title="Made for hands-on evaluation"
          />
          <View style={[styles.stack, { gap: theme.spacing.xs }]}>
            <LumenListRow leading={<LumenIcon decorative name="search" size="md" />}>
              <LumenText variant="label">Find any component quickly</LumenText>
              <LumenText tone="muted">Search the complete native catalog by name.</LumenText>
            </LumenListRow>
            <LumenDivider />
            <LumenListRow leading={<LumenIcon decorative name="pointer" size="md" />}>
              <LumenText variant="label">Exercise real behavior</LumenText>
              <LumenText tone="muted">Press, edit, dismiss, select, refresh, and share.</LumenText>
            </LumenListRow>
            <LumenDivider />
            <LumenListRow leading={<LumenIcon decorative name="accessibility" size="md" />}>
              <LumenText variant="label">Review native accessibility</LumenText>
              <LumenText tone="muted">Inspect labels, states, touch targets, and contrast.</LumenText>
            </LumenListRow>
          </View>
        </LumenCard>

        <LumenStatusBar
          message="Built with @santi020k/lumen-react-native"
          tone="success"
          trailing={<LumenText tone="muted" variant="caption">Public preview</LumenText>}
        />
      </ScrollView>
    </LumenSurface>
  )
}

const AboutScreen = ({
  onSchemeChange,
  onThemePresetChange,
  scheme,
  themePreset
}: {
  onSchemeChange: (scheme: ColorScheme) => void
  onThemePresetChange: (preset: ThemePreset) => void
  scheme: ColorScheme
  themePreset: ThemePreset
}): ReactElement => (
  <LumenSurface padding="none" radius="none" style={styles.screen} tone="canvas">
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroCopy}>
        <LumenBadge tone="accent">Lumen Playground</LumenBadge>
        <LumenText variant="title">About this preview</LumenText>
        <LumenText tone="soft">
          A public, account-free gallery for evaluating the real Lumen React Native package.
        </LumenText>
      </View>

      <LumenCard>
        <LumenSectionHeader
          subtitle="Follow the device or choose a fixed playground theme."
          title="Appearance"
        />
        <LumenSegmentedControl
          label="Playground theme"
          onValueChange={value => {
            if (isThemePreset(value)) onThemePresetChange(value)
          }}
          options={[
            { label: 'Lumen', value: 'lumen' },
            { label: 'santi020k', value: 'santi020k' }
          ]}
          value={themePreset}
        />
        <LumenSegmentedControl
          label="Playground appearance"
          onValueChange={value => {
            if (isColorScheme(value)) onSchemeChange(value)
          }}
          options={[
            { label: 'System', value: 'system' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' }
          ]}
          value={scheme}
        />
      </LumenCard>

      <LumenAlert variant="success">
        <LumenAlertTitle>Private by design</LumenAlertTitle>
        <LumenAlertDescription>
          The playground requires no account and does not collect, retain, or share personal data.
          Interactive examples remain on your device.
        </LumenAlertDescription>
      </LumenAlert>

      <LumenCard>
        <LumenSectionHeader
          subtitle="Documentation, source, support, and policies."
          title="Learn more"
        />
        <View style={styles.linkActions}>
          <LumenButton
            onPress={() => {
              openExternalURL('https://lumen.santi020k.com/docs/react-native')
            }}
          >
            React Native documentation
          </LumenButton>
          <LumenButton
            intent="secondary"
            onPress={() => {
              openExternalURL('https://github.com/santi020k/lumen')
            }}
          >
            View source on GitHub
          </LumenButton>
          <LumenButton
            intent="secondary"
            onPress={() => {
              openExternalURL('https://lumen.santi020k.com/support')
            }}
          >
            Support
          </LumenButton>
          <LumenButton
            intent="quiet"
            onPress={() => {
              openExternalURL('https://lumen.santi020k.com/privacy')
            }}
          >
            Privacy policy
          </LumenButton>
        </View>
      </LumenCard>

      <LumenText tone="muted" variant="caption">
        Lumen UI · React Native playground 1.0.0 · Created by Santiago Molina
      </LumenText>
    </ScrollView>
  </LumenSurface>
)

const ChartExamples = ({
  isVisible
}: {
  isVisible: (name: string) => boolean
}): ReactElement => (
  <>
    {isVisible('Sparkline') && (
      <LumenSparkline label="Weekly adoption trend" values={[12, 18, 16, 27, 35]} />
    )}
    {isVisible('Line chart') && (
      <LumenLineChart
        area
        heading="Weekly adoption"
        label="Weekly adoption chart"
        series={[{
          data: [
            { x: 'Mon', y: 18 },
            { x: 'Tue', y: 26 },
            { x: 'Wed', y: null },
            { x: 'Thu', y: 41 },
            { x: 'Fri', y: 53 }
          ],
          id: 'adoption',
          label: 'Projects'
        }]}
      />
    )}
    {isVisible('Bar chart') && (
      <LumenBarChart
        label="Components by platform"
        series={[{
          data: [{ x: 'Web', y: 82 }, { x: 'iOS', y: 61 }, { x: 'Android', y: 58 }],
          id: 'components',
          label: 'Components'
        }]}
      />
    )}
    {isVisible('Pie chart') && (
      <LumenPieChart
        label="Issue status distribution"
        series={{
          data: [{ x: 'Complete', y: 68 }, { x: 'Active', y: 22 }, { x: 'Blocked', y: 10 }],
          id: 'issues',
          label: 'Issues'
        }}
      />
    )}
    {isVisible('Scatter chart') && (
      <LumenScatterChart
        label="Bundle size and render time"
        series={[{
          data: [{ x: 12, y: 28, size: 12 }, { x: 20, y: 41, size: 20 }, { x: 31, y: 54, size: 28 }],
          id: 'releases',
          label: 'Releases'
        }]}
      />
    )}
    {isVisible('Heatmap') && (
      <LumenHeatmap
        data={[
          { value: 18, x: 'Mon', y: 'Morning' },
          { value: 32, x: 'Tue', y: 'Morning' },
          { value: 47, x: 'Mon', y: 'Evening' },
          { value: null, x: 'Tue', y: 'Evening' }
        ]}
        label="Activity by day and period"
      />
    )}
    {isVisible('Range chart') && (
      <LumenRangeChart
        data={[
          { high: 28, low: 16, x: 'Mon' },
          { high: 35, low: 21, x: 'Tue' },
          { high: 42, low: 27, x: 'Wed' }
        ]}
        label="Daily forecast range"
      />
    )}
    {isVisible('Combo chart') && (
      <LumenComboChart
        label="Deployments and reliability"
        series={[
          {
            data: [{ x: 'Apr', y: 24 }, { x: 'May', y: 31 }, { x: 'Jun', y: 38 }],
            id: 'deployments',
            label: 'Deployments',
            mark: 'bar'
          },
          {
            data: [{ x: 'Apr', y: 94 }, { x: 'May', y: 97 }, { x: 'Jun', y: 99 }],
            id: 'reliability',
            label: 'Reliability',
            mark: 'line'
          }
        ]}
      />
    )}
  </>
)

const Playground = ({
  onSchemeChange
}: {
  onSchemeChange: (scheme: ColorScheme) => void
}): ReactElement => {
  const theme = useLumenTheme()
  const themeToggle = getThemeToggleState(theme.scheme)
  const initialComponent = getInitialComponentQuery()
  const embedded = isEmbeddedPreview()
  const [email, setEmail] = useState('hello@lumen.dev')
  const [notes, setNotes] = useState('Native components now share one documented contract.')
  const [releaseDate, setReleaseDate] = useState<Date | null>(() => new Date(2026, 8, 15))

  const [reportingRange, setReportingRange] = useState<LumenDateRangeValue>(() => ({
    end: new Date(2026, 8, 30),
    start: new Date(2026, 8, 15)
  }))

  const [phoneNumber, setPhoneNumber] = useState<LumenPhoneNumber>(() => (
    createEmptyLumenPhoneNumber(defaultPhoneCountry)
  ))

  const [query, setQuery] = useState(initialComponent)
  const [saved, setSaved] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [profile, setProfile] = useState('balanced')
  const [density, setDensity] = useState('comfortable')
  const [detailsExpanded, setDetailsExpanded] = useState(true)
  const [showBanner, setShowBanner] = useState(true)
  const [showToast, setShowToast] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [designSelected, setDesignSelected] = useState(true)
  const [dialogVisible, setDialogVisible] = useState(initialComponent === 'Alert dialog')
  const [sheetVisible, setSheetVisible] = useState(initialComponent === 'Sheet')
  const [activeTab, setActiveTab] = useState('overview')
  const [navigationValue, setNavigationValue] = useState('components')
  const [navigationVisible, setNavigationVisible] = useState(true)
  const [lastAction, setLastAction] = useState('No overlay action yet')

  const visibleNames = useMemo(
    () => getVisibleComponentNames(query, embedded),
    [embedded, query]
  )

  const isVisible = (name: string) => visibleNames.includes(name)
  const isAnyVisible = (...names: string[]) => names.some(isVisible)

  return (
    <LumenSurface padding="none" radius="none" style={styles.screen} tone="canvas">
      <ScrollView
        contentContainerStyle={getPlaygroundContentStyle(embedded)}
        keyboardShouldPersistTaps="handled"
        refreshControl={(
          <LumenRefreshControl
            accessibilityLabel="Refresh component catalog"
            onRefresh={() => {
              setRefreshing(true)

              globalThis.setTimeout(() => {
                setRefreshing(false)
              }, 800)
            }}
            refreshing={refreshing}
          />
        )}
      >
        <Visibility visible={!embedded}>
          <>
            <View style={styles.hero}>
              <View style={styles.heroCopy}>
                <LumenBadge tone="accent">{Platform.OS}</LumenBadge>
                <LumenText variant="title">Lumen Playground</LumenText>
                <LumenText tone="soft">
                  Explore every public primitive with real React Native state and behavior.
                </LumenText>
              </View>
              <LumenIconButton
                name={themeToggle.icon}
                label={themeToggle.label}
                onPress={() => {
                  onSchemeChange(themeToggle.scheme)
                }}
              />
            </View>

            <LumenSearchField
              graphic={<LumenIcon decorative name="search" size="sm" />}
              onChangeText={setQuery}
              prompt="Search components"
              value={query}
            />

            <View style={styles.catalogMeta}>
              <LumenText variant="label">
                {visibleNames.length}
                {' '}
                components
              </LumenText>
              <LumenText tone="muted" variant="caption">Interactive web · iOS · Android</LumenText>
            </View>
          </>
        </Visibility>

        <Visibility visible={isAnyVisible('Theme', 'Text', 'Surface')}>
          <ComponentSection
            description="Semantic roles adapt to the selected color scheme."
            title="Theme, text, and surfaces"
          >
            <LumenSurface padding="lg" tone="muted">
              <LumenText variant="title">Shared foundations</LumenText>
              <LumenText tone="soft">Canvas, surfaces, type, spacing, and radii come from Lumen.</LumenText>
            </LumenSurface>
          </ComponentSection>
        </Visibility>

        <Visibility visible={isAnyVisible('Icon', 'Icon button')}>
          <ComponentSection description="Shared names render the same Lumen artwork on every platform." title="Icons">
            <View style={styles.row}>
              <LumenIcon label="Search" name="search" />
              <LumenIcon label="Complete" name="check" size="lg" />
              <LumenIcon label="GitHub" name="brand:github" size="lg" />
              <LumenIconButton
                label="Search the catalog"
                name="search"
                onPress={() => {
                  setQuery('')
                }}
              />
            </View>
          </ComponentSection>
        </Visibility>

        <Visibility visible={isAnyVisible('Button', 'Button group', 'Chip')}>
          <ComponentSection description="Press each intent and inspect disabled and loading states." title="Buttons">
            <LumenButtonGroup style={styles.row}>
              <LumenButton onPress={() => {
                setSaved(true)
              }}
              >
                Primary
              </LumenButton>
              <LumenButton
                intent="secondary"
                onPress={() => {
                  setSaved(false)
                }}
              >
                Secondary
              </LumenButton>
              <LumenButton
                intent="danger"
                onPress={() => {
                  setSaved(false)
                }}
              >
                Danger
              </LumenButton>
            </LumenButtonGroup>
            <View style={styles.row}>
              <LumenButton disabled>Disabled</LumenButton>
              <LumenButton loading>Saving</LumenButton>
              <LumenChip
                label="Design"
                onPress={() => {
                  setDesignSelected(previous => !previous)
                }}
                selected={designSelected}
              />
            </View>
          </ComponentSection>
        </Visibility>

        <Visibility visible={isAnyVisible('Sparkline', 'Line chart', 'Bar chart', 'Pie chart', 'Scatter chart', 'Heatmap', 'Range chart', 'Combo chart')}>
          <ComponentSection
            description="Tokenized plots include a factual accessibility summary and readable fallback data."
            title="Data visualization"
          >
            <ChartExamples isVisible={isVisible} />
          </ComponentSection>
        </Visibility>

        <Visibility
          visible={isAnyVisible(
            'Text field',
            'Textarea',
            'Field group',
            'Toggle',
            'Settings row',
            'Search field',
            'Date field',
            'Date range field',
            'Phone input',
            'Checkbox',
            'Radio group',
            'Segmented control',
            'Tabs'
          )}
        >
          <ComponentSection description="Edit controls to exercise native focus, switch, and clear behavior." title="Forms">
            <LumenTextField
              accessibilityLabel="Email address"
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              value={email}
            />
            <LumenTextField
              accessibilityLabel="Invalid project slug"
              error
              placeholder="Invalid value"
              value="lumen playground"
            />
            <LumenTextarea
              description="Summarize the native release."
              label="Release notes"
              onChangeText={setNotes}
              value={notes}
            />
            <LumenDateField
              description="Choose the planned native release date."
              label="Release date"
              minimumDate={new Date(2026, 8, 1)}
              onValueChange={setReleaseDate}
              value={releaseDate}
            />
            <LumenDateRangeField
              description="The end date cannot precede the start date."
              label="Reporting period"
              minimumDate={new Date(2026, 8, 1)}
              onValueChange={setReportingRange}
              value={reportingRange}
            />
            <LumenPhoneInput
              description={phoneNumber.e164 ?? 'Add the full hospital or OB number.'}
              label="Hospital or OB phone number"
              locale="en-US"
              onValueChange={setPhoneNumber}
              value={phoneNumber}
            />
            <LumenFieldGroup
              description="These controls retain independent focus and labels."
              label="Publication checks"
              required
            >
              <LumenCheckbox
                checked={termsAccepted}
                label="Confirm accessibility review"
                onCheckedChange={setTermsAccepted}
              />
            </LumenFieldGroup>
            <LumenToggle
              description="Example state only. The playground does not register for notifications."
              label="Demo notification preference"
              onValueChange={setNotificationsEnabled}
              value={notificationsEnabled}
            />
            <LumenSettingsRow
              control={(
                <LumenToggle
                  label="Demo automatic updates"
                  onValueChange={setNotificationsEnabled}
                  showLabel={false}
                  value={notificationsEnabled}
                />
              )}
              description="Example state only. The playground does not download updates."
              graphic={<LumenIcon decorative name="check" size="sm" />}
              title="Demo automatic updates"
            />
            <LumenCheckbox
              checked={termsAccepted}
              description="Required before publishing this native component set."
              label="Confirm accessibility review"
              onCheckedChange={setTermsAccepted}
            />
            <LumenRadioGroup
              label="Performance profile"
              onValueChange={setProfile}
              options={[
                { description: 'Reduce background activity.', label: 'Quiet', value: 'quiet' },
                { description: 'Recommended for most projects.', label: 'Balanced', value: 'balanced' },
                { description: 'Prioritize responsiveness.', label: 'Performance', value: 'performance' }
              ]}
              value={profile}
            />
            <LumenSegmentedControl
              label="Control density"
              onValueChange={setDensity}
              options={[
                { label: 'Compact', value: 'compact' },
                { label: 'Comfortable', value: 'comfortable' },
                { disabled: true, label: 'Spacious', value: 'spacious' }
              ]}
              value={density}
            />
            <Visibility visible={isVisible('Tabs')}>
              <LumenTabs
                label="Workspace views"
                onValueChange={setActiveTab}
                options={[
                  { label: 'Overview', value: 'overview' },
                  { label: 'Activity', value: 'activity' },
                  { disabled: true, label: 'Billing', value: 'billing' }
                ]}
                value={activeTab}
              >
                <LumenSurface padding="md" tone="muted">
                  <LumenText variant="label">
                    {activeTab === 'overview' ? 'Workspace health is ready.' : 'Three components updated today.'}
                  </LumenText>
                </LumenSurface>
              </LumenTabs>
            </Visibility>
          </ComponentSection>
        </Visibility>

        <Visibility visible={isAnyVisible('Badge', 'Divider', 'Spinner')}>
          <ComponentSection description="Compact status, separation, and progress primitives." title="Feedback primitives">
            <View style={styles.row}>
              <LumenBadge>Neutral</LumenBadge>
              <LumenBadge tone="success">Ready</LumenBadge>
              <LumenBadge tone="warning">Review</LumenBadge>
              <LumenBadge tone="danger">Blocked</LumenBadge>
              <LumenSpinner accessibilityLabel="Loading component data" />
            </View>
          </ComponentSection>
        </Visibility>

        <Visibility visible={isVisible('Card')}>
          <ComponentSection description="Cards support neutral, semantic, and interactive presentations." title="Card">
            <LumenCard
              onPress={() => {
                setSaved(previous => !previous)
              }}
              variant="muted"
            >
              <LumenText variant="label">Interactive workspace</LumenText>
              <LumenText tone="soft">Press to toggle the saved state.</LumenText>
              <LumenBadge tone={saved ? 'success' : 'neutral'}>{saved ? 'Saved' : 'Draft'}</LumenBadge>
            </LumenCard>
          </ComponentSection>
        </Visibility>

        <Visibility visible={isAnyVisible('Alert', 'Banner', 'Toast')}>
          <ComponentSection description="Alerts preserve readable titles and descriptions across tones." title="Alert">
            <LumenAlert variant="success">
              <LumenAlertTitle>Playground is ready</LumenAlertTitle>
              <LumenAlertDescription>The same screen can run on web, iOS, and Android.</LumenAlertDescription>
            </LumenAlert>
            {showBanner ?
              (
                <LumenBanner
                  description="Dismiss this notice to exercise local state."
                  onDismiss={() => {
                    setShowBanner(false)
                  }}
                  title="Native structured feedback"
                  variant="accent"
                />
              ) :
              (
                <LumenButton
                  intent="secondary"
                  onPress={() => {
                    setShowBanner(true)
                  }}
                  size="sm"
                >
                  Restore banner
                </LumenButton>
              )}
            <Visibility visible={showToast}>
              <LumenToast
                description="All shared native catalogs were updated."
                onDismiss={() => {
                  setShowToast(false)
                }}
                title="Changes saved"
                variant="success"
              />
            </Visibility>
          </ComponentSection>
        </Visibility>

        <Visibility visible={isVisible('Progress')}>
          <ComponentSection description="Progress exposes its value to assistive technology." title="Progress">
            <View style={styles.progressLabel}>
              <LumenText variant="label">Documentation coverage</LumenText>
              <LumenText tone="muted">86%</LumenText>
            </View>
            <LumenProgress label="Documentation coverage" value={86} />
          </ComponentSection>
        </Visibility>

        <Visibility visible={isAnyVisible('Skeleton', 'Disclosure')}>
          <ComponentSection
            description="Loading placeholders stay quiet, while disclosures expose controlled expanded state."
            title="Content states"
          >
            <View style={styles.row}>
              <LumenSkeleton height={44} shape="circle" width={44} />
              <View style={{ flex: 1, gap: theme.spacing.sm }}>
                <LumenSkeleton height={16} label="Loading profile" width="72%" />
                <LumenSkeleton height={12} width="48%" />
              </View>
            </View>
            <LumenDisclosure
              description="Press the header to verify native expanded state."
              expanded={detailsExpanded}
              onExpandedChange={setDetailsExpanded}
              title="Implementation notes"
            >
              <LumenText tone="soft">Each adapter owns its native rendering and focus behavior.</LumenText>
            </LumenDisclosure>
          </ComponentSection>
        </Visibility>

        <Visibility visible={isAnyVisible('Graphic', 'Backdrop', 'Illustration', 'Image')}>
          <ComponentSection
            description="Token-aware decorative foundations and semantic empty, success, error, and offline artwork."
            title="Visual content"
          >
            <View style={styles.visualGrid}>
              <LumenCard style={styles.visualCard}>
                <LumenGraphic label="Orbit graphic with a package icon" size="sm" tone="brand" variant="orbit">
                  <LumenIcon decorative name="package" size="lg" />
                </LumenGraphic>
                <LumenText variant="label">Graphic</LumenText>
              </LumenCard>
              <LumenCard style={styles.visualCard}>
                <LumenBackdrop intensity="strong" style={{ width: '100%' }} tone="accent" variant="dots">
                  <View style={{ alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.xl }}>
                    <LumenIcon decorative name="sparkles" size="lg" />
                    <LumenText variant="label">Backdrop</LumenText>
                  </View>
                </LumenBackdrop>
              </LumenCard>
            </View>
            <View style={styles.row}>
              <LumenIllustration label="Empty inbox" size="sm" variant="empty" />
              <LumenIllustration label="Successful operation" size="sm" variant="success" />
              <LumenIllustration label="Operation failed" size="sm" variant="error" />
              <LumenIllustration label="Device is offline" size="sm" variant="offline" />
            </View>
            <LumenImage
              aspectRatio={16 / 9}
              fit="cover"
              label="Blue Lumen sample artwork"
              radius="md"
              source={sampleImage}
            />
          </ComponentSection>
        </Visibility>

        <Visibility
          visible={isAnyVisible('Avatar', 'List row', 'Stat', 'Section header')}
        >
          <ComponentSection description="Identity, metrics, and structured rows compose into product content." title="Data display">
            <LumenSectionHeader
              actions={(
                <LumenButton
                  intent="quiet"
                  onPress={() => {
                    setSaved(false)
                  }}
                  size="sm"
                >
                  Refresh
                </LumenButton>
              )}
              count={String(componentNames.length)}
              subtitle="Shared native contracts"
              title="Workspace"
            />
            <View style={styles.statGrid}>
              <LumenStat
                detail="Across three adapters"
                label="Shared components"
                style={styles.statItem}
                tone="accent"
                value={String(componentNames.length)}
              />
              <LumenStat
                detail="All repository gates"
                label="Verification"
                style={styles.statItem}
                tone="success"
                value="Passing"
              />
            </View>
            <LumenCard variant={saved ? 'success' : 'muted'}>
              <LumenListRow
                leading={<LumenAvatar fallback="LU" label="Lumen UI" size="lg" />}
                trailing={<LumenBadge tone={saved ? 'success' : 'neutral'}>{saved ? 'Saved' : 'Draft'}</LumenBadge>}
              >
                <LumenText variant="label">Lumen UI</LumenText>
                <LumenText tone="muted">Native design system</LumenText>
              </LumenListRow>
            </LumenCard>
          </ComponentSection>
        </Visibility>

        <Visibility visible={visibleNames.length === 0}>
          <LumenEmptyState
            actions={(
              <LumenButton
                intent="secondary"
                onPress={() => {
                  setQuery('')
                }}
              >
                Clear search
              </LumenButton>
            )}
            description="Try another component name or reset the catalog."
            graphic={<LumenIcon decorative name="search" size="lg" />}
            title="No matching component"
          />
        </Visibility>

        <Visibility visible={isAnyVisible('Alert dialog', 'Sheet', 'Menu', 'Share button')}>
          <ComponentSection
            description="Controlled modal surfaces, anchored actions, and the operating-system share sheet."
            title="Overlays and system actions"
          >
            <View style={styles.row}>
              <LumenButton
                onPress={() => {
                  setDialogVisible(true)
                }}
              >
                Open alert dialog
              </LumenButton>
              <LumenButton
                intent="secondary"
                onPress={() => {
                  setSheetVisible(true)
                }}
              >
                Open sheet
              </LumenButton>
              <LumenMenu
                accessibilityLabel="Component actions"
                items={[
                  {
                    label: 'Duplicate example',
                    onPress: () => {
                      setLastAction('Duplicated the example')
                    }
                  },
                  {
                    disabled: true,
                    label: 'Archive example',
                    onPress: () => {
                      setLastAction('Archived the example')
                    }
                  },
                  {
                    destructive: true,
                    label: 'Delete example',
                    onPress: () => {
                      setLastAction('Deleted the example')
                    }
                  }
                ]}
                trigger={<LumenIcon name="ellipsis" size="md" />}
              />
              <LumenShareButton
                content={{ message: 'Explore Lumen UI at https://lumen.santi020k.com' }}
                label="Share Lumen"
                onError={() => {
                  setLastAction('Sharing is unavailable on this target')
                }}
                onShared={() => {
                  setLastAction('Opened the system share flow')
                }}
              />
            </View>
            <LumenText tone="muted" variant="caption">{lastAction}</LumenText>
          </ComponentSection>
          <LumenAlertDialog
            confirmLabel="Delete example"
            description="This gallery keeps the operation local so the destructive flow is safe to test."
            destructive
            onConfirm={() => {
              setDialogVisible(false)

              setLastAction('Confirmed the destructive dialog')
            }}
            onDismiss={() => {
              setDialogVisible(false)
            }}
            title="Delete this example?"
            visible={dialogVisible}
          />
          <LumenSheet
            actions={(
              <LumenButton
                onPress={() => {
                  setSheetVisible(false)

                  setLastAction('Saved sheet settings')
                }}
              >
                Save settings
              </LumenButton>
            )}
            description="A native modal surface for focused supplemental work."
            onDismiss={() => {
              setSheetVisible(false)
            }}
            title="Component settings"
            visible={sheetVisible}
          >
            <LumenToggle
              description="Show experimental examples in this local gallery."
              label="Experimental examples"
              onValueChange={setNotificationsEnabled}
              value={notificationsEnabled}
            />
          </LumenSheet>
        </Visibility>

        <Visibility
          visible={isAnyVisible(
            'Navigation bar',
            'Navigation accessory',
            'Collapsible navigation bar'
          )}
        >
          <ComponentSection
            description="Controlled destinations, compact accessories, and optional animated visibility for scrolling layouts."
            title="Native navigation"
          >
            <LumenNavigationBar
              items={demoNavigationItems}
              onReselect={value => {
                setLastAction(`Reselected ${value}`)
              }}
              onValueChange={setNavigationValue}
              value={navigationValue}
            />
            <LumenNavigationAccessory>
              <LumenText variant="label">3 components updated</LumenText>
            </LumenNavigationAccessory>
            <LumenCollapsibleNavigationBar
              accessory={<LumenText variant="caption">Gallery sync complete</LumenText>}
              items={demoNavigationItems}
              onReselect={value => {
                setLastAction(`Reselected ${value}`)
              }}
              onValueChange={setNavigationValue}
              value={navigationValue}
              visible={navigationVisible}
            />
            <LumenButton
              intent="secondary"
              onPress={() => {
                setNavigationVisible(previous => !previous)
              }}
              size="sm"
            >
              {navigationVisible ? 'Hide navigation' : 'Show navigation'}
            </LumenButton>
          </ComponentSection>
        </Visibility>

        <Visibility visible={!embedded}>
          <LumenStatusBar
            message={`Built with @santi020k/lumen-react-native · ${theme.scheme} theme`}
            tone="success"
            trailing={(
              <LumenText tone="muted" variant="caption">
                {componentNames.length}
                {' '}
                shared
              </LumenText>
            )}
          />
        </Visibility>
      </ScrollView>
    </LumenSurface>
  )
}

const AppShell = ({
  onSchemeChange,
  onThemePresetChange,
  scheme,
  themePreset
}: {
  onSchemeChange: (scheme: ColorScheme) => void
  onThemePresetChange: (preset: ThemePreset) => void
  scheme: ColorScheme
  themePreset: ThemePreset
}): ReactElement => {
  const theme = useLumenTheme()
  const embedded = isEmbeddedPreview()
  const [destination, setDestination] = useState<AppDestination>(getInitialDestination)

  return (
    <>
      <ExpoStatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView
        edges={['top', 'right', 'bottom', 'left']}
        style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}
      >
        <LumenSurface padding="none" radius="none" style={styles.app} tone="canvas">
          <View style={styles.appBody}>
            {destination === 'home' && (
              <HomeScreen
                onBrowse={() => {
                  setDestination('components')
                }}
                onOpenAbout={() => {
                  setDestination('about')
                }}
              />
            )}
            {destination === 'components' && (
              <Playground onSchemeChange={onSchemeChange} />
            )}
            {destination === 'about' && (
              <AboutScreen
                onSchemeChange={onSchemeChange}
                onThemePresetChange={onThemePresetChange}
                scheme={scheme}
                themePreset={themePreset}
              />
            )}
          </View>
          {!embedded && (
            <LumenNavigationBar
              accessibilityLabel="Playground navigation"
              items={appNavigationItems}
              onValueChange={value => {
                if (isAppDestination(value)) setDestination(value)
              }}
              style={styles.appNavigation}
              value={destination}
            />
          )}
        </LumenSurface>
      </SafeAreaView>
    </>
  )
}

const App = (): ReactElement => {
  const [scheme, setScheme] = useState<ColorScheme>(getInitialColorScheme)
  const [themePreset, setThemePreset] = useState<ThemePreset>(getInitialThemePreset)
  const systemScheme = useColorScheme()
  const resolvedScheme = resolvePlaygroundScheme(scheme, systemScheme)

  const theme = useMemo(
    () => createPlaygroundTheme(themePreset, resolvedScheme),
    [resolvedScheme, themePreset]
  )

  return (
    <SafeAreaProvider>
      <LumenProvider theme={theme}>
        <AppShell
          onSchemeChange={setScheme}
          onThemePresetChange={setThemePreset}
          scheme={scheme}
          themePreset={themePreset}
        />
      </LumenProvider>
    </SafeAreaProvider>
  )
}

export default App
