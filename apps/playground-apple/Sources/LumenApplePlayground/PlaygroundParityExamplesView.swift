import LumenUI
import SwiftUI

struct PlaygroundParityExamplesView: View {
    let matches: (String) -> Bool

    var body: some View {
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
