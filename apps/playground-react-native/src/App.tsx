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
  StyleSheet,
  View
} from 'react-native'

import {
  getLumenIconGraphic,
  LumenAlert,
  LumenAlertDescription,
  LumenAlertDialog,
  LumenAlertTitle,
  LumenAvatar,
  LumenBackdrop,
  LumenBadge,
  LumenBanner,
  LumenButton,
  LumenButtonGroup,
  LumenCard,
  LumenCheckbox,
  LumenChip,
  LumenCollapsibleNavigationBar,
  LumenDisclosure,
  LumenDivider,
  LumenEmptyState,
  LumenFieldGroup,
  LumenGraphic,
  LumenIcon,
  LumenIconButton,
  LumenIllustration,
  LumenListRow,
  LumenMenu,
  LumenNavigationAccessory,
  LumenNavigationBar,
  LumenProgress,
  LumenProvider,
  LumenRadioGroup,
  LumenRefreshControl,
  LumenSearchField,
  LumenSectionHeader,
  LumenSegmentedControl,
  LumenSettingsRow,
  LumenShareButton,
  LumenSheet,
  LumenSkeleton,
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
  useLumenTheme
} from '@santi020k/lumen-react-native'

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
  'Button group',
  'Text field',
  'Textarea',
  'Field group',
  'Toggle',
  'Settings row',
  'Search field',
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
const settingsIcon = getLumenIconGraphic('settings')
const updatesIcon = getLumenIconGraphic('bell')

const navigationItems = [
  { badge: 3, icon: componentIcon, label: 'Components', value: 'components' },
  { badge: true, icon: updatesIcon, label: 'Updates', value: 'updates' },
  { disabled: true, icon: settingsIcon, label: 'Settings', value: 'settings' }
] as const

const getInitialComponentQuery = (): string => {
  if (Platform.OS !== 'web' || typeof globalThis.location === 'undefined') return ''

  return new URLSearchParams(globalThis.location.search).get('component') ?? ''
}

const openExternalURL = (url: string): void => {
  Linking.openURL(url).catch(() => undefined)
}

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

const AboutPlayground = (): ReactElement => {
  const theme = useLumenTheme()

  return (
    <ComponentSection
      description="A living catalog for evaluating Lumen's React Native components on native devices and the web."
      title="About Lumen Playground"
    >
      <View style={{ alignItems: 'flex-start', gap: theme.spacing.sm }}>
        <LumenBadge tone="success">No data collection</LumenBadge>
        <LumenText tone="soft">
          Search the complete catalog, exercise interactive states, and compare light and dark
          {' '}
          themes without creating an account.
        </LumenText>
        <LumenButton
          intent="secondary"
          onPress={() => {
            openExternalURL('https://lumen.santi020k.com/docs/react-native')
          }}
        >
          Documentation
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
          intent="secondary"
          onPress={() => {
            openExternalURL('https://lumen.santi020k.com/privacy')
          }}
        >
          Privacy
        </LumenButton>
      </View>
    </ComponentSection>
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

const Playground = ({
  onSchemeChange,
  scheme
}: {
  onSchemeChange: (scheme: ColorScheme) => void
  scheme: ColorScheme
}): ReactElement => {
  const theme = useLumenTheme()
  const themeToggle = getThemeToggleState(scheme)
  const initialComponent = getInitialComponentQuery()
  const [email, setEmail] = useState('hello@lumen.dev')
  const [notes, setNotes] = useState('Native components now share one documented contract.')
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

  const visibleNames = useMemo(() => componentNames.filter(name => (
    name.toLowerCase().includes(query.trim().toLowerCase())
  )), [query])

  const isVisible = (name: string) => visibleNames.includes(name)
  const isAnyVisible = (...names: string[]) => names.some(isVisible)

  return (
    <LumenSurface padding="none" radius="none" style={styles.screen} tone="canvas">
      <ScrollView
        contentContainerStyle={styles.content}
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
            <LumenButtonGroup>
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

        <Visibility
          visible={isAnyVisible(
            'Text field',
            'Textarea',
            'Field group',
            'Toggle',
            'Settings row',
            'Search field',
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

        <Visibility visible={isAnyVisible('Graphic', 'Backdrop', 'Illustration')}>
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
              items={navigationItems}
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
              items={navigationItems}
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

        <Visibility visible={query.trim().length === 0}>
          <AboutPlayground />
        </Visibility>

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
