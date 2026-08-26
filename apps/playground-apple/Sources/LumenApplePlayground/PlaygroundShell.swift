import Foundation
import LumenUI
import SwiftUI

enum PlaygroundDestination: String, CaseIterable, Identifiable {
    case home
    case examples
    case components
    case settings

    var id: String { rawValue }

    var title: String {
        rawValue.capitalized
    }

    var systemName: String {
        switch self {
        case .home: "house"
        case .examples: "rectangle.stack"
        case .components: "square.grid.2x2"
        case .settings: "gearshape"
        }
    }
}

enum PlaygroundThemePreference: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }

    var title: String {
        rawValue.capitalized
    }
}

enum PlaygroundComponentCategory: String, CaseIterable, Identifiable {
    case all
    case foundations
    case actions
    case forms
    case feedback
    case content
    case navigation

    var id: String { rawValue }
    var title: String { rawValue.capitalized }

    func contains(_ component: String) -> Bool {
        self == .all || PlaygroundCatalog.category(for: component) == self
    }
}

enum PlaygroundCatalog {
    static let componentNames = [
        "Theme", "Text", "Surface", "Icon", "Icon button", "Button", "Button group", "Text field",
        "Textarea", "Field group", "Phone input", "Chip", "Badge", "Link",
        "Divider", "Spinner", "Card", "Alert", "Alert dialog", "Progress", "Skeleton", "Disclosure", "Avatar",
        "Toggle", "Settings row", "Checkbox", "Radio group", "Segmented control", "Tabs",
        "Picker", "Slider", "Date field", "Date range field", "Search field", "Empty state", "List row", "Banner", "Toast", "Stat", "Gauge",
        "Section header", "Status bar", "Graphic", "Backdrop", "Illustration", "Image", "Navigation bar",
        "Sparkline", "Line chart", "Bar chart", "Pie chart", "Scatter chart", "Heatmap", "Range chart", "Combo chart",
        "Sheet", "Menu", "Share button", "Tab bar minimization", "Tab accessory",
        "Shortcut recorder", "Symbol picker"
    ]

    static func count(in category: PlaygroundComponentCategory) -> Int {
        componentNames.filter(category.contains).count
    }

    static func category(for component: String) -> PlaygroundComponentCategory {
        switch component {
        case "Theme", "Text", "Surface", "Icon", "Graphic", "Backdrop", "Illustration", "Image":
            .foundations
        case "Icon button", "Button", "Button group", "Chip", "Link", "Menu", "Share button":
            .actions
        case "Text field", "Textarea", "Field group", "Phone input", "Toggle", "Settings row", "Checkbox", "Radio group",
             "Segmented control", "Tabs", "Picker", "Slider", "Date field", "Date range field", "Search field",
             "Shortcut recorder", "Symbol picker":
            .forms
        case "Badge", "Divider", "Spinner", "Alert", "Alert dialog", "Progress", "Skeleton", "Banner", "Toast":
            .feedback
        case "Card", "Disclosure", "Avatar", "Empty state", "List row", "Stat", "Gauge", "Section header",
             "Status bar", "Sparkline", "Line chart", "Bar chart", "Pie chart", "Scatter chart", "Heatmap",
             "Range chart", "Combo chart":
            .content
        case "Navigation bar", "Sheet", "Tab bar minimization", "Tab accessory":
            .navigation
        default:
            .content
        }
    }

    static var categoryChartSeries: [LumenChartSeries] {
        let categories = PlaygroundComponentCategory.allCases.filter { $0 != .all }
        return [
            LumenChartSeries(
                id: "components",
                label: "Components",
                data: categories.map { category in
                    LumenChartDatum(
                        id: category.rawValue,
                        x: .category(category.title),
                        y: Double(count(in: category))
                    )
                },
                tone: .brand,
                mark: .bar
            )
        ]
    }
}

struct PlaygroundLaunchConfiguration: Equatable {
    let componentFilter: String?
    let destination: PlaygroundDestination
    let forcesDarkAppearance: Bool

