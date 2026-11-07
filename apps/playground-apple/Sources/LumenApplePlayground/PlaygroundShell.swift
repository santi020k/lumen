import Foundation
import LumenUI
import SwiftUI
#if os(macOS)
import AppKit
#endif

let playgroundBottomScrollClearance: CGFloat = {
    #if os(iOS)
    LumenSpacing.size3xl
    #else
    0
    #endif
}()

let playgroundPageMaximumWidth: CGFloat = {
    #if os(macOS)
    1280
    #else
    1040
    #endif
}()

enum PlaygroundDestination: String, CaseIterable, Identifiable {
    case home
    case examples
    case components
    case settings

    var id: String { rawValue }

    var title: String {
        rawValue.capitalized
    }

    var sidebarDetail: LocalizedStringKey {
        switch self {
        case .home: "The system at a glance"
        case .examples: "Composed product flows"
        case .components: "Every primitive, live"
        case .settings: "Make it your own"
        }
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

    func resolvedScheme(systemScheme: ColorScheme) -> LumenColorScheme {
        switch self {
        case .system: systemScheme == .dark ? .dark : .light
        case .light: .light
        case .dark: .dark
        }
    }
}

enum PlaygroundThemePreset: String, CaseIterable, Identifiable {
    case lumen
    case studio
    case glass
    case santi020k
    case paper
    case field

    var id: String { rawValue }

    var title: String {
        switch self {
        case .lumen: "Normal"
        case .santi020k: rawValue
        default: rawValue.capitalized
        }
    }

    func theme(for scheme: LumenColorScheme) -> LumenTheme {
        switch self {
        case .lumen: scheme == .dark ? .dark : .light
        case .studio: LumenTheme(preset: .studio, scheme: scheme)
        case .glass: LumenTheme(preset: .glass, scheme: scheme)
        case .santi020k: LumenTheme(.santi020k, scheme: scheme)
        case .paper: LumenTheme(.paper, scheme: scheme)
        case .field: LumenTheme(.field, scheme: scheme)
        }
    }
}

struct PlaygroundLaunchConfiguration: Equatable {
    let componentFilter: String?
    let destination: PlaygroundDestination
    let themePreset: PlaygroundThemePreset
    let forcesDarkAppearance: Bool

