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

public struct LumenDisclosure<Content: View>: View {
    @Binding private var isExpanded: Bool
    @Environment(\.lumenTheme) private var theme

    private let content: Content
    private let description: String?
    private let title: String

    public init(
        _ title: String,
        isExpanded: Binding<Bool>,
        description: String? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        _isExpanded = isExpanded
        self.description = description
        self.content = content()
    }

    public var body: some View {
        DisclosureGroup(isExpanded: $isExpanded) {
            content
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, LumenSpacing.md)
        } label: {
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
}
#endif
