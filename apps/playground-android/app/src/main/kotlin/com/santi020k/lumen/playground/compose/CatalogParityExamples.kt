package com.santi020k.lumen.playground.compose

import androidx.compose.runtime.Composable

internal val parityExampleNames = setOf("Timeline", "Table", "Stepper", "Breadcrumb", "Mentions", "Rating", "Data table", "Tour", "Command", "Tree grid", "Carousel", "Tooltip", "Tree select", "Transfer", "Color picker", "Schedule", "Tree", "QR code", "Cascader", "Calendar", "Agenda", "Kanban board", "Kanban column")

@Composable
internal fun CatalogParityExamples(names: List<String>) {
    for (name in names) {
        when (name) {
            "Timeline" -> TimelineParityExample()
            "Table" -> TableParityExample()
            "Stepper" -> StepperParityExample()
            "Breadcrumb" -> BreadcrumbParityExample()
            "Mentions" -> MentionsParityExample()
            "Rating" -> RatingParityExample()
            "Data table" -> DataTableParityExample()
            "Tour" -> TourParityExample()
            "Command" -> CommandParityExample()
            "Tree grid" -> TreeGridParityExample()
            "Carousel" -> CarouselParityExample()
            "Tooltip" -> TooltipParityExample()
            "Tree select" -> TreeSelectParityExample()
            "Transfer" -> TransferParityExample()
            "Color picker" -> ColorPickerParityExample()
            "Schedule" -> ScheduleParityExample()
            "Calendar" -> CalendarParityExample()
            "Agenda" -> AgendaParityExample()
            "Kanban board" -> KanbanBoardParityExample()
            "Kanban column" -> KanbanColumnParityExample()

            "Cascader" -> CascaderParityExample()
            "Tree" -> TreeParityExample()
            "QR code" -> QRCodeParityExample()
        }
    }
}
