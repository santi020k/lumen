#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenRatingModel: Equatable, Sendable {
    public let maximum: Int

    public init(maximum: Int = 5) {
        self.maximum = min(100, max(1, maximum))
    }

    public func resolved(_ value: Int) -> Int { min(maximum, max(0, value)) }
}

public struct LumenRating: View {
    @Binding private var value: Int
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenTheme) private var theme
    private let label: String
    private let model: LumenRatingModel
    private let readOnly: Bool
    private let formatOption: (Int, Int) -> String

    public init(_ label: String, value: Binding<Int>, maximum: Int = 5,
                readOnly: Bool = false,
                formatOption: @escaping (Int, Int) -> String = { "\($0) / \($1)" }) {
        self.label = label
        _value = value
        model = LumenRatingModel(maximum: maximum)
        self.readOnly = readOnly
        self.formatOption = formatOption
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
            Text(label).foregroundStyle(theme.colors.ink)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 44, maximum: 44))],
                      alignment: .leading, spacing: LumenSpacing.xs) {
                ForEach(1...model.maximum, id: \.self) { option in
                    Button {
                        if isEnabled && !readOnly { value = option }
                    } label: {
                        LumenIcon(name: .star, color: option <= model.resolved(value)
                                  ? theme.colors.brandSolid : theme.colors.inkMuted)
                            .frame(minWidth: 44, minHeight: 44)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .disabled(readOnly)
                    .accessibilityLabel(Text(formatOption(option, model.maximum)))
                    .accessibilityAddTraits(option == model.resolved(value) ? .isSelected : [])
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(label))
        .opacity(isEnabled ? 1 : 0.52)
    }
}
#endif
