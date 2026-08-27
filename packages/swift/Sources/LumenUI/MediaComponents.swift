import SwiftUI

public enum LumenImageFit: Sendable {
    case contain
    case cover

    var contentMode: ContentMode {
        switch self {
        case .contain: .fit
        case .cover: .fill
        }
    }
}

public enum LumenImageRadius: Sendable {
    case full
    case lg
    case md
    case none
    case sm

    var value: CGFloat {
        switch self {
        case .full: LumenRadius.full
        case .lg: LumenRadius.lg
        case .md: LumenRadius.md
        case .none: 0
        case .sm: LumenRadius.sm
        }
    }
}

public struct LumenImage<Content: View>: View {
    private let aspectRatio: CGFloat?
    private let content: Content
    private let fit: LumenImageFit
    private let label: String?
    private let radius: LumenImageRadius

    public init(
        aspectRatio: CGFloat? = nil,
        fit: LumenImageFit = .cover,
        radius: LumenImageRadius = .lg,
        label: String? = nil,
        @ViewBuilder content: () -> Content
    ) {
        if let aspectRatio, aspectRatio.isFinite, aspectRatio > 0 {
            self.aspectRatio = aspectRatio
        } else {
            self.aspectRatio = nil
        }

        self.content = content()
        self.fit = fit
        self.label = label
        self.radius = radius
    }

    public var body: some View {
        content
            .aspectRatio(aspectRatio, contentMode: fit.contentMode)
            .clipShape(RoundedRectangle(cornerRadius: radius.value, style: .continuous))
            .accessibilityElement(children: .ignore)
            .accessibilityHidden(label == nil)
            .accessibilityLabel(Text(label ?? ""))
    }
}
