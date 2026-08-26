import Foundation
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
    @State private var accessibilityReviewed = false
    @State private var componentSearch = ""
    @State private var disclosureExpanded = true
    @State private var isDark = false
    @State private var notificationsEnabled = true
    @State private var notes = "Native components now share one documented contract."
    @State private var progress = 76.0
    @State private var query = ""
    @State private var releaseDate = Date()
    @State private var selectedDensity = "Comfortable"
    @State private var selectedProfile = "balanced"
    @State private var selectedLayout = "comfortable"
    @State private var selectedTab = "overview"
    @State private var selectedSymbol = "sparkles"
    #if os(macOS)
    @State private var shortcut: LumenShortcut?
    #endif
    @State private var showBanner = true
    @State private var showToast = true
    @State private var showAlertDialog = false
    @State private var showSheet = false
    @State private var designSelected = true
    @State private var selectedDestination = "home"

    private let componentNames = [
        "Theme", "Text", "Surface", "Icon", "Icon button", "Button", "Button group", "Text field",
        "Textarea", "Field group", "Chip", "Badge", "Link",
        "Divider", "Spinner", "Card", "Alert", "Alert dialog", "Progress", "Skeleton", "Disclosure", "Avatar",
        "Toggle", "Settings row", "Checkbox", "Radio group", "Segmented control", "Tabs",
        "Picker", "Slider", "Date field", "Search field", "Empty state", "List row", "Banner", "Toast", "Stat", "Gauge",
        "Section header", "Status bar", "Graphic", "Backdrop", "Illustration", "Navigation bar",
        "Sheet", "Menu", "Share button", "Tab bar minimization", "Tab accessory",
        "Shortcut recorder", "Symbol picker"
    ]

    init() {
        _isDark = State(initialValue: ProcessInfo.processInfo.arguments.contains("--dark"))

        if let index = ProcessInfo.processInfo.arguments.firstIndex(of: "--component"),
           ProcessInfo.processInfo.arguments.indices.contains(index + 1) {
            let component = ProcessInfo.processInfo.arguments[index + 1]
            _query = State(initialValue: component)
            _showAlertDialog = State(initialValue: component == "Alert dialog")
            _showSheet = State(initialValue: component == "Sheet")
        }
    }

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
                visualSection
                actionsSection
                formsSection
                feedbackSection
                contentStatesSection
                dataSection
                navigationSection
                presentationSection
                emptyStateSection

                if query.isEmpty {
                    aboutSection
                }

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

                LumenStatusBar("Built with LumenUI", tone: .success) {
                    LumenText("\(componentNames.count) components", variant: .caption, tone: .muted)
                }
            }
                .frame(maxWidth: 820)
                .padding(LumenSpacing.xl)
                .frame(maxWidth: .infinity)
            }
        }
        .lumenTheme(isDark ? .dark : .light)
    }

    @ViewBuilder
    private var visualSection: some View {
        if matches("Graphic", "Backdrop", "Illustration") {
            PlaygroundSection(
                "Visual composition",
                description: "Decorative primitives use semantic color and keep meaningful artwork labeled."
            ) {
                LumenBackdrop(intensity: .subtle, tone: .accent, variant: .grid) {
                    HStack(spacing: LumenSpacing.lg) {
                        LumenGraphic(label: "Shared component orbit", size: .sm, tone: .brand, variant: .orbit) {
                            LumenIcon(name: .sparkles, size: .lg)
                        }
                        LumenIllustration(
                            variant: .success,
                            tone: .auto,
                            size: .sm,
                            label: "Successful native build"
                        )
                    }
                    .frame(maxWidth: .infinity)
                    .padding(LumenSpacing.lg)
                }
                .frame(minHeight: 190)
                .clipShape(RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous))
            }
        }
    }

    private var hero: some View {
        HStack(alignment: .top, spacing: LumenSpacing.lg) {
            VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                LumenBadge("SwiftUI", tone: .accent)
                LumenText("Lumen Playground", variant: .title)
                LumenText(
                    "Explore the public SwiftUI components with native controls and state.",
                    tone: .soft
                )
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            LumenIconButton(
                name: isDark ? .sun : .moon,
                label: isDark ? "Use light theme" : "Use dark theme"
            ) {
                isDark.toggle()
            }
        }
    }

    private var aboutSection: some View {
        PlaygroundSection(
            "About Lumen Playground",
            description: "A living, offline catalog for evaluating Lumen's native SwiftUI components."
        ) {
            LumenSurface(tone: .muted, padding: .lg) {
                VStack(alignment: .leading, spacing: LumenSpacing.md) {
                    HStack(spacing: LumenSpacing.sm) {
                        LumenBadge("Version \(appVersion)", tone: .accent)
                        LumenBadge("No data collection", tone: .success)
                    }
                    LumenText(
                        "Search the complete catalog, exercise interactive states, and compare light and dark themes without creating an account.",
                        tone: .soft
                    )
                    FlowLayout {
                        LumenLink(
                            "Documentation",
                            destination: playgroundURL("https://lumen.santi020k.com/docs/apple"),
                            showsExternalIndicator: true
                        )
                        LumenLink(
                            "Support",
                            destination: playgroundURL("https://lumen.santi020k.com/support"),
                            showsExternalIndicator: true
                        )
                        LumenLink(
                            "Privacy",
                            destination: playgroundURL("https://lumen.santi020k.com/privacy"),
                            showsExternalIndicator: true
                        )
                    }
                }
            }
        }
    }

    private var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
            ?? "Development"
    }

    private func playgroundURL(_ value: String) -> URL {
        URL(string: value) ?? URL(fileURLWithPath: "/")
    }

    @ViewBuilder
    private var foundationsSection: some View {
        if matches("Theme", "Text", "Surface", "Icon", "Icon button") {
            PlaygroundSection(
                "Foundations",
                description: "Theme, typography, surfaces, and shared Lumen icons use semantic roles."
            ) {
                LumenSurface(tone: .muted, padding: .lg) {
                    VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                        HStack(spacing: LumenSpacing.md) {
                            LumenIcon(name: .star, label: "Lumen")
                            LumenIcon(name: .brandGithub, label: "GitHub")
                            LumenText("Shared native foundations", variant: .label)
                            Spacer()
                            LumenIconButton(name: .search, label: "Search") {}
                        }
                        LumenText("Colors, spacing, radii, typography, and motion stay native.", tone: .soft)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var actionsSection: some View {
        if matches("Button", "Button group", "Chip", "Link") {
            PlaygroundSection("Buttons", description: "Try every intent, loading, and disabled state.") {
                LumenButtonGroup {
                    LumenButton("Primary") {}
                    LumenButton("Secondary", intent: .secondary) {}
                    LumenButton("Danger", intent: .danger) {}
                }
                FlowLayout {
                    LumenButton("Loading", loading: true) {}
                    LumenButton("Disabled", disabled: true) {}
                    LumenChip(
                        "Design",
                        selected: designSelected,
                        onPress: { designSelected.toggle() }
                    )
                    LumenLink(
                        "Native guidance",
                        destination: URL(string: "https://lumen.santi020k.com/docs/apple")
                            ?? URL(fileURLWithPath: "/docs/apple"),
                        showsExternalIndicator: true
                    )
                }
            }
        }
    }

    @ViewBuilder
    private var navigationSection: some View {
        if matches("Navigation bar", "Tab bar minimization", "Tab accessory") {
            PlaygroundSection(
                "Navigation",
                description: "Destination state and re-selection remain application-owned."
            ) {
                VStack(spacing: LumenSpacing.lg) {
                    LumenText("Selected: \(selectedDestination.capitalized)", variant: .label)
                    LumenNavigationBar(
                        selection: $selectedDestination,
                        items: [
                            LumenNavigationItem(
                                "Home",
                                value: "home",
                                systemName: "house",
                                selectedSystemName: "house.fill"
                            ),
                            LumenNavigationItem(
                                "Activity",
                                value: "activity",
                                systemName: "bell",
                                badge: .count(12)
                            ),
                            LumenNavigationItem(
                                "Profile",
                                value: "profile",
                                systemName: "person",
                                badge: .dot()
                            )
                        ]
                    )
                    #if os(iOS)
                    if matches("Tab bar minimization") {
                        TabView {
                            ScrollView {
                                LazyVStack(alignment: .leading, spacing: LumenSpacing.md) {
                                    ForEach(1...8, id: \.self) { index in
                                        LumenText("Release note \(index)", variant: .label)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                            .padding(LumenSpacing.md)
                                            .background(
                                                Color.primary.opacity(0.05),
                                                in: RoundedRectangle(cornerRadius: LumenRadius.sm)
                                            )
                                    }
                                }
                                .padding(LumenSpacing.md)
                            }
                            .tabItem { Label("Feed", systemImage: "rectangle.stack") }

                            LumenText("Profile", variant: .title)
                                .tabItem { Label("Profile", systemImage: "person") }
                        }
                        .frame(height: 320)
                        .lumenTabBarMinimizeBehavior(.onScrollDown)
                    }
                    #endif
                    #if os(iOS)
                    LumenTabAccessory {
                        HStack {
                            LumenText("Upload in progress", variant: .label)
                            Spacer()
                            LumenProgress(value: 64, label: "Upload progress")
                                .frame(width: 120)
                        }
                    } compact: {
                        LumenBadge("64%", tone: .accent)
                    }
                    #endif
                }
            }
        }
    }

    @ViewBuilder
    private var presentationSection: some View {
        if matches("Alert dialog", "Sheet", "Menu", "Share button") {
            PlaygroundSection(
                "Presentation",
                description: "System-owned overlays retain native dismissal, keyboard, and assistive behavior."
            ) {
                FlowLayout {
                    LumenButton("Confirm publication", intent: .danger) {
                        showAlertDialog = true
                    }
                    .lumenAlertDialog(
                        isPresented: $showAlertDialog,
                        title: "Publish components?",
                        description: "This demonstrates a destructive confirmation.",
                        confirmLabel: "Publish",
                        confirmRole: .destructive,
                        onConfirm: {}
                    )

                    LumenButton("Open release sheet", intent: .secondary) {
                        showSheet = true
                    }
                    .lumenSheet(
                        isPresented: $showSheet,
                        title: "Release details",
                        description: "Application-owned content inside a native sheet."
                    ) {
                        LumenText("All Apple component contracts are represented.", tone: .soft)
                    }

                    LumenMenu(
                        items: [
                            LumenMenuItem("Duplicate", systemName: "plus.square.on.square", action: {}),
                            LumenMenuItem("Archive", systemName: "archivebox", disabled: true, action: {}),
                            LumenMenuItem("Delete", systemName: "trash", role: .destructive, action: {})
                        ]
                    ) {
                        LumenBadge("More actions", tone: .accent)
                    }

                    LumenShareButton("Share catalog", item: "Lumen SwiftUI component catalog")
                }
            }
        }
    }

    @ViewBuilder
    private var formsSection: some View {
        if matches(
            "Text field",
            "Textarea",
            "Field group",
            "Toggle",
            "Settings row",
            "Picker",
            "Slider",
            "Date field",
            "Search field",
            "Checkbox",
            "Radio group",
            "Segmented control",
            "Tabs"
        ) {
            PlaygroundSection("Forms", description: "Edit controls to exercise native focus and input behavior.") {
                VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                    if matches("Text field") {
                        LumenTextField("Email address", text: $email)
                    }
                    if matches("Textarea") {
                        LumenTextarea(
                            "Release notes",
                            text: $notes,
                            description: "Summarize the native release."
                        )
                    }
                    if matches("Field group") {
                        LumenFieldGroup(
                            "Publication checks",
                            description: "Contained controls retain independent focus and labels.",
                            required: true
                        ) {
                            LumenCheckbox(
                                "Confirm accessibility review",
                                isChecked: $accessibilityReviewed
                            )
                        }
                    }
                    if matches("Settings row") {
                        LumenSettingsRow(
                            "Demo notification preference",
                            description: "Example state only. The playground does not register for notifications.",
                            systemName: "bell"
                        ) {
                            LumenToggle(isOn: $notificationsEnabled) {
                                Text("Demo notification preference")
                            }
                            .labelsHidden()
                        }
                    }
                    if matches("Toggle") {
                        LumenToggle("Demo notification preference", isOn: $notificationsEnabled)
                    }
                    if matches("Checkbox") {
                        LumenCheckbox(
                            "Confirm accessibility review",
                            isChecked: $accessibilityReviewed,
                            description: "Required before publishing this native component set."
                        )
                    }
                    if matches("Radio group") {
                        LumenRadioGroup(
                            "Performance profile",
                            selection: $selectedProfile,
                            options: [
                                LumenSelectionOption("Quiet", value: "quiet", description: "Reduce background activity."),
                                LumenSelectionOption(
                                    "Balanced",
                                    value: "balanced",
                                    description: "Recommended for most projects."
                                ),
                                LumenSelectionOption(
                                    "Performance",
                                    value: "performance",
                                    description: "Prioritize responsiveness."
                                )
                            ]
                        )
                    }
                    if matches("Segmented control") {
                        LumenSegmentedControl(
                            "Control density",
                            selection: $selectedLayout,
                            options: [
                                LumenSelectionOption("Compact", value: "compact"),
                                LumenSelectionOption("Comfortable", value: "comfortable"),
                                LumenSelectionOption("Spacious", value: "spacious", isDisabled: true)
                            ]
                        )
                    }
                    if matches("Tabs") {
                        LumenTabs(
                            "Workspace views",
                            selection: $selectedTab,
                            options: [
                                LumenSelectionOption("Overview", value: "overview"),
                                LumenSelectionOption("Activity", value: "activity"),
                                LumenSelectionOption("Billing", value: "billing", isDisabled: true)
                            ]
                        ) { selected in
                            LumenSurface(tone: .muted, padding: .md) {
                                LumenText(
                                    selected == "overview"
                                        ? "Workspace health is ready."
                                        : "Three components updated today.",
                                    variant: .label
                                )
                            }
                        }
                    }
                    if matches("Picker") {
                        LumenPicker("Density", selection: $selectedDensity, style: .segmented) {
                            Text("Compact").tag("Compact")
                            Text("Comfortable").tag("Comfortable")
                        }
                    }
                    if matches("Slider") {
                        LumenSlider(
                            "Documentation coverage",
                            value: $progress,
                            in: 0...100,
                            step: 1,
                            valueLabel: "\(Int(progress))%"
                        )
                    }
                    if matches("Date field") {
                        LumenDateField(
                            "Release date",
                            selection: $releaseDate,
                            description: "Choose when this component becomes available."
                        )
                    }
                    if matches("Search field") {
                        LumenSearchField("Search workspaces", text: $componentSearch)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var contentStatesSection: some View {
        if matches("Skeleton", "Disclosure") {
            PlaygroundSection(
                "Content states",
                description: "Loading placeholders and disclosures preserve native semantics."
            ) {
                VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                    HStack(spacing: LumenSpacing.md) {
                        LumenSkeleton(width: 44, height: 44, shape: .circle)
                        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                            LumenSkeleton(width: 180, height: 16, label: "Loading profile")
                            LumenSkeleton(width: 120, height: 12)
                        }
                    }
                    LumenDisclosure(
                        "Implementation notes",
                        isExpanded: $disclosureExpanded,
                        description: "Expand to inspect native content behavior."
                    ) {
                        LumenText(
                            "Each adapter owns its native rendering and focus behavior.",
                            tone: .soft
                        )
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var feedbackSection: some View {
        if matches("Badge", "Divider", "Spinner", "Alert", "Progress", "Banner", "Toast") {
            PlaygroundSection("Feedback", description: "Status and progress remain understandable without color alone.") {
                VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                    if matches("Badge", "Spinner") {
                        FlowLayout {
                            if matches("Badge") {
                                LumenBadge("Ready", tone: .success)
                                LumenBadge("Review", tone: .warning)
                                LumenBadge("Blocked", tone: .danger)
                            }
                            if matches("Spinner") {
                                LumenSpinner("Loading component data")
                            }
                        }
                    }
                    if matches("Divider") {
                        LumenDivider()
                    }
                    if matches("Alert") {
                        LumenAlert(variant: .success) {
                            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                                LumenText("Playground is ready", variant: .label, tone: .success)
                                LumenText("This screen uses the real LumenUI package.", tone: .soft)
                            }
                        }
                    }
                    if matches("Progress") {
                        LumenProgress(value: progress, label: "Documentation coverage")
                    }
                    if matches("Banner") {
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
                    if matches("Toast"), showToast {
                        LumenToast(
                            "Changes saved",
                            description: "All shared native catalogs were updated.",
                            variant: .success,
                            onDismiss: { showToast = false }
                        )
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
                    if matches("Section header") {
                        LumenSectionHeader(
                            "Workspace",
                            subtitle: "Native component coverage",
                            count: String(componentNames.count)
                        )
                    }
                    if matches("Stat", "Gauge") {
                        HStack(spacing: LumenSpacing.md) {
                            if matches("Stat") {
                                LumenStat(
                                    "Components",
                                    value: String(componentNames.count),
                                    detail: "SwiftUI APIs",
                                    systemName: "square.grid.2x2",
                                    tone: .brand
                                )
                            }
                            if matches("Gauge") {
                                LumenGauge(
                                    "Coverage",
                                    value: progress,
                                    valueLabel: "\(Int(progress))%",
                                    systemName: "checkmark.seal",
                                    tone: .success
                                )
                                .frame(maxWidth: .infinity)
                            }
                        }
                    }
                    if matches("Card") {
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
                    }
                    if matches("Avatar", "List row") {
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
                VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                    if matches("Shortcut recorder") {
                        LumenShortcutRecorder("Quick switch", shortcut: $shortcut) { candidate in
                            candidate.keyCode == 12 ? "Reserved by Quit." : nil
                        }
                    }
                    if matches("Symbol picker") {
                        LumenSymbolPicker("Workspace symbol", selectedName: $selectedSymbol)
                    }
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
