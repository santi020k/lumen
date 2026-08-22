#if os(macOS)
import AppKit
import SwiftUI

public struct LumenShortcut: Hashable {
    public let display: String
    public let keyCode: UInt16
    public let modifiers: NSEvent.ModifierFlags

    public init(
        keyCode: UInt16,
        modifiers: NSEvent.ModifierFlags,
        display: String? = nil
    ) {
        self.keyCode = keyCode
        self.modifiers = modifiers.intersection(.deviceIndependentFlagsMask)
        self.display = display ?? Self.format(
            keyCode: keyCode,
            modifiers: modifiers,
            characters: nil
        )
    }

    public func hash(into hasher: inout Hasher) {
        hasher.combine(keyCode)
        hasher.combine(modifiers.rawValue)
    }

    public static func == (lhs: LumenShortcut, rhs: LumenShortcut) -> Bool {
        lhs.keyCode == rhs.keyCode && lhs.modifiers.rawValue == rhs.modifiers.rawValue
    }

    static func from(_ event: NSEvent) -> LumenShortcut {
        LumenShortcut(
            keyCode: event.keyCode,
            modifiers: event.modifierFlags,
            display: format(
                keyCode: event.keyCode,
                modifiers: event.modifierFlags,
                characters: event.charactersIgnoringModifiers
            )
        )
    }

    static func format(
        keyCode: UInt16,
        modifiers: NSEvent.ModifierFlags,
        characters: String?
    ) -> String {
        let flags = modifiers.intersection(.deviceIndependentFlagsMask)
        var parts: [String] = []

        if flags.contains(.control) { parts.append("⌃") }
        if flags.contains(.option) { parts.append("⌥") }
        if flags.contains(.shift) { parts.append("⇧") }
        if flags.contains(.command) { parts.append("⌘") }

        let specialKeys: [UInt16: String] = [
            36: "↩",
            48: "⇥",
            49: "Space",
            51: "⌫",
            115: "↖",
            116: "⇞",
            119: "↘",
            121: "⇟",
            123: "←",
            124: "→",
            125: "↓",
            126: "↑",
        ]

        if let specialKey = specialKeys[keyCode] {
            parts.append(specialKey)
        } else if let characters, let character = characters.first {
            parts.append(String(character).uppercased())
        } else {
            parts.append("Key \(keyCode)")
        }

        return parts.joined()
    }
}

@MainActor
private final class LumenShortcutRecorderState: ObservableObject {
    @Published var errorMessage: String?
    @Published var isRecording = false
    var monitor: Any?
}

public struct LumenShortcutRecorder: View {
    @Binding private var shortcut: LumenShortcut?
    @Environment(\.lumenTheme) private var theme
    @StateObject private var state = LumenShortcutRecorderState()

    private let label: LocalizedStringKey
    private let validation: ((LumenShortcut) -> String?)?

