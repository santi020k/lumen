import XCTest

final class CatalogParityInteractionTests: XCTestCase {
    @MainActor
    func testCalendarControlledSelectionAndBoundsInBothSchemes() {
        for dark in [false, true] {
            let app = launch("Calendar", dark: dark)
            let day = app.buttons["2026-03-09"]
            reveal(day, app: app)
            day.tap()
            XCTAssertTrue(app.staticTexts["Selected: 2026-03-09"].waitForExistence(timeout: 5))
            let next = app.buttons["Next month"]
            reveal(next, app: app)
            next.tap()
            XCTAssertTrue(app.staticTexts["2026-04"].waitForExistence(timeout: 5))
            capture(app, name: "calendar-\(dark ? "dark" : "light")-selected")
            XCTAssertFalse(app.buttons["2026-04-21"].isEnabled)
            app.terminate()
        }
    }

    @MainActor
    func testTreeDisclosurePreservesUnknownSelection() {
        let app = launch("Tree", dark: false)
        let expand = app.buttons["Expand Reports"]
        reveal(expand, app: app)
        expand.tap()
        XCTAssertTrue(app.staticTexts["Quarterly report"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Selected: missing-record"].exists)
        let collapse = app.buttons["Collapse Reports"]
        reveal(collapse, app: app)
        collapse.tap()
        XCTAssertFalse(app.staticTexts["Quarterly report"].exists)
        capture(app, name: "tree-light-disclosure")
        app.terminate()
    }

    @MainActor private func launch(_ component: String, dark: Bool) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--component", component] + (dark ? ["--dark"] : [])
        app.launch()
        return app
    }

    @MainActor private func reveal(_ element: XCUIElement, app: XCUIApplication) {
        XCTAssertTrue(element.waitForExistence(timeout: 15))
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
}
