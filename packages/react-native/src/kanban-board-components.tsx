import { type ReactElement, type ReactNode, useRef, useState } from 'react'
import { PanResponder, ScrollView, View, type ViewProps } from 'react-native'

import { type LumenKanbanCard, type LumenKanbanColumnData, LumenKanbanModel } from './kanban-recipes.js'
import { LumenButton, LumenText } from './primitives.js'
import { LumenCard } from './shared-components.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenKanbanBoardProps extends Pick<ViewProps, 'style' | 'testID' | 'nativeID' | 'accessibilityHint'> {
  label: string
  columns: readonly LumenKanbanColumnData[]
  onColumnsChange: (columns: readonly LumenKanbanColumnData[]) => void
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  loading?: boolean | undefined
  error?: string | null | undefined
  loadingLabel?: string | undefined
  emptyLabel?: string | undefined
  invalidLabel?: string | undefined
  renderCard?: ((card: LumenKanbanCard) => ReactNode) | undefined
  formatMove?: ((card: string, column: string, position: number) => string) | undefined
  formatDrag?: ((card: string) => string) | undefined
}

interface BoardBounds { x: number, y: number, width: number, height: number }

interface BoardLayout {
  columns: Map<string, BoardBounds>
  cards: Map<string, BoardBounds>
  measures: Map<string, () => void>
}

const defaultMove = (card: string, column: string, position: number): string => `Move ${card} to ${column}, position ${position}`
const defaultDrag = (card: string): string => `Hold to drag ${card}`

const contains = (bounds: BoardBounds, x: number, y: number): boolean => {
  const horizontal = x >= bounds.x && x <= bounds.x + bounds.width
  const vertical = y >= bounds.y && y <= bounds.y + bounds.height

  return horizontal && vertical
}

const measure = (view: View | null, map: Map<string, BoardBounds>, id: string): void => {
  view?.measureInWindow((x, y, width, height) => map.set(id, { x, y, width, height }))
}

const refresh = (layout: BoardLayout): void => {
  for (const update of layout.measures.values()) update()
}

const register = (view: View | null, layout: BoardLayout, kind: 'cards' | 'columns', id: string): void => {
  if (view === null) return

  const update = (): void => {
    measure(view, layout[kind], id)
  }

  layout.measures.set(`${kind}:${id}`, update)

  update()
}

const statusLabel = (props: LumenKanbanBoardProps, valid: boolean): string | null => {
  if (props.loading) return props.loadingLabel ?? 'Loading'

  if (props.error !== undefined && props.error !== null) return props.error

  if (!valid) return props.invalidLabel ?? 'Invalid board data'

  if (props.columns.length === 0) return props.emptyLabel ?? 'No cards'

  return null
}