    public init(
        _ label: LocalizedStringKey,
        shortcut: Binding<LumenShortcut?>,
        validation: ((LumenShortcut) -> String?)? = nil
    ) {
        self.label = label
        _shortcut = shortcut
        self.validation = validation
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            HStack(spacing: LumenSpacing.md) {
                Text(label)
                    .font(.callout.weight(.semibold))
                    .foregroundStyle(theme.colors.ink)

                Spacer(minLength: LumenSpacing.md)

                if state.isRecording {
                    Text("Press keys…")
                        .font(.caption.monospaced())
                        .foregroundStyle(theme.colors.inkMuted)

                    LumenButton("Cancel", intent: .quiet, size: .sm) {
                        stopRecording()
                    }
                } else {
                    if let shortcut {
                        Text(shortcut.display)
                            .font(.caption.weight(.semibold).monospaced())
                            .foregroundStyle(theme.colors.ink)
                            .padding(.horizontal, LumenSpacing.sm)
                            .padding(.vertical, LumenSpacing.xs)
                            .background(theme.colors.surfaceStrong)
                            .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm))
                            .accessibilityLabel("Current shortcut \(shortcut.display)")
                    }

                    LumenButton(shortcut == nil ? "Record…" : "Change…", intent: .secondary, size: .sm) {
                        startRecording()
                    }

                    if shortcut != nil {
                        LumenButton("Clear", intent: .quiet, size: .sm) {
                            shortcut = nil
                            state.errorMessage = nil
                        }
                    }
                }
            }

            if let errorMessage = state.errorMessage {
                HStack(spacing: LumenSpacing.sm) {
                    LumenIcon(
                        systemName: "exclamationmark.triangle",
                        size: .sm,
                        color: theme.colors.warning
                    )
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(theme.colors.warning)
                }
                .accessibilityElement(children: .combine)
            }
        }
        .onDisappear {
            stopRecording()
        }
    }

    private func startRecording() {
        guard state.monitor == nil else { return }

        state.errorMessage = nil
        state.isRecording = true
        state.monitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { event in
            handle(event)
            return nil
        }
    }

    private func stopRecording() {
        if let monitor = state.monitor {
            NSEvent.removeMonitor(monitor)
        }
        state.monitor = nil
        state.isRecording = false
    }

    private func handle(_ event: NSEvent) {
        defer { stopRecording() }

        if event.keyCode == 53 {
            return
        }

        let shortcut = LumenShortcut.from(event)
        let commandModifiers: NSEvent.ModifierFlags = [.command, .control, .option, .shift]

        guard !shortcut.modifiers.intersection(commandModifiers).isEmpty else {
            state.errorMessage = "Include at least one modifier key."
            return
        }

        if let validationMessage = validation?(shortcut) {
            state.errorMessage = validationMessage
            return
        }

        self.shortcut = shortcut
        state.errorMessage = nil
    }
}

public struct LumenSymbolOption: Hashable, Identifiable, Sendable {
    public let category: String
    public let label: String
    public let name: String

    public var id: String { name }

    public init(name: String, label: String, category: String) {
        self.name = name
        self.label = label
        self.category = category
    }

    public static let common: [LumenSymbolOption] = [
        LumenSymbolOption(name: "folder", label: "Folder", category: "Files"),
        LumenSymbolOption(name: "doc", label: "Document", category: "Files"),
        LumenSymbolOption(name: "tray", label: "Tray", category: "Files"),
        LumenSymbolOption(name: "archivebox", label: "Archive", category: "Files"),
        LumenSymbolOption(name: "desktopcomputer", label: "Desktop", category: "Devices"),
        LumenSymbolOption(name: "laptopcomputer", label: "Laptop", category: "Devices"),
        LumenSymbolOption(name: "display", label: "Display", category: "Devices"),
        LumenSymbolOption(name: "iphone", label: "Phone", category: "Devices"),
        LumenSymbolOption(name: "hammer", label: "Build", category: "Work"),
        LumenSymbolOption(name: "wrench.and.screwdriver", label: "Tools", category: "Work"),
        LumenSymbolOption(name: "briefcase", label: "Business", category: "Work"),
        LumenSymbolOption(name: "chart.bar", label: "Analytics", category: "Work"),
        LumenSymbolOption(name: "person.2", label: "People", category: "People"),
        LumenSymbolOption(name: "bubble.left.and.bubble.right", label: "Messages", category: "People"),
        LumenSymbolOption(name: "video", label: "Video", category: "People"),
        LumenSymbolOption(name: "calendar", label: "Calendar", category: "Planning"),
        LumenSymbolOption(name: "checklist", label: "Tasks", category: "Planning"),
        LumenSymbolOption(name: "clock", label: "Time", category: "Planning"),
        LumenSymbolOption(name: "flag", label: "Milestone", category: "Planning"),
        LumenSymbolOption(name: "star", label: "Favorite", category: "General"),
        LumenSymbolOption(name: "heart", label: "Health", category: "General"),
        LumenSymbolOption(name: "house", label: "Home", category: "General"),
        LumenSymbolOption(name: "gearshape", label: "Settings", category: "General"),
    ]
}

public struct LumenSymbolPicker: View {
    @Binding private var selectedName: String
    @Environment(\.lumenTheme) private var theme
    @State private var query = ""

