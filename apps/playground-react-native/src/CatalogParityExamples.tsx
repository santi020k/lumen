import type { ReactElement } from 'react'
import { View } from 'react-native'

import { AgendaParityExample } from './AgendaParityExample'
import { CalendarParityExample } from './CalendarParityExample'
import { CascaderParityExample } from './CascaderParityExample'
import { ColorPickerParityExample } from './ColorPickerParityExample'
import { KanbanBoardParityExample } from './KanbanBoardParityExample'
import { KanbanColumnParityExample } from './KanbanColumnParityExample'
import { QRCodeParityExample } from './QRCodeParityExample'
import { ScheduleParityExample } from './ScheduleParityExample'
import { TransferParityExample } from './TransferParityExample'
import { TreeParityExample } from './TreeParityExample'
import { TreeSelectParityExample } from './TreeSelectParityExample'

const parityExamples = [
  { Component: TreeSelectParityExample, name: 'Tree select', slug: 'tree-select' },
  { Component: TransferParityExample, name: 'Transfer', slug: 'transfer' },
  { Component: ColorPickerParityExample, name: 'Color picker', slug: 'color-picker' },
  { Component: ScheduleParityExample, name: 'Schedule', slug: 'schedule' },
  { Component: CalendarParityExample, name: 'Calendar', slug: 'calendar' },
  { Component: AgendaParityExample, name: 'Agenda', slug: 'agenda' },
  { Component: KanbanBoardParityExample, name: 'Kanban board', slug: 'kanban-board' },
  { Component: KanbanColumnParityExample, name: 'Kanban column', slug: 'kanban-column' },
  { Component: CascaderParityExample, name: 'Cascader', slug: 'cascader' },
  { Component: TreeParityExample, name: 'Tree', slug: 'tree' },
  { Component: QRCodeParityExample, name: 'QR code', slug: 'qr-code' }
] as const

export const CatalogParityExamples = ({ isVisible }: {
  isVisible: (name: string) => boolean
}): ReactElement => (
  <>
    {parityExamples.filter(example => isVisible(example.name)).map(({ Component, slug }) => (
      <View key={slug} testID={`component-${slug}`}><Component /></View>
    ))}
  </>
)
