import SwiftUI

public enum LumenColorScheme: Sendable {
    case dark
    case light
}

public struct LumenTheme: Sendable {
    public let colors: LumenColorPalette
    public let scheme: LumenColorScheme

    public init(colors: LumenColorPalette, scheme: LumenColorScheme) {
        self.colors = colors
        self.scheme = scheme
    }

    public static let light = LumenTheme(colors: LumenColors.light, scheme: .light)
    public static let dark = LumenTheme(colors: LumenColors.dark, scheme: .dark)
}

private struct LumenThemeKey: EnvironmentKey {
    static let defaultValue = LumenTheme.light
}

public extension EnvironmentValues {
    var lumenTheme: LumenTheme {
        get { self[LumenThemeKey.self] }
        set { self[LumenThemeKey.self] = newValue }
    }
}

public extension View {
    func lumenTheme(_ theme: LumenTheme) -> some View {
        environment(\.lumenTheme, theme)
            .preferredColorScheme(theme.scheme == .dark ? .dark : .light)
    }
}
