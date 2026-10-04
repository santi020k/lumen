#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI
import CoreImage
import CoreImage.CIFilterBuiltins

public enum LumenQRCodeCorrection: String, CaseIterable, Sendable { case low = "L", medium = "M", quartile = "Q", high = "H" }
public enum LumenQRCodeError: Error, Equatable { case empty, capacity, options }

public struct LumenQRCodeMatrix: Equatable, Sendable {
    public let modules: [[Bool]]
    public var dimension: Int { modules.count }

    public init(value: String, correction: LumenQRCodeCorrection = .medium, quietZone: Int = 4) throws {
        guard (4...32).contains(quietZone) else { throw LumenQRCodeError.options }
        guard !value.isEmpty else { throw LumenQRCodeError.empty }
        guard value.utf16.count <= 7089 else { throw LumenQRCodeError.capacity }
        let data = Data(value.utf8)
        let filter = CIFilter.qrCodeGenerator()
        filter.message = data
        filter.correctionLevel = correction.rawValue
        guard let image = filter.outputImage else { throw LumenQRCodeError.capacity }
        let width = Int(image.extent.width)
        var pixels = [UInt8](repeating: 0, count: width * width * 4)
        CIContext().render(image, toBitmap: &pixels, rowBytes: width * 4,
                           bounds: image.extent, format: .RGBA8, colorSpace: CGColorSpaceCreateDeviceRGB())
        // Core Image supplies a one-module border. Replace it with the requested quiet zone.
        let side = width - 2 + quietZone * 2
        var result = [[Bool]](repeating: [Bool](repeating: false, count: side), count: side)
        for y in 1..<(width - 1) {
            for x in 1..<(width - 1) {
                result[quietZone + width - 2 - y][quietZone + x - 1] = pixels[(y * width + x) * 4] < 128
            }
        }
        modules = result
    }
}

public struct LumenQRCode: View {
    @Environment(\.lumenTheme) private var theme
    private let value: String
    private let label: String
    private let size: CGFloat
    private let errorLabel: String
    private let showValue: Bool
    private let result: Result<LumenQRCodeMatrix, Error>

    public init(_ label: String, value: String, size: CGFloat = 160,
                correction: LumenQRCodeCorrection = .medium, quietZone: Int = 4,
                errorLabel: String = "Unable to generate QR code", showValue: Bool = true) {
        self.label = label; self.value = value; self.size = size
        self.errorLabel = errorLabel; self.showValue = showValue
        result = Result { try LumenQRCodeMatrix(value: value, correction: correction, quietZone: quietZone) }
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
            if case let .success(matrix) = result, size.isFinite, size > 0, size <= 4096 {
                Canvas { context, bounds in
                    context.fill(Path(CGRect(origin: .zero, size: bounds)), with: .color(.white))
                    let unit = bounds.width / CGFloat(matrix.dimension)
                    var path = Path()
                    for y in 0..<matrix.dimension {
                        for x in 0..<matrix.dimension where matrix.modules[y][x] {
                            path.addRect(CGRect(x: CGFloat(x) * unit, y: CGFloat(y) * unit, width: unit, height: unit))
                        }
                    }
                    context.fill(path, with: .color(.black))
                }
                .frame(width: size, height: size)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(Text(label)).accessibilityValue(Text(value))
                .accessibilityAddTraits(.isImage)
            } else { Text(errorLabel).foregroundStyle(theme.colors.ink) }
            if showValue { Text(value).foregroundStyle(theme.colors.ink) }
        }
    }
}
#endif
