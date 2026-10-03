import SwiftUI

public enum LumenColorScheme: Sendable {
    case dark
    case light
}

public enum LumenSurfaceMaterial: Sendable {
    case solid
    case glass
}

public struct LumenAppearance: Sendable {
    public let radiusScale: CGFloat
    public let spacingScale: CGFloat
    public let borderWidth: CGFloat
    public let elevationScale: CGFloat
    public let material: LumenSurfaceMaterial

    public init(
        radiusScale: CGFloat = 1, spacingScale: CGFloat = 1,
        borderWidth: CGFloat = 1, elevationScale: CGFloat = 1,
        material: LumenSurfaceMaterial = .solid
    ) {
        precondition([radiusScale, spacingScale, borderWidth, elevationScale].allSatisfy { $0.isFinite && $0 >= 0 })
        self.radiusScale = radiusScale
        self.spacingScale = spacingScale
        self.borderWidth = borderWidth
        self.elevationScale = elevationScale
        self.material = material
    }
}

public struct LumenTextStyles: Sendable {
    public let body: Font
    public let caption: Font
    public let label: Font
    public let title: Font

    public init(
        body: Font = .body, caption: Font = .caption,
        label: Font = .callout.weight(.semibold), title: Font = .title2.weight(.bold)
    ) {
        self.body = body
        self.caption = caption
        self.label = label
        self.title = title
    }
}

public struct LumenTheme: Sendable {
    public let colors: LumenColorPalette
    public let scheme: LumenColorScheme
    public let appearance: LumenAppearance
    public let textStyles: LumenTextStyles

    public init(
        colors: LumenColorPalette, scheme: LumenColorScheme,
        appearance: LumenAppearance = LumenAppearance(),
        textStyles: LumenTextStyles = LumenTextStyles()
    ) {
        self.colors = colors
        self.scheme = scheme
        self.appearance = appearance
        self.textStyles = textStyles
    }

    public init(
        preset: LumenThemePreset, scheme: LumenColorScheme,
        appearance: LumenAppearance? = nil,
        textStyles: LumenTextStyles = LumenTextStyles()
    ) {
        self.init(colors: preset.colors(for: scheme), scheme: scheme,
                  appearance: appearance ?? preset.appearance, textStyles: textStyles)
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
    func lumenTheme(
        _ theme: LumenTheme,
        enforceColorScheme: Bool = true
    ) -> some View {
        lumenTheme(theme, enforceColorScheme: enforceColorScheme, applyTint: true)
    }

    @ViewBuilder
    func lumenTheme(
        _ theme: LumenTheme,
        enforceColorScheme: Bool = true,
        applyTint: Bool
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
