import SwiftUI

struct LumenSurfaceBackground: ViewModifier {
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @Environment(\.colorSchemeContrast) private var contrast
    let color: Color
    let material: LumenSurfaceMaterial

    @ViewBuilder
    func body(content: Content) -> some View {
        if #available(watchOS 10, *), material == .glass && !reduceTransparency && contrast != .increased {
            content.background(.regularMaterial)
        } else {
            content.background(color)
        }
    }
}
