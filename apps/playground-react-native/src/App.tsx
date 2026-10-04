// cspell:words Capacidad
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  AccessibilityInfo,
  Linking,
  PixelRatio,
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
  SafeAreaView,
  useSafeAreaInsets
} from 'react-native-safe-area-context'

import {
  createEmptyLumenPhoneNumber,
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
  LumenBoxPlot,
  LumenBulletChart,
  LumenButton,
  LumenButtonGroup,
  LumenCalendarHeatmap,
  LumenCard,
  LumenCheckbox,
  LumenChip,
  LumenCollapsibleNavigationBar,
  LumenComboChart,
  LumenDisclosure,
  LumenDivider,
  LumenDumbbellChart,
  LumenEmptyState,
  LumenErrorState,
  LumenFieldGroup,
  LumenFunnelChart,
  LumenGauge,
  LumenGraphic,
  LumenHeatmap,
  LumenHistogram,
  LumenIcon,
  LumenIconButton,
  LumenIllustration,
  LumenImage,
  LumenLineChart,
  LumenListRow,
  LumenLollipopChart,
  LumenMenu,
  LumenNavigationAccessory,
  LumenNavigationBar,
  LumenPhoneInput,
  type LumenPhoneNumber,
  LumenPicker,
  LumenPieChart,
  LumenProgress,
  LumenProvider,
  LumenRadioGroup,
  LumenRangeChart,
  LumenRangeSlider,
  LumenRefreshControl,
  LumenScatterChart,
  LumenSearchField,
  LumenSectionHeader,
  LumenSegmentedControl,
  LumenSettingsRow,
  LumenShareButton,
  LumenSheet,
  LumenSkeleton,
  LumenSlider,
  LumenSparkline,
  LumenSpinner,
  LumenStat,
  LumenStatusBar,
  LumenSurface,
  LumenTabs,
  LumenText,
  LumenTextarea,
  LumenTextField,
  LumenToast,
  LumenToggle,
  LumenWaterfallChart,
  useLumenTheme
} from '@santi020k/lumen-react-native'
import {
  LumenDateField,
  LumenDateRangeField,
  type LumenDateRangeValue
} from '@santi020k/lumen-react-native/datetime'
import { StatusBar as ExpoStatusBar } from 'expo-status-bar'

import { AdvancedInputExamples } from './AdvancedInputExamples'
import {
  type AppDestination,
  componentCategories,
  type ComponentCategory,
  componentNames,
  getComponentCategory,
  getVisibleComponentNames,
  isAppDestination,
  isComponentCategory,
  normalizeComponentQuery,
  playgroundLumenVersion
} from './playground-model'
import { createPlaygroundTheme, isThemePreset, type ThemePreset, themePresetOptions } from './playground-theme'
import { WorkspaceExample } from './WorkspaceExample'

type ColorScheme = 'dark' | 'light' | 'system'

const resolvePlaygroundScheme = (
  preference: ColorScheme,
  systemScheme: ReturnType<typeof useColorScheme>
): 'dark' | 'light' => {
  if (preference === 'dark' || preference === 'light') return preference

  return systemScheme === 'dark' ? 'dark' : 'light'
}

interface ComponentSectionProps {
  children: ReactNode
  description: string
  title: string
}

const componentIcon = getLumenIconGraphic('blocks')
const examplesIcon = getLumenIconGraphic('layers')
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
  { icon: examplesIcon, label: 'Examples', value: 'examples' },
  { icon: componentIcon, label: 'Components', value: 'components' },
  { icon: settingsIcon, label: 'Settings', value: 'settings' }
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

const getInitialThemePreset = (): ThemePreset => {
  const preset = getWebQueryParameter('theme')

  return isThemePreset(preset) ? preset : 'lumen'
}

const getInitialDestination = (): AppDestination => {
  if (isEmbeddedPreview() || getInitialComponentQuery()) return 'components'

  const destination = getWebQueryParameter('destination')

  return isAppDestination(destination) ? destination : 'home'
}

