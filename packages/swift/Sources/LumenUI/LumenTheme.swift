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
    private(set) var named: LumenNamedTheme? = nil
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

    /// Resolve both the semantic palette and the named theme's component appearance.
    public init(_ definition: LumenNamedTheme, scheme: LumenColorScheme, textStyles: LumenTextStyles? = nil) {
        let title: Font = definition.serifHeadings
            ? .system(.title2, design: .serif, weight: .bold) : .title2.weight(.bold)
        self.init(colors: scheme == .dark ? definition.dark : definition.light, scheme: scheme,
                  textStyles: textStyles ?? LumenTextStyles(title: title))
        self.named = definition
    }

    func increasingContrast() -> LumenTheme {
        guard named != nil else { return self }
        var theme = LumenTheme(colors: colors.overriding(line: colors.inkSoft, inkMuted: colors.ink),
                               scheme: scheme, appearance: appearance, textStyles: textStyles)
        theme.named = named
        return theme
    }

    var linkForeground: Color { named == nil ? colors.brandSolid : colors.brand }
    var actionFill: Color { named?.inkActions == true ? colors.ink : colors.brandSolid }
    var actionForeground: Color { named?.inkActions == true ? colors.surface : colors.onBrand }
    var successForeground: Color {
        (scheme == .dark ? named?.darkOnSuccess : named?.lightOnSuccess) ?? colors.onBrand
    }
    func statusText(_ status: Color) -> Color {
        (scheme == .dark ? named?.darkStatusText : named?.lightStatusText) ?? status
    }
    var controlRadius: CGFloat { named?.radii?.sm ?? LumenRadius.sm }

    func surfaceRadius(_ radius: LumenSurfaceRadius) -> CGFloat {
        if let radii = named?.radii {
            switch radius {
            case .sm: return radii.sm
            case .md: return radii.md
            case .lg: return radii.lg
            default: break
            }
        }
        return radius.value * appearance.radiusScale
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
    static let defaultValue: LumenTheme? = nil
}

public extension EnvironmentValues {
    var lumenTheme: LumenTheme {
        get { self[LumenThemeKey.self] ?? .light }
        set { self[LumenThemeKey.self] = newValue }
    }
}

private struct LumenThemeEnvironment: ViewModifier {
    @Environment(\.colorSchemeContrast) private var contrast
    let theme: LumenTheme

    func body(content: Content) -> some View {
        content.environment(\.lumenTheme, contrast == .increased ? theme.increasingContrast() : theme)
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
        let preferredScheme = theme.resolvedPreferredColorScheme(enforceColorScheme: enforceColorScheme)
        // Emit the optional window preference from a background child so changing enforcement
        // does not move application content between conditional branches and reset its state.
        let themed = modifier(LumenThemeEnvironment(theme: theme)).background {
            if let preferredScheme {
                Color.clear.preferredColorScheme(preferredScheme)
            }
        }

        if applyTint {
            themed.tint(theme.linkForeground)
        } else {
            themed
        }
    }
}

/// Small, medium and large corners in native points. Layout and hit targets are independent.
public struct LumenThemeRadii: Sendable {
    let sm, md, lg: CGFloat

    public init(sm: CGFloat, md: CGFloat, lg: CGFloat) {
        precondition([sm, md, lg].allSatisfy { $0.isFinite && $0 >= 0 })
        self.sm = sm
        self.md = md
        self.lg = lg
    }
}

/// A reusable pair of palettes with optional component treatments.
public struct LumenNamedTheme: Sendable {
    let light, dark: LumenColorPalette
    let radii: LumenThemeRadii?
    let serifHeadings, inkActions: Bool
    let lightChartBrand, darkChartBrand: Color?
    let lightOnSuccess, darkOnSuccess: Color?
    let lightStatusText, darkStatusText: Color?

    public init(
        light: LumenColorPalette, dark: LumenColorPalette, radii: LumenThemeRadii? = nil,
        serifHeadings: Bool = false, inkActions: Bool = false,
        lightChartBrand: Color? = nil, darkChartBrand: Color? = nil,
        lightOnSuccess: Color? = nil, darkOnSuccess: Color? = nil,
        lightStatusText: Color? = nil, darkStatusText: Color? = nil
    ) {
        self.light = light
        self.dark = dark
        self.radii = radii
        self.serifHeadings = serifHeadings
        self.inkActions = inkActions
        self.lightChartBrand = lightChartBrand
        self.darkChartBrand = darkChartBrand
        self.lightOnSuccess = lightOnSuccess
        self.darkOnSuccess = darkOnSuccess
        self.lightStatusText = lightStatusText
        self.darkStatusText = darkStatusText
    }

    /// Derive an app theme from a named appearance while retaining its shape, title and action treatments.
    public func overridingColors(_ transform: (LumenColorPalette, LumenColorScheme) -> LumenColorPalette) -> Self {
        Self(light: transform(light, .light), dark: transform(dark, .dark), radii: radii,
             serifHeadings: serifHeadings, inkActions: inkActions,
             lightChartBrand: lightChartBrand, darkChartBrand: darkChartBrand,
             lightOnSuccess: lightOnSuccess, darkOnSuccess: darkOnSuccess,
             lightStatusText: lightStatusText, darkStatusText: darkStatusText)
    }
}

private struct LumenScopedSchemeKey: EnvironmentKey {
    static let defaultValue: ColorScheme? = nil
}

extension EnvironmentValues {
    var lumenScopedScheme: ColorScheme? {
        get { self[LumenScopedSchemeKey.self] }
        set { self[LumenScopedSchemeKey.self] = newValue }
    }

    fileprivate var installedLumenTheme: LumenTheme? { self[LumenThemeKey.self] }
}

private struct LumenThemeScope: ViewModifier {
    @Environment(\.colorScheme) private var systemScheme
    @Environment(\.installedLumenTheme) private var parent
    let definition: LumenNamedTheme
    let scheme: LumenColorScheme?
    let applyTint: Bool

    func body(content: Content) -> some View {
        let resolved = scheme ?? parent?.scheme ?? (systemScheme == .dark ? .dark : .light)
        let localScheme: ColorScheme = resolved == .dark ? .dark : .light
        content
            .lumenTheme(LumenTheme(definition, scheme: resolved), enforceColorScheme: false, applyTint: applyTint)
            .environment(\.colorScheme, localScheme)
            .environment(\.lumenScopedScheme, localScheme)
    }
}

public extension View {
    /// Theme a subtree using its nearest Lumen scheme, or the system at an application root.
    /// A pinned scheme applies to controls and presentations inside this scope.
    func lumenThemeScope(_ definition: LumenNamedTheme, scheme: LumenColorScheme? = nil,
                         applyTint: Bool = true) -> some View {
        modifier(LumenThemeScope(definition: definition, scheme: scheme, applyTint: applyTint))
    }
}
