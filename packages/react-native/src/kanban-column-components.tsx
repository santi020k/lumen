import { type ReactElement, type ReactNode, useRef, useState } from 'react'
import { PanResponder, View, type ViewProps } from 'react-native'

import { type LumenKanbanCard, type LumenKanbanColumnData, LumenKanbanModel } from './kanban-recipes.js'
import { LumenButton, LumenText } from './primitives.js'
import { LumenCard } from './shared-components.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenKanbanColumnProps extends Pick<ViewProps, 'style' | 'testID' | 'nativeID' | 'accessibilityHint'> {
  column: LumenKanbanColumnData
  onColumnChange: (column: LumenKanbanColumnData) => void
  onAdd?: (() => void) | undefined
  onCardPress?: ((cardId: string) => void) | undefined
  renderCard?: ((card: LumenKanbanCard) => ReactNode) | undefined
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  loading?: boolean | undefined
  error?: string | null | undefined
  addLabel?: string | undefined
  loadingLabel?: string | undefined
  emptyLabel?: string | undefined
  invalidLabel?: string | undefined
  formatCount?: ((count: number, capacity: number | undefined) => string) | undefined
  formatMove?: ((card: string, position: number) => string) | undefined
  formatDrag?: ((card: string) => string) | undefined
  formatOpen?: ((card: string) => string) | undefined
}

interface ColumnBounds { x: number, y: number, width: number, height: number }

interface ColumnLayout {
  bounds: Map<string, ColumnBounds>
  measure: Map<string, () => void>
}

const defaultCount = (count: number, capacity: number | undefined): string => {
  if (capacity === undefined) return `${count} cards`

  return `${count} of ${capacity} cards`
}

const defaultMove = (card: string, position: number): string => `Move ${card} to position ${position}`
const defaultDrag = (card: string): string => `Hold to drag ${card}`
const defaultOpen = (card: string): string => `Open ${card}`

const blockedColumn = (props: LumenKanbanColumnProps): boolean => {
  const disabled = (props.disabled ?? false) || (props.readOnly ?? false) || props.column.disabled === true
  const status = (props.loading ?? false) || (props.error !== null && props.error !== undefined)

  return disabled || status
}

const updateColumn = (props: LumenKanbanColumnProps, cardId: string, position: number): void => {
  if (blockedColumn(props)) return

  const next = new LumenKanbanModel([props.column]).moving(cardId, props.column.id, position)?.[0]

  if (next) props.onColumnChange(next)
}

const register = (view: View | null, layout: ColumnLayout, id: string): void => {
  if (!view) return

  const update = (): void => {
    view.measureInWindow((x, y, width, height) => layout.bounds.set(id, { x, y, width, height }))
  }

  layout.measure.set(id, update)

  update()
}

const dragIndex = (
  props: LumenKanbanColumnProps, layout: ColumnLayout, cardId: string, x: number, y: number
): number => {
  const column = layout.bounds.get(`column:${props.column.id}`)

  if (!column || x < column.x || x > column.x + column.width || y < column.y || y > column.y + column.height) return -1

  const remaining = props.column.cards.filter(card => card.id !== cardId)

  const index = remaining.findIndex(card => {
    const bounds = layout.bounds.get(`card:${card.id}`)

    return bounds !== undefined && y < bounds.y + bounds.height / 2
  })

  return index < 0 ? remaining.length : index
}

