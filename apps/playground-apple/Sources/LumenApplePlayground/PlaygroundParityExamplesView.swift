import LumenUI
import SwiftUI

struct PlaygroundParityExamplesView: View {
    let matches: (String) -> Bool

    var body: some View {
        if matches("Timeline") {
            PlaygroundSection("Timeline", description: "Host-owned chronological content with a terminal connector.") { TimelineParityExample() }
        }
        if matches("Table") {
            PlaygroundSection("Table", description: "Named records with controlled empty and invalid states.") { TableParityExample() }
        }
        if matches("Stepper") {
            PlaygroundSection("Stepper", description: "Controlled progress with localized step states.") { StepperParityExample() }
        }
        if matches("Breadcrumb") {
            PlaygroundSection("Breadcrumb", description: "Named native ancestor navigation and current destination.") { BreadcrumbParityExample() }
        }
        #if os(iOS) || os(visionOS)
        if matches("Mentions") {
            PlaygroundSection("Mentions", description: "Controlled mention suggestions with native composition guards.") { MentionsParityExample() }
        }
        #endif
        if matches("Rating") {
            PlaygroundSection("Rating", description: "Controlled whole-number selection with localized labels.") { RatingParityExample() }
        }
        if matches("Data table") {
            PlaygroundSection("Data table", description: "Controlled sorting and retained record selection.") { DataTableParityExample() }
        }
        if matches("Tour") {
            PlaygroundSection("Tour", description: "Controlled guidance anchored to measured native targets.") { TourParityExample() }
        }
        if matches("Tree grid") {
            PlaygroundSection("Tree grid", description: "Controlled native tree grid with retained host state.") {
                TreeGridParityExample()
            }
        }
        if matches("Command") {
            PlaygroundSection("Command", description: "Controlled native command with retained host state.") {
                CommandParityExample()
            }
        }
        if matches("Tooltip") {
            PlaygroundSection("Tooltip", description: "Native controlled tooltip with accessible interactions.") {
                TooltipParityExample()
            }
        }
        if matches("Carousel") {
            PlaygroundSection("Carousel", description: "Native controlled carousel with accessible interactions.") {
                CarouselParityExample()
            }
        }
        if matches("Transfer") {
            PlaygroundSection("Transfer", description: "Controlled native selection with retained host values.") {
                TransferParityExample()
            }
        }
        if matches("Tree select") {
            PlaygroundSection("Tree select", description: "Controlled native selection with retained host values.") {
                TreeSelectParityExample()
            }
        }
        if matches("Color picker") {
            PlaygroundSection("Color picker", description: "Controlled native color channels and validated text.") {
                ColorPickerParityExample()
            }
        }
        if matches("Schedule") {
            PlaygroundSection("Schedule", description: "Timed native day columns with controlled event moves.") {
                ScheduleParityExample()
            }
        }
        if matches("Calendar") {
            PlaygroundSection("Calendar", description: "Controlled native calendar example.") {
                CalendarParityExample()
            }
        }
        if matches("Agenda") {
            PlaygroundSection("Agenda", description: "Controlled native agenda example.") {
                AgendaParityExample()
            }
        }
        if matches("Kanban board") {
            PlaygroundSection("Kanban board", description: "Controlled native kanban board example.") {
                KanbanBoardParityExample()
            }
        }
        if matches("Kanban column") {
            PlaygroundSection("Kanban column", description: "Controlled native kanban column example.") {
                KanbanColumnParityExample()
            }
        }

        if matches("Cascader") {
            PlaygroundSection("Cascader", description: "Controlled destination paths with native branch browsing.") {
                CascaderParityExample()
            }
        }
        if matches("QR code") {
            PlaygroundSection("QR code", description: "Offline Unicode encoding with localized recovery.") {
                QRCodeParityExample()
            }
        }
        if matches("Tree") {
            PlaygroundSection("Tree", description: "Controlled expansion and selection with synthetic project files.") {
                TreeParityExample()
            }
        }
    }
}