    init(arguments: [String]) {
        forcesDarkAppearance = arguments.contains("--dark")

        if let index = arguments.firstIndex(of: "--component"),
           arguments.indices.contains(index + 1) {
            componentFilter = arguments[index + 1]
        } else {
            componentFilter = nil
        }

        if let index = arguments.firstIndex(of: "--destination"),
           arguments.indices.contains(index + 1),
           let parsedDestination = PlaygroundDestination(rawValue: arguments[index + 1].lowercased()) {
            destination = parsedDestination
        } else {
            destination = .home
        }
    }
}

struct PlaygroundRootView: View {
    @Environment(\.colorScheme) private var colorScheme
    @State private var destination: PlaygroundDestination
    @State private var themePreference: PlaygroundThemePreference

    private let launchConfiguration: PlaygroundLaunchConfiguration

    init(arguments: [String] = ProcessInfo.processInfo.arguments) {
        let configuration = PlaygroundLaunchConfiguration(arguments: arguments)
        launchConfiguration = configuration
        _destination = State(initialValue: configuration.destination)
        _themePreference = State(initialValue: configuration.forcesDarkAppearance ? .dark : .system)
    }

    var body: some View {
        Group {
            if let componentFilter = launchConfiguration.componentFilter {
                ComponentsCatalogView(
                    themePreference: $themePreference,
                    componentFilter: componentFilter
                )
            } else {
                applicationShell
            }
        }
        .lumenTheme(activeTheme, enforceColorScheme: themePreference != .system)
    }

    @ViewBuilder
    private var applicationShell: some View {
        #if os(macOS)
        NavigationSplitView {
            List(PlaygroundDestination.allCases, selection: $destination) { item in
                Label(item.title, systemImage: item.systemName)
                    .tag(item)
            }
            .navigationTitle("Lumen Playground")
        } detail: {
            destinationView(destination)
        }
        #else
        TabView(selection: $destination) {
            ForEach(PlaygroundDestination.allCases) { item in
                destinationView(item)
                    .tabItem {
                        Label(item.title, systemImage: item.systemName)
                    }
                    .tag(item)
            }
        }
        #endif
    }

    @ViewBuilder
    private func destinationView(_ item: PlaygroundDestination) -> some View {
        switch item {
        case .home:
            PlaygroundHomeView(openDestination: { destination = $0 })
        case .examples:
            PlaygroundExamplesView()
        case .components:
            ComponentsCatalogView(themePreference: $themePreference)
        case .settings:
            PlaygroundSettingsView(themePreference: $themePreference)
        }
    }

    private var activeTheme: LumenTheme {
        switch themePreference {
        case .system:
            colorScheme == .dark ? .dark : .light
        case .light:
            .light
        case .dark:
            .dark
        }
    }
}

struct PlaygroundPage<Content: View>: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    private let content: Content
    private let subtitle: LocalizedStringKey
    private let title: LocalizedStringKey

    init(
        _ title: LocalizedStringKey,
        subtitle: LocalizedStringKey,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.subtitle = subtitle
        self.content = content()
    }

    var body: some View {
        LumenSurface(tone: .canvas, padding: .none, radius: .none) {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: LumenSpacing.md) {
                    VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                        LumenText(title, variant: .title)
                        LumenText(subtitle, tone: .soft)
                    }
                    content
                    LumenStatusBar("Built with LumenUI", tone: .success)
                }
                .frame(maxWidth: 1040)
                .padding(.horizontal, horizontalSizeClass == .compact ? LumenSpacing.lg : LumenSpacing.xl)
                .padding(.vertical, LumenSpacing.lg)
                .frame(maxWidth: .infinity)
            }
        }
    }
}

struct AdaptiveColumns<Primary: View, Secondary: View>: View {
    private let primary: Primary
    private let secondary: Secondary

    init(
        @ViewBuilder primary: () -> Primary,
        @ViewBuilder secondary: () -> Secondary
    ) {
        self.primary = primary()
        self.secondary = secondary()
    }

    var body: some View {
        ViewThatFits(in: .horizontal) {
            HStack(alignment: .top, spacing: LumenSpacing.md) {
                primary.frame(minWidth: 340, maxWidth: .infinity, alignment: .topLeading)
                secondary.frame(minWidth: 340, maxWidth: .infinity, alignment: .topLeading)
            }
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                primary
                secondary
            }
        }
    }
}
