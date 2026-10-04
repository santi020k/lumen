#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenTimeline<Content: View>: View {
    private let label: String
    private let content: Content

    public init(_ label: String, @ViewBuilder content: () -> Content) {
        self.label = label
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) { content }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(Text(label))
    }
}

public struct LumenTimelineItem<Content: View, Dot: View>: View {
    @Environment(\.lumenTheme) private var theme
    private let content: Content
    private let dot: Dot
    private let isLast: Bool

    public init(isLast: Bool = false, @ViewBuilder dot: () -> Dot, @ViewBuilder content: () -> Content) {
        self.isLast = isLast
        self.dot = dot()
        self.content = content()
    }

    public var body: some View {
        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.leading, 20 + LumenSpacing.md)
            .overlay(alignment: .topLeading) {
                GeometryReader { geometry in
                    if !isLast {
                        Path { path in
                            path.move(to: CGPoint(x: 10, y: 12))
                            path.addLine(to: CGPoint(x: 10, y: max(28, geometry.size.height)))
                        }.stroke(theme.colors.line, lineWidth: 1)
                    }
                    dot.foregroundStyle(theme.colors.brandSolid).frame(width: 20, height: 8)
                }
                .accessibilityHidden(true)
            }
    }
}

public extension LumenTimelineItem where Dot == Circle {
    init(isLast: Bool = false, @ViewBuilder content: () -> Content) {
        self.init(isLast: isLast, dot: { Circle() }, content: content)
    }
}
#endif