const BoardCard = ({ card, column, index, props, model, layout, blocked }: {
  card: LumenKanbanCard
  column: LumenKanbanColumnData
  index: number
  props: LumenKanbanBoardProps
  model: LumenKanbanModel
  layout: BoardLayout
  blocked: boolean
}): ReactElement => {
  const theme = useLumenTheme()
  const ref = useRef<View>(null)
  const [dragActive, setDragActive] = useState(false)
  const movable = !blocked && !card.disabled && !column.disabled
  const formatMove = props.formatMove ?? defaultMove

  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: () => dragActive && movable,
    onPanResponderRelease: (_event, gesture) => {
      setDragActive(false)

      if (!movable) return

      const target = props.columns.find(candidate => {
        const bounds = layout.columns.get(candidate.id)

        return bounds !== undefined && contains(bounds, gesture.moveX, gesture.moveY)
      })

      if (!target) return

      const remaining = target.cards.filter(candidate => candidate.id !== card.id)

      const before = remaining.findIndex(candidate => {
        const bounds = layout.cards.get(candidate.id)

        return bounds !== undefined && gesture.moveY < bounds.y + bounds.height / 2
      })

      const next = model.moving(card.id, target.id, before < 0 ? remaining.length : before)

      if (next !== null) props.onColumnsChange(next)
    },
    onPanResponderTerminate: () => {
      setDragActive(false)
    }
  })

  const actions = props.columns.flatMap(target => {
    const positions = target.id === column.id ?
      [index - 1, index + 1].filter(position => position >= 0 && position < column.cards.length) :
      [target.cards.length]

    return positions.map(position => ({ target, position }))
  })

  return (
    <View
      ref={ref}
      onLayout={() => {
        register(ref.current, layout, 'cards', card.id)
      }}
      style={{ gap: theme.spacing.xs, opacity: dragActive ? 0.65 : 1 }}
      {...responder.panHandlers}
    >
      <LumenCard>{props.renderCard ? props.renderCard(card) : <LumenText>{card.label}</LumenText>}</LumenCard>
      <LumenButton
        accessibilityRole="button"
        accessibilityLabel={(props.formatDrag ?? defaultDrag)(card.label)}
        accessibilityState={{ disabled: !movable }}
        disabled={!movable}
        intent="secondary"
        onLongPress={() => {
          refresh(layout)

          setDragActive(true)
        }}
        onPressOut={() => {
          setDragActive(false)
        }}
      >
        <LumenText>{(props.formatDrag ?? defaultDrag)(card.label)}</LumenText>
      </LumenButton>
      {actions.map(({ target, position }) => {
        const next = model.moving(card.id, target.id, position)
        const actionLabel = formatMove(card.label, target.label, position + 1)

        return (
          <LumenButton
            key={`${target.id}:${position}`}
            accessibilityLabel={actionLabel}
            disabled={blocked || next === null}
            onPress={() => {
              if (!blocked && next !== null) props.onColumnsChange(next)
            }}
          >
            {actionLabel}
          </LumenButton>
        )
      })}
    </View>
  )
}

const BoardColumn = ({ column, props, model, layout, blocked }: {
  column: LumenKanbanColumnData
  props: LumenKanbanBoardProps
  model: LumenKanbanModel
  layout: BoardLayout
  blocked: boolean
}): ReactElement => {
  const theme = useLumenTheme()
  const ref = useRef<View>(null)

  return (
    <View
      ref={ref}
      onLayout={() => {
        register(ref.current, layout, 'columns', column.id)
      }}
      style={{ width: 272, minHeight: 88, padding: theme.spacing.md, gap: theme.spacing.md }}
    >
      <LumenText accessibilityRole="header">{column.label}</LumenText>
      {column.cards.length === 0 ? <LumenText>{props.emptyLabel ?? 'No cards'}</LumenText> : null}
      {column.cards.map((card, index) => (
        <BoardCard
          key={card.id}
          card={card}
          column={column}
          index={index}
          props={props}
          model={model}
          layout={layout}
          blocked={blocked}
        />
      ))}
    </View>
  )
}

export const LumenKanbanBoard = (props: LumenKanbanBoardProps): ReactElement => {
  const theme = useLumenTheme()
  const [layout] = useState<BoardLayout>(() => ({ columns: new Map(), cards: new Map(), measures: new Map() }))
  const model = new LumenKanbanModel(props.columns)
  const hasError = props.error !== null && props.error !== undefined
  const blocked = (props.disabled ?? false) || (props.readOnly ?? false) || (props.loading ?? false) || hasError
  const status = statusLabel(props, model.valid)

  return (
    <View
      testID={props.testID}
      nativeID={props.nativeID}
      accessibilityLabel={props.label}
      accessibilityHint={props.accessibilityHint}
      style={[{ gap: theme.spacing.md }, props.style]}
    >
      <LumenText accessibilityRole="header">{props.label}</LumenText>
      {status !== null ?
        <LumenText accessibilityLiveRegion="polite">{status}</LumenText> :
        (
          <ScrollView
            horizontal
            accessibilityLabel={props.label}
            onScroll={() => {
              refresh(layout)
            }}
            scrollEventThrottle={16}
          >
            {props.columns.map(column => (
              <BoardColumn
                key={column.id}
                column={column}
                props={props}
                model={model}
                layout={layout}
                blocked={blocked}
              />
            ))}
          </ScrollView>
        )}
    </View>
  )
}
