#if os(iOS) || os(macOS)
import SwiftUI

public enum LumenSkeletonShape: Sendable {
    case circle
    case rectangle
    case text
}

public struct LumenSkeleton: View {
    @Environment(\.lumenTheme) private var theme

    private let height: CGFloat
    private let label: String?
    private let shape: LumenSkeletonShape
    private let width: CGFloat?

    public init(
        width: CGFloat? = nil,
        height: CGFloat = 16,
        shape: LumenSkeletonShape = .text,
        label: String? = nil
    ) {
        self.width = width
        self.height = height.isFinite && height > 0 ? height : 16
        self.shape = shape
        self.label = label
    }

    public var body: some View {
        skeletonShape
            .foregroundStyle(theme.colors.surfaceStrong.opacity(0.72))
            .frame(maxWidth: fillsAvailableWidth ? .infinity : nil, alignment: .leading)
            .frame(width: resolvedWidth, height: height)
            .accessibilityElement(children: .ignore)
            .accessibilityHidden(label == nil)
            .accessibilityLabel(Text(label ?? ""))
            .accessibilityValue(Text(label == nil ? "" : "Loading"))
    }

    private var fillsAvailableWidth: Bool {
        width == nil && shape != .circle
    }

    private var resolvedWidth: CGFloat? {
        shape == .circle ? height : width
    }

    @ViewBuilder
    private var skeletonShape: some View {
        switch shape {
        case .circle:
            Circle()
        case .rectangle:
            RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous)
        case .text:
            RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous)
        }
    }
}

public enum LumenGraphicSize: Sendable {
    case lg
    case md
    case sm

    var dimension: CGFloat {
        switch self {
        case .lg: LumenGraphics.lgFrameSize
        case .md: LumenGraphics.mdFrameSize
        case .sm: LumenGraphics.smFrameSize
        }
    }
}

public enum LumenGraphicTone: Sendable {
    case accent
    case brand
    case neutral
}

public enum LumenGraphicVariant: Sendable {
    case glow
    case grid
    case orbit
}

public struct LumenGraphic<Content: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let content: Content
    private let label: String?
    private let size: LumenGraphicSize
    private let tone: LumenGraphicTone
    private let variant: LumenGraphicVariant

    public init(
        label: String? = nil,
        size: LumenGraphicSize = .md,
        tone: LumenGraphicTone = .brand,
        variant: LumenGraphicVariant = .orbit,
        @ViewBuilder content: () -> Content
    ) {
        self.label = label
        self.size = size
        self.tone = tone
        self.variant = variant
        self.content = content()
    }

    public var body: some View {
        ZStack {
            graphicLayer
            content
        }
        .frame(width: size.dimension, height: size.dimension)
        .clipped()
        .accessibilityElement(children: label == nil ? .ignore : .combine)
        .accessibilityHidden(label == nil)
        .accessibilityLabel(Text(label ?? ""))
    }

    private var color: Color {
        switch tone {
        case .accent: theme.colors.accent
        case .brand: theme.colors.brand
        case .neutral: theme.colors.inkMuted
        }
    }

    @ViewBuilder
    private var graphicLayer: some View {
        switch variant {
        case .glow:
            Circle()
                .fill(
                    RadialGradient(
                        colors: [color.opacity(0.3), color.opacity(0)],
                        center: .center,
                        startRadius: 0,
                        endRadius: size.dimension * 0.42
                    )
                )
                .padding(size.dimension * 0.08)
        case .grid:
            Canvas { context, canvasSize in
                var path = Path()
                for index in 0...6 {
                    let position = CGFloat(index) * canvasSize.width / 6
                    path.move(to: CGPoint(x: position, y: 0))
                    path.addLine(to: CGPoint(x: position, y: canvasSize.height))
                    path.move(to: CGPoint(x: 0, y: position))
                    path.addLine(to: CGPoint(x: canvasSize.width, y: position))
                }
                context.stroke(path, with: .color(color.opacity(0.18)), lineWidth: 1)
            }
            .padding(size.dimension * 0.12)
        case .orbit:
            Canvas { context, canvasSize in
                let bounds = CGRect(origin: .zero, size: canvasSize)
                for ratio in [0.9, 0.62, 0.34] {
                    let inset = canvasSize.width * (1 - ratio) / 2
                    context.stroke(
                        Path(ellipseIn: bounds.insetBy(dx: inset, dy: inset)),
                        with: .color(color.opacity(0.24)),
                        lineWidth: 1
                    )
                }
                var axes = Path()
                axes.move(to: CGPoint(x: canvasSize.width * 0.14, y: canvasSize.height / 2))
                axes.addLine(to: CGPoint(x: canvasSize.width * 0.86, y: canvasSize.height / 2))
                axes.move(to: CGPoint(x: canvasSize.width / 2, y: canvasSize.height * 0.14))
                axes.addLine(to: CGPoint(x: canvasSize.width / 2, y: canvasSize.height * 0.86))
                context.stroke(axes, with: .color(color.opacity(0.18)), lineWidth: 1)
            }
        }
    }
}

