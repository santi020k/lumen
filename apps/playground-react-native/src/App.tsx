import {
  type ReactElement,
  type ReactNode,
  useMemo,
  useState
} from 'react'
import {
  Platform,
  ScrollView,
  StyleSheet,
  View
} from 'react-native'

import {
  LumenAlert,
  LumenAlertDescription,
  LumenAlertTitle,
  LumenAvatar,
  LumenBadge,
  LumenBanner,
  LumenButton,
  LumenCard,
  LumenDivider,
  LumenEmptyState,
  LumenIcon,
  LumenIconButton,
  type LumenIconGraphicProps,
  LumenListRow,
  LumenProgress,
  LumenProvider,
  LumenSearchField,
  LumenSectionHeader,
  LumenSettingsRow,
  LumenSpinner,
  LumenStat,
  LumenStatusBar,
  LumenSurface,
  LumenText,
  LumenTextField,
  LumenToggle,
  useLumenTheme
} from '@santi020k/lumen-react-native'
import {
  Check as CheckIcon,
  Moon as MoonIcon,
  Search as SearchIcon,
  Sun as SunIcon
} from 'lucide-react-native'

type ColorScheme = 'dark' | 'light'

interface ComponentSectionProps {
  children: ReactElement | ReactElement[]
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
  'Text field',
  'Toggle',
  'Settings row',
  'Search field',
  'Badge',
  'Divider',
  'Spinner',
  'Card',
  'Alert',
  'Progress',
  'Avatar',
  'Empty state',
  'List row',
  'Banner',
  'Stat',
  'Section header',
  'Status bar'
]

const iconColor = (color: LumenIconGraphicProps['color']): string | undefined => (
  typeof color === 'string' ? color : undefined
)

const CheckGraphic = ({ color, size, strokeWidth }: LumenIconGraphicProps): ReactElement => (
  <CheckIcon color={iconColor(color)} size={size} strokeWidth={strokeWidth} />
)

const MoonGraphic = ({ color, size, strokeWidth }: LumenIconGraphicProps): ReactElement => (
  <MoonIcon color={iconColor(color)} size={size} strokeWidth={strokeWidth} />
)

const SearchGraphic = ({ color, size, strokeWidth }: LumenIconGraphicProps): ReactElement => (
  <SearchIcon color={iconColor(color)} size={size} strokeWidth={strokeWidth} />
)

const SunGraphic = ({ color, size, strokeWidth }: LumenIconGraphicProps): ReactElement => (
  <SunIcon color={iconColor(color)} size={size} strokeWidth={strokeWidth} />
)

const styles = StyleSheet.create({
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
  section: {
    gap: 16
  },
  sectionHeading: {
    gap: 4
  }
})

const Visibility = ({ children, visible }: { children: ReactNode, visible: boolean }): ReactNode => (
  visible ? children : null
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

const Playground = ({
  onSchemeChange,
  scheme
}: {
  onSchemeChange: (scheme: ColorScheme) => void
  scheme: ColorScheme
}): ReactElement => {
  const theme = useLumenTheme()
  const [email, setEmail] = useState('hello@lumen.dev')
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showBanner, setShowBanner] = useState(true)

  const visibleNames = useMemo(() => componentNames.filter(name => (
    name.toLowerCase().includes(query.trim().toLowerCase())
  )), [query])

  const isVisible = (name: string) => visibleNames.includes(name)
  const isAnyVisible = (...names: string[]) => names.some(isVisible)

  return (
    <LumenSurface padding="none" radius="none" style={styles.screen} tone="canvas">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <LumenBadge tone="accent">{Platform.OS}</LumenBadge>
            <LumenText variant="title">Lumen React Native Playground</LumenText>
            <LumenText tone="soft">
              Explore every public primitive with real React Native state and behavior.
            </LumenText>
          </View>
          <LumenIconButton
            icon={scheme === 'dark' ? SunGraphic : MoonGraphic}
            label={`Use ${scheme === 'dark' ? 'light' : 'dark'} theme`}
            onPress={() => {
              onSchemeChange(scheme === 'dark' ? 'light' : 'dark')
            }}
          />
        </View>

        <LumenSearchField
          graphic={<LumenIcon decorative icon={SearchGraphic} size="sm" />}
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
          <ComponentSection description="Application-provided graphics use Lumen sizing and intent." title="Icons">
            <View style={styles.row}>
              <LumenIcon icon={SearchGraphic} label="Search" />
              <LumenIcon icon={CheckGraphic} label="Complete" size="lg" />
              <LumenIconButton
                icon={SearchGraphic}
                label="Search the catalog"
                onPress={() => {
                  setQuery('')
                }}
              />
            </View>
          </ComponentSection>
        </Visibility>

        <Visibility visible={isVisible('Button')}>
          <ComponentSection description="Press each intent and inspect disabled and loading states." title="Buttons">
            <View style={styles.row}>
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
            </View>
            <View style={styles.row}>
              <LumenButton disabled>Disabled</LumenButton>
              <LumenButton loading>Saving</LumenButton>
            </View>
          </ComponentSection>
        </Visibility>

        <Visibility
          visible={isAnyVisible('Text field', 'Toggle', 'Settings row', 'Search field')}
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
            <LumenToggle
              description="Receive component release notes."
              label="Release notifications"
              onValueChange={setNotificationsEnabled}
              value={notificationsEnabled}
            />
            <LumenSettingsRow
              control={(
                <LumenToggle
                  label="Automatic updates"
                  onValueChange={setNotificationsEnabled}
                  showLabel={false}
                  value={notificationsEnabled}
                />
              )}
              description="Download stable updates automatically."
              graphic={<LumenIcon decorative icon={CheckGraphic} size="sm" />}
              title="Automatic updates"
            />
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

        <Visibility visible={isAnyVisible('Alert', 'Banner')}>
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
              count="23"
              subtitle="Shared native contracts"
              title="Workspace"
            />
            <View style={styles.statGrid}>
              <LumenStat
                detail="Across three adapters"
                label="Shared components"
                style={styles.statItem}
                tone="accent"
                value="23"
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
            graphic={<LumenIcon decorative icon={SearchGraphic} size="lg" />}
            title="No matching component"
          />
        </Visibility>

        <LumenStatusBar
          message={`Powered by @santi020k/lumen-react-native · ${theme.scheme} theme`}
          tone="success"
          trailing={<LumenText tone="muted" variant="caption">23 shared</LumenText>}
        />
      </ScrollView>
    </LumenSurface>
  )
}

const App = (): ReactElement => {
  const [scheme, setScheme] = useState<ColorScheme>('light')

  return (
    <LumenProvider scheme={scheme}>
      <Playground onSchemeChange={setScheme} scheme={scheme} />
    </LumenProvider>
  )
}

export default App
