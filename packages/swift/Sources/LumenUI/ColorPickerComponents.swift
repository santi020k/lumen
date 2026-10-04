#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenColorPickerLabels: Sendable {
    public var field: String; public var hue: String; public var saturation: String; public var brightness: String
    public var alpha: String; public var invalid: String; public var preview: String
    public init(field: String = "Hex or RGBA color", hue: String = "Hue", saturation: String = "Saturation",
                brightness: String = "Brightness", alpha: String = "Opacity", invalid: String = "Enter a valid color",
                preview: String = "Selected color") {
        self.field = field; self.hue = hue; self.saturation = saturation; self.brightness = brightness
        self.alpha = alpha; self.invalid = invalid; self.preview = preview
    }
}
public struct LumenColorPicker: View {
    @Binding private var value: String
    @State private var draft: String
    @State private var selection: LumenHSVA?
    @State private var selectionSource: String?
    private let label: String; private let allowAlpha: Bool; private let disabled: Bool; private let readOnly: Bool
    private let labels: LumenColorPickerLabels; private let palette: [LumenColorSwatch]
    public init(_ label: String, value: Binding<String>, allowAlpha: Bool = false, disabled: Bool = false,
                readOnly: Bool = false, palette: [LumenColorSwatch] = [], labels: LumenColorPickerLabels = .init()) {
        self.label = label; _value = value; _draft = State(initialValue: value.wrappedValue)
        self.allowAlpha = allowAlpha; self.disabled = disabled; self.readOnly = readOnly
        self.palette = palette; self.labels = labels
    }
    private var enabled: Bool { !disabled && !readOnly }
    private var color: LumenRGBA? {
        guard let parsed = LumenColor.parse(value), LumenColor.format(parsed, allowAlpha: allowAlpha) != nil else { return nil }
        return parsed
    }
    private var source: String? { color.flatMap { LumenColor.format($0, allowAlpha: allowAlpha) } }
    private var hsva: LumenHSVA? { selectionSource == source ? selection ?? color.flatMap(LumenColor.hsva) : color.flatMap(LumenColor.hsva) }
    private var invalid: Bool { LumenColor.parse(draft).flatMap { LumenColor.format($0, allowAlpha: allowAlpha) } == nil }
    private func publish(_ next: String) { guard enabled else { return }; value = next; draft = next }
    private func channel(_ key: WritableKeyPath<LumenHSVA, Double>) -> Binding<Double> {
        Binding(get: { hsva?[keyPath: key] ?? 0 }, set: { next in
            guard enabled, var candidate = hsva else { return }
            candidate[keyPath: key] = next
            guard let rgba = LumenColor.rgba(candidate), let encoded = LumenColor.format(rgba, allowAlpha: allowAlpha) else { return }
            selection = candidate; selectionSource = encoded; publish(encoded)
        })
    }
    private func swiftColor(_ rgba: LumenRGBA) -> Color {
        Color(.sRGB, red: Double(rgba.red) / 255, green: Double(rgba.green) / 255, blue: Double(rgba.blue) / 255, opacity: rgba.alpha)
    }
    private var nativeBinding: Binding<Color> {
        Binding(get: { color.map(swiftColor) ?? .clear }, set: { next in
            guard enabled, let space = CGColorSpace(name: CGColorSpace.sRGB),
                  let cg = next.cgColor?.converted(to: space, intent: .defaultIntent, options: nil),
                  let components = cg.components, components.count == 4,
                  components.allSatisfy({ $0.isFinite && (0...1).contains($0) }) else { return }
            let rgba = LumenRGBA(red: Int((components[0] * 255).rounded()), green: Int((components[1] * 255).rounded()),
                                 blue: Int((components[2] * 255).rounded()), alpha: allowAlpha ? Double(components[3]) : 1)
            guard let encoded = LumenColor.format(rgba, allowAlpha: allowAlpha) else { return }
            selection = LumenColor.hsva(rgba); selectionSource = encoded; publish(encoded)
        })
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            Text(label)
            if color != nil {
                SwiftUI.ColorPicker(labels.preview, selection: nativeBinding, supportsOpacity: allowAlpha)
                    .frame(minHeight: 44).disabled(!enabled)
                LumenSlider(LocalizedStringKey(labels.hue), value: channel(\.hue), in: 0...360, step: 1)
                LumenSlider(LocalizedStringKey(labels.saturation), value: channel(\.saturation), in: 0...1, step: 0.01)
                LumenSlider(LocalizedStringKey(labels.brightness), value: channel(\.value), in: 0...1, step: 0.01)
                if allowAlpha { LumenSlider(LocalizedStringKey(labels.alpha), value: channel(\.alpha), in: 0...1, step: 0.01) }
            }
            LumenTextField(labels.field, text: Binding(get: { draft }, set: { next in
                guard enabled else { return }; draft = next
                if let rgba = LumenColor.parse(next), let encoded = LumenColor.format(rgba, allowAlpha: allowAlpha) {
                    selection = nil; selectionSource = nil; value = encoded
                }
            }), error: invalid, errorMessage: invalid ? labels.invalid : nil).disabled(!enabled)
            if !palette.isEmpty {
                ScrollView(.horizontal) {
                    HStack(spacing: LumenSpacing.sm) {
                        ForEach(validPalette) { swatch in
                            if let rgba = LumenColor.parse(swatch.value), let encoded = LumenColor.format(rgba, allowAlpha: allowAlpha) {
                                Button { selection = nil; selectionSource = nil; publish(encoded) } label: {
                                    RoundedRectangle(cornerRadius: LumenRadius.sm).fill(swiftColor(rgba))
                                        .frame(width: 44, height: 44).overlay(RoundedRectangle(cornerRadius: LumenRadius.sm).stroke(.primary, lineWidth: source == encoded ? 3 : 1))
                                }.buttonStyle(.plain).accessibilityLabel(Text(swatch.label))
                                    .accessibilityValue(Text(encoded)).disabled(!enabled || swatch.disabled)
                                    .accessibilityAddTraits(source == encoded ? .isSelected : [])
                            }
                        }
                    }
                }
            }
        }.disabled(!enabled).onChange(of: value) { next in
            draft = next
            if selectionSource != source { selection = nil; selectionSource = nil }
        }.onChange(of: allowAlpha) { _ in draft = value; selection = nil; selectionSource = nil }
    }
    private var validPalette: [LumenColorSwatch] {
        var seen = Set<String>()
        return palette.filter { LumenColor.parse($0.value).flatMap { LumenColor.format($0, allowAlpha: allowAlpha) } != nil && seen.insert($0.id).inserted }
    }
}
#endif
