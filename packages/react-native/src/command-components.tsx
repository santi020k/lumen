import type { ReactElement } from 'react'
import { ScrollView, type TextInputKeyPressEvent, View, type ViewProps } from 'react-native'

import { type LumenCommandGroup, lumenCommandGroups, type LumenCommandItem, type LumenCommandNavigation, moveLumenCommandActive, resolveLumenCommandActive } from './command-recipes.js'
import { LumenButton, LumenText, LumenTextField } from './primitives.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenCommandProps extends Pick<ViewProps, 'style' | 'testID'> {
  label: string
  groups: readonly LumenCommandGroup[]
  open: boolean
  onOpenChange: (open: boolean) => void
  query: string
  onQueryChange: (query: string) => void
  activeId: string | null
  onActiveIdChange: (id: string) => void
  onSelect: (item: LumenCommandItem) => void
  disabled?: boolean
  readOnly?: boolean
  autoFocus?: boolean
  loading?: boolean
  error?: string | null
  searchLabel?: string
  closeLabel?: string
  previousLabel?: string
  nextLabel?: string
  selectLabel?: string
  noActiveLabel?: string
  emptyLabel?: string
  loadingLabel?: string
  invalidLabel?: string
  formatCount?: (count: number) => string
  formatActive?: (item: LumenCommandItem) => string
}

const commandStatus = (props: LumenCommandProps, invalid: boolean): string | null => {
  if (props.error != null) return props.error

  if (props.loading) return props.loadingLabel ?? 'Loading'

  if (invalid) return props.invalidLabel ?? 'Invalid commands'

  return null
}

const keyboardNavigation = (key: string): LumenCommandNavigation | null => {
  if (key === 'ArrowDown') return 'next'

  if (key === 'ArrowUp') return 'previous'

  if (key === 'Home') return 'first'

  if (key === 'End') return 'last'

  return null
}

const defaultActive = (item: LumenCommandItem): string => item.label || item.id

const commandLocked = (props: LumenCommandProps, status: string | null): boolean => {
  const interaction = props.disabled === true || props.readOnly === true

  return interaction || status !== null || !props.open
}

export const LumenCommand = (input: LumenCommandProps): ReactElement | null => {
  const props = {
    autoFocus: true,
    searchLabel: 'Search commands',
    closeLabel: 'Close commands',
    previousLabel: 'Previous command',
    nextLabel: 'Next command',
    selectLabel: 'Run highlighted command',
    noActiveLabel: 'No command highlighted',
    emptyLabel: 'No matching commands',
    formatCount: String,
    formatActive: defaultActive,
    ...input
  }

  const theme = useLumenTheme()
  const groups = lumenCommandGroups(props.groups, props.query)
  const status = commandStatus(props, groups === null)
  const locked = commandLocked(props, status)
  const active = resolveLumenCommandActive(props.groups, props.query, props.activeId)
  const count = groups?.reduce((total, group) => total + group.items.length, 0) ?? 0

  const navigate = (direction: LumenCommandNavigation): void => {
    if (locked) return

    const next = moveLumenCommandActive(props.groups, props.query, props.activeId, direction)

    if (next) props.onActiveIdChange(next)
  }

  const select = (id: string | null): void => {
    if (locked) return

    const item = resolveLumenCommandActive(props.groups, props.query, id)

    if (item) {
      props.onActiveIdChange(item.id)

      props.onSelect(item)
    }
  }

  const keyPress = (event: TextInputKeyPressEvent): void => {
    if (event.nativeEvent.key === 'Escape') {
      props.onOpenChange(false)

      return
    }

    const direction = keyboardNavigation(event.nativeEvent.key)

    if (direction) navigate(direction)
  }

  if (!props.open) return null

  return (
    <View style={props.style} testID={props.testID} accessibilityLabel={props.label}>
      <LumenText accessibilityRole="header">{props.label}</LumenText>
      <LumenButton
        intent="quiet"
        accessibilityLabel={props.closeLabel}
        onPress={() => {
          props.onOpenChange(false)
        }}
      >
        <LumenText>{props.closeLabel}</LumenText>
      </LumenButton>
      {status !== null ?
        <LumenText accessibilityLiveRegion="polite">{status}</LumenText> :
        (
          <View style={{ gap: theme.spacing.sm }}>
            <LumenTextField
              value={props.query}
              accessibilityLabel={props.searchLabel}
              placeholder={props.searchLabel}
              autoFocus={props.autoFocus && !locked}
              editable={!locked}
              returnKeyType="go"
              autoCorrect={false}
              autoCapitalize="none"
              onKeyPress={keyPress}
              onSubmitEditing={() => {
                select(props.activeId)
              }}
              onChangeText={query => {
                if (!locked) props.onQueryChange(query)
              }}
            />
            <LumenText accessibilityLiveRegion="polite">{props.formatCount(count)}</LumenText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {(['previous', 'next'] as const).map(direction => (
                <LumenButton
                  key={direction}
                  intent="secondary"
                  accessibilityLabel={direction === 'previous' ? props.previousLabel : props.nextLabel}
                  disabled={locked ||
                    moveLumenCommandActive(props.groups, props.query, props.activeId, direction) === null}
                  onPress={() => {
                    navigate(direction)
                  }}
                >
                  <LumenText>{direction === 'previous' ? props.previousLabel : props.nextLabel}</LumenText>
                </LumenButton>
              ))}
            </View>
            <LumenText accessibilityLiveRegion="polite">{active ? props.formatActive(active) : props.noActiveLabel}</LumenText>
            {count === 0 && <LumenText>{props.emptyLabel}</LumenText>}
            <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {groups?.map(group => (
                <View key={group.id} style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
                  <LumenText accessibilityRole="header">{group.label || group.id}</LumenText>
                  {group.items.map(item => (
                    <LumenButton
                      key={item.id}
                      intent="quiet"
                      accessibilityLabel={[item.label || item.id, item.detail, item.shortcut].filter(Boolean).join(', ')}
                      accessibilityState={{ selected: item.id === active?.id }}
                      disabled={locked || item.disabled === true}
                      style={{
                        minWidth: 44,
                        minHeight: 44,
                        backgroundColor: item.id === active?.id ? theme.colors.brandSoft : theme.colors.surface
                      }}
                      onFocus={() => {
                        if (!locked && !item.disabled) props.onActiveIdChange(item.id)
                      }}
                      onPress={() => {
                        select(item.id)
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <LumenText>{item.label || item.id}</LumenText>
                        {item.detail && <LumenText>{item.detail}</LumenText>}
                        {item.shortcut && <LumenText>{item.shortcut}</LumenText>}
                      </View>
                    </LumenButton>
                  ))}
                </View>
              ))}
            </ScrollView>
            <LumenButton
              accessibilityLabel={props.selectLabel}
              disabled={locked || !active}
              onPress={() => {
                select(props.activeId)
              }}
            >
              <LumenText>{props.selectLabel}</LumenText>
            </LumenButton>
          </View>
        )}
    </View>
  )
}
