import LumenUI
import SwiftUI

@main
struct LumenApplePlaygroundApp: App {
    var body: some Scene {
        WindowGroup {
            ApplePlaygroundView()
                .frame(minWidth: 420, minHeight: 620)
        }
    }
}

private struct ApplePlaygroundView: View {
    @State private var email = "hello@lumen.dev"
    @State private var isDark = false
    @State private var notificationsEnabled = true
    @State private var progress = 76.0
    @State private var query = ""
    @State private var selectedDensity = "Comfortable"
    @State private var selectedSymbol = "sparkles"
    @State private var showBanner = true

    private let componentNames = [
        "Theme", "Text", "Surface", "Icon", "Icon button", "Button", "Text field", "Badge",
        "Divider", "Spinner", "Card", "Alert", "Progress", "Avatar", "Toggle", "Settings row",
        "Picker", "Slider", "Search field", "Empty state", "List row", "Banner", "Stat", "Gauge",
        "Section header", "Status bar", "Shortcut recorder", "Symbol picker"
    ]

    var body: some View {
        LumenSurface(tone: .canvas, padding: .none, radius: .none) {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: LumenSpacing.lg) {
                hero
                LumenSearchField("Search components", text: $query)

                HStack {
                    LumenText("\(visibleCount) components", variant: .label)
                    Spacer()
                    LumenText("iOS · iPadOS · macOS", variant: .caption, tone: .muted)
                }

                foundationsSection
                actionsSection
                formsSection
                feedbackSection
                dataSection
                emptyStateSection

                #if os(macOS)
                macUtilitiesSection
                #endif

                if visibleCount == 0 {
                    LumenEmptyState(
                        "No matching component",
                        systemName: "magnifyingglass",
                        description: "Try another component name."
                    )
                }

                LumenStatusBar("Powered by the local LumenUI package", tone: .success) {
                    LumenText("23 shared", variant: .caption, tone: .muted)
                }
            }
                .frame(maxWidth: 820)
                .padding(LumenSpacing.xl)
                .frame(maxWidth: .infinity)
            }
        }
        .lumenTheme(isDark ? .dark : .light)
    }

    private var hero: some View {
        HStack(alignment: .top, spacing: LumenSpacing.lg) {
            VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                LumenBadge("SwiftUI", tone: .accent)
                LumenText("Lumen Apple Playground", variant: .title)
                LumenText(
                    "Explore the public SwiftUI components with native controls and state.",
                    tone: .soft
                )
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            LumenIconButton(
                systemName: isDark ? "sun.max" : "moon",
                label: isDark ? "Use light theme" : "Use dark theme"
            ) {
                isDark.toggle()
            }
        }
    }

    @ViewBuilder
    private var foundationsSection: some View {
        if matches("Theme", "Text", "Surface", "Icon", "Icon button") {
            PlaygroundSection(
                "Foundations",
                description: "Theme, typography, surfaces, and SF Symbols use semantic roles."
            ) {
                LumenSurface(tone: .muted, padding: .lg) {
                    VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                        HStack(spacing: LumenSpacing.md) {
                            LumenIcon(systemName: "sparkles", label: "Lumen")
                            LumenText("Shared native foundations", variant: .label)
                            Spacer()
                            LumenIconButton(systemName: "magnifyingglass", label: "Search") {}
                        }
                        LumenText("Colors, spacing, radii, typography, and motion stay native.", tone: .soft)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var actionsSection: some View {
        if matches("Button") {
            PlaygroundSection("Buttons", description: "Try every intent, loading, and disabled state.") {
                FlowLayout {
                    LumenButton("Primary") {}
                    LumenButton("Secondary", intent: .secondary) {}
                    LumenButton("Danger", intent: .danger) {}
                    LumenButton("Loading", loading: true) {}
                    LumenButton("Disabled", disabled: true) {}
                }
            }
        }
    }

    @ViewBuilder
    private var formsSection: some View {
        if matches("Text field", "Toggle", "Settings row", "Picker", "Slider", "Search field") {
            PlaygroundSection("Forms", description: "Edit controls to exercise native focus and input behavior.") {
                VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                    LumenTextField("Email address", text: $email)
                    LumenSettingsRow(
                        "Notifications",
                        description: "Receive component release updates.",
                        systemName: "bell"
                    ) {
                        LumenToggle(isOn: $notificationsEnabled) {
                            Text("Notifications")
                        }
                        .labelsHidden()
                    }
                    LumenPicker("Density", selection: $selectedDensity, style: .segmented) {
                        Text("Compact").tag("Compact")
                        Text("Comfortable").tag("Comfortable")
                    }
                    LumenSlider(
                        "Documentation coverage",
                        value: $progress,
                        in: 0...100,
                        step: 1,
                        valueLabel: "\(Int(progress))%"
                    )
                }
            }
        }
    }

    @ViewBuilder
    private var feedbackSection: some View {
        if matches("Badge", "Divider", "Spinner", "Alert", "Progress", "Banner") {
            PlaygroundSection("Feedback", description: "Status and progress remain understandable without color alone.") {
                VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                    FlowLayout {
                        LumenBadge("Ready", tone: .success)
                        LumenBadge("Review", tone: .warning)
                        LumenBadge("Blocked", tone: .danger)
                        LumenSpinner("Loading component data")
                    }
                    LumenDivider()
                    LumenAlert(variant: .success) {
                        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                            LumenText("Playground is ready", variant: .label, tone: .success)
                            LumenText("This screen uses the real LumenUI package.", tone: .soft)
                        }
                    }
                    LumenProgress(value: progress, label: "Documentation coverage")
                    if showBanner {
                        LumenBanner(
                            "Native SwiftUI implementation",
                            description: "Dismiss this banner to exercise local state.",
                            systemName: "swift",
                            variant: .accent,
                            onDismiss: { showBanner = false }
                        )
                    } else {
                        LumenButton("Restore banner", intent: .secondary) { showBanner = true }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var dataSection: some View {
        if matches("Card", "Avatar", "List row", "Stat", "Gauge", "Section header") {
            PlaygroundSection("Data display", description: "Cards, identity, metrics, and structured rows.") {
                VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                    LumenSectionHeader("Workspace", subtitle: "Native component coverage", count: "28")
                    HStack(spacing: LumenSpacing.md) {
                        LumenStat(
                            "Components",
                            value: "28",
                            detail: "SwiftUI APIs",
                            systemName: "square.grid.2x2",
                            tone: .brand
                        )
                        LumenGauge(
                            "Coverage",
                            value: progress,
                            valueLabel: "\(Int(progress))%",
                            systemName: "checkmark.seal",
                            tone: .success
                        )
                        .frame(maxWidth: .infinity)
                    }
                    FlowLayout {
                        LumenCard(variant: .accent) {
                            LumenText("Accent", variant: .label, tone: .default)
                        }
                        LumenCard(variant: .success) {
                            LumenText("Success", variant: .label, tone: .success)
                        }
                        LumenCard(variant: .warning) {
                            LumenText("Warning", variant: .label, tone: .warning)
                        }
                        LumenCard(variant: .destructive) {
                            LumenText("Destructive", variant: .label, tone: .danger)
                        }
                    }
                    LumenCard(variant: .muted) {
                        LumenListRow {
                            LumenAvatar(fallback: "LU", size: .lg, label: "Lumen UI")
                        } content: {
                            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                                LumenText("Lumen UI", variant: .label)
                                LumenText("Native design system", variant: .caption, tone: .muted)
                            }
                        } trailing: {
                            LumenBadge("Active", tone: .success)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var emptyStateSection: some View {
        if matches("Empty state") {
            PlaygroundSection("Empty state", description: "Shared recovery structure preserves native SwiftUI behavior.") {
                LumenEmptyState(
                    "Everything is documented",
                    systemName: "checkmark.circle",
                    description: "Browse another category or try the native controls above."
                ) {
                    LumenButton("Explore components") { query = "" }
                }
                .frame(minHeight: 240)
            }
        }
    }

    #if os(macOS)
    @ViewBuilder
    private var macUtilitiesSection: some View {
        if matches("Shortcut recorder", "Symbol picker") {
            PlaygroundSection("macOS utilities", description: "Desktop-only keyboard and SF Symbol tools.") {
                HStack {
                    LumenText("Workspace symbol", variant: .label)
                    Spacer()
                    LumenSymbolPickerButton("Workspace symbol", selectedName: $selectedSymbol)
                }
            }
        }
    }
    #endif

    private var visibleCount: Int {
        componentNames.filter { name in
            query.isEmpty || name.localizedCaseInsensitiveContains(query)
        }.count
    }

    private func matches(_ names: String...) -> Bool {
        query.isEmpty || names.contains { $0.localizedCaseInsensitiveContains(query) }
    }
}

private struct PlaygroundSection<Content: View>: View {
    private let content: Content
    private let description: LocalizedStringKey
    private let title: LocalizedStringKey

    init(
        _ title: LocalizedStringKey,
        description: LocalizedStringKey,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.description = description
        self.content = content()
    }

    var body: some View {
        LumenCard {
            VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    LumenText(title, variant: .label)
                    LumenText(description, variant: .caption, tone: .muted)
                }
                LumenDivider()
                content
            }
        }
    }
}

private struct FlowLayout<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: LumenSpacing.sm) { content }
            VStack(alignment: .leading, spacing: LumenSpacing.sm) { content }
        }
    }
}
