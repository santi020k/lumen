import SwiftUI

public struct LumenMediaViewportValue: Equatable, Sendable {
    public var zoom: Double
    public var x: Double
    public var y: Double

    public init(zoom: Double = 1, x: Double = 0, y: Double = 0) {
        self.zoom = zoom
        self.x = x
        self.y = y
    }

    public func normalized(maxZoom: Double = 4) -> Self {
        let limit = maxZoom.isFinite ? min(16, max(1, maxZoom)) : 4
        let scale = zoom.isFinite ? min(limit, max(1, zoom)) : 1
        return Self(zoom: scale,
                    x: scale == 1 ? 0 : (x.isFinite ? min(1, max(-1, x)) : 0),
                    y: scale == 1 ? 0 : (y.isFinite ? min(1, max(-1, y)) : 0))
    }

    public func applying(_ action: LumenMediaViewportAction, maxZoom: Double = 4) -> Self {
        var next = normalized(maxZoom: maxZoom)
        switch action {
        case .zoomIn: next.zoom += 0.25
        case .zoomOut: next.zoom -= 0.25
        case .fit: next = Self()
        case .left: next.x -= 0.25
        case .right: next.x += 0.25
        case .up: next.y -= 0.25
        case .down: next.y += 0.25
        }
        return next.normalized(maxZoom: maxZoom)
    }

    public func panning(dx: Double, dy: Double, width: Double, height: Double, maxZoom: Double = 4) -> Self {
        let current = normalized(maxZoom: maxZoom)
        let extent = (current.zoom - 1) / 2
        guard extent > 0, width.isFinite, height.isFinite, width > 0, height > 0 else { return current }
        return Self(zoom: current.zoom,
                    x: current.x + (dx.isFinite ? dx / width / extent : 0),
                    y: current.y + (dy.isFinite ? dy / height / extent : 0)).normalized(maxZoom: maxZoom)
    }
}

public enum LumenMediaViewportAction: String, CaseIterable, Sendable {
    case zoomIn, zoomOut, fit, left, right, up, down
}

public struct LumenMediaViewportLabels: Sendable {
    public var zoomIn: String
    public var zoomOut: String
    public var fit: String
    public var left: String
    public var right: String
    public var up: String
    public var down: String

    public init(zoomIn: String = "Zoom in", zoomOut: String = "Zoom out", fit: String = "Fit to view",
                left: String = "Pan left", right: String = "Pan right", up: String = "Pan up", down: String = "Pan down") {
        self.zoomIn = zoomIn
        self.zoomOut = zoomOut
        self.fit = fit
        self.left = left
        self.right = right
        self.up = up
        self.down = down
    }

    public func label(for action: LumenMediaViewportAction) -> String {
        switch action {
        case .zoomIn: zoomIn
        case .zoomOut: zoomOut
        case .fit: fit
        case .left: left
        case .right: right
        case .up: up
        case .down: down
        }
    }
}

#if os(iOS) || os(macOS) || os(visionOS)
/// The application owns media loading and the viewport binding. Zoom is relative to fit.
public struct LumenMediaViewport<Content: View>: View {
    @Binding private var value: LumenMediaViewportValue
    @Environment(\.lumenTheme) private var theme
    @Environment(\.locale) private var locale
    @State private var dragStart: LumenMediaViewportValue?
    @State private var pinchStart: LumenMediaViewportValue?
    private let label: String
    private let maxZoom: Double
    private let ratio: CGFloat
    private let disabled: Bool
    private let labels: LumenMediaViewportLabels
    private let content: Content

    public init(_ label: String, value: Binding<LumenMediaViewportValue>, maxZoom: Double = 4,
                aspectRatio: CGFloat = 16 / 9, disabled: Bool = false,
                labels: LumenMediaViewportLabels = .init(), @ViewBuilder content: () -> Content) {
        self.label = label
        _value = value
        self.maxZoom = maxZoom
        ratio = aspectRatio.isFinite && (0.1...10).contains(aspectRatio) ? aspectRatio : 16 / 9
        self.disabled = disabled
        self.labels = labels
        self.content = content()
    }

