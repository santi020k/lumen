import XCTest
@testable import LumenUI

final class ColorPickerTests: XCTestCase {
    func testParsingAndOpacity() {
        for (input, expected) in [("#123", "#112233ff"), ("#1234", "#11223344"), ("#ABCDEF", "#abcdefff"), ("#11223300", "#11223300"), ("rgba(255, 128, 0, .5)", "#ff800080")] {
            XCTAssertEqual(LumenColor.parse(input).flatMap { LumenColor.format($0, allowAlpha: true) }, expected)
        }
        XCTAssertNil(LumenColor.format(LumenRGBA(red: 0, green: 0, blue: 0, alpha: 0)))
    }
    func testHexRejectsNonAsciiDigitGraphemes() {
        for input in ["#1️⃣23", "#1️23", "#１２３", "#١٢٣", "#a\u{FE0F}bc", "#a\u{200D}bc"] {
            XCTAssertNil(LumenColor.parse(input))
        }
        XCTAssertEqual(LumenColor.parse("#123"), LumenRGBA(red: 17, green: 34, blue: 51))
    }
    func testMalformedAndBounds() {
        for input in ["", "#12", "#gg0000", "red", "rgba(1,2,3,NaN)", "rgba(1.2,2,3,1)", "rgba(256,2,3,1)", "rgba(1,2,3,1e0)", "rgba(1,2,3,-1)", "rgba(1,2,3,2)", String(repeating: "#", count: 1000000)] { XCTAssertNil(LumenColor.parse(input)) }
        XCTAssertNil(LumenColor.format(LumenRGBA(red: 0, green: 0, blue: 0, alpha: .nan)))
        XCTAssertNil(LumenColor.rgba(LumenHSVA(hue: .infinity, saturation: 1, value: 1)))
    }
    func testPaletteFirstValidCanonicalColorAndStableNames() {
        let palette: [LumenColorSwatch] = [
            .init(id: " ", label: "Missing ID", value: "#f00"),
            .init(id: "unnamed", label: " \n", value: "#f00"),
            .init(id: "white", label: "Malformed first entry", value: "bad"),
            .init(id: "white", label: "First white", value: "#fff", disabled: true),
            .init(id: "alias", label: "Equivalent white", value: "rgba(255,255,255,1)"),
            .init(id: "white", label: "Duplicate ID", value: "#00f"),
            .init(id: "blue", label: "Blue", value: "#00f")
        ]
        let resolved = lumenValidColorPalette(palette, allowAlpha: false)
        XCTAssertEqual(resolved.map(\.label), ["First white", "Blue"])
        XCTAssertTrue(resolved.first?.disabled == true)
        XCTAssertEqual(palette.count, 7)
    }
    func testPaletteAlphaEquivalence() {
        let palette: [LumenColorSwatch] = [
            .init(id: "opaque", label: "Opaque white", value: "#fff"),
            .init(id: "same", label: "Equivalent opaque white", value: "#ffffffff"),
            .init(id: "transparent", label: "Transparent white", value: "#ffffff00")
        ]
        XCTAssertEqual(lumenValidColorPalette(palette, allowAlpha: true).map(\.id), ["opaque", "transparent"])
        XCTAssertEqual(lumenValidColorPalette(palette, allowAlpha: false).map(\.id), ["opaque"])
    }
    func testRoundTripAndLatentChannels() {
        for r in [0,51,128,255] { for g in [0,51,128,255] { for b in [0,51,128,255] {
            let color = LumenRGBA(red: r, green: g, blue: b, alpha: 0)
            XCTAssertEqual(LumenColor.hsva(color).flatMap(LumenColor.rgba), color)
        } } }
        var latent = LumenHSVA(hue: 240, saturation: 1, value: 0, alpha: 0)
        XCTAssertEqual(LumenColor.rgba(latent), LumenRGBA(red: 0, green: 0, blue: 0, alpha: 0))
        latent.value = 1
        XCTAssertEqual(LumenColor.rgba(latent), LumenRGBA(red: 0, green: 0, blue: 255, alpha: 0))
    }
}