const updateWebQueryParameter = (name: string, value: string): void => {
  if (
    Platform.OS !== 'web' ||
    typeof globalThis.history === 'undefined' ||
    typeof globalThis.location === 'undefined'
  ) return

  const url = new URL(globalThis.location.href)

  if (value) url.searchParams.set(name, value)
  else url.searchParams.delete(name)

  globalThis.history.replaceState(null, '', url)
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
  catalogPicker: {
    gap: 12
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  componentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  componentGridItem: {
    flexBasis: 150,
    flexGrow: 1
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

const isColorScheme = (value: string): value is ColorScheme => (
  value === 'dark' || value === 'light' || value === 'system'
)

type ExampleState = 'empty' | 'error' | 'loading' | 'success'

type ExamplePattern = 'health' | 'profile' | 'release' | 'workspace'

type PlaygroundLocale = 'en' | 'es'

interface AccessibilitySnapshot {
  fontScale: number
  reduceMotion: boolean
  screenReader: boolean
}

interface PlaygroundLocalizedCopy {
  action: string
  description: string
  error: string
  label: string
  success: string
}

const playgroundLocalizedCopy: Record<PlaygroundLocale, PlaygroundLocalizedCopy> = {
  en: {
    action: 'Validate note',
    description: 'Describe what changed for your users.',
    error: 'A release note is required.',
    label: 'Release note',
    success: 'The release note is ready.'
  },
  es: {
    action: 'Validar nota',
    description: 'Describe qué cambió para tus usuarios.',
    error: 'La nota de la versión es obligatoria.',
    label: 'Nota de la versión',
    success: 'La nota de la versión está lista.'
  }
}

const isExampleState = (value: string): value is ExampleState => (
  value === 'empty' || value === 'error' || value === 'loading' || value === 'success'
)

const isExamplePattern = (value: string): value is ExamplePattern => (
  value === 'health' || value === 'profile' || value === 'release' || value === 'workspace'
)

const useAccessibilitySnapshot = (): AccessibilitySnapshot => {
  const [snapshot, setSnapshot] = useState<AccessibilitySnapshot>({
    fontScale: PixelRatio.getFontScale(),
    reduceMotion: false,
    screenReader: false
  })

  useEffect(() => {
    let active = true

    const readAccessibilitySnapshot = async (): Promise<void> => {
      const [reduceMotion, screenReader] = await Promise.all([
        AccessibilityInfo.isReduceMotionEnabled(),
        AccessibilityInfo.isScreenReaderEnabled()
      ])

      if (active) {
        setSnapshot({
          fontScale: PixelRatio.getFontScale(),
          reduceMotion,
          screenReader
        })
      }
    }

    readAccessibilitySnapshot().catch(() => undefined)

    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      reduceMotion => {
        setSnapshot(previous => ({ ...previous, reduceMotion }))
      }
    )

    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      screenReader => {
        setSnapshot(previous => ({ ...previous, screenReader }))
      }
    )

    return () => {
      active = false

      reduceMotionSubscription.remove()

      screenReaderSubscription.remove()
    }
  }, [])

  return snapshot
}

const HomeScreen = ({
  onBrowse,
  onOpenExamples,
  onOpenSettings
}: {
  onBrowse: () => void
  onOpenExamples: () => void
  onOpenSettings: () => void
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
            <LumenButton intent="secondary" onPress={onOpenExamples}>Open product examples</LumenButton>
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
              <LumenText tone="muted">Inspect live device settings, localized validation, and contrast.</LumenText>
            </LumenListRow>
          </View>
        </LumenCard>

        <LumenButton intent="quiet" onPress={onOpenSettings}>Review appearance and accessibility</LumenButton>

        <LumenStatusBar
          message="Built with @santi020k/lumen-react-native"
          tone="success"
          trailing={<LumenText tone="muted" variant="caption">Public preview</LumenText>}
        />
      </ScrollView>
    </LumenSurface>
  )
}

const ExampleStatePreview = ({
  onStateChange,
  state
}: {
  onStateChange: (state: ExampleState) => void
  state: ExampleState
}): ReactElement => (
  <LumenCard style={styles.section}>
    <LumenSectionHeader
      subtitle="Inspect explicit loading, empty, error, and success outcomes."
      title="State preview"
    />
    <LumenSegmentedControl
      label="Reference state"
      onValueChange={value => {
        if (isExampleState(value)) onStateChange(value)
      }}
      options={[
        { label: 'Loading', value: 'loading' },
        { label: 'Empty', value: 'empty' },
        { label: 'Error', value: 'error' },
        { label: 'Success', value: 'success' }
      ]}
      value={state}
    />
    {state === 'loading' && (
      <View accessibilityLiveRegion="polite" style={styles.stack}>
        <LumenSpinner accessibilityLabel="Loading reference data" />
        <LumenSkeleton shape="text" />
        <LumenSkeleton shape="text" width="78%" />
        <LumenStatusBar message="Synchronizing the native catalog" tone="accent" />
      </View>
    )}
    {state === 'empty' && (
      <LumenEmptyState
        actions={(
          <LumenButton onPress={() => {
            onStateChange('success')
          }}
          >
            Create sample entry
          </LumenButton>
        )}
        description="Add a sample entry to review the completed state."
        graphic={<LumenIcon decorative name="blocks" size="lg" />}
        title="Nothing needs attention"
      />
    )}
    {state === 'error' && (
      <LumenErrorState
        actions={(
          <LumenButton onPress={() => {
            onStateChange('loading')
          }}
          >
            Retry synchronization
          </LumenButton>
        )}
        description="The local example could not finish its simulated refresh."
        reference="PLAYGROUND-SYNC"
        title="Catalog synchronization failed"
      />
    )}
    {state === 'success' && (
      <LumenCard variant="success">
        <LumenListRow
          leading={<LumenIcon decorative name="circle-check" size="lg" />}
          trailing={<LumenBadge tone="success">Ready</LumenBadge>}
        >
          <LumenText variant="label">Reference is current</LumenText>
          <LumenText tone="muted">Local example data is ready to inspect.</LumenText>
        </LumenListRow>
      </LumenCard>
    )}
  </LumenCard>
)

const ExamplesScreen = (): ReactElement => {
  const initialState = getWebQueryParameter('state')
  const initialPattern = getWebQueryParameter('pattern')

  const [exampleState, setExampleState] = useState<ExampleState>(
    () => isExampleState(initialState) ? initialState : 'success'
  )

  const [pattern, setPattern] = useState<ExamplePattern>(
    () => isExamplePattern(initialPattern) ? initialPattern : 'release'
  )

  const [approved, setApproved] = useState(false)
  const [profileName, setProfileName] = useState('Lumen Contributor')
  const [profileRole, setProfileRole] = useState('developer')
  const [updatesEnabled, setUpdatesEnabled] = useState(true)
  const [profileSaved, setProfileSaved] = useState(false)

  const updateExampleState = (state: ExampleState): void => {
    setExampleState(state)

    updateWebQueryParameter('state', state)
  }

  if (pattern === 'workspace') {
    return (
      <WorkspaceExample onBack={() => {
        setPattern('release')

        updateWebQueryParameter('pattern', 'release')
      }}
      />
    )
  }

  return (
    <LumenSurface padding="none" radius="none" style={styles.screen} tone="canvas">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCopy}>
          <LumenBadge tone="accent">Product patterns</LumenBadge>
          <LumenText variant="title">Examples</LumenText>
          <LumenText tone="soft">
            Switch among complete release, catalog-health, and contributor-profile patterns.
          </LumenText>
        </View>

        <LumenTabs
          label="Example pattern"
          onValueChange={value => {
            if (isExamplePattern(value)) {
              setPattern(value)

              updateWebQueryParameter('pattern', value)
            }
          }}
          options={[
            { label: 'Release', value: 'release' },
            { label: 'Health', value: 'health' },
            { label: 'Profile', value: 'profile' },
            { label: 'Workspace', value: 'workspace' }
          ]}
          value={pattern}
        >
          {pattern === 'release' && (
            <View style={styles.stack}>
              <LumenCard style={styles.section}>
                <LumenSectionHeader
                  subtitle="Prepare a local package review with explicit validation and completion feedback."
                  title="Release checklist"
                />
                <LumenCheckbox
                  checked={approved}
                  description="Review labels, focus order, touch targets, and status announcements."
                  label="Accessibility review complete"
                  onCheckedChange={setApproved}
                />
                <LumenButton
                  disabled={!approved}
                  onPress={() => {
                    updateExampleState('success')
                  }}
                >
                  Prepare release
                </LumenButton>
                <LumenStatusBar
                  message={approved ? 'Release ready for final review' : 'Accessibility review required'}
                  tone={approved ? 'success' : 'warning'}
                />
              </LumenCard>
              <ExampleStatePreview state={exampleState} onStateChange={updateExampleState} />
            </View>
          )}

          {pattern === 'health' && (
            <View style={styles.stack}>
              <View style={styles.statGrid}>
                <LumenStat
                  detail="Current public catalog"
                  label="Components"
                  style={styles.statItem}
                  tone="accent"
                  value={String(componentNames.length)}
                />
                <LumenStat
                  detail="Shared discovery structure"
                  label="Categories"
                  style={styles.statItem}
                  tone="success"
                  value={String(componentCategories.length)}
                />
              </View>
              <LumenBarChart
                heading="Catalog distribution"
                label="React Native components by category"
                series={[{
                  data: componentCategories.map(category => ({
                    x: category.label,
                    y: category.names.length
                  })),
                  id: 'catalog',
                  label: 'Components'
                }]}
              />
              <ExampleStatePreview state={exampleState} onStateChange={updateExampleState} />
            </View>
          )}

          {pattern === 'profile' && (
            <View style={styles.stack}>
              <LumenCard style={styles.section}>
                <LumenSectionHeader
                  subtitle="Profile details and local preferences remain editable and recoverable."
                  title="Contributor onboarding"
                />
                <LumenTextarea
                  errorMessage={profileName.trim().length === 0 ? 'Enter a display name.' : undefined}
                  label="Display name"
                  onChangeText={value => {
                    setProfileName(value)

                    setProfileSaved(false)
                  }}
                  value={profileName}
                />
                <LumenSegmentedControl
                  label="Primary role"
                  onValueChange={value => {
                    setProfileRole(value)

                    setProfileSaved(false)
                  }}
                  options={[
                    { label: 'Design', value: 'designer' },
                    { label: 'Develop', value: 'developer' },
                    { label: 'Review', value: 'reviewer' }
                  ]}
                  value={profileRole}
                />
                <LumenToggle
                  description="This changes local demonstration state only."
                  label="Show release update examples"
                  onValueChange={value => {
                    setUpdatesEnabled(value)

                    setProfileSaved(false)
                  }}
                  value={updatesEnabled}
                />
                <LumenButton
                  disabled={profileName.trim().length === 0}
                  onPress={() => {
                    setProfileSaved(true)
                  }}
                >
                  Save profile
                </LumenButton>
                {profileSaved && (
                  <LumenToast
                    description={`${profileName} is ready to ${profileRole}.`}
                    onDismiss={() => {
                      setProfileSaved(false)
                    }}
                    title="Contributor profile saved"
                    variant="success"
                  />
                )}
              </LumenCard>
            </View>
          )}
        </LumenTabs>

        <LumenStatusBar message="Examples use local, disposable state" tone="success" />
      </ScrollView>
    </LumenSurface>
  )
}

