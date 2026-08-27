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

public extension LumenColorPalette {
    func overriding(
        canvas: Color? = nil,
        surface: Color? = nil,
        surfaceMuted: Color? = nil,
        surfaceStrong: Color? = nil,
        line: Color? = nil,
        ink: Color? = nil,
        inkSoft: Color? = nil,
        inkMuted: Color? = nil,
        brand: Color? = nil,
        brandSolid: Color? = nil,
        brandSoft: Color? = nil,
        onBrand: Color? = nil,
        accent: Color? = nil,
        success: Color? = nil,
        warning: Color? = nil,
        danger: Color? = nil,
        onDanger: Color? = nil
    ) -> LumenColorPalette {
        LumenColorPalette(
            canvas: canvas ?? self.canvas,
            surface: surface ?? self.surface,
            surfaceMuted: surfaceMuted ?? self.surfaceMuted,
            surfaceStrong: surfaceStrong ?? self.surfaceStrong,
            line: line ?? self.line,
            ink: ink ?? self.ink,
            inkSoft: inkSoft ?? self.inkSoft,
            inkMuted: inkMuted ?? self.inkMuted,
            brand: brand ?? self.brand,
            brandSolid: brandSolid ?? self.brandSolid,
            brandSoft: brandSoft ?? self.brandSoft,
            onBrand: onBrand ?? self.onBrand,
            accent: accent ?? self.accent,
            success: success ?? self.success,
            warning: warning ?? self.warning,
            danger: danger ?? self.danger,
            onDanger: onDanger ?? self.onDanger
        )
    }
}

extension LumenTheme {
    func resolvedPreferredColorScheme(enforceColorScheme: Bool) -> ColorScheme? {
        guard enforceColorScheme else { return nil }

        return scheme == .dark ? .dark : .light
    }
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
    @ViewBuilder
    func lumenTheme(
        _ theme: LumenTheme,
        enforceColorScheme: Bool = true,
        applyTint: Bool = true
    ) -> some View {
        if applyTint {
            environment(\.lumenTheme, theme)
                .tint(theme.colors.brandSolid)
                .preferredColorScheme(theme.resolvedPreferredColorScheme(enforceColorScheme: enforceColorScheme))
        } else {
            environment(\.lumenTheme, theme)
                .preferredColorScheme(theme.resolvedPreferredColorScheme(enforceColorScheme: enforceColorScheme))
        }
    }
}
