#if os(macOS)
import AppKit
import Testing
@testable import LumenUI

@MainActor
private final class KeyDeliveryView: NSView {
    private(set) var receivedCharacters: [String] = []

    override var acceptsFirstResponder: Bool { true }

    override func keyDown(with event: NSEvent) {
        receivedCharacters.append(event.characters ?? "")
    }
}

@MainActor
private func activateForKeyDelivery(_ app: NSApplication) {
    if #available(macOS 14.0, *) {
        app.activate()
    } else {
        app.activate(ignoringOtherApps: false)
    }
}

@MainActor
private func syntheticKeyDown(windowNumber: Int) throws -> NSEvent {
    try #require(
        NSEvent.keyEvent(
            with: .keyDown,
            location: .zero,
            modifierFlags: [],
            timestamp: ProcessInfo.processInfo.systemUptime,
            windowNumber: windowNumber,
            context: nil,
            characters: "k",
            charactersIgnoringModifiers: "k",
            isARepeat: false,
            keyCode: 40
        )
    )
}

@Suite(.serialized)
struct MacShortcutRecorderTests {
    @MainActor @Test
    func enabledRecorderCapturesSyntheticKeyDownAndRestoresNormalDeliveryAfterStop() throws {
        let app = NSApplication.shared
        let previousPolicy = app.activationPolicy()
        try #require(app.setActivationPolicy(.accessory))
        defer { app.setActivationPolicy(previousPolicy) }
        let state = LumenShortcutRecorderState()
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 320, height: 120),
            styleMask: [.titled],
            backing: .buffered,
            defer: false
        )
        window.isReleasedWhenClosed = false
        let receiver = KeyDeliveryView(frame: window.contentLayoutRect)
        window.contentView = receiver
        window.makeKeyAndOrderFront(nil)
        defer {
            state.stopRecording()
            window.close()
        }
        try #require(window.makeFirstResponder(receiver))
        activateForKeyDelivery(app)

        app.sendEvent(try syntheticKeyDown(windowNumber: window.windowNumber))
        #expect(receiver.receivedCharacters == ["k"])

        var captured: LumenShortcut?
        state.startRecording(isEnabled: true) { event in
            captured = LumenShortcut.from(event)
            state.stopRecording()
        }
        #expect(state.isRecording)
        #expect(state.monitor != nil)

        app.sendEvent(try syntheticKeyDown(windowNumber: window.windowNumber))

        #expect(captured != nil)
        #expect(!state.isRecording)
        #expect(state.monitor == nil)
        #expect(receiver.receivedCharacters == ["k"])

        app.sendEvent(try syntheticKeyDown(windowNumber: window.windowNumber))
        #expect(receiver.receivedCharacters == ["k", "k"])
    }

    @MainActor @Test
    func disablingWhileRecordingStopsMonitorAndRestoresNormalKeyDelivery() throws {
        let app = NSApplication.shared
        let previousPolicy = app.activationPolicy()
        try #require(app.setActivationPolicy(.accessory))
        defer { app.setActivationPolicy(previousPolicy) }
        let state = LumenShortcutRecorderState()
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 320, height: 120),
            styleMask: [.titled],
            backing: .buffered,
            defer: false
        )
        window.isReleasedWhenClosed = false
        let receiver = KeyDeliveryView(frame: window.contentLayoutRect)
        window.contentView = receiver
        window.makeKeyAndOrderFront(nil)
        defer {
            state.stopRecording()
            window.close()
        }
        try #require(window.makeFirstResponder(receiver))
        activateForKeyDelivery(app)

        var captured: LumenShortcut?
        state.startRecording(isEnabled: true) { event in
            captured = LumenShortcut.from(event)
            state.stopRecording()
        }
        #expect(state.isRecording)

        state.setEnabled(false)
        #expect(!state.isRecording)
        #expect(state.monitor == nil)

        app.sendEvent(try syntheticKeyDown(windowNumber: window.windowNumber))
        #expect(captured == nil)
        #expect(receiver.receivedCharacters == ["k"])

        state.setEnabled(true)
        #expect(!state.isRecording)
        #expect(state.monitor == nil)

        app.sendEvent(try syntheticKeyDown(windowNumber: window.windowNumber))
        #expect(captured == nil)
        #expect(receiver.receivedCharacters == ["k", "k"])
    }

    @MainActor @Test
    func startingWhileDisabledDoesNotInstallMonitor() throws {
        let app = NSApplication.shared
        let previousPolicy = app.activationPolicy()
        try #require(app.setActivationPolicy(.accessory))
        defer { app.setActivationPolicy(previousPolicy) }
        let state = LumenShortcutRecorderState()
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 320, height: 120),
            styleMask: [.titled],
            backing: .buffered,
            defer: false
        )
        window.isReleasedWhenClosed = false
        let receiver = KeyDeliveryView(frame: window.contentLayoutRect)
        window.contentView = receiver
        window.makeKeyAndOrderFront(nil)
        defer {
            state.stopRecording()
            window.close()
        }
        try #require(window.makeFirstResponder(receiver))
        activateForKeyDelivery(app)

        var captured: LumenShortcut?
        state.startRecording(isEnabled: false) { event in
            captured = LumenShortcut.from(event)
        }
        #expect(!state.isRecording)
        #expect(state.monitor == nil)

        app.sendEvent(try syntheticKeyDown(windowNumber: window.windowNumber))
        #expect(captured == nil)
        #expect(receiver.receivedCharacters == ["k"])
    }
}
#endif