const SettingsScreen = ({
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
  const accessibility = useAccessibilitySnapshot()
  const [locale, setLocale] = useState<PlaygroundLocale>('en')
  const [releaseNote, setReleaseNote] = useState('')
  const [validated, setValidated] = useState(false)
  const localizedCopy = playgroundLocalizedCopy[locale]

  const validationMessage = validated && releaseNote.trim().length === 0 ?
    localizedCopy.error :
    undefined

  return (
    <LumenSurface padding="none" radius="none" style={styles.screen} tone="canvas">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heroCopy}>
          <LumenBadge tone="accent">Local preferences</LumenBadge>
          <LumenText variant="title">Settings</LumenText>
          <LumenText tone="soft">
            Preview appearance, inspect live accessibility context, and exercise localized validation.
          </LumenText>
        </View>

        <LumenCard style={styles.section}>
          <LumenSectionHeader
            subtitle="Follow the device or choose a fixed playground theme."
            title="Appearance"
          />
          <LumenPicker
            label="Playground theme"
            onValueChange={value => {
              if (isThemePreset(value)) onThemePresetChange(value)
            }}
            options={themePresetOptions}
            value={themePreset}
          />
          <LumenText variant="caption" tone="muted">
            Normal keeps the classic Lumen look. Studio uses neutral surfaces. Glass uses rounded surfaces
            with an opaque material fallback on React Native.
          </LumenText>
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
          <View style={styles.row}>
            <LumenBadge tone="accent">{themePresetOptions.find(option => option.value === themePreset)?.label}</LumenBadge>
            <LumenBadge tone="neutral">{scheme.charAt(0).toUpperCase() + scheme.slice(1)}</LumenBadge>
          </View>
        </LumenCard>

        <LumenCard style={styles.section}>
          <LumenSectionHeader
            subtitle="Read-only values come from React Native and update when supported device settings change."
            title="Accessibility"
          />
          <LumenSettingsRow
            control={<LumenBadge tone={accessibility.screenReader ? 'success' : 'neutral'}>{accessibility.screenReader ? 'On' : 'Off'}</LumenBadge>}
            description="VoiceOver, TalkBack, or the active web accessibility bridge"
            title="Screen reader"
          />
          <LumenDivider />
          <LumenSettingsRow
            control={<LumenBadge tone={accessibility.reduceMotion ? 'success' : 'neutral'}>{accessibility.reduceMotion ? 'On' : 'Off'}</LumenBadge>}
            description="System preference for quieter functional transitions"
            title="Reduce motion"
          />
          <LumenDivider />
          <LumenSettingsRow
            control={(
              <LumenBadge tone="neutral">
                {accessibility.fontScale.toFixed(2)}
                ×
              </LumenBadge>
            )}
            description="Current React Native font scale"
            title="Text scale"
          />
          <LumenAlert>
            <LumenAlertTitle>Use the platform settings for authoritative testing</LumenAlertTitle>
            <LumenAlertDescription>
              The playground reports native preferences without pretending to replace VoiceOver,
              TalkBack, keyboard, contrast, or device text-size verification.
            </LumenAlertDescription>
          </LumenAlert>
        </LumenCard>

        <LumenCard style={styles.section}>
          <LumenSectionHeader
            subtitle="Switch application-owned copy while the controls remain mounted."
            title="Runtime localization"
          />
          <LumenSegmentedControl
            label="Language"
            onValueChange={value => {
              if (value === 'en' || value === 'es') setLocale(value)
            }}
            options={[
              { label: 'English', value: 'en' },
              { label: 'Español', value: 'es' }
            ]}
            value={locale}
          />
          <LumenTextarea
            description={localizedCopy.description}
            errorMessage={validationMessage}
            label={localizedCopy.label}
            onChangeText={value => {
              setReleaseNote(value)

              setValidated(false)
            }}
            value={releaseNote}
          />
          <LumenButton onPress={() => {
            setValidated(true)
          }}
          >
            {localizedCopy.action}
          </LumenButton>
          {validated && validationMessage === undefined && (
            <LumenAlert variant="success">
              <LumenAlertTitle>{localizedCopy.success}</LumenAlertTitle>
            </LumenAlert>
          )}
        </LumenCard>

        <LumenCard style={styles.section}>
          <LumenSectionHeader
            subtitle="Reference build details stay visible for support and review checks."
            title="App and platform"
          />
          <LumenSettingsRow
            control={<LumenBadge tone="success">Native</LumenBadge>}
            description="React Native with Expo"
            title="Platform"
          />
          <LumenDivider />
          <LumenSettingsRow
            control={<LumenBadge tone="neutral">{componentNames.length}</LumenBadge>}
            description="Generated playground entries"
            title="Catalog"
          />
          <LumenDivider />
          <LumenSettingsRow
            control={<LumenBadge tone="success">None</LumenBadge>}
            description="No account, analytics, or remote storage"
            title="Data collection"
          />
        </LumenCard>

        <LumenAlert variant="success">
          <LumenAlertTitle>Private by design</LumenAlertTitle>
          <LumenAlertDescription>
            The playground requires no account and does not collect, retain, or share personal data.
            Interactive examples remain on your device.
          </LumenAlertDescription>
        </LumenAlert>

        <LumenCard style={styles.section}>
          <LumenSectionHeader
            subtitle="Documentation, source, support, and policies."
            title="Privacy and resources"
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
              Feedback & support
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
          Lumen UI · React Native playground · Created by Santiago Molina
        </LumenText>
      </ScrollView>
    </LumenSurface>
  )
}

