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

    @MainActor
    func testPhoneCatalogReadyStatesInBothSchemes() {
        let examples: [(String, String)] = [
            ("Agenda", "Project agenda"), ("Cascader", "Destination"),
            ("Color picker", "Accent color"), ("Data table", "Synthetic packages"),
            ("Kanban board", "Project board"), ("Kanban column", "To do"),
            ("Schedule", "Launch schedule"), ("Tree grid", "Synthetic project status"),
            ("Transfer", "Project transfer"), ("Tree select", "Project"),
            ("Rating", "Example rating"), ("Mentions", "Example mentions")
        ]
        for dark in [false, true] {
            for (component, label) in examples {
                let app = launch(component, dark: dark)
                let content = app.descendants(matching: .any).matching(identifier: label).firstMatch
                reveal(content, app: app)
                let slug = component.lowercased().replacingOccurrences(of: " ", with: "-")
                capture(app, name: "\(slug)-\(dark ? "dark" : "light")-ready")
                app.terminate()
            }
        }
    }

    @MainActor
    func testAdditionalCatalogInteractionsInBothSchemes() {
        for dark in [false, true] {
            for (component, label) in [("Timeline", "Example timeline"), ("Table", "Example records"), ("Breadcrumb", "Location"), ("Stepper", "Example progress"), ("Carousel", "Example slides")] {
                let app = launch(component, dark: dark)
                let content = app.descendants(matching: .any).matching(identifier: label).firstMatch
                reveal(content, app: app)
                if component == "Carousel" {
                    let next = app.buttons["Next slide"]
                    reveal(next, app: app)
                    next.tap()
                    XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "Portfolio, slide 2 of 3").firstMatch.waitForExistence(timeout: 5))
                }
                capture(app, name: "\(component.lowercased())-\(dark ? "dark" : "light")-ready")
                app.terminate()
            }
            let tooltip = launch("Tooltip", dark: dark)
            let help = tooltip.buttons["Project privacy help"]
            reveal(help, app: tooltip)
            help.tap()
            XCTAssertTrue(tooltip.staticTexts["This playground uses synthetic project information."].waitForExistence(timeout: 5))
            capture(tooltip, name: "tooltip-\(dark ? "dark" : "light")-ready")
            tooltip.terminate()
            let command = launch("Command", dark: dark)
            let open = command.buttons["Open commands"]
            reveal(open, app: command)
            open.tap()
            XCTAssertTrue(command.descendants(matching: .any).matching(identifier: "Project commands").firstMatch.waitForExistence(timeout: 5))
            let keyboardIntroduction = command.buttons["Continue"]
            if keyboardIntroduction.waitForExistence(timeout: 2) { keyboardIntroduction.tap() }
            let search = command.textFields["Search commands"]
            search.tap()
            search.typeText("preview")
            capture(command, name: "command-\(dark ? "dark" : "light")-ready")
            command.buttons["Toggle preview"].tap()
            XCTAssertTrue(command.staticTexts["Preview enabled"].waitForExistence(timeout: 5))
            command.terminate()
            let tour = launch("Tour", dark: dark)
            let start = tour.buttons["Start tour"]
            reveal(start, app: tour)
            start.tap()
            XCTAssertTrue(tour.staticTexts["Step 1 of 3"].waitForExistence(timeout: 5))
            capture(tour, name: "tour-\(dark ? "dark" : "light")-ready")
            tour.buttons["Next"].tap()
            XCTAssertTrue(tour.staticTexts["Step 2 of 3"].waitForExistence(timeout: 5))
            tour.buttons["Close tour"].tap()
            tour.terminate()
        }
    }

    @MainActor
    func testFinalKanbanBoundaryActionsInBothSchemes() {
        for dark in [false, true] {
            for (component, label) in [("Kanban board", "Project board"), ("Kanban column", "To do")] {
                let app = launch(component, dark: dark)
                let content = app.descendants(matching: .any).matching(identifier: label).firstMatch
                reveal(content, app: app)
                XCTAssertEqual(app.buttons.matching(NSPredicate(format: "label ENDSWITH %@", "position 0")).count, 0)
                let slug = component.lowercased().replacingOccurrences(of: " ", with: "-")
                capture(app, name: "\(slug)-\(dark ? "dark" : "light")-ready")
                app.terminate()
            }
        }
    }

    @MainActor
    func testKanbanColumnCaptureMatchesDocumentation() {
        let app = launch("Kanban column", dark: false)
        let column = app.staticTexts["To do"].firstMatch
        reveal(column, app: app)
        capture(app, name: "kanban-column-light-ready")
        app.terminate()
    }

    @MainActor
    func testTourCaptureMatchesDocumentation() {
        let app = launch("Tour", dark: false)
        let start = app.buttons["Start tour"]
        reveal(start, app: app)
        start.tap()
        XCTAssertTrue(app.staticTexts["Step 1 of 3"].waitForExistence(timeout: 5))
        capture(app, name: "tour-light-ready")
        app.buttons["Next"].tap()
        XCTAssertTrue(app.staticTexts["Step 2 of 3"].waitForExistence(timeout: 5))
        app.buttons["Close tour"].tap()
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
        app.swipeUp()
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