public enum LumenBackdropIntensity: Sendable {
    case medium
    case strong
    case subtle

    var opacity: Double {
        switch self {
        case .medium: 0.68
        case .strong: 1
        case .subtle: 0.4
        }
    }
}

public enum LumenBackdropTone: Sendable {
    case accent
    case brand
    case neutral
}

public enum LumenBackdropVariant: Sendable {
    case aurora
    case dots
    case grid
    case rays
}

public struct LumenBackdrop<Content: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let content: Content
    private let intensity: LumenBackdropIntensity
    private let tone: LumenBackdropTone
    private let variant: LumenBackdropVariant

    public init(
        intensity: LumenBackdropIntensity = .medium,
        tone: LumenBackdropTone = .brand,
        variant: LumenBackdropVariant = .aurora,
        @ViewBuilder content: () -> Content
    ) {
        self.intensity = intensity
        self.tone = tone
        self.variant = variant
        self.content = content()
    }

    public var body: some View {
        ZStack {
            backdropLayer
                .opacity(intensity.opacity)
                .accessibilityHidden(true)
            content
        }
        .clipped()
    }

    private var color: Color {
        switch tone {
        case .accent: theme.colors.accent
        case .brand: theme.colors.brand
        case .neutral: theme.colors.inkMuted
        }
    }

    private var secondaryColor: Color {
        tone == .neutral ? theme.colors.surfaceStrong : theme.colors.accent
    }

    @ViewBuilder
    private var backdropLayer: some View {
        switch variant {
        case .aurora:
            GeometryReader { proxy in
                Circle()
                    .fill(color.opacity(0.22))
                    .frame(width: proxy.size.width * 0.72)
                    .offset(x: -proxy.size.width * 0.2, y: -proxy.size.height * 0.46)
                Circle()
                    .fill(secondaryColor.opacity(0.18))
                    .frame(width: proxy.size.width * 0.62)
                    .offset(x: proxy.size.width * 0.58, y: proxy.size.height * 0.44)
            }
        case .dots:
            Canvas { context, canvasSize in
                for row in 0..<6 {
                    for column in 0..<8 {
                        let point = CGPoint(
                            x: (CGFloat(column) + 0.5) * canvasSize.width / 8,
                            y: (CGFloat(row) + 0.5) * canvasSize.height / 6
                        )
                        context.fill(
                            Path(ellipseIn: CGRect(x: point.x - 1.5, y: point.y - 1.5, width: 3, height: 3)),
                            with: .color(color.opacity(0.28))
                        )
                    }
                }
            }
        case .grid:
            Canvas { context, canvasSize in
                var path = Path()
                for index in 0...6 {
                    let x = CGFloat(index) * canvasSize.width / 6
                    let y = CGFloat(index) * canvasSize.height / 6
                    path.move(to: CGPoint(x: x, y: 0))
                    path.addLine(to: CGPoint(x: x, y: canvasSize.height))
                    path.move(to: CGPoint(x: 0, y: y))
                    path.addLine(to: CGPoint(x: canvasSize.width, y: y))
                }
                context.stroke(path, with: .color(color.opacity(0.18)), lineWidth: 1)
            }
        case .rays:
            Canvas { context, canvasSize in
                var path = Path()
                let center = CGPoint(x: canvasSize.width / 2, y: canvasSize.height / 2)
                let radius = sqrt(
                    canvasSize.width * canvasSize.width + canvasSize.height * canvasSize.height
                )
                for index in 0..<12 {
                    let angle = CGFloat(index) * .pi / 6
                    path.move(to: center)
                    path.addLine(to: CGPoint(
                        x: center.x + cos(angle) * radius,
                        y: center.y + sin(angle) * radius
                    ))
                }
                context.stroke(path, with: .color(color.opacity(0.2)), lineWidth: 1)
            }
        }
    }
}

public enum LumenIllustrationSize: Sendable {
    case lg
    case md
    case sm

    var dimension: CGFloat {
        switch self {
        case .lg: LumenGraphics.lgIllustrationSize
        case .md: LumenGraphics.mdIllustrationSize
        case .sm: LumenGraphics.smIllustrationSize
        }
    }
}

public enum LumenIllustrationTone: Sendable {
    case accent
    case auto
    case brand
    case neutral
}

public enum LumenIllustrationVariant: Sendable {
    case empty
    case error
    case offline
    case success
}

public struct LumenIllustration: View {
    @Environment(\.lumenTheme) private var theme

    private let label: String?
    private let size: LumenIllustrationSize
    private let tone: LumenIllustrationTone
    private let variant: LumenIllustrationVariant

    public init(
        variant: LumenIllustrationVariant = .empty,
        tone: LumenIllustrationTone = .auto,
        size: LumenIllustrationSize = .md,
        label: String? = nil
    ) {
        self.variant = variant
        self.tone = tone
        self.size = size
        self.label = label
    }

