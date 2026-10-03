import XCTest

final class WorkspacePerformanceTests: XCTestCase {
    @MainActor
    func testResponsiveApplicationLaunch() {
        let app = XCUIApplication()
        app.launchArguments = ["--destination", "examples"]
        let options = XCTMeasureOptions.default
        options.iterationCount = 5
        measure(metrics: [XCTApplicationLaunchMetric(waitUntilResponsive: true)], options: options) {
            app.launch()
        }
        XCTAssertTrue(app.buttons["Workspace"].firstMatch.waitForExistence(timeout: 10))
    }

    @MainActor
    func testWorkspaceScrolling() {
        let app = XCUIApplication()
        app.launchArguments = ["--destination", "examples"]
        let options = XCTMeasureOptions.default
        options.iterationCount = 5
        options.invocationOptions = [.manuallyStart, .manuallyStop]
        var metrics: [XCTMetric] = [XCTOSSignpostMetric.scrollingAndDecelerationMetric]
        if #available(iOS 26.0, *) {
            metrics.append(XCTHitchMetric(application: app))
        }
        measure(metrics: metrics, options: options) {
            app.terminate()
            app.launch()
            let list = openWorkspace(app)
            XCTAssertTrue(list.staticTexts["Lumen 001"].isHittable)
            startMeasuring()
            list.swipeUp(velocity: .fast)
            list.swipeUp(velocity: .fast)
            stopMeasuring()
            XCTAssertFalse(list.staticTexts["Lumen 001"].isHittable)
        }
    }

    @MainActor
    func testLongNotesSaveWithKeyboardVisible() {
        let app = XCUIApplication()
        app.launchArguments = ["--destination", "examples"]
        app.launch()
        let list = openWorkspace(app)
        let search = app.textFields["Search records"]
        XCTAssertTrue(search.waitForExistence(timeout: 10))
        search.tap()
        search.typeText("Lumen 200")
        list.staticTexts["Lumen 200"].tap()
        let edit = app.buttons["Edit record"]
        XCTAssertTrue(edit.waitForExistence(timeout: 10))
        edit.tap()
        let noteEditor = app.textViews.firstMatch
        XCTAssertTrue(noteEditor.waitForExistence(timeout: 10))
        noteEditor.tap()
        let notes = "Long workspace note. " + String(repeating: "Validated record notes. ", count: 12)
        noteEditor.typeText(notes)
        let save = app.buttons["Save"]
        XCTAssertTrue(app.keyboards.firstMatch.exists)
        XCTAssertTrue(save.isHittable)
        let beforeSave = XCTAttachment(screenshot: app.screenshot())
        beforeSave.name = "Workspace long notes with keyboard"
        beforeSave.lifetime = .keepAlways
        add(beforeSave)
        save.tap()
        let savedNotes = app.staticTexts.matching(NSPredicate(format: "label == %@", notes)).firstMatch
        XCTAssertTrue(savedNotes.waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Changes saved locally"].exists)
        let saved = XCTAttachment(screenshot: app.screenshot())
        saved.name = "Workspace saved notes"
        saved.lifetime = .keepAlways
        add(saved)
    }

    @MainActor
    private func openWorkspace(_ app: XCUIApplication) -> XCUIElement {
        let workspace = app.buttons["Workspace"].firstMatch
        XCTAssertTrue(workspace.waitForExistence(timeout: 10))
        workspace.tap()
        let list = app.descendants(matching: .any)["workspace-records"].firstMatch
        XCTAssertTrue(list.waitForExistence(timeout: 10))
        return list
    }
}
