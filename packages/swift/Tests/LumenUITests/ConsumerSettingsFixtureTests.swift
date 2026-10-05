#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI
import Testing
@testable import LumenUI

private struct ConsumerSettingsFixture: View {
    @State private var enabled = true
    @State private var name = "Synthetic profile"

    var body: some View {
        LumenSurface {
            VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                LumenSettingsRow(
                    "Keep synthetic reports available when the connection is interrupted",
                    description: "The application owns synchronization and recovery; this switch only presents the preference."
                ) {
                    LumenToggle("Keep synthetic reports available", isOn: $enabled)
                        .labelsHidden()
                }
                LumenFieldGroup(
                    "A deliberately long profile label for large text and narrow native settings",
                    description: "Fictional information for consumer layout verification.",
                    errorMessage: "Review this synthetic validation message.",
                    required: true
                ) {
                    LumenTextField("Profile name", text: $name)
                }
                LumenButton("Retry synthetic synchronization", action: {})
            }
        }
    }
}

@MainActor
@Test func consumerSettingsComposeAtPhoneAndDesktopWidthsWithLargeText() {
    for width in [320.0, 390.0, 1024.0] {
        for size in [DynamicTypeSize.large, .accessibility5] {
            _ = ConsumerSettingsFixture().body
                .frame(width: width)
                .dynamicTypeSize(size)
                .environment(\.locale, Locale(identifier: "es_CO"))
                .lumenTheme(.light)
            _ = ConsumerSettingsFixture().body
                .frame(width: width)
                .dynamicTypeSize(size)
                .lumenTheme(.dark)
        }
    }
}
#endif
