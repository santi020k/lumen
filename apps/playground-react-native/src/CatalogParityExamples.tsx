import type { ReactElement } from 'react'
import { View } from 'react-native'

import { AgendaParityExample } from './AgendaParityExample'
import { BreadcrumbParityExample } from './BreadcrumbParityExample'
import { CalendarParityExample } from './CalendarParityExample'
import { CarouselParityExample } from './CarouselParityExample'
import { CascaderParityExample } from './CascaderParityExample'
import { ColorPickerParityExample } from './ColorPickerParityExample'
import { CommandParityExample } from './CommandParityExample'
import { DataTableParityExample } from './DataTableParityExample'
import { KanbanBoardParityExample } from './KanbanBoardParityExample'
import { KanbanColumnParityExample } from './KanbanColumnParityExample'
import { MentionsParityExample } from './MentionsParityExample'
import { QRCodeParityExample } from './QRCodeParityExample'
import { RatingParityExample } from './RatingParityExample'
import { ScheduleParityExample } from './ScheduleParityExample'
import { StepperParityExample } from './StepperParityExample'
import { TableParityExample } from './TableParityExample'
import { TimelineParityExample } from './TimelineParityExample'
import { TooltipParityExample } from './TooltipParityExample'
import { TourParityExample } from './TourParityExample'
import { TransferParityExample } from './TransferParityExample'
import { TreeGridParityExample } from './TreeGridParityExample'
import { TreeParityExample } from './TreeParityExample'
import { TreeSelectParityExample } from './TreeSelectParityExample'

const parityExamples = [
  { Component: TimelineParityExample, name: 'Timeline', slug: 'timeline' },
  { Component: TableParityExample, name: 'Table', slug: 'table' },
  { Component: StepperParityExample, name: 'Stepper', slug: 'stepper' },
  { Component: BreadcrumbParityExample, name: 'Breadcrumb', slug: 'breadcrumb' },
  { Component: MentionsParityExample, name: 'Mentions', slug: 'mentions' },
  { Component: RatingParityExample, name: 'Rating', slug: 'rating' },
  { Component: TourParityExample, name: 'Tour', slug: 'tour' },
  { Component: DataTableParityExample, name: 'Data table', slug: 'data-table' },
  { Component: TreeGridParityExample, name: 'Tree grid', slug: 'tree-grid' },
  { Component: CommandParityExample, name: 'Command', slug: 'command' },
  { Component: TooltipParityExample, name: 'Tooltip', slug: 'tooltip' },
  { Component: CarouselParityExample, name: 'Carousel', slug: 'carousel' },
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
