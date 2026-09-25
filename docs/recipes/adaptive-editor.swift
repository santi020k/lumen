import LumenUI
import SwiftUI

/// Consumer-owned composition. Editing, export, and draft state remain in the application.
struct AdaptiveEditorWorkspace<Preview: View, Controls: View, Actions: View>: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @ViewBuilder let preview: () -> Preview
    @ViewBuilder let controls: () -> Controls
    @ViewBuilder let actions: () -> Actions

    var body: some View {
        LumenSurface(tone: .canvas, padding: .none, radius: .none) {
            GeometryReader { geometry in
                let usesInspector = geometry.size.width >= 700
                    && geometry.size.width > geometry.size.height
                    && !dynamicTypeSize.isAccessibilitySize
                if usesInspector {
                    HStack(spacing: 0) {
                        preview().frame(maxWidth: .infinity, maxHeight: .infinity)
                        Divider()
                        ScrollView { controls().padding() }
                            .frame(width: min(420, geometry.size.width * 0.38))
                    }
                } else {
                    VStack(spacing: 0) {
                        preview().frame(maxWidth: .infinity, maxHeight: .infinity)
                        Divider()
                        ScrollView { controls().padding() }
                            .frame(height: geometry.size.height * (dynamicTypeSize.isAccessibilitySize ? 0.65 : 0.45))
                    }
                }
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            LumenSurface(tone: .surface, padding: .sm, radius: .none) {
                ViewThatFits(in: .horizontal) {
                    HStack { actions() }
                    VStack { actions() }
                }
            }
        }
    }
}
