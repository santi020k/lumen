import Foundation
import LumenUI
import SwiftUI

let playgroundBottomScrollClearance: CGFloat = {
    #if os(iOS)
    LumenSpacing.size3xl
    #else
    0
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
}

enum PlaygroundThemePreset: String, CaseIterable, Identifiable {
    case lumen
    case studio
    case glass
    case santi020k

    var id: String { rawValue }

    var title: String {
        switch self {
        case .lumen: "Normal"
        case .studio: "Studio"
        case .glass: "Glass"
        case .santi020k: "santi020k"
        }
    }

    func theme(for scheme: LumenColorScheme) -> LumenTheme {
        switch (self, scheme) {
        case (.lumen, .light):
            .light
        case (.lumen, .dark):
            .dark
        case (.studio, _):
            LumenTheme(preset: .studio, scheme: scheme)
        case (.glass, _):
            LumenTheme(preset: .glass, scheme: scheme)
        case (.santi020k, .light):
            LumenTheme(colors: Self.santi020kLight, scheme: .light)
        case (.santi020k, .dark):
            LumenTheme(colors: Self.santi020kDark, scheme: .dark)
        }
    }

    private static let santi020kLight = palette(
        canvas: 0xFAF9FB, surface: 0xFFFFFF, surfaceMuted: 0xF5F3F7,
        surfaceStrong: 0xE5E2E9, line: 0xD6D0DC, ink: 0x332E38,
        inkSoft: 0x5B5463, inkMuted: 0x47434C, brand: 0x620AE6,
        brandSolid: 0x5709CE, brandSoft: 0xEEE7F9, accent: 0x7D29FA,
        success: 0x16A249, warning: 0xF59F0A, danger: 0xEF4343,
        onDanger: 0x000000
    )

    private static let santi020kDark = palette(
        canvas: 0x110C1D, surface: 0x1C1528, surfaceMuted: 0x231D30,
        surfaceStrong: 0x322B40, line: 0x494158, ink: 0xDFDDE3,
        inkSoft: 0xB6B2BD, inkMuted: 0x8D8896, brand: 0xA56EF7,
        brandSolid: 0x6F16F3, brandSoft: 0x2A1943, accent: 0x9F64F7,
        success: 0x21C45D, warning: 0xF6A823, danger: 0xF15B5B,
        onDanger: 0x110C1D
    )

    private static func palette(
        canvas: UInt32, surface: UInt32, surfaceMuted: UInt32, surfaceStrong: UInt32,
        line: UInt32, ink: UInt32, inkSoft: UInt32, inkMuted: UInt32,
        brand: UInt32, brandSolid: UInt32, brandSoft: UInt32, accent: UInt32,
        success: UInt32, warning: UInt32, danger: UInt32, onDanger: UInt32
    ) -> LumenColorPalette {
        LumenColorPalette(
            canvas: color(canvas), surface: color(surface), surfaceMuted: color(surfaceMuted),
            surfaceStrong: color(surfaceStrong), line: color(line), ink: color(ink),
            inkSoft: color(inkSoft), inkMuted: color(inkMuted), brand: color(brand),
            brandSolid: color(brandSolid), brandSoft: color(brandSoft), onBrand: .white,
            accent: color(accent), success: color(success), warning: color(warning),
            danger: color(danger), onDanger: color(onDanger)
        )
    }

    private static func color(_ value: UInt32) -> Color {
        Color(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
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
    @State private var themePreset = PlaygroundThemePreset.lumen
    @State private var catalogCategory = PlaygroundComponentCategory.all

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
        .tint(activeTheme.colors.brandSolid)
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

    private var activeTheme: LumenTheme {
        let scheme: LumenColorScheme = switch themePreference {
        case .system:
            colorScheme == .dark ? .dark : .light
        case .light:
            .light
        case .dark:
            .dark
        }
        return themePreset.theme(for: scheme)
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
