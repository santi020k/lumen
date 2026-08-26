import LumenUI
import SwiftUI

@main
struct LumenWatchPlaygroundApp: App {
    private let component: String

    init() {
        let arguments = ProcessInfo.processInfo.arguments
        if let index = arguments.firstIndex(of: "--component"),
           arguments.indices.contains(index + 1) {
            component = arguments[index + 1]
        } else {
            component = "Wearable action"
        }
    }

    var body: some Scene {
        WindowGroup {
            WatchComponentView(component: component)
        }
    }
}

private struct WatchComponentView: View {
    let component: String

    var body: some View {
        ScrollView {
            VStack(spacing: LumenSpacing.md) {
                Text("Lumen")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text(component)
                    .font(.headline)
                    .multilineTextAlignment(.center)

                componentPreview
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, LumenSpacing.sm)
        }
        .lumenTheme(.dark)
    }

    @ViewBuilder
    private var componentPreview: some View {
        switch component {
        case "Wearable action":
            LumenWatchActionButton("Start timer", tone: .brand, dimension: 92, action: {}) {
                Image(systemName: "play.fill")
                    .font(.title2)
            }
        case "Wearable progress":
            LumenWatchProgressRing(value: 42, maximum: 60, tone: .accent) {
                VStack(spacing: 0) {
                    Text("42")
                        .font(.title2.bold())
                    Text("minutes")
                        .font(.caption2)
                }
            }
            .frame(width: 112, height: 112)
        case "Wearable status":
            LumenWatchStatus("Phone unavailable", systemName: "iphone.slash", tone: .warning)
        case "Wearable metric":
            LumenWatchMetric("Duration", value: "42:08", detail: "Personal best", tone: .brand)
        case "Wearable list row":
            LumenWatchListRow {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Morning run")
                        .font(.caption.weight(.semibold))
                    Text("42 minutes")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        default:
            Text("Choose a wearable component")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}
