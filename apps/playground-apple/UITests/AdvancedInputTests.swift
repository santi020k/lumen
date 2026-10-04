// cspell:words Capacidad
import XCTest

final class AdvancedInputTests: XCTestCase {
    @MainActor
    func testMultiSelectRetainsFilteredValuesAndAppliesImmediately() {
        let app = open("Multi select")
        let choose = app.buttons["Choose cities · 2 selected"]
        reveal(choose, in: app)
        choose.tap()
        let option = app.buttons["Medellín"]
        XCTAssertTrue(option.waitForExistence(timeout: 5))
        option.tap()
        let search = app.textFields["Search cities"]
        search.tap()
        search.typeText("Bog")
        XCTAssertFalse(app.buttons["Medellín"].exists)
        app.buttons["Done"].tap()
        XCTAssertTrue(app.buttons["Choose cities · 3 selected"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Remove retained-city"].exists)
        let remove = app.buttons["Remove medellin"]
        reveal(remove, in: app)
        remove.tap()
        XCTAssertTrue(app.buttons["Choose cities · 2 selected"].exists)
        let readOnly = app.switches["Read-only examples"]
        reveal(readOnly, in: app)
        tapSwitch(readOnly)
        XCTAssertFalse(app.buttons["Choose cities · 2 selected"].isEnabled)
        capture("Native MultiSelect retained selections and read-only controls", app: app)
    }

    @MainActor
    func testRangeEndpointsAdjustAndReadOnlyValuesRemainAccessible() {
        let app = XCUIApplication()
        app.launchArguments = ["--component", "Range slider"]
        app.launch()
        XCTAssertTrue(app.staticTexts["Forms"].waitForExistence(timeout: 10))
        let minimum = app.sliders["Capacity · Minimum"]
        reveal(minimum, in: app)
        minimum.adjust(toNormalizedSliderPosition: 0.3)
        let startText = minimum.value as? String
        guard let startText, let start = Double(startText.replacingOccurrences(of: "%", with: "")) else {
            XCTFail("Missing formatted minimum")
            return
        }
        XCTAssertGreaterThan(start, 20)
        XCTAssertLessThanOrEqual(start, 80)
        XCTAssertEqual(start.truncatingRemainder(dividingBy: 10), 0)
        let maximum = app.sliders["Capacity · Maximum"]
        reveal(maximum, in: app)
        XCTAssertEqual(maximum.value as? String, "80%")
        maximum.adjust(toNormalizedSliderPosition: 0.6)
        guard let endText = maximum.value as? String,
            let end = Double(endText.replacingOccurrences(of: "%", with: "")) else {
            XCTFail("Missing formatted maximum")
            return
        }
        XCTAssertLessThan(end, 80)
        XCTAssertGreaterThanOrEqual(end, start)
        XCTAssertEqual(end.truncatingRemainder(dividingBy: 10), 0)
        XCTAssertEqual(minimum.value as? String, startText)
        let readOnly = app.sliders["Capacidad · Mínimo"]
        reveal(readOnly, in: app)
        XCTAssertFalse(readOnly.isEnabled)
        XCTAssertEqual(readOnly.value as? String, "20 %")
        capture("Native range endpoints and localized read-only values", app: app)
    }

    @MainActor
    func testPasswordRevealResetsAfterDisabling() {
        let app = open("Password field")
        let secure = app.secureTextFields["Example password"]
        reveal(secure, in: app)
        XCTAssertTrue(secure.exists)
        let show = app.buttons["Show password"]
        reveal(show, in: app)
        show.tap()
        XCTAssertTrue(app.textFields["Example password"].waitForExistence(timeout: 5))
        let readOnly = app.switches["Read-only examples"]
        reveal(readOnly, in: app)
        tapSwitch(readOnly)
        XCTAssertEqual(readOnly.value as? String, "1")
        XCTAssertTrue(app.secureTextFields["Example password"].waitForExistence(timeout: 5))
        tapSwitch(readOnly)
        XCTAssertEqual(readOnly.value as? String, "0")
        XCTAssertTrue(app.secureTextFields["Example password"].exists)
        capture("Password masked after re-enabling", app: app)
    }

    @MainActor
    func testNumberSteppingAndSpanishDraft() {
        let app = open("Number field")
        let number = app.textFields["Quantity"]
        reveal(number, in: app)
        XCTAssertEqual(number.value as? String, "12.5")
        let increase = app.buttons["Increase value"]
        reveal(increase, in: app)
        increase.tap()
        XCTAssertEqual(number.value as? String, "12.6")
        let spanish = app.switches["Español"]
        reveal(spanish, in: app)
        tapSwitch(spanish)
        XCTAssertEqual(spanish.value as? String, "1")
        let localized = app.textFields["Cantidad"]
        XCTAssertTrue(localized.waitForExistence(timeout: 5))
        let draft = expectation(for: NSPredicate(format: "value == %@", "12,5"), evaluatedWith: localized)
        wait(for: [draft], timeout: 5)
        capture("Localized number draft", app: app)
    }

    @MainActor
    func testAutocompleteSelectsNativeResult() {
        let app = open("Autocomplete")
        let city = app.textFields["City"]
        reveal(city, in: app)
        city.tap()
        city.typeText("Bo")
        let result = app.buttons["Bogotá"]
        XCTAssertTrue(result.waitForExistence(timeout: 5))
        reveal(result, in: app)
        result.tap()
        XCTAssertEqual(city.value as? String, "Bogotá")
        XCTAssertFalse(app.buttons["Close results"].exists)
        capture("Native autocomplete selection", app: app)
    }

    @MainActor
    func testAdvancedControlLayouts() {
        for component in ["Number field", "Time field", "Autocomplete", "Password field", "Input OTP", "Image comparison"] {
            let app = open(component)
            let advanced = app.staticTexts["Advanced inputs"]
            reveal(advanced, in: app)
            app.scrollViews.firstMatch.swipeUp()
            capture(component, app: app)
            app.terminate()
        }
    }

    @MainActor
    private func open(_ component: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--component", component]
        app.launch()
        XCTAssertTrue(app.staticTexts["Advanced inputs"].waitForExistence(timeout: 10))
        return app
    }

    @MainActor
    private func reveal(_ element: XCUIElement, in app: XCUIApplication) {
        for _ in 0..<8 {
            if element.isHittable { return }
            if element.frame.midY < app.frame.midY {
                app.scrollViews.firstMatch.swipeDown()
            } else {
                app.scrollViews.firstMatch.swipeUp()
            }
        }
        XCTAssertTrue(element.isHittable)
    }

    @MainActor
    private func tapSwitch(_ toggle: XCUIElement) {
        // SwiftUI exposes the complete label row; tap the native switch at its trailing edge.
        toggle.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.5)).tap()
    }

    @MainActor
    private func capture(_ name: String, app: XCUIApplication) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