const IntervalChartExamples = ({ isVisible }: { isVisible: (name: string) => boolean }): ReactElement => (
  <>
    {isVisible('Calendar heatmap') && (
      <LumenCalendarHeatmap testID="component-calendar-heatmap" label="Daily activity" heading="Daily activity" startDate="2026-01-01" endDate="2026-03-31" data={Array.from({ length: 90 }, (_, index) => ({ date: new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10), value: index % 11 === 0 ? null : (index * 7) % 30 }))} />
    )}
    {isVisible('Funnel chart') && (
      <LumenFunnelChart testID="component-funnel-chart" label="Signup stages" heading="Signup stages" data={[{ id: 'visits', label: 'Visits', value: 1200 }, { id: 'started', label: 'Started', value: 720 }, { id: 'completed', label: 'Completed', value: 360 }]} />
    )}
    {isVisible('Box plot') && (
      <LumenBoxPlot testID="component-box-plot" label="Response time distribution" heading="Response time distribution" description="Milliseconds · supplied five-number summaries" data={[{ id: 'api', label: 'API', min: 12, q1: 24, median: 35, q3: 48, max: 70, outliers: [95] }, { id: 'worker', label: 'Worker', min: 18, q1: 30, median: 46, q3: 64, max: 90, outliers: [110] }]} />
    )}
    {isVisible('Waterfall chart') && (
      <LumenWaterfallChart
        label="Revenue movement"
        heading="Revenue movement"
        description="Opening balance to closing · USD, thousands"
        valueLabel="USD, thousands"
        data={[
          { id: 'opening', label: 'Opening', kind: 'total', value: 120 },
          { id: 'new', label: 'New', value: 85 },
          { id: 'growth', label: 'Growth', value: 35 },
          { id: 'costs', label: 'Costs', value: -45 },
          { id: 'other', label: 'Other', value: -10 },
          { id: 'closing', label: 'Closing', kind: 'total', value: 185 }
        ]}
      />
    )}
    {isVisible('Lollipop chart') && (
      <LumenLollipopChart testID="component-lollipop-chart" label="Team performance" heading="Team performance" data={[{ id: 'design', label: 'Design', reference: 62, value: 88 }, { id: 'engineering', label: 'Engineering', reference: 76, value: 91 }, { id: 'support', label: 'Support', reference: 81, value: 74 }, { id: 'operations', label: 'Operations', reference: 54, value: 83 }]} domain={{ min: 0, max: 100 }} referenceLabel="Previous" valueLabel="Current" />
    )}
    {isVisible('Dumbbell chart') && (
      <LumenDumbbellChart testID="component-dumbbell-chart" label="Progress by team" heading="Progress by team" data={[{ id: 'design', label: 'Design', reference: 62, value: 88 }, { id: 'engineering', label: 'Engineering', reference: 76, value: 91 }, { id: 'support', label: 'Support', reference: 81, value: 74 }, { id: 'operations', label: 'Operations', reference: 54, value: 83 }]} domain={{ min: 0, max: 100 }} referenceLabel="Previous" valueLabel="Current" />
    )}
    {isVisible('Bullet chart') && (
      <LumenBulletChart testID="component-bullet-chart" label="Delivery performance" heading="On-time delivery" description="Actual performance against the service target" value={86} target={95} ranges={[{ end: 70, label: 'Developing' }, { end: 90, label: 'Consistent' }, { end: 100, label: 'Excellent' }]} formatValue={value => `${value}%`} />
    )}
    {isVisible('Histogram') && (
      <LumenHistogram
        label="Response times"
        heading="Response time"
        description="Distribution of requests · milliseconds"
        data={
          [3, 8, 18, 34, 48, 57, 51, 37, 26, 15, 8, 3].map((count, index) => ({
            start: index * 25, end: (index + 1) * 25, count
          }))
        }
      />
    )}
  </>
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
    <IntervalChartExamples isVisible={isVisible} />
    {isVisible('Heatmap') && (
      <LumenHeatmap
        colorScale="diverging"
        heading="Weekly activity"
        description="Change from typical activity · by day and hour"
        data={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].flatMap((day, row) => (
          Array.from({ length: 12 }, (_, column) => {
            const typical = Math.round(Math.sin((column - 3) / 2) * 14 + Math.cos(row) * 6)
            const value = row === 0 && column === 0 ? 0 : typical

            return { value: row === 4 && column === 6 ? null : value, x: `${column + 8}:00`, y: day }
          })
        ))}
        label="Change in activity by day and hour"
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

interface CatalogFocusPanelProps {
  focusedComponent: string | undefined
  onClear: () => void
  onSelectComponent: (name: string) => void
  showComponentPicker: boolean
  visibleNames: readonly string[]
}

const CatalogFocusPanel = ({
  focusedComponent,
  onClear,
  onSelectComponent,
  showComponentPicker,
  visibleNames
}: CatalogFocusPanelProps): ReactElement | null => {
  if (visibleNames.length === 0) return null

  if (focusedComponent) {
    const focusedCategory = getComponentCategory(focusedComponent)

    return (
      <LumenCard style={styles.catalogPicker} variant="accent">
        <View style={styles.row}>
          <LumenBadge tone="accent">Focused component</LumenBadge>
          {focusedCategory ? <LumenBadge tone="neutral">{focusedCategory}</LumenBadge> : null}
        </View>
        <LumenText variant="title">{focusedComponent}</LumenText>
        <LumenText tone="muted">
          The gallery below focuses the component's realistic interactive composition and related state.
        </LumenText>
        <View style={styles.linkActions}>
          <LumenButton intent="secondary" onPress={onClear}>Back to catalog</LumenButton>
          <LumenButton
            intent="quiet"
            onPress={() => {
              openExternalURL('https://lumen.santi020k.com/docs/react-native')
            }}
          >
            Open React Native guidance
          </LumenButton>
        </View>
      </LumenCard>
    )
  }

  if (showComponentPicker) {
    return (
      <LumenCard style={styles.catalogPicker}>
        <LumenSectionHeader
          subtitle="Open one focused example without losing the selected category."
          title="Choose a component"
        />
        <View style={styles.componentGrid}>
          {visibleNames.map(name => (
            <LumenButton
              key={name}
              intent="secondary"
              onPress={() => {
                onSelectComponent(name)
              }}
              size="sm"
              style={styles.componentGridItem}
            >
              {name}
            </LumenButton>
          ))}
        </View>
      </LumenCard>
    )
  }

  return (
    <LumenCard variant="muted">
      <LumenText variant="label">Choose a category or search by component name</LumenText>
      <LumenText tone="muted">
        Category filters reveal a compact index; selecting a name focuses its interactive composition.
      </LumenText>
    </LumenCard>
  )
}

interface CatalogDiscoveryProps {
  onCategoryChange: (category: ComponentCategory | 'all') => void
  onClear: () => void
  onQueryChange: (value: string) => void
  onSchemeChange: (scheme: ColorScheme) => void
  onSelectComponent: (name: string) => void
  query: string
  selectedCategory: ComponentCategory | 'all'
  visibleNames: readonly string[]
}

const CatalogDiscovery = ({
  onCategoryChange,
  onClear,
  onQueryChange,
  onSchemeChange,
  onSelectComponent,
  query,
  selectedCategory,
  visibleNames
}: CatalogDiscoveryProps): ReactElement => {
  const theme = useLumenTheme()
  const themeToggle = getThemeToggleState(theme.scheme)

  const focusedComponent = componentNames.find(
    name => visibleNames.includes(name) && normalizeComponentQuery(name) === normalizeComponentQuery(query)
  )

  const showComponentPicker = query.trim().length > 0 || selectedCategory !== 'all'

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <LumenBadge tone="accent">{Platform.OS}</LumenBadge>
          <LumenBadge tone="neutral">
            {`Lumen ${playgroundLumenVersion}`}
          </LumenBadge>
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
        onChangeText={onQueryChange}
        prompt="Search components"
        value={query}
      />

      <View accessibilityLabel="Component categories" style={styles.categoryRow}>
        <LumenChip label="All" onPress={onClear} selected={selectedCategory === 'all'} />
        {componentCategories.map(category => (
          <LumenChip
            key={category.value}
            label={category.label}
            onPress={() => {
              onCategoryChange(category.value)
            }}
            selected={selectedCategory === category.value}
          />
        ))}
      </View>

      <View style={styles.catalogMeta}>
        <LumenText accessibilityLiveRegion="polite" variant="label">
          {visibleNames.length}
          {' '}
          {visibleNames.length === 1 ? 'component' : 'components'}
        </LumenText>
        <LumenText tone="muted" variant="caption">Interactive web · iOS · Android</LumenText>
      </View>

      {showComponentPicker ?
        (
          <LumenButton intent="quiet" onPress={onClear}>Reset filters</LumenButton>
        ) :
        null}

      <CatalogFocusPanel
        focusedComponent={focusedComponent}
        onClear={onClear}
        onSelectComponent={onSelectComponent}
        showComponentPicker={showComponentPicker}
        visibleNames={visibleNames}
      />
    </>
  )
}

