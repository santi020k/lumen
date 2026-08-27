import SwiftUI

/// The amount of space Lumen controls reserve for pointer or touch interaction.
public enum LumenControlDensity: Equatable, Sendable {
    /// Compact controls sized for pointer-first macOS interfaces.
    case compact
    /// Regular controls sized for touch-first and spatial interfaces.
    case regular

    public static var platformDefault: LumenControlDensity {
        #if os(macOS) || targetEnvironment(macCatalyst)
        .compact
        #else
        .regular
        #endif
    }
}

private struct LumenControlDensityKey: EnvironmentKey {
    static let defaultValue = LumenControlDensity.platformDefault
}

public extension EnvironmentValues {
    var lumenControlDensity: LumenControlDensity {
        get { self[LumenControlDensityKey.self] }
        set { self[LumenControlDensityKey.self] = newValue }
    }
}

public extension View {
    /// Overrides Lumen's automatic Apple-platform control density for this view hierarchy.
    func lumenControlDensity(_ density: LumenControlDensity) -> some View {
        environment(\.lumenControlDensity, density)
    }
}
