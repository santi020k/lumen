import LumenUI
import SwiftUI

private enum ExamplePattern: String, CaseIterable, Identifiable {
    case release
    case health
    case profile

    var id: String { rawValue }
    var title: String { rawValue.capitalized }
}

private enum ReferenceState: String, CaseIterable, Identifiable {
    case loading
    case empty
    case error
    case success

    var id: String { rawValue }
    var title: String { rawValue.capitalized }
}

struct PlaygroundExamplesView: View {
    @State private var accessibilityReviewed = true
    @State private var email = "release@lumen.dev"
    @State private var healthState: ReferenceState = .success
    @State private var notificationsEnabled = true
    @State private var pattern: ExamplePattern = .release
    @State private var profileDensity = "Comfortable"
    @State private var profileName = "Lumen Contributor"
    @State private var profileStep = 1
    @State private var releaseDate = Date().addingTimeInterval(86_400)
    @State private var releaseNotice: String?
    @State private var showResetConfirmation = false
    @State private var syncState: ReferenceState = .success

    var body: some View {
        PlaygroundPage(
            "Examples",
            subtitle: "Switch among complete product patterns and exercise their real interaction states."
        ) {
            patternGallery
        }
    }

    private var patternGallery: some View {
        LumenTabs(
            "Pattern gallery",
            selection: $pattern,
            options: ExamplePattern.allCases.map { item in
                LumenSelectionOption(item.title, value: item)
            }
        ) { selection in
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                patternSummary(selection)
                patternContent(selection)
            }
            .padding(.top, LumenSpacing.sm)
        }
    }

    private func patternSummary(_ selection: ExamplePattern) -> some View {
        LumenCard(variant: .accent) {
            LumenListRow {
                LumenIcon(systemName: patternSystemName(selection), label: LocalizedStringKey(selection.title))
            } content: {
                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    LumenText(LocalizedStringKey(selection.title), variant: .label)
                    LumenText(patternDescription(selection), variant: .caption, tone: .muted)
                }
            } trailing: {
                LumenBadge("Interactive", tone: .accent)
            }
        }
    }

    @ViewBuilder
    private func patternContent(_ selection: ExamplePattern) -> some View {
        switch selection {
        case .release:
            releasePattern
        case .health:
            healthPattern
        case .profile:
            profilePattern
        }
    }

    private var releasePattern: some View {
        AdaptiveColumns {
            PlaygroundSection(
                "Prepare a release",
                description: "Validation, review state, and submission feedback stay in one focused task."
            ) {
                VStack(alignment: .leading, spacing: LumenSpacing.md) {
                    LumenTextField(
                        "Release contact",
                        text: $email,
                        error: email.isEmpty,
                        errorMessage: email.isEmpty ? "Enter a release contact before requesting review." : nil
                    )
                    LumenDateField(
                        "Target date",
                        selection: $releaseDate,
                        description: "Choose when the reviewed package should become available."
                    )
                    LumenCheckbox(
                        "Accessibility review complete",
                        isChecked: $accessibilityReviewed,
                        description: "VoiceOver, Dynamic Type, contrast, and keyboard evidence are attached."
                    )
                    LumenProgress(value: releaseProgress, label: "Release readiness")
                    LumenAlert(variant: releaseReady ? .success : .warning) {
                        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                            LumenText(
                                releaseReady ? "Ready for final review" : "Release needs attention",
                                variant: .label,
                                tone: releaseReady ? .success : .warning
                            )
                            LumenText(
                                releaseReady
                                    ? "Required contact and accessibility evidence are present."
                                    : "Resolve the validation message and complete accessibility review.",
                                tone: .soft
                            )
                        }
                    }
                    FlowLayout {
                        LumenButton("Request review", disabled: !releaseReady) {
                            releaseNotice = "Review requested successfully"
                        }
                        LumenButton("Save draft", intent: .secondary) {
                            releaseNotice = "Draft saved locally"
                        }
                    }
                    if let releaseNotice {
                        LumenToast(
                            LocalizedStringKey(releaseNotice),
                            description: "The example state changed without contacting an external service.",
                            variant: .success,
                            onDismiss: { self.releaseNotice = nil }
                        )
                    }
                }
            }
        } secondary: {
            stateLab(
                title: "Component sync",
                description: "Inspect explicit loading, empty, error, and success outcomes.",
                state: $syncState
            )
        }
    }

    private var healthPattern: some View {
        AdaptiveColumns {
            PlaygroundSection(
                "Catalog health",
                description: "Factual component distribution supports review and prioritization."
            ) {
                VStack(alignment: .leading, spacing: LumenSpacing.md) {
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: LumenSpacing.md) { healthMetrics }
                        VStack(spacing: LumenSpacing.md) { healthMetrics }
                    }
                    LumenBarChart(
                        label: "Components by product category",
                        series: PlaygroundCatalog.categoryChartSeries,
                        summary: "\(PlaygroundCatalog.componentNames.count) catalog entries grouped across six categories.",
                        showData: true
                    )
                }
            }
        } secondary: {
            stateLab(
                title: "Health refresh",
                description: "Recovery controls visibly update the current dashboard state.",
                state: $healthState
            )
        }
    }

    @ViewBuilder
    private var healthMetrics: some View {
        LumenStat(
            "Catalog entries",
            value: String(PlaygroundCatalog.componentNames.count),
            detail: "Public examples",
            systemName: "square.grid.2x2",
            tone: .brand
        )
        LumenStat(
            "Categories",
            value: "6",
            detail: "Product intent",
            systemName: "rectangle.3.group",
            tone: .accent
        )
    }

    private var profilePattern: some View {
        AdaptiveColumns {
            PlaygroundSection(
                "Contributor onboarding",
                description: "Profile details, validation, preferences, and progress form one recoverable flow."
            ) {
                VStack(alignment: .leading, spacing: LumenSpacing.md) {
                    HStack {
                        LumenBadge("Step \(profileStep) of 2", tone: .accent)
                        Spacer()
                        LumenText(profileStep == 1 ? "Profile" : "Preferences", variant: .caption, tone: .muted)
                    }
                    LumenProgress(value: Double(profileStep * 50), label: "Onboarding progress")
                    if profileStep == 1 {
                        LumenTextField(
                            "Display name",
                            text: $profileName,
                            error: profileName.isEmpty,
                            errorMessage: profileName.isEmpty ? "Enter a display name to continue." : nil
                        )
                        LumenTextField("Contact email", text: $email)
                        LumenButton("Continue", disabled: profileName.isEmpty) { profileStep = 2 }
                    } else {
                        LumenSettingsRow(
                            "Review notifications",
                            description: "Example preference stored only for this session.",
                            systemName: "bell"
                        ) {
                            LumenToggle(isOn: $notificationsEnabled) { Text("Review notifications") }
                                .labelsHidden()
                        }
                        LumenPicker("Control density", selection: $profileDensity, style: .segmented) {
                            Text("Compact").tag("Compact")
                            Text("Comfortable").tag("Comfortable")
                        }
                        FlowLayout {
                            LumenButton("Save profile") {
                                releaseNotice = "Contributor profile saved"
                            }
                            LumenButton("Back", intent: .secondary) { profileStep = 1 }
                        }
                    }
                    if let releaseNotice, pattern == .profile {
                        LumenToast(
                            LocalizedStringKey(releaseNotice),
                            description: "Profile and preference state is now represented in the example.",
                            variant: .success,
                            onDismiss: { self.releaseNotice = nil }
                        )
                    }
                }
            }
        } secondary: {
            PlaygroundSection(
                "Profile summary",
                description: "Identity and preference state remains understandable at a glance."
            ) {
                VStack(alignment: .leading, spacing: LumenSpacing.md) {
                    LumenCard(variant: .muted) {
                        LumenListRow {
                            LumenAvatar(fallback: profileInitials, size: .lg, label: "Contributor profile")
                        } content: {
                            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                                LumenText(
                                    LocalizedStringKey(profileName.isEmpty ? "Name required" : profileName),
                                    variant: .label,
                                    tone: profileName.isEmpty ? .danger : .default
                                )
                                LumenText("\(profileDensity) density", variant: .caption, tone: .muted)
                            }
                        } trailing: {
                            LumenBadge(notificationsEnabled ? "Notified" : "Quiet", tone: notificationsEnabled ? .accent : .neutral)
                        }
                    }
                    LumenButton("Reset profile example", intent: .danger) {
                        showResetConfirmation = true
                    }
                    .lumenAlertDialog(
                        isPresented: $showResetConfirmation,
                        title: "Reset profile example?",
                        description: "This clears only the temporary profile choices in the playground.",
                        confirmLabel: "Reset",
                        confirmRole: .destructive,
                        onConfirm: {
                            profileName = ""
                            notificationsEnabled = false
                            profileStep = 1
                            releaseNotice = nil
                        }
                    )
                }
            }
        }
    }

    private func stateLab(
        title: LocalizedStringKey,
        description: LocalizedStringKey,
        state: Binding<ReferenceState>
    ) -> some View {
        PlaygroundSection(title, description: description) {
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                LumenSegmentedControl(
                    "Reference state",
                    selection: state,
                    options: ReferenceState.allCases.map { item in
                        LumenSelectionOption(item.title, value: item)
                    }
                )
                stateContent(state)
            }
        }
    }

    @ViewBuilder
    private func stateContent(_ state: Binding<ReferenceState>) -> some View {
        switch state.wrappedValue {
        case .loading:
            LumenCard(variant: .muted) {
                VStack(alignment: .leading, spacing: LumenSpacing.md) {
                    HStack {
                        LumenSpinner("Refreshing reference data")
                        Spacer()
                        LumenBadge("Loading", tone: .accent)
                    }
                    LumenSkeleton(height: 18, label: "Loading reference details")
                    LumenSkeleton(width: 180, height: 14)
                    LumenButton("Refresh already running", disabled: true) {}
                    LumenButton("Finish refresh", intent: .secondary) { state.wrappedValue = .success }
                }
            }
        case .empty:
            LumenEmptyState(
                "Nothing needs attention",
                systemName: "tray",
                description: "The current reference queue has no pending items."
            ) {
                LumenButton("Create sample item", intent: .secondary) { state.wrappedValue = .success }
            }
            .frame(minHeight: 220)
        case .error:
            LumenBanner(
                "Refresh could not finish",
                description: "Existing local data remains safe. Retry to restore the successful state.",
                systemName: "exclamationmark.triangle",
                variant: .destructive
            ) {
                LumenButton("Retry", intent: .danger) { state.wrappedValue = .loading }
            }
        case .success:
            LumenCard(variant: .success) {
                VStack(alignment: .leading, spacing: LumenSpacing.md) {
                    LumenListRow {
                        LumenIcon(systemName: "checkmark.circle.fill", label: "Complete")
                    } content: {
                        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                            LumenText("Reference is current", variant: .label, tone: .success)
                            LumenText("All local example data is ready to inspect.", variant: .caption, tone: .muted)
                        }
                    } trailing: {
                        LumenBadge("Success", tone: .success)
                    }
                    LumenButton("Simulate failure", intent: .secondary) { state.wrappedValue = .error }
                }
            }
        }
    }

    private var releaseReady: Bool {
        !email.isEmpty && accessibilityReviewed
    }

    private var releaseProgress: Double {
        (email.isEmpty ? 25 : 50) + (accessibilityReviewed ? 50 : 0)
    }

    private var profileInitials: String {
        let words = profileName.split(separator: " ").prefix(2)
        let initials = words.compactMap(\.first).map(String.init).joined()
        return initials.isEmpty ? "?" : initials.uppercased()
    }

    private func patternSystemName(_ selection: ExamplePattern) -> String {
        switch selection {
        case .release: "checkmark.seal"
        case .health: "chart.xyaxis.line"
        case .profile: "person.crop.circle"
        }
    }

    private func patternDescription(_ selection: ExamplePattern) -> LocalizedStringKey {
        switch selection {
        case .release:
            "Prepare and review a component release with explicit operational states."
        case .health:
            "Inspect factual catalog distribution and recoverable health states."
        case .profile:
            "Complete contributor onboarding and verify saved preference feedback."
        }
    }
}
