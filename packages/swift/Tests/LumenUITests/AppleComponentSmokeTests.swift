#if os(iOS) || os(macOS)
import SwiftUI
import Testing
@testable import LumenUI

private enum FixtureProfile: String, CaseIterable {
    case balanced
    case performance
    case quiet
}

private struct AppleComponentCatalogFixture: View {
    @State private var isEnabled = true
    @State private var profile = FixtureProfile.balanced
    @State private var query = ""
    @State private var sliderValue = 50.0

    #if os(macOS)
    @State private var shortcut: LumenShortcut?
    @State private var symbolName = "folder"
    #endif

    var body: some View {
        ScrollView {
            VStack(spacing: LumenSpacing.lg) {
                LumenSettingsRow(
                    "Automatic behavior",
                    description: "Use the recommended native behavior.",
                    systemName: "gearshape"
                ) {
                    LumenToggle("Automatic behavior", isOn: $isEnabled)
                        .labelsHidden()
                }

                LumenPicker("Profile", selection: $profile, style: .segmented) {
                    ForEach(FixtureProfile.allCases, id: \.self) { profile in
                        Text(profile.rawValue.capitalized).tag(profile)
                    }
                }

                LumenSlider(
                    "Intensity",
                    value: $sliderValue,
                    in: 0...100,
                    step: 5,
                    valueLabel: "\(Int(sliderValue)) percent"
                )

                LumenSearchField("Search components", text: $query)

                LumenEmptyState(
                    "Nothing here yet",
                    systemName: "tray",
                    description: "Create the first item to get started."
                ) {
                    LumenButton("Create", action: {})
                }

                LumenListRow {
                    LumenIcon(systemName: "folder")
                } content: {
                    VStack(alignment: .leading) {
                        Text("Workspace")
                        Text("Three open windows").font(.caption)
                    }
                } trailing: {
                    LumenButton("Open", intent: .secondary, size: .sm, action: {})
                }

                LumenBanner(
                    "Saved successfully",
                    description: "The new settings are active.",
                    variant: .success,
                    onDismiss: {}
                ) {
                    LumenButton("Undo", intent: .quiet, size: .sm, action: {})
                }

                LumenSectionHeader("Overview", subtitle: "Current workspace", count: "3") {
                    LumenButton("Refresh", intent: .quiet, size: .sm, action: {})
                }

                HStack {
                    LumenStat("Open windows", value: "12", systemName: "macwindow", tone: .accent)
                    LumenGauge(
                        "Completion",
                        value: 72,
                        valueLabel: "72 percent",
                        systemName: "checkmark",
                        tone: .success
                    )
                }

                LumenStatusBar("Ready", tone: .success) {
                    Text("Updated now")
                }

                LumenCard(variant: .accent) {
                    Text("Semantic card emphasis")
                }

                #if os(macOS)
                LumenShortcutRecorder("Quick switch", shortcut: $shortcut)
                LumenSymbolPickerButton("Workspace symbol", selectedName: $symbolName)
                #endif
            }
        }
    }
}

@MainActor
@Test func appleComponentCatalogComposesAsOneLumenSurface() {
    _ = AppleComponentCatalogFixture().body
}
#endif
