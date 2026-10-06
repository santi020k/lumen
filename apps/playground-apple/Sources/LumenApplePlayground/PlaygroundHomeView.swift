// cspell:words cursorarrow
import LumenUI
import SwiftUI

struct PlaygroundHomeView: View {
    let openDestination: (PlaygroundDestination) -> Void

    var body: some View {
        PlaygroundPage(
            "Release workspace",
            subtitle: "Review the Apple reference surface, exercise product patterns, and inspect every public component."
        ) {
            compactHero
            AdaptiveColumns {
                readinessCard
            } secondary: {
                categoryChart
            }
            AdaptiveColumns {
                featuredWorkflows
            } secondary: {
                quickActions
            }
            LumenAlert(variant: .success) {
                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    LumenText("Reference workspace ready", variant: .label, tone: .success)
                    LumenText(
                        "All four destinations are available locally with no account, analytics, or network dependency.",
                        tone: .soft
                    )
                }
            }
        }
    }

    private var compactHero: some View {
        LumenCard(variant: .accent) {
            ViewThatFits(in: .horizontal) {
                HStack(alignment: .center, spacing: LumenSpacing.lg) {
                    heroCopy
                    Spacer(minLength: LumenSpacing.md)
                    heroActions
                }
                VStack(alignment: .leading, spacing: LumenSpacing.md) {
                    heroCopy
                    heroActions
                }
            }
        }
    }

    private var heroCopy: some View {
        HStack(alignment: .top, spacing: LumenSpacing.md) {
            LumenSurface(tone: .muted, padding: .md) {
                LumenIcon(name: .sparkles, size: .lg, label: "Lumen")
            }
            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                FlowLayout {
                    LumenBadge("SwiftUI", tone: .accent)
                    LumenBadge("\(PlaygroundCatalog.componentNames.count) components", tone: .neutral)
                }
                LumenText("Component release workspace", variant: .title)
                LumenText(
                    "A production-shaped reference for Apple platform components and states.",
                    variant: .caption,
                    tone: .muted
                )
            }
        }
    }

    private var heroActions: some View {
        FlowLayout {
            LumenButton("Open examples") { openDestination(.examples) }
            LumenButton("Browse catalog", intent: .secondary) { openDestination(.components) }
        }
    }

    private var readinessCard: some View {
        PlaygroundSection(
            "Release readiness",
            description: "Workspace structure and deterministic launch behavior are available for review."
        ) {
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                HStack(alignment: .center, spacing: LumenSpacing.md) {
                    LumenGauge(
                        "Workspace readiness",
                        value: 100,
                        valueLabel: "100%",
                        systemName: "checkmark.seal",
                        tone: .success
                    )
                    .frame(maxWidth: 150)
                    VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                        readinessRow("Destinations", value: "4 of 4", tone: .success)
                        readinessRow("Product patterns", value: "3", tone: .accent)
                        readinessRow("Launch modes", value: "Standard · Filtered", tone: .neutral)
                    }
                }
                LumenProgress(value: 100, label: "Reference workspace coverage")
                LumenButton("Review release pattern", intent: .secondary) {
                    openDestination(.examples)
                }
            }
        }
    }

    private func readinessRow(
        _ label: LocalizedStringKey,
        value: LocalizedStringKey,
        tone: LumenBadgeTone
    ) -> some View {
        HStack {
            LumenText(label, variant: .caption, tone: .muted)
            Spacer()
            LumenBadge(value, tone: tone)
        }
    }

    private var categoryChart: some View {
        PlaygroundSection(
            "Catalog distribution",
            description: "Actual public playground entries grouped by product intent."
        ) {
            LumenBarChart(
                label: "Components by category",
                series: PlaygroundCatalog.categoryChartSeries,
                summary: "\(PlaygroundCatalog.componentNames.count) components across six product categories.",
                showData: false
            )
        }
    }

    private var featuredWorkflows: some View {
        PlaygroundSection(
            "Featured workflows",
            description: "Complete patterns demonstrate how primitives behave together."
        ) {
            VStack(spacing: LumenSpacing.sm) {
                workflowRow(
                    "Release readiness",
                    detail: "Validation, review progress, sync states, and approval",
                    systemName: "checkmark.seal"
                )
                LumenDivider()
                workflowRow(
                    "Catalog health",
                    detail: "Factual category metrics, trend context, and recovery",
                    systemName: "chart.xyaxis.line"
                )
                LumenDivider()
                workflowRow(
                    "Contributor profile",
                    detail: "Onboarding, preferences, save feedback, and reset",
                    systemName: "person.crop.circle"
                )
            }
        }
    }

    private func workflowRow(
        _ title: LocalizedStringKey,
        detail: LocalizedStringKey,
        systemName: String
    ) -> some View {
        LumenListRow {
            LumenIcon(systemName: systemName, label: title)
        } content: {
            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                LumenText(title, variant: .label)
                LumenText(detail, variant: .caption, tone: .muted)
            }
        } trailing: {
            LumenBadge("Example", tone: .accent)
        }
    }

    private var quickActions: some View {
        PlaygroundSection(
            "Quick actions",
            description: "Move directly to the reference area needed for the current review."
        ) {
            VStack(spacing: LumenSpacing.sm) {
                destinationRow(
                    "Explore product patterns",
                    detail: "Three interactive, composed flows",
                    systemName: "rectangle.stack",
                    destination: .examples
                )
                LumenDivider()
                destinationRow(
                    "Find a component",
                    detail: "Search or filter by category",
                    systemName: "square.grid.2x2",
                    destination: .components
                )
                LumenDivider()
                destinationRow(
                    "Review environment",
                    detail: "Theme, accessibility, platform, and privacy",
                    systemName: "gearshape",
                    destination: .settings
                )
            }
        }
    }

    private func destinationRow(
        _ title: LocalizedStringKey,
        detail: LocalizedStringKey,
        systemName: String,
        destination: PlaygroundDestination
    ) -> some View {
        LumenCard(variant: .muted, action: { openDestination(destination) }) {
            LumenListRow {
                LumenIcon(systemName: systemName, label: title)
            } content: {
                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    LumenText(title, variant: .label)
                    LumenText(detail, variant: .caption, tone: .muted)
                }
            } trailing: {
                LumenIcon(systemName: "chevron.right", label: "Open")
            }
        }
    }
}