const ColumnCard = ({ props, card, index, layout }: {
  props: LumenKanbanColumnProps
  card: LumenKanbanCard
  index: number
  layout: ColumnLayout
}): ReactElement => {
  const theme = useLumenTheme()
  const ref = useRef<View>(null)
  const [dragActive, setDragActive] = useState(false)
  const disabled = blockedColumn(props) || card.disabled === true
  const model = new LumenKanbanModel([props.column])

  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: () => dragActive && !disabled,
    onPanResponderRelease: (_event, gesture) => {
      setDragActive(false)

      const position = dragIndex(props, layout, card.id, gesture.moveX, gesture.moveY)

      if (!disabled && position >= 0) updateColumn(props, card.id, position)
    },
    onPanResponderTerminate: () => {
      setDragActive(false)
    }
  })

  return (
    <View
      ref={ref}
      onLayout={() => {
        register(ref.current, layout, `card:${card.id}`)
      }}
      style={{ gap: theme.spacing.xs, opacity: dragActive ? 0.65 : 1 }}
      {...responder.panHandlers}
    >
      <LumenCard>{props.renderCard ? props.renderCard(card) : <LumenText>{card.label}</LumenText>}</LumenCard>
      {props.onCardPress ?
        (
          <LumenButton
            intent="secondary"
            disabled={Boolean(props.disabled) || props.column.disabled === true || card.disabled === true}
            onPress={() => {
              if (!props.disabled && !props.column.disabled && !card.disabled) props.onCardPress?.(card.id)
            }}
          >
            {(props.formatOpen ?? defaultOpen)(card.label)}
          </LumenButton>
        ) :
        null}
      <LumenButton
        intent="secondary"
        disabled={disabled}
        onLongPress={() => {
          for (const update of layout.measure.values()) update()

          setDragActive(true)
        }}
        onPressOut={() => {
          setDragActive(false)
        }}
      >
        {(props.formatDrag ?? defaultDrag)(card.label)}
      </LumenButton>
      {[index - 1, index + 1]
        .filter(position => position >= 0 && position < props.column.cards.length).map(position => (
          <LumenButton
            key={position}
            disabled={disabled || model.moving(card.id, props.column.id, position) === null}
            onPress={() => {
              if (!disabled) updateColumn(props, card.id, position)
            }}
          >
            {(props.formatMove ?? defaultMove)(card.label, position + 1)}
          </LumenButton>
        ))}
    </View>
  )
}

const columnStatus = (props: LumenKanbanColumnProps, valid: boolean): string | null => {
  if (props.loading) return props.loadingLabel ?? 'Loading'

  if (props.error !== undefined && props.error !== null) return props.error

  if (!valid) return props.invalidLabel ?? 'Invalid column data'

  return null
}

const columnFull = function (column: LumenKanbanColumnData): boolean {
  return column.capacity !== undefined && column.cards.length >= column.capacity
}

export const LumenKanbanColumn = (props: LumenKanbanColumnProps): ReactElement => {
  const theme = useLumenTheme()
  const ref = useRef<View>(null)
  const [layout] = useState<ColumnLayout>(() => ({ bounds: new Map(), measure: new Map() }))
  const model = new LumenKanbanModel([props.column])
  const status = columnStatus(props, model.valid)

  if (!model.valid) return (
    <LumenText accessibilityLiveRegion="polite">{status}</LumenText>
  )

  const full = columnFull(props.column)
  const addDisabled = blockedColumn(props) || full

  const countLabel = status === null ?
    (props.formatCount ?? defaultCount)(props.column.cards.length, props.column.capacity) :
    ''

  return (
    <View
      ref={ref}
      onLayout={() => {
        register(ref.current, layout, `column:${props.column.id}`)
      }}
      testID={props.testID}
      nativeID={props.nativeID}
      accessibilityLabel={props.column.label}
      accessibilityHint={props.accessibilityHint}
      style={[{ gap: theme.spacing.md, minHeight: 88 }, props.style]}
    >
      <LumenText accessibilityRole="header">{props.column.label}</LumenText>
      {status !== null ?
        <LumenText accessibilityLiveRegion="polite">{status}</LumenText> :
        (
          <>
            <LumenText>{countLabel}</LumenText>
            {props.column.cards.length === 0 ?
              <LumenText>{props.emptyLabel ?? 'No cards'}</LumenText> :
              null}
            {props.column.cards.map((card, index) => (
              <ColumnCard key={card.id} props={props} card={card} index={index} layout={layout} />
            ))}
            {props.onAdd ?
              (
                <LumenButton
                  disabled={addDisabled}
                  onPress={() => {
                    if (!addDisabled) props.onAdd?.()
                  }}
                >
                  {props.addLabel ?? 'Add card'}
                </LumenButton>
              ) :
              null}
          </>
        )}
    </View>
  )
}
