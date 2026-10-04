#if os(iOS) || os(macOS) || os(visionOS)
import Testing
import SwiftUI
import ImageIO
import UniformTypeIdentifiers
import CoreImage
import Vision
@testable import LumenUI

@Test func qrCodeHasDeterministicFinderPatternsAndQuietZone() throws {
    let matrix = try LumenQRCodeMatrix(value: "HELLO WORLD")
    #expect(matrix == (try LumenQRCodeMatrix(value: "HELLO WORLD")))
    #expect(matrix.dimension == 29)
    #expect(matrix.modules.prefix(4).allSatisfy { $0.allSatisfy { !$0 } })
    #expect(Array(matrix.modules[4][4..<11]) == [true, true, true, true, true, true, true])
    #expect(Array(matrix.modules[5][4..<11]) == [true, false, false, false, false, false, true])
}

@Test func qrCodeRejectsInvalidInputs() throws {
    #expect(try LumenQRCodeMatrix(value: String(repeating: "1", count: 3000), correction: .low).dimension > 0)
    #expect(throws: LumenQRCodeError.empty) { try LumenQRCodeMatrix(value: "") }
    #expect(throws: LumenQRCodeError.options) { try LumenQRCodeMatrix(value: "A", quietZone: 3) }
    #expect(throws: LumenQRCodeError.capacity) { try LumenQRCodeMatrix(value: String(repeating: "A", count: 100000)) }
    #expect(throws: LumenQRCodeError.capacity) { try LumenQRCodeMatrix(value: String(repeating: "🌞", count: 1000)) }
}

@Test func qrCodeInteroperatesWithVisionDecoder() throws {
    let value = "https://lumen.santi020k.com/日本語?name=Molina🌞"
    for correction in LumenQRCodeCorrection.allCases {
        let matrix = try LumenQRCodeMatrix(value: value, correction: correction)
        let scale = 8
        let side = matrix.dimension * scale
        var pixels = [UInt8](repeating: 255, count: side * side * 4)
        for y in 0..<side {
            for x in 0..<side where matrix.modules[y / scale][x / scale] {
                let offset = (y * side + x) * 4
                pixels[offset] = 0; pixels[offset + 1] = 0; pixels[offset + 2] = 0
            }
        }
        let image = CIImage(bitmapData: Data(pixels), bytesPerRow: side * 4,
                            size: CGSize(width: side, height: side), format: .RGBA8,
                            colorSpace: CGColorSpaceCreateDeviceRGB())
        let request = VNDetectBarcodesRequest()
        request.symbologies = [.qr]
        try VNImageRequestHandler(ciImage: image).perform([request])
        #expect(request.results?.first?.payloadStringValue == value)
    }
}
@Test @MainActor func qrCodeNativeSwiftUIRenderingCanBeScannedAtNarrowAndDesktopWidths() throws {
    let directory = ProcessInfo.processInfo.environment["LUMEN_QRCODE_CAPTURE_DIR"]
    let value = "https://lumen.santi020k.com/日本語?name=Molina🌞"
    for width in [390, 1280] {
        for dark in [false, true] {
            let theme = dark ? LumenTheme.dark : LumenTheme.light
            let view = LumenQRCode("Example QR code", value: value)
                .frame(width: CGFloat(width) - 32, alignment: .leading).padding(16)
                .background(theme.colors.canvas).environment(\.lumenTheme, theme)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            guard let image = renderer.cgImage else { throw LumenQRCodeError.options }
            #expect(image.width == width * 2)
            let request = VNDetectBarcodesRequest()
            request.symbologies = [.qr]
            try VNImageRequestHandler(cgImage: image).perform([request])
            #expect(request.results?.contains { $0.payloadStringValue == value } == true)
            if let directory {
                let url = URL(fileURLWithPath: directory).appendingPathComponent("swift-\(width)-\(dark ? "dark" : "light")-unicode.png")
                guard let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else { throw LumenQRCodeError.options }
                CGImageDestinationAddImage(destination, image, nil)
                #expect(CGImageDestinationFinalize(destination))
            }
        }
    }
}
#endif
