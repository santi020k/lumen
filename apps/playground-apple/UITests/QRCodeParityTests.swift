import XCTest

final class QRCodeParityTests: XCTestCase {
    @MainActor
    func testQRCodeRendersAndRecoversInLightAndDarkAppearance() {
        for dark in [false, true] {
            let app = XCUIApplication()
            app.launchArguments = ["--component", "QR code"] + (dark ? ["--dark"] : [])
            app.launch()
            let code = app.images["Example QR code"]
            XCTAssertTrue(code.waitForExistence(timeout: 15))
            reveal(code, app: app)
            assertQRCodeValue(app, expected: "https://lumen.santi020k.com", name: dark ? "swift-dark-ready" : "swift-light-ready")
            app.buttons["Unicode"].tap()
            reveal(code, app: app)
            assertQRCodeValue(app, expected: "https://lumen.santi020k.com/日本語?name=Molina🌞", name: dark ? "swift-dark-unicode" : "swift-light-unicode")
            let language = app.buttons["English / Español"]
            reveal(language, app: app)
            language.tap()
            let empty = app.buttons["Vacío"]
            reveal(empty, app: app)
            empty.tap()
            let error = app.staticTexts["No se pudo generar el código QR"]
            XCTAssertTrue(error.waitForExistence(timeout: 5))
            reveal(error, app: app)
            capture(app, name: dark ? "swift-dark-empty-es" : "swift-light-empty-es")
            XCTAssertFalse(app.images["Código QR de ejemplo"].exists)
            app.buttons["Exceso"].tap()
            XCTAssertTrue(error.exists)
            app.buttons["Restaurar"].tap()
            let restored = app.images["Código QR de ejemplo"]
            XCTAssertTrue(restored.waitForExistence(timeout: 5))
            reveal(restored, app: app)
            assertQRCodeValue(app, expected: "https://lumen.santi020k.com", name: dark ? "swift-dark-restored-es" : "swift-light-restored-es")
            app.terminate()
        }
    }

    @MainActor private func reveal(_ element: XCUIElement, app: XCUIApplication) {
        for _ in 0..<8 where !element.isHittable {
            if element.frame.minY < app.frame.minY { app.swipeDown() } else { app.swipeUp() }
        }
        XCTAssertTrue(element.isHittable)
    }

    @MainActor private func capture(_ app: XCUIApplication, name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    @MainActor private func assertQRCodeValue(_ app: XCUIApplication, expected: String, name: String) {
        app.swipeUp()
        let caption = app.staticTexts[expected]
        if caption.exists { reveal(caption, app: app) }
        capture(app, name: name)
        XCTAssertTrue(app.images.allElementsBoundByIndex.contains { ($0.value as? String) == expected })
    }
}