    init(arguments: [String]) {
        forcesDarkAppearance = arguments.contains("--dark")
        let preset = arguments.firstIndex(of: "--theme").flatMap { arguments.dropFirst($0 + 1).first }
        themePreset = preset.flatMap { PlaygroundThemePreset(rawValue: $0.lowercased()) } ?? .lumen

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
    #if os(macOS)
    @State private var systemColorScheme = PlaygroundMacAppearance.scheme(for: NSApplication.shared.effectiveAppearance)
    #else
    @Environment(\.colorScheme) private var colorScheme
    #endif
    @State private var destination: PlaygroundDestination
    @State private var themePreference: PlaygroundThemePreference
    @State private var themePreset = PlaygroundThemePreset.lumen
    @State private var catalogCategory = PlaygroundComponentCategory.all

    private let launchConfiguration: PlaygroundLaunchConfiguration

    init(arguments: [String] = ProcessInfo.processInfo.arguments) {
        let configuration = PlaygroundLaunchConfiguration(arguments: arguments)
        launchConfiguration = configuration
        _destination = State(initialValue: configuration.destination)
        _themePreset = State(initialValue: configuration.themePreset)
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
        // On Mac, resolve System independently of the window preference. Clearing the
        // preference to nil can leave the window environment on its previous scheme.
        .lumenTheme(activeTheme, enforceColorScheme: enforcesWindowAppearance)
        #if os(macOS)
        .onReceive(NSApplication.shared.publisher(for: \.effectiveAppearance)) { appearance in
            systemColorScheme = PlaygroundMacAppearance.scheme(for: appearance)
        }
        #endif
    }

    @ViewBuilder
    private var applicationShell: some View {
        #if os(macOS)
        NavigationSplitView {
            macSidebar
                .navigationSplitViewColumnWidth(min: 220, ideal: 240, max: 280)
        } detail: {
            destinationView(destination)
                .navigationTitle(destination.title)
                .toolbar {
                    ToolbarItemGroup(placement: .automatic) {
                        LumenPicker(selection: $themePreset, style: .menu) {
                            Text("Theme")
                        } currentValueLabel: {
                            Text(themePreset.title)
                        } content: {
                            ForEach(PlaygroundThemePreset.allCases) { preset in
                                Text(preset.title).tag(preset)
                            }
                        }
                        .frame(width: 150)
                        .accessibilityLabel("Theme")
                        .help("Choose the playground theme")
                        LumenPicker(selection: $themePreference, style: .menu) {
                            Text("Appearance")
                        } currentValueLabel: {
                            Text(themePreference.title)
                        } content: {
                            ForEach(PlaygroundThemePreference.allCases) { preference in
                                Text(preference.title).tag(preference)
                            }
                        }
                        .frame(width: 155)
                        .accessibilityLabel("Appearance")
                        .help("Choose light, dark, or system appearance")
                    }
                }
        }
        .navigationSplitViewStyle(.balanced)
        .focusedSceneValue(\.playgroundDestination, $destination)
        #else
        TabView(selection: $destination) {
            ForEach(PlaygroundDestination.allCases) { item in
                destinationView(item)
                    .background(activeTheme.colors.canvas.ignoresSafeArea())
                    .ignoresSafeArea(.container, edges: .bottom)
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
            #if os(macOS)
            PlaygroundMacHomeView(
                openDestination: { destination = $0 },
                openCategory: { category in
                    catalogCategory = category
                    destination = .components
                }
            )
            #else
            PlaygroundHomeView(openDestination: { destination = $0 })
            #endif
        case .examples:
            PlaygroundExamplesView()
        case .components:
            ComponentsCatalogView(themePreference: $themePreference, initialCategory: catalogCategory)
                .id(catalogCategory)
        case .settings:
            PlaygroundSettingsView(themePreference: $themePreference, themePreset: $themePreset)
        }
    }

    #if os(macOS)
    private var macSidebar: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: LumenSpacing.sm) {
                LumenSurface(tone: .surface, padding: .sm) {
                    LumenIcon(name: .sparkles, size: .lg)
                }
                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    LumenText("Lumen UI", variant: .title)
                    LumenText("APPLE PLAYGROUND", variant: .caption, tone: .muted)
                }
            }
            .padding(LumenSpacing.lg)

            List(selection: $destination) {
                Section("Explore") {
                    ForEach(PlaygroundDestination.allCases) { item in
                        HStack(spacing: LumenSpacing.sm) {
                            LumenIcon(systemName: item.systemName, size: .sm)
                                .frame(width: 20)
                            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                                LumenText(LocalizedStringKey(item.title), variant: .label)
                                LumenText(item.sidebarDetail, variant: .caption, tone: .soft)
                            }
                            .padding(.vertical, LumenSpacing.xs)
                        }
                        .tag(item)
                    }
                }
            }
            .listStyle(.sidebar)

            LumenCard(variant: .muted, padding: .md, radius: .lg) {
                VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                    LumenBadge("Lumen \(PlaygroundCatalog.lumenVersion)", tone: .accent)
                    LumenText("One system. Native possibilities.", variant: .label)
                    LumenText("Explore real controls, charts, and complete product flows.", variant: .caption, tone: .soft)
                }
            }
            .padding(.horizontal, LumenSpacing.md)
            .padding(.bottom, LumenSpacing.md)

            if let authorURL = URL(string: "https://santi020k.com") {
                LumenLink("Made by santi020k", destination: authorURL, showsExternalIndicator: true)
                    .font(.caption)
                    .padding(.horizontal, LumenSpacing.lg)
                    .padding(.bottom, LumenSpacing.lg)
            }
        }
        .background(activeTheme.colors.surfaceMuted)
    }
    #endif

    private var enforcesWindowAppearance: Bool {
        #if os(macOS)
        true
        #else
        themePreference != .system
        #endif
    }

    private var activeTheme: LumenTheme {
        #if os(macOS)
        themePreset.theme(for: themePreference.resolvedScheme(systemScheme: systemColorScheme))
        #else
        themePreset.theme(for: themePreference.resolvedScheme(systemScheme: colorScheme))
        #endif
    }
}