    private let options: [LumenSymbolOption]
    private let title: LocalizedStringKey

    public init(
        _ title: LocalizedStringKey = "Choose a symbol",
        selectedName: Binding<String>,
        options: [LumenSymbolOption] = LumenSymbolOption.common
    ) {
        self.title = title
        _selectedName = selectedName
        self.options = options
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) {
            Text(title)
                .font(.headline)
                .foregroundStyle(theme.colors.ink)

            LumenSearchField("Search symbols", text: $query)

            LumenDivider()

            if matchingOptions.isEmpty {
                LumenEmptyState(
                    "No symbols found",
                    systemName: "magnifyingglass",
                    description: "Try a different search term."
                )
            } else {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: LumenSpacing.lg) {
                        ForEach(categories, id: \.self) { category in
                            VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                                Text(category)
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(theme.colors.inkMuted)

                                LazyVGrid(columns: columns, alignment: .leading, spacing: LumenSpacing.sm) {
                                    ForEach(matchingOptions.filter { $0.category == category }) { option in
                                        symbolButton(option)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private var categories: [String] {
        options.map(\.category).reduce(into: []) { result, category in
            if !result.contains(category) && matchingOptions.contains(where: { $0.category == category }) {
                result.append(category)
            }
        }
    }

    private var columns: [GridItem] {
        [GridItem(.adaptive(minimum: 64, maximum: 88), spacing: LumenSpacing.sm)]
    }

    private var matchingOptions: [LumenSymbolOption] {
        guard !query.isEmpty else { return options }

        return options.filter {
            $0.label.localizedCaseInsensitiveContains(query)
                || $0.name.localizedCaseInsensitiveContains(query)
                || $0.category.localizedCaseInsensitiveContains(query)
        }
    }

    private func symbolButton(_ option: LumenSymbolOption) -> some View {
        let isSelected = selectedName == option.name

        return Button {
            selectedName = option.name
        } label: {
            VStack(spacing: LumenSpacing.xs) {
                LumenIcon(
                    systemName: option.name,
                    size: .md,
                    color: isSelected ? theme.colors.brand : theme.colors.inkSoft
                )
                Text(option.label)
                    .font(.caption2)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, minHeight: 56)
            .padding(.horizontal, LumenSpacing.xs)
            .background(isSelected ? theme.colors.brandSoft : theme.colors.surfaceMuted)
            .overlay {
                RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous)
                    .stroke(isSelected ? theme.colors.brand : theme.colors.line, lineWidth: 1)
            }
            .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous))
        }
        .buttonStyle(.plain)
        .help(option.label)
        .accessibilityLabel(option.label)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

public struct LumenSymbolPickerButton: View {
    @Binding private var selectedName: String
    @Environment(\.lumenTheme) private var theme
    @State private var isPresented = false

    private let label: LocalizedStringKey
    private let options: [LumenSymbolOption]

    public init(
        _ label: LocalizedStringKey = "Choose a symbol",
        selectedName: Binding<String>,
        options: [LumenSymbolOption] = LumenSymbolOption.common
    ) {
        self.label = label
        _selectedName = selectedName
        self.options = options
    }

    public var body: some View {
        Button {
            isPresented = true
        } label: {
            ZStack(alignment: .bottomTrailing) {
                LumenIcon(systemName: selectedName, size: .lg, color: theme.colors.brand)
                    .frame(width: 42, height: 42)
                    .background(theme.colors.brandSoft)
                    .clipShape(RoundedRectangle(cornerRadius: LumenRadius.md, style: .continuous))

                Image(systemName: "pencil.circle.fill")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(theme.colors.onBrand, theme.colors.brandSolid)
                    .offset(x: 4, y: 4)
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .help(Text(label))
        .popover(isPresented: $isPresented, arrowEdge: .bottom) {
            LumenSymbolPicker(label, selectedName: $selectedName, options: options)
                .padding(LumenSpacing.lg)
                .frame(width: 400, height: 480)
                .lumenTheme(theme)
        }
    }
}
#endif
