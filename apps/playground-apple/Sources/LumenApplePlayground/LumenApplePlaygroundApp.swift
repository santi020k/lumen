import Foundation
import LumenUI
import SwiftUI

@main
struct LumenApplePlaygroundApp: App {
    var body: some Scene {
        WindowGroup {
            PlaygroundRootView()
                .frame(minWidth: 420, minHeight: 620)
        }
    }
}

struct ComponentsCatalogView: View {
    @State private var email = "hello@lumen.dev"
    @State private var accessibilityReviewed = false
    @State private var componentSearch = ""
    @State private var disclosureExpanded = true
    @Binding private var themePreference: PlaygroundThemePreference
    @State private var notificationsEnabled = true
    @State private var notes = "Native components now share one documented contract."
    @State private var phoneNumber = LumenPhoneNumber.empty(
        country: LumenPhoneCountries.forRegion("CO") ?? LumenPhoneCountry(
            regionCode: "CO",
            callingCode: "+57",
            displayName: "Colombia"
        )
    )
    @State private var progress = 76.0
    @State private var query = ""
    @State private var releaseDate = Date()
    @State private var releaseEndDate = Date().addingTimeInterval(86_400)
    @State private var selectedCategory: PlaygroundComponentCategory = .all
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

    private let isDeterministicFilter: Bool
    private let componentNames = PlaygroundCatalog.componentNames

    init(themePreference: Binding<PlaygroundThemePreference>, componentFilter: String? = nil) {
        _themePreference = themePreference
        _query = State(initialValue: componentFilter ?? "")
        _showAlertDialog = State(initialValue: componentFilter == "Alert dialog")
        _showSheet = State(initialValue: componentFilter == "Sheet")
        isDeterministicFilter = componentFilter != nil
    }

    var body: some View {
        LumenSurface(tone: .canvas, padding: .none, radius: .none) {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: LumenSpacing.lg) {
                if isDeterministicFilter {
                    hero
                    LumenSearchField("Search components", text: $query)
                    catalogCountRow
                } else {
                    catalogHeader
                }

                AdaptiveColumns {
                    foundationsSection
                } secondary: {
                    visualSection
                }
                AdaptiveColumns {
                    actionsSection
                } secondary: {
                    formsSection
                }
                AdaptiveColumns {
                    feedbackSection
                } secondary: {
                    contentStatesSection
                }
                AdaptiveColumns {
                    dataSection
                } secondary: {
                    chartSection
                }
                AdaptiveColumns {
                    navigationSection
                } secondary: {
                    presentationSection
                }
                emptyStateSection

                if query.isEmpty, selectedCategory == .all {
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
                .frame(maxWidth: 1040)
                .padding(isDeterministicFilter ? LumenSpacing.xl : LumenSpacing.lg)
                .frame(maxWidth: .infinity)
            }
        }
    }

