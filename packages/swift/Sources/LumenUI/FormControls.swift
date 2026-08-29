#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenToggle<Label: View>: View {
    @Binding private var isOn: Bool
    @Environment(\.lumenTheme) private var theme

    private let label: Label

    public init(
        isOn: Binding<Bool>,
        @ViewBuilder label: () -> Label
    ) {
        _isOn = isOn
        self.label = label()
    }

    public var body: some View {
        Toggle(isOn: $isOn) {
            label
        }
        .toggleStyle(.switch)
        .tint(theme.colors.brandSolid)
    }
}

public extension LumenToggle where Label == Text {
    init(_ title: LocalizedStringKey, isOn: Binding<Bool>) {
        self.init(isOn: isOn) {
            Text(title)
        }
    }
}

public struct LumenSettingsRow<Control: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let control: Control
    private let description: LocalizedStringKey?
    private let systemName: String?
    private let title: LocalizedStringKey

    public init(
        _ title: LocalizedStringKey,
        description: LocalizedStringKey? = nil,
        systemName: String? = nil,
        @ViewBuilder control: () -> Control
    ) {
        self.title = title
        self.description = description
        self.systemName = systemName
        self.control = control()
    }

    public var body: some View {
        HStack(alignment: .center, spacing: LumenSpacing.lg) {
            if let systemName {
                LumenIcon(systemName: systemName, size: .sm, color: theme.colors.inkSoft)
            }

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
            .frame(maxWidth: .infinity, alignment: .leading)

            control
                .fixedSize(horizontal: true, vertical: false)
        }
        .frame(minHeight: 56)
        .accessibilityElement(children: .contain)
    }
}

public enum LumenPickerStyle: Sendable {
    case automatic
    case menu
    case segmented
}

public struct LumenPicker<SelectionValue: Hashable, Content: View>: View {
    @Binding private var selection: SelectionValue
    @Environment(\.lumenTheme) private var theme

    private let content: Content
    private let currentValueLabel: AnyView?
    private let richLabel: AnyView?
    private let showsLabel: Bool
    private let style: LumenPickerStyle
    private let title: LocalizedStringKey

    public init(
        _ title: LocalizedStringKey,
        selection: Binding<SelectionValue>,
        style: LumenPickerStyle = .automatic,
        showsLabel: Bool = true,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        currentValueLabel = nil
        richLabel = nil
        _selection = selection
        self.style = style
        self.showsLabel = showsLabel
        self.content = content()
    }

    public init<Label: View, CurrentValueLabel: View>(
        selection: Binding<SelectionValue>,
        style: LumenPickerStyle = .automatic,
        @ViewBuilder label: () -> Label,
        @ViewBuilder currentValueLabel: () -> CurrentValueLabel,
        @ViewBuilder content: () -> Content
    ) {
        title = ""
        _selection = selection
        self.style = style
        showsLabel = true
        richLabel = AnyView(label())
        self.currentValueLabel = AnyView(currentValueLabel())
        self.content = content()
    }

    public var body: some View {
        styledPicker
            .tint(theme.colors.brandSolid)
    }

    @ViewBuilder
    private var styledPicker: some View {
        switch style {
        case .automatic:
            picker
        case .menu:
            #if os(watchOS)
            picker
            #else
            picker.pickerStyle(.menu)
            #endif
        case .segmented:
            picker.pickerStyle(.segmented)
        }
    }

    @ViewBuilder
    private var picker: some View {
        if #available(iOS 18, macOS 15, tvOS 18, watchOS 11, visionOS 2, *) {
            let picker = Picker(selection: $selection) {
                content
            } label: {
                if let richLabel { richLabel } else { Text(title) }
            } currentValueLabel: {
                if let currentValueLabel { currentValueLabel }
            }

            if showsLabel { picker } else { picker.labelsHidden() }
        } else {
            let picker = Picker(selection: $selection) {
                content
            } label: {
                HStack(spacing: LumenSpacing.sm) {
                    if let richLabel { richLabel } else { Text(title) }
                    if let currentValueLabel { currentValueLabel }
                }
            }

            if showsLabel { picker } else { picker.labelsHidden() }
        }
    }
}

public struct LumenSliderConfiguration: Equatable, Sendable {
    public let bounds: ClosedRange<Double>
    public let step: Double?

    public static func resolve(
        bounds: ClosedRange<Double>,
        step: Double?
    ) -> LumenSliderConfiguration {
        let safeStep = step.flatMap { value in
            value.isFinite && value > 0 ? value : nil
        }

        return LumenSliderConfiguration(bounds: bounds, step: safeStep)
    }
}

public struct LumenSlider: View {
    @Binding private var value: Double
    @Environment(\.lumenTheme) private var theme

    private let configuration: LumenSliderConfiguration
    private let label: LocalizedStringKey
    private let onEditingChanged: (Bool) -> Void
    private let valueLabel: String?

    public init(
        _ label: LocalizedStringKey,
        value: Binding<Double>,
        in bounds: ClosedRange<Double>,
        step: Double? = nil,
        valueLabel: String? = nil,
        onEditingChanged: @escaping (Bool) -> Void = { _ in }
    ) {
        self.label = label
        _value = value
        configuration = LumenSliderConfiguration.resolve(bounds: bounds, step: step)
        self.valueLabel = valueLabel
        self.onEditingChanged = onEditingChanged
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            HStack(alignment: .firstTextBaseline, spacing: LumenSpacing.md) {
                Text(label)
                    .font(.callout.weight(.semibold))
                    .foregroundStyle(theme.colors.ink)

                Spacer(minLength: LumenSpacing.md)

                if let valueLabel {
                    Text(valueLabel)
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(theme.colors.inkMuted)
                }
            }

            slider
                .tint(theme.colors.brandSolid)
        }
    }

    @ViewBuilder
    private var slider: some View {
        if let step = configuration.step {
            Slider(
                value: $value,
                in: configuration.bounds,
                step: step,
                onEditingChanged: onEditingChanged,
                label: { Text(label) }
            )
        } else {
            Slider(
                value: $value,
                in: configuration.bounds,
                onEditingChanged: onEditingChanged,
                label: { Text(label) }
            )
        }
    }
}

public struct LumenSearchField: View {
    @Binding private var text: String
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenControlDensity) private var density
    @Environment(\.lumenTheme) private var theme

    private let prompt: String

    public init(_ prompt: String = "Search", text: Binding<String>) {
        self.prompt = prompt
        _text = text
    }

    public var body: some View {
        HStack(spacing: LumenSpacing.sm) {
            LumenIcon(systemName: "magnifyingglass", size: .sm, color: theme.colors.inkMuted)

            TextField(prompt, text: $text)
                .textFieldStyle(.plain)
                .foregroundStyle(theme.colors.ink)

            if !text.isEmpty {
                LumenIconButton(
                    systemName: "xmark.circle.fill",
                    label: "Clear search",
                    size: .sm
                ) {
                    text = ""
                }
            }
        }
        .frame(minHeight: LumenButtonMetrics.resolve(.md, density: density).minHeight)
        .padding(.horizontal, LumenSpacing.md)
        .background(theme.colors.surface)
        .overlay {
            RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous)
                .stroke(theme.colors.line, lineWidth: 1)
        }
        .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous))
        .opacity(isEnabled ? 1 : 0.52)
    }
}
#endif