#if os(macOS)
enum PlaygroundMacAppearance {
    static func scheme(for appearance: NSAppearance) -> ColorScheme {
        appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua ? .dark : .light
    }
}
#endif

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
                    #if os(macOS)
                    PlaygroundPageHeading(title, subtitle: subtitle)
                    #else
                    VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                        LumenText(title, variant: .title)
                        LumenText(subtitle, tone: .soft)
                    }
                    #endif
                    content
                    LumenStatusBar("Built with LumenUI", tone: .success)
                }
                .frame(maxWidth: playgroundPageMaximumWidth)
                .padding(.horizontal, horizontalSizeClass == .compact ? LumenSpacing.lg : LumenSpacing.xl)
                .padding(.vertical, LumenSpacing.lg)
                .padding(.bottom, playgroundBottomScrollClearance)
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
        #if os(macOS)
        PlaygroundColumnLayout {
            primary
            secondary
        }
        #else
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
        #endif
    }
}

#if os(macOS)
/// Measure wrapped content at its column width instead of testing its unwrapped ideal width.
private struct PlaygroundColumnLayout: Layout {
    private let gap = LumenSpacing.md
    private let minimumColumnWidth: CGFloat = 360

    private func columnWidth(for width: CGFloat) -> CGFloat {
        width >= minimumColumnWidth * 2 + gap ? (width - gap) / 2 : width
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? minimumColumnWidth
        let column = columnWidth(for: width)
        let heights = subviews.map { $0.sizeThatFits(ProposedViewSize(width: column, height: nil)).height }
        let height = column < width
            ? heights.max() ?? 0
            : heights.reduce(0, +) + gap * CGFloat(max(0, heights.count - 1))
        return CGSize(width: width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let column = columnWidth(for: bounds.width)
        var origin = bounds.origin
        for child in subviews {
            let size = child.sizeThatFits(ProposedViewSize(width: column, height: nil))
            child.place(at: origin, anchor: .topLeading, proposal: ProposedViewSize(width: column, height: size.height))
            if column < bounds.width {
                origin.x += column + gap
            } else {
                origin.y += size.height + gap
            }
        }
    }
}
#endif

/// Search accepts displayed labels and copyable component IDs such as `date-range-field`.
enum PlaygroundComponentSearch {
    static func normalized(_ value: String) -> String {
        String(value.lowercased().filter { !$0.isWhitespace && $0 != "-" && $0 != "_" })
    }

    static func matches(_ name: String, query: String, exact: Bool = false) -> Bool {
        let needle = normalized(query)
        let label = normalized(name)
        return needle.isEmpty || (exact ? label == needle : label.contains(needle))
    }
}

#if os(macOS)
/// Shared desktop introduction keeps secondary destinations in the home's visual language.
struct PlaygroundPageHeading: View {
    let title: LocalizedStringKey
    let subtitle: LocalizedStringKey

    init(_ title: LocalizedStringKey, subtitle: LocalizedStringKey) {
        self.title = title
        self.subtitle = subtitle
    }

    var body: some View {
        LumenCard(padding: .none, radius: .lg) {
            LumenBackdrop(intensity: .subtle, variant: .aurora) {
                VStack(alignment: .leading, spacing: LumenSpacing.md) {
                    FlowLayout {
                        LumenBadge("APPLE PLAYGROUND", tone: .accent)
                        LumenBadge("SwiftUI · macOS", tone: .neutral)
                    }
                    LumenText(title, variant: .title)
                        .accessibilityAddTraits(.isHeader)
                    LumenText(subtitle, tone: .soft)
                        .frame(maxWidth: 640, alignment: .leading)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(LumenSpacing.xl)
            }
        }
    }
}
#endif