    private var catalogHeader: some View {
        PlaygroundSection(
            "SwiftUI component library",
            description: "Search every public playground entry or narrow the catalog by product intent."
        ) {
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                HStack(alignment: .center) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: LumenSpacing.sm) {
                            LumenBadge("\(componentNames.count) components", tone: .accent)
                            LumenBadge("6 categories", tone: .neutral)
                            LumenBadge("3 platforms", tone: .success)
                        }
                    }
                    Spacer(minLength: LumenSpacing.sm)
                    themeButton
                }
                LumenSearchField("Search components", text: $query)
                LumenText("Browse by category", variant: .label)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: LumenSpacing.sm) {
                        ForEach(PlaygroundComponentCategory.allCases) { category in
                            LumenChip(
                                LocalizedStringKey(category.title),
                                selected: selectedCategory == category,
                                onPress: { selectedCategory = category }
                            )
                        }
                    }
                    .padding(.vertical, 1)
                }
                catalogCountRow
            }
        }
    }

    private var catalogCountRow: some View {
        HStack {
            LumenText("\(visibleCount) components", variant: .label)
            Spacer()
            LumenText(
                selectedCategory == .all ? "iOS · iPadOS · macOS" : LocalizedStringKey(selectedCategory.title),
                variant: .caption,
                tone: .muted
            )
        }
    }

    private var themeButton: some View {
        LumenIconButton(
            name: themePreference == .dark ? .sun : .moon,
            label: themePreference == .dark ? "Use light theme" : "Use dark theme"
        ) {
            themePreference = themePreference == .dark ? .light : .dark
        }
    }

    @ViewBuilder
    private var visualSection: some View {
        if matches("Graphic", "Backdrop", "Illustration", "Image") {
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
                        LumenImage(
                            aspectRatio: 1,
                            fit: .contain,
                            radius: .md,
                            label: "Photo placeholder"
                        ) {
                            Image(systemName: "photo.on.rectangle.angled")
                                .resizable()
                                .symbolRenderingMode(.hierarchical)
                        }
                        .frame(width: 96)
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

            themeButton
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
            "Phone input",
            "Toggle",
            "Settings row",
            "Picker",
            "Slider",
            "Date field",
            "Date range field",
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
                    if matches("Phone input") {
                        LumenPhoneInput(
                            "Hospital or OB phone number",
                            value: $phoneNumber,
                            locale: Locale(identifier: "en_US"),
                            description: phoneNumber.e164 ?? "Add the full hospital or OB number."
                        )
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
                    if matches("Date range field") {
                        LumenDateRangeField(
                            "Release window",
                            start: $releaseDate,
                            end: $releaseEndDate,
                            description: "Choose the inclusive availability window."
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
    private var chartSection: some View {
        if matches("Sparkline", "Line chart", "Bar chart", "Pie chart", "Scatter chart", "Heatmap", "Range chart", "Combo chart") {
            PlaygroundSection(
                "Data visualization",
                description: "Tokenized plots include a factual accessibility summary and readable fallback data."
            ) {
                if isVisible("Sparkline") {
                    LumenSparkline(label: "Weekly adoption trend", values: [12, 18, 16, 27, 35])
                }
                if isVisible("Line chart") {
                    LumenLineChart(
                        label: "Weekly adoption chart",
                        series: [
                            LumenChartSeries(
                                id: "adoption",
                                label: "Projects",
                                data: [
                                    LumenChartDatum(id: "mon", x: .category("Mon"), y: 18),
                                    LumenChartDatum(id: "tue", x: .category("Tue"), y: 26),
                                    LumenChartDatum(id: "wed", x: .category("Wed"), y: nil),
                                    LumenChartDatum(id: "thu", x: .category("Thu"), y: 41),
                                    LumenChartDatum(id: "fri", x: .category("Fri"), y: 53)
                                ]
                            )
                        ],
                        heading: "Weekly adoption",
                        area: true
                    )
                }
                if isVisible("Bar chart") {
                    LumenBarChart(
                        label: "Components by platform",
                        series: [
                            LumenChartSeries(
                                id: "components",
                                label: "Components",
                                data: [
                                    LumenChartDatum(id: "web", x: .category("Web"), y: 82),
                                    LumenChartDatum(id: "ios", x: .category("iOS"), y: 61),
                                    LumenChartDatum(id: "android", x: .category("Android"), y: 58)
                                ]
                            )
                        ]
                    )
                }
                if isVisible("Pie chart") {
                    LumenPieChart(
                        label: "Issue status distribution",
                        series: LumenChartSeries(
                            id: "issues",
                            label: "Issues",
                            data: [
                                LumenChartDatum(id: "complete", x: .category("Complete"), y: 68),
                                LumenChartDatum(id: "active", x: .category("Active"), y: 22),
                                LumenChartDatum(id: "blocked", x: .category("Blocked"), y: 10)
                            ]
                        )
                    )
                }
                if isVisible("Scatter chart") {
                    LumenScatterChart(
                        label: "Bundle size and render time",
                        series: [
                            LumenChartSeries(
                                id: "releases",
                                label: "Releases",
                                data: [
                                    LumenChartDatum(id: "one", x: .number(12), y: 28, size: 12),
                                    LumenChartDatum(id: "two", x: .number(20), y: 41, size: 20),
                                    LumenChartDatum(id: "three", x: .number(31), y: 54, size: 28)
                                ]
                            )
                        ]
                    )
                }
                if isVisible("Heatmap") {
                    LumenHeatmap(
                        label: "Activity by day and period",
                        data: [
                            LumenHeatmapDatum(id: "mon-am", column: "Mon", row: "Morning", value: 18),
                            LumenHeatmapDatum(id: "tue-am", column: "Tue", row: "Morning", value: 32),
                            LumenHeatmapDatum(id: "mon-pm", column: "Mon", row: "Evening", value: 47),
                            LumenHeatmapDatum(id: "tue-pm", column: "Tue", row: "Evening", value: nil)
                        ]
                    )
                }
                if isVisible("Range chart") {
                    LumenRangeChart(
                        label: "Daily forecast range",
                        data: [
                            LumenRangeDatum(id: "mon", x: .category("Mon"), low: 16, high: 28),
                            LumenRangeDatum(id: "tue", x: .category("Tue"), low: 21, high: 35),
                            LumenRangeDatum(id: "wed", x: .category("Wed"), low: 27, high: 42)
                        ]
                    )
                }
                if isVisible("Combo chart") {
                    LumenComboChart(
                        label: "Deployments and reliability",
                        series: [
                            LumenChartSeries(
                                id: "deployments",
                                label: "Deployments",
                                data: [
                                    LumenChartDatum(id: "dep-apr", x: .category("Apr"), y: 24),
                                    LumenChartDatum(id: "dep-may", x: .category("May"), y: 31),
                                    LumenChartDatum(id: "dep-jun", x: .category("Jun"), y: 38)
                                ],
                                mark: .bar
                            ),
                            LumenChartSeries(
                                id: "reliability",
                                label: "Reliability",
                                data: [
                                    LumenChartDatum(id: "rel-apr", x: .category("Apr"), y: 94),
                                    LumenChartDatum(id: "rel-may", x: .category("May"), y: 97),
                                    LumenChartDatum(id: "rel-jun", x: .category("Jun"), y: 99)
                                ]
                            )
                        ]
                    )
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
            isVisible(name)
        }.count
    }

    private func matches(_ names: String...) -> Bool {
        names.contains(where: isVisible)
    }

    private func isVisible(_ name: String) -> Bool {
        let matchesQuery = query.isEmpty || name.localizedCaseInsensitiveContains(query)
        return matchesQuery && selectedCategory.contains(name)
    }
}

struct PlaygroundSection<Content: View>: View {
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

struct FlowLayout<Content: View>: View {
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
