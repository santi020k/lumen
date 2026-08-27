#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenSelectionOption<Value: Hashable>: Identifiable {
    public let description: String?
    public let id: Value
    public let isDisabled: Bool
    public let title: String

    public init(
        _ title: String,
        value: Value,
        description: String? = nil,
        isDisabled: Bool = false
    ) {
        self.title = title
        id = value
        self.description = description
        self.isDisabled = isDisabled
    }
}

public struct LumenCheckbox: View {
    @Binding private var isChecked: Bool
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenTheme) private var theme

    private let description: String?
    private let label: String

    public init(_ label: String, isChecked: Binding<Bool>, description: String? = nil) {
        self.label = label
        _isChecked = isChecked
        self.description = description
    }

    public var body: some View {
        Button { isChecked.toggle() } label: {
            HStack(alignment: .top, spacing: LumenSpacing.md) {
                Image(systemName: isChecked ? "checkmark.square.fill" : "square")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(isChecked ? theme.colors.brandSolid : theme.colors.inkMuted)
                    .frame(width: 24, height: 24)
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    Text(label).font(.callout.weight(.semibold)).foregroundStyle(theme.colors.ink)
                    if let description {
                        Text(description)
                            .font(.caption)
                            .foregroundStyle(theme.colors.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .opacity(isEnabled ? 1 : 0.52)
        .accessibilityLabel(Text(label))
        .accessibilityValue(Text(isChecked ? "Checked" : "Not checked"))
    }
}

public struct LumenRadioGroup<Value: Hashable>: View {
    @Binding private var selection: Value
    @Environment(\.lumenTheme) private var theme

    private let label: String
    private let options: [LumenSelectionOption<Value>]

    public init(_ label: String, selection: Binding<Value>, options: [LumenSelectionOption<Value>]) {
        self.label = label
        _selection = selection
        self.options = options
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            Text(label).font(.callout.weight(.semibold)).foregroundStyle(theme.colors.ink)
            ForEach(options) { option in
                let isSelected = selection == option.id

                Button { selection = option.id } label: {
                    HStack(alignment: .top, spacing: LumenSpacing.md) {
                        Image(systemName: isSelected ? "largecircle.fill.circle" : "circle")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(isSelected ? theme.colors.brandSolid : theme.colors.inkMuted)
                            .frame(width: 24, height: 24)
                            .accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                            Text(option.title).font(.callout).foregroundStyle(theme.colors.ink)
                            if let description = option.description {
                                Text(description)
                                    .font(.caption)
                                    .foregroundStyle(theme.colors.inkMuted)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(option.isDisabled)
                .opacity(option.isDisabled ? 0.52 : 1)
                .accessibilityLabel(Text(option.title))
                .accessibilityValue(Text(isSelected ? "Selected" : "Not selected"))
                .accessibilityAddTraits(isSelected ? .isSelected : [])
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(label))
    }
}

public struct LumenSegmentedControl<Value: Hashable>: View {
    @Binding private var selection: Value
    @Environment(\.lumenTheme) private var theme

    private let label: String
    private let options: [LumenSelectionOption<Value>]
    private let showsLabel: Bool

    public init(
        _ label: String,
        selection: Binding<Value>,
        options: [LumenSelectionOption<Value>],
        showsLabel: Bool = true
    ) {
        self.label = label
        _selection = selection
        self.options = options
        self.showsLabel = showsLabel
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            if showsLabel {
                Text(label).font(.callout.weight(.semibold)).foregroundStyle(theme.colors.ink)
            }
            HStack(spacing: 2) {
                ForEach(options) { option in
                    let isSelected = selection == option.id

                    Button { selection = option.id } label: {
                        Text(option.title)
                            .font(.caption.weight(isSelected ? .bold : .semibold))
                            .lineLimit(1)
                            .frame(maxWidth: .infinity, minHeight: 36)
                            .padding(.horizontal, LumenSpacing.sm)
                            .foregroundStyle(isSelected ? theme.colors.brand : theme.colors.inkSoft)
                            .background(isSelected ? theme.colors.surface : .clear)
                            .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .disabled(option.isDisabled)
                    .opacity(option.isDisabled ? 0.52 : 1)
                    .accessibilityLabel(Text(option.title))
                    .accessibilityValue(Text(isSelected ? "Selected" : "Not selected"))
                    .accessibilityAddTraits(isSelected ? .isSelected : [])
                }
            }
            .padding(2)
            .background(theme.colors.surfaceMuted)
            .overlay {
                RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous)
                    .stroke(theme.colors.line, lineWidth: 1)
            }
            .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous))
            .accessibilityElement(children: .contain)
            .accessibilityLabel(Text(label))
        }
    }
}

public struct LumenTabs<Value: Hashable, Content: View>: View {
    @Binding private var selection: Value
    @Environment(\.lumenTheme) private var theme

    private let content: (Value) -> Content
    private let label: String
    private let options: [LumenSelectionOption<Value>]

    public init(
        _ label: String,
        selection: Binding<Value>,
        options: [LumenSelectionOption<Value>],
        @ViewBuilder content: @escaping (Value) -> Content
    ) {
        self.label = label
        _selection = selection
        self.options = options
        self.content = content
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) {
            HStack(spacing: LumenSpacing.xs) {
                ForEach(options) { option in
                    let isSelected = selection == option.id

                    Button { selection = option.id } label: {
                        Text(option.title)
                            .font(.callout.weight(isSelected ? .bold : .semibold))
                            .foregroundStyle(isSelected ? theme.colors.brand : theme.colors.inkSoft)
                            .frame(minHeight: 44)
                            .padding(.horizontal, LumenSpacing.md)
                            .overlay(alignment: .bottom) {
                                Rectangle()
                                    .fill(isSelected ? theme.colors.brandSolid : .clear)
                                    .frame(height: 2)
                            }
                    }
                    .buttonStyle(.plain)
                    .disabled(option.isDisabled)
                    .opacity(option.isDisabled ? 0.52 : 1)
                    .accessibilityLabel(Text(option.title))
                    .accessibilityValue(Text(isSelected ? "Selected" : "Not selected"))
                    .accessibilityAddTraits(isSelected ? .isSelected : [])
                }
                Spacer(minLength: 0)
            }
            .overlay(alignment: .bottom) {
                Rectangle().fill(theme.colors.line).frame(height: 1)
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(Text(label))

            content(selection)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityElement(children: .contain)
                .accessibilityLabel(Text("\(selectedTitle) tab panel"))
        }
    }

    private var selectedTitle: String {
        options.first(where: { $0.id == selection })?.title ?? String(describing: selection)
    }
}
#endif