    public var body: some View {
        Canvas { context, canvasSize in
            let scale = min(canvasSize.width, canvasSize.height) / 120
            let lineWidth = max(2, LumenGraphics.standardStrokeWidth * scale)
            let bounds = CGRect(origin: .zero, size: canvasSize)
            context.fill(
                Path(ellipseIn: bounds.insetBy(dx: 11 * scale, dy: 11 * scale)),
                with: .color(color.opacity(LumenGraphics.washOpacity))
            )
            drawArtwork(context: &context, scale: scale, lineWidth: lineWidth)
        }
        .frame(width: size.dimension, height: size.dimension)
        .accessibilityElement(children: .ignore)
        .accessibilityHidden(label == nil)
        .accessibilityLabel(Text(label ?? ""))
    }

    private var color: Color {
        switch tone {
        case .accent: theme.colors.accent
        case .brand: theme.colors.brand
        case .neutral: theme.colors.inkMuted
        case .auto:
            switch variant {
            case .empty: theme.colors.brand
            case .error: theme.colors.danger
            case .offline: theme.colors.inkMuted
            case .success: theme.colors.success
            }
        }
    }

    private func drawArtwork(context: inout GraphicsContext, scale: CGFloat, lineWidth: CGFloat) {
        let style = StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round)

        for element in lumenIllustrationArtwork(for: variant) {
            context.stroke(
                illustrationPath(for: element, scale: scale),
                with: .color(color),
                style: style
            )
        }
    }

    private func illustrationPath(
        for element: LumenIllustrationElement,
        scale: CGFloat
    ) -> Path {
        switch element {
        case let .circle(cx, cy, radius):
            Path(
                ellipseIn: CGRect(
                    x: (cx - radius) * scale,
                    y: (cy - radius) * scale,
                    width: radius * 2 * scale,
                    height: radius * 2 * scale
                )
            )
        case let .roundedRect(x, y, width, height, radius):
            Path(
                roundedRect: CGRect(
                    x: x * scale,
                    y: y * scale,
                    width: width * scale,
                    height: height * scale
                ),
                cornerRadius: radius * scale
            )
        case let .line(points):
            pointPath(points, scale: scale, closesPath: false)
        case let .polygon(points):
            pointPath(points, scale: scale, closesPath: true)
        case let .polyline(points):
            pointPath(points, scale: scale, closesPath: false)
        }
    }

    private func pointPath(
        _ points: [CGFloat],
        scale: CGFloat,
        closesPath: Bool
    ) -> Path {
        var path = Path()

        guard points.count >= 4 else { return path }

        path.move(to: CGPoint(x: points[0] * scale, y: points[1] * scale))

        for index in stride(from: 2, to: points.count, by: 2) {
            path.addLine(to: CGPoint(x: points[index] * scale, y: points[index + 1] * scale))
        }

        if closesPath { path.closeSubpath() }

        return path
    }
}

public struct LumenDisclosure<Content: View>: View {
    @Environment(\.lumenTheme) private var theme
    @State private var internalIsExpanded: Bool

    private let content: Content
    private let customLabel: AnyView?
    private let description: String?
    private let externalIsExpanded: Binding<Bool>?
    private let title: String?

    public init(
        _ title: String,
        isExpanded: Binding<Bool>,
        description: String? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.customLabel = nil
        self.description = description
        self.externalIsExpanded = isExpanded
        _internalIsExpanded = State(initialValue: isExpanded.wrappedValue)
        self.title = title
    }

    public init(
        _ title: String,
        initiallyExpanded: Bool = false,
        description: String? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.customLabel = nil
        self.description = description
        self.externalIsExpanded = nil
        _internalIsExpanded = State(initialValue: initiallyExpanded)
        self.title = title
    }

    public init<Label: View>(
        isExpanded: Binding<Bool>,
        @ViewBuilder label: () -> Label,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.customLabel = AnyView(label())
        self.description = nil
        self.externalIsExpanded = isExpanded
        _internalIsExpanded = State(initialValue: isExpanded.wrappedValue)
        self.title = nil
    }

    public init<Label: View>(
        initiallyExpanded: Bool = false,
        @ViewBuilder label: () -> Label,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.customLabel = AnyView(label())
        self.description = nil
        self.externalIsExpanded = nil
        _internalIsExpanded = State(initialValue: initiallyExpanded)
        self.title = nil
    }

    public var body: some View {
        DisclosureGroup(isExpanded: expansionBinding) {
            content
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, LumenSpacing.md)
        } label: {
            disclosureLabel
        }
        .tint(theme.colors.brandSolid)
        .padding(.horizontal, LumenSpacing.lg)
        .padding(.vertical, LumenSpacing.md)
        .background(theme.colors.surface)
        .overlay {
            RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous)
                .stroke(theme.colors.line, lineWidth: 1)
        }
        .clipShape(RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous))
    }

    private var expansionBinding: Binding<Bool> {
        externalIsExpanded ?? Binding(
            get: { internalIsExpanded },
            set: { internalIsExpanded = $0 }
        )
    }

    @ViewBuilder
    private var disclosureLabel: some View {
        if let customLabel {
            customLabel
        } else if let title {
            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                Text(title)
                    .font(.callout.weight(.semibold))
                    .foregroundStyle(theme.colors.ink)

                if let description {
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(theme.colors.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }
}
#endif
