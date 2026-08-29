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
    case santi020k

    var id: String { rawValue }

    var title: String {
        switch self {
        case .lumen: "Lumen"
        case .santi020k: "santi020k"
        }
    }

    func theme(for scheme: LumenColorScheme) -> LumenTheme {
        switch (self, scheme) {
        case (.lumen, .light):
            .light
        case (.lumen, .dark):
            .dark
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
            PlaygroundHomeView(openDestination: { destination = $0 })
        case .examples:
            PlaygroundExamplesView()
        case .components:
            ComponentsCatalogView(themePreference: $themePreference)
        case .settings:
            PlaygroundSettingsView(themePreference: $themePreference, themePreset: $themePreset)
        }
    }

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