    private var current: LumenMediaViewportValue { value.normalized(maxZoom: maxZoom) }
    private var zoomLabel: String { current.zoom.formatted(.percent.locale(locale).precision(.fractionLength(0))) }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            GeometryReader { geometry in
                content
                    .frame(width: geometry.size.width, height: geometry.size.height)
                    .scaleEffect(current.zoom)
                    .offset(x: current.x * (current.zoom - 1) * geometry.size.width / 2,
                            y: current.y * (current.zoom - 1) * geometry.size.height / 2)
                    .frame(width: geometry.size.width, height: geometry.size.height)
                    .clipped()
                    .contentShape(Rectangle())
                    .gesture(DragGesture(minimumDistance: 2).onChanged { drag in
                        guard !disabled, current.zoom > 1, pinchStart == nil else { return }
                        let start = dragStart ?? current
                        dragStart = start
                        value = start.panning(dx: drag.translation.width, dy: drag.translation.height,
                                              width: geometry.size.width, height: geometry.size.height, maxZoom: maxZoom)
                    }.onEnded { _ in dragStart = nil }, including: disabled || current.zoom <= 1 ? .none : .all)
                    .simultaneousGesture(MagnificationGesture().onChanged { scale in
                        guard !disabled else { return }
                        let start = pinchStart ?? current
                        pinchStart = start
                        dragStart = nil
                        value = LumenMediaViewportValue(zoom: start.zoom * scale, x: start.x, y: start.y).normalized(maxZoom: maxZoom)
                    }.onEnded { _ in pinchStart = nil }, including: disabled ? .none : .all)
            }
            .aspectRatio(ratio, contentMode: .fit)
            .background(theme.colors.surfaceMuted)
            .clipShape(RoundedRectangle(cornerRadius: LumenRadius.lg))
            .accessibilityLabel(Text(verbatim: label))
            .accessibilityValue(Text(verbatim: zoomLabel))
            Text(verbatim: label)
            Text(verbatim: zoomLabel).monospacedDigit()
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 120))], alignment: .leading, spacing: LumenSpacing.sm) {
                ForEach(LumenMediaViewportAction.allCases, id: \.self) { action in
                    LumenButton(intent: .secondary,
                                disabled: disabled || current.applying(action, maxZoom: maxZoom) == current,
                                action: { value = current.applying(action, maxZoom: maxZoom) }) {
                        Text(verbatim: labels.label(for: action))
                    }
                }
            }
        }
    }
}
#endif

public enum LumenMediaThumbnailState: Sendable { case ready, loading, error }

func resolveMediaThumbnailStateLabel(_ state: LumenMediaThumbnailState, label: String) -> String {
    if !label.isEmpty { return label }
    return state == .loading ? "Loading" : "Unavailable"
}

public struct LumenMediaThumbnail<Content: View>: View {
    @Environment(\.lumenTheme) private var theme
    private let label: String
    private let selected: Bool
    private let order: Int?
    private let state: LumenMediaThumbnailState
    private let stateLabel: String
    private let disabled: Bool
    private let onSelectionChange: (Bool) -> Void
    private let content: Content

    public init(_ label: String, selected: Bool, order: Int? = nil,
                state: LumenMediaThumbnailState = .ready, stateLabel: String = "",
                disabled: Bool = false, onSelectionChange: @escaping (Bool) -> Void,
                @ViewBuilder content: () -> Content) {
        self.label = label
        self.selected = selected
        self.order = order.flatMap { $0 > 0 ? $0 : nil }
        self.state = state
        self.stateLabel = resolveMediaThumbnailStateLabel(state, label: stateLabel)
        self.disabled = disabled
        self.onSelectionChange = onSelectionChange
        self.content = content()
    }

    public var body: some View {
        LumenButton(intent: .secondary, disabled: disabled || state != .ready,
                    action: { onSelectionChange(!selected) }) {
            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                content.aspectRatio(1, contentMode: .fit).clipped().accessibilityHidden(true)
                HStack(alignment: .top) {
                    Text(verbatim: label)
                    if selected { LumenIcon(systemName: "checkmark", label: nil) }
                    if let order { Text(verbatim: String(order)).monospacedDigit() }
                }
                if state != .ready { Text(verbatim: stateLabel) }
            }
            .padding(LumenSpacing.xs)
        }
        .overlay {
            RoundedRectangle(cornerRadius: LumenRadius.sm)
                .stroke(selected ? theme.colors.brand : theme.colors.line, lineWidth: selected ? 2 : 1)
        }
        .accessibilityLabel(Text(verbatim: label))
        .accessibilityValue(Text(verbatim: state == .ready ? order.map(String.init) ?? "" : stateLabel))
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

public struct LumenMediaFilmstrip<Content: View>: View {
    private let label: String
    private let selectionLabel: String
    private let content: Content

    public init(_ label: String, selectionLabel: String, @ViewBuilder content: () -> Content) {
        self.label = label
        self.selectionLabel = selectionLabel
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            LumenText(.verbatim(label), variant: .label)
            LumenText(.verbatim(selectionLabel), variant: .caption)
            ScrollView(.horizontal) {
                HStack(alignment: .top, spacing: LumenSpacing.sm) { content }
                    .padding(LumenSpacing.xs)
            }
        }
    }
}
