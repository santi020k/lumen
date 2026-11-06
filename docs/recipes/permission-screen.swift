import LumenUI
import SwiftUI

/// Copy into the application and supply its permission actions and localized strings.
struct PermissionScreen: View {
    let title: String
    let rationale: String
    let actionLabel: String
    let alternativeLabel: String?
    let request: () -> Void
    let alternative: () -> Void
    let recheck: () -> Void

    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        ScrollView {
            LumenCard {
                VStack(alignment: .leading, spacing: 16) {
                    Text(title).font(.title2).accessibilityAddTraits(.isHeader)
                    Text(rationale).fixedSize(horizontal: false, vertical: true)
                    LumenButton(.verbatim(actionLabel), action: request)
                    if let alternativeLabel {
                        LumenButton(.verbatim(alternativeLabel), intent: .secondary, action: alternative)
                    }
                }
                .frame(maxWidth: 560, alignment: .leading)
            }
            .padding()
        }
        .onChange(of: scenePhase) { phase in
            if phase == .active { recheck() }
        }
    }
}