#if os(macOS)
/// Desktop composition uses the public primitives and actual generated catalog counts.
struct PlaygroundMacHomeView: View {
    @Environment(\.lumenTheme) private var theme
    @State private var projectName = "My next great idea"
    @State private var notifications = true
    @State private var savedProject: String?

    let openDestination: (PlaygroundDestination) -> Void
    let openCategory: (PlaygroundComponentCategory) -> Void

    var body: some View {
        GeometryReader { geometry in
            LumenSurface(tone: .canvas, padding: .none, radius: .none) {
                ScrollView {
                    VStack(alignment: .leading, spacing: LumenSpacing.xl) {
                        hero(wide: geometry.size.width >= 850)
                        metrics(wide: geometry.size.width >= 850)
                        categoryGallery
                        if geometry.size.width >= 850 {
                            HStack(alignment: .top, spacing: LumenSpacing.lg) {
                                catalogChart.frame(maxWidth: .infinity)
                                compositionCard.frame(maxWidth: .infinity)
                            }
                        } else {
                            catalogChart
                            compositionCard
                        }
                        LumenStatusBar("Built with public LumenUI components", tone: .success) {
                            LumenText("Local, interactive previews", variant: .caption, tone: .muted)
                        }
                    }
                    .padding(LumenSpacing.xl)
                    .frame(maxWidth: 1280)
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }

    private func hero(wide: Bool) -> some View {
        LumenCard(padding: .none, radius: .lg) {
            LumenBackdrop(intensity: .subtle, variant: .aurora) {
                Group {
                    if wide {
                        HStack(alignment: .center, spacing: LumenSpacing.xl) {
                            heroCopy.frame(maxWidth: .infinity, alignment: .leading)
                            livePreview.frame(width: 330)
                        }
                    } else {
                        VStack(alignment: .leading, spacing: LumenSpacing.xl) {
                            heroCopy
                            livePreview
                        }
                    }
                }
                .padding(LumenSpacing.xl)
            }
        }
    }

    private var heroCopy: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.lg) {
            FlowLayout {
                LumenBadge("DESIGNED TO COMPOSE", tone: .accent)
                LumenBadge("SwiftUI · macOS", tone: .neutral)
            }
            LumenText("Small primitives.\nBig possibilities.", variant: .title)
                .accessibilityAddTraits(.isHeader)
            LumenText(
                "Build something that feels at home on the Mac. Explore the details, change the theme, and put the pieces together.",
                tone: .soft
            )
            FlowLayout {
                LumenButton("Explore components") { openCategory(.all) }
                LumenButton("Open examples", intent: .secondary) { openDestination(.examples) }
            }
            HStack(spacing: LumenSpacing.sm) {
                LumenIcon(systemName: "cursorarrow.click", size: .sm)
                LumenText("The preview is real. Give it a try.", variant: .caption, tone: .soft)
            }
        }
    }

    private var livePreview: some View {
        LumenCard(material: theme.appearance.material) {
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                HStack {
                    LumenSurface(tone: .muted, padding: .sm) {
                        LumenIcon(systemName: "square.stack.3d.up", size: .lg)
                    }
                    Spacer()
                    LumenBadge("Live preview", tone: .success)
                }
                LumenText("Make it yours", variant: .title)
                LumenText("A little workspace, built from Lumen.", variant: .caption, tone: .soft)
                LumenTextField("Project name", text: $projectName)
                    .onChange(of: projectName) { _ in savedProject = nil }
                LumenToggle(isOn: $notifications) {
                    Text("Project notifications")
                }
                LumenDivider()
                if let savedProject {
                    LumenToast("Project created", description: LocalizedStringKey(savedProject), variant: .success)
                }
                HStack {
                    LumenAvatar(fallback: "LM", size: .sm, label: "Workspace owner")
                    LumenText("Your workspace", variant: .caption, tone: .soft)
                    Spacer(minLength: LumenSpacing.xs)
                    LumenButton("Create", size: .sm) {
                        savedProject = projectName.trimmingCharacters(in: .whitespacesAndNewlines)
                    }
                    .disabled(projectName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private func metrics(wide: Bool) -> some View {
        LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: LumenSpacing.md), count: wide ? 4 : 2),
            spacing: LumenSpacing.md
        ) {
            metric("Public components", value: "\(PlaygroundCatalog.componentNames.count)", systemName: "square.grid.2x2")
            metric("Product categories", value: "\(PlaygroundCatalog.categories.count)", systemName: "square.stack")
            metric("Theme presets", value: "\(PlaygroundThemePreset.allCases.count)", systemName: "paintpalette")
            metric("Apple adapter", value: "SwiftUI", systemName: "macwindow")
        }
    }

    private func metric(_ label: LocalizedStringKey, value: String, systemName: String) -> some View {
        LumenStat(label, value: value, systemName: systemName)
    }

    private var categoryGallery: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    LumenText("Explore the building blocks", variant: .title)
                        .accessibilityAddTraits(.isHeader)
                    LumenText("Choose a category to open its live catalog.", variant: .caption, tone: .soft)
                }
                Spacer()
                LumenButton("View all", intent: .quiet, size: .sm) { openCategory(.all) }
            }
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 230), spacing: LumenSpacing.md)], spacing: LumenSpacing.md) {
                ForEach(PlaygroundComponentCategory.allCases.filter { $0 != .all }) { category in
                    categoryCard(category)
                }
            }
        }
    }

    private func categoryCard(_ category: PlaygroundComponentCategory) -> some View {
        LumenCard(padding: .md, radius: .lg, action: { openCategory(category) }) {
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                HStack {
                    LumenSurface(tone: .muted, padding: .sm) {
                        LumenIcon(systemName: category.showcaseSymbol, color: theme.colors.brand)
                    }
                    Spacer()
                    LumenBadge("\(PlaygroundCatalog.count(in: category))", tone: .neutral)
                }
                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    LumenText(LocalizedStringKey(category.title), variant: .label)
                    LumenText(category.showcaseDescription, variant: .caption, tone: .soft)
                        .fixedSize(horizontal: false, vertical: true)
                }
                HStack {
                    LumenText("Explore category", variant: .caption, tone: .soft)
                    Spacer()
                    LumenIcon(systemName: "arrow.up.right", size: .sm)
                }
            }
        }
        .accessibilityLabel("\(category.title), \(PlaygroundCatalog.count(in: category)) components")
        .accessibilityHint("Open this category in the component catalog")
    }

    private var catalogChart: some View {
        PlaygroundSection("A system with range", description: "Actual component counts from the shared catalog.") {
            LumenBarChart(
                label: "Components by category",
                series: PlaygroundCatalog.categoryChartSeries,
                summary: "\(PlaygroundCatalog.componentNames.count) components across \(PlaygroundCatalog.categories.count) categories.",
                showData: false
            )
        }
    }

    private var compositionCard: some View {
        LumenCard {
            VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                LumenGraphic(size: .md, tone: .accent, variant: .grid) {
                    LumenIcon(systemName: "rectangle.3.group", size: .lg)
                }
                LumenText("See the pieces work together", variant: .title)
                LumenText("Go beyond individual controls with interactive release, catalog, profile, and editable workspace examples.", tone: .soft)
                FlowLayout {
                    LumenBadge("Forms", tone: .neutral)
                    LumenBadge("Charts", tone: .accent)
                    LumenBadge("Real states", tone: .success)
                }
                LumenButton("Explore product flows", intent: .secondary) { openDestination(.examples) }
            }
        }
    }
}

private extension PlaygroundComponentCategory {
    var showcaseSymbol: String {
        switch self {
        case .all: "square.grid.2x2"
        case .foundations: "square.3.layers.3d"
        case .actions: "cursorarrow.click"
        case .forms: "slider.horizontal.3"
        case .feedback: "bell.badge"
        case .data: "chart.xyaxis.line"
        case .navigation: "sidebar.left"
        }
    }

    var showcaseDescription: LocalizedStringKey {
        switch self {
        case .all: "The complete component collection."
        case .foundations: "Tokens, surfaces, typography, and graphics."
        case .actions: "Buttons, commands, menus, and shortcuts."
        case .forms: "Thoughtful inputs for simple and complex data."
        case .feedback: "Clear progress, status, and recovery."
        case .data: "Charts, tables, and expressive visualizations."
        case .navigation: "Move between views without losing context."
        }
    }
}
#endif