const Playground = ({
  onSchemeChange
}: {
  onSchemeChange: (scheme: ColorScheme) => void
}): ReactElement => {
  const theme = useLumenTheme()
  const sheetInsets = useSafeAreaInsets()
  const initialComponent = getInitialComponentQuery()
  const initialCategory = getWebQueryParameter('category')
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

  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>(
    () => isComponentCategory(initialCategory) ? initialCategory : 'all'
  )

  const [saved, setSaved] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [profile, setProfile] = useState('balanced')
  const [region, setRegion] = useState('americas')
  const [speedRange, setSpeedRange] = useState<readonly [number, number]>([2_000, 4_000])
  const [minimumSpeed, setMinimumSpeed] = useState(2_400)
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
    () => getVisibleComponentNames(query, selectedCategory, embedded),
    [embedded, query, selectedCategory]
  )

  const isVisible = (name: string) => visibleNames.includes(name)
  const isAnyVisible = (...names: string[]) => names.some(isVisible)

  const clearCatalogFocus = (): void => {
    setQuery('')

    setSelectedCategory('all')

    updateWebQueryParameter('component', '')

    updateWebQueryParameter('category', '')
  }

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
          <CatalogDiscovery
            onCategoryChange={category => {
              setSelectedCategory(category)

              setQuery('')

              updateWebQueryParameter('category', category === 'all' ? '' : category)

              updateWebQueryParameter('component', '')
            }}
            onClear={clearCatalogFocus}
            onQueryChange={value => {
              setQuery(value)

              setSelectedCategory('all')

              updateWebQueryParameter('component', value)

              updateWebQueryParameter('category', '')
            }}
            onSchemeChange={onSchemeChange}
            onSelectComponent={name => {
              setQuery(name)

              updateWebQueryParameter('component', name)
            }}
            query={query}
            selectedCategory={selectedCategory}
            visibleNames={visibleNames}
          />
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
                onPress={clearCatalogFocus}
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

        <Visibility visible={isAnyVisible('Calendar heatmap', 'Funnel chart', 'Box plot', 'Sparkline', 'Line chart', 'Bar chart', 'Pie chart', 'Scatter chart', 'Waterfall chart', 'Histogram', 'Bullet chart', 'Lollipop chart', 'Dumbbell chart', 'Heatmap', 'Range chart', 'Combo chart')}>
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
            'Number field',
            'Time field',
            'Autocomplete',
            'Multi select',
            'Password field',
            'Input OTP',
            'Image comparison',
            'Textarea',
            'Field group',
            'Toggle',
            'Settings row',
            'Search field',
            'Date field',
            'Date range field',
            'Phone input',
            'Picker',
            'Slider',
            'Range slider',
            'Checkbox',
            'Radio group',
            'Segmented control',
            'Tabs'
          )}
        >
          <ComponentSection description="Edit controls to exercise native focus, switch, and clear behavior." title="Forms">
            <AdvancedInputExamples isVisible={isVisible} />
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
            <View testID="component-picker">
              <LumenPicker
                label="Deployment region"
                onValueChange={setRegion}
                options={[
                  { label: 'Americas', value: 'americas' },
                  { label: 'Europe', value: 'europe' },
                  { disabled: true, label: 'Asia Pacific (coming soon)', value: 'asia-pacific' }
                ]}
                value={region}
              />
            </View>
            <View testID="component-slider">
              <LumenSlider
                label="Minimum speed"
                max={5_000}
                min={1_000}
                onValueChange={setMinimumSpeed}
                step={100}
                value={minimumSpeed}
                valueLabel={`${minimumSpeed} RPM`}
              />
            </View>
            <View testID="component-range-slider">
              <LumenRangeSlider
                label="Speed range"
                value={speedRange}
                onValueChange={setSpeedRange}
                min={1_000}
                max={5_000}
                step={100}
                formatValue={value => `${value} RPM`}
              />
              <LumenRangeSlider
                label="Capacidad"
                value={[20, 80]}
                onValueChange={() => undefined}
                readOnly
                startLabel="Mínimo"
                endLabel="Máximo"
                formatValue={value => `${value} %`}
              />
            </View>
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

        <Visibility visible={isVisible('Error state')}>
          <ComponentSection
            description="A recoverable offline state with an application-owned action and safe support reference."
            title="Error state"
          >
            <LumenErrorState
              actions={(
                <LumenButton
                  intent="secondary"
                  onPress={clearCatalogFocus}
                >
                  Try again
                </LumenButton>
              )}
              description="Check your connection and try again."
              kind="offline"
              reference="REQ-4F82"
              title="Could not load projects"
            />
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
          visible={isAnyVisible('Avatar', 'List row', 'Stat', 'Section header', 'Gauge')}
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
              <View style={styles.statItem} testID="component-gauge">
                <LumenGauge
                  label="Platform readiness"
                  tone="success"
                  value={57}
                  valueLabel="57 shared"
                />
              </View>
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
                onPress={clearCatalogFocus}
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
            avoidKeyboard
            presentation="adaptive"
            safeAreaInsets={sheetInsets}
            scrollable
            description="A native modal surface for focused supplemental work."
            onDismiss={() => {
              setSheetVisible(false)
            }}
            title="Component settings"
            visible={sheetVisible}
          >
            <LumenTextField accessibilityLabel="Workspace name" placeholder="Workspace name" />
            <LumenTextarea label="Workspace notes" onChangeText={setNotes} placeholder="Add notes" value={notes} />
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

  const navigate = (value: AppDestination): void => {
    setDestination(value)

    updateWebQueryParameter('destination', value)

    if (value !== 'components') {
      updateWebQueryParameter('component', '')

      updateWebQueryParameter('category', '')
    }

    if (value !== 'examples') updateWebQueryParameter('state', '')
  }

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
                  navigate('components')
                }}
                onOpenExamples={() => {
                  navigate('examples')
                }}
                onOpenSettings={() => {
                  navigate('settings')
                }}
              />
            )}
            {destination === 'examples' && <ExamplesScreen />}
            {destination === 'components' && (
              <Playground onSchemeChange={onSchemeChange} />
            )}
            {destination === 'settings' && (
              <SettingsScreen
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
                if (isAppDestination(value)) {
                  navigate(value)
                }
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
