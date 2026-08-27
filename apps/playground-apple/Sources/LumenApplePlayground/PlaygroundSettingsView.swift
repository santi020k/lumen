import LumenUI
import SwiftUI

enum PlaygroundRuntimeLocale: String, CaseIterable, Identifiable {
    case english = "en"
    case spanish = "es"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .english: "English"
        case .spanish: "Español"
        }
    }

    var copy: PlaygroundLocalizedCopy {
        switch self {
        case .english:
            PlaygroundLocalizedCopy(
                title: "Live localization",
                description: "Application-owned locale state updates this view without recreating it.",
                fieldLabel: "Release note",
                fieldDescription: "Describe what changed for your users.",
                validation: "A release note is required.",
                action: "Validate note",
                success: "The release note is ready."
            )
        case .spanish:
            PlaygroundLocalizedCopy(
                title: "Localización en vivo",
                description: "El estado de idioma de la aplicación actualiza esta vista sin recrearla.",
                fieldLabel: "Nota de la versión",
                fieldDescription: "Describe qué cambió para tus usuarios.",
                validation: "La nota de la versión es obligatoria.",
                action: "Validar nota",
                success: "La nota de la versión está lista."
            )
        }
    }
}

struct PlaygroundLocalizedCopy: Equatable {
    let title: String
    let description: String
    let fieldLabel: String
    let fieldDescription: String
    let validation: String
    let action: String
    let success: String
}

struct PlaygroundSettingsView: View {
    @Environment(\.accessibilityDifferentiateWithoutColor) private var differentiateWithoutColor
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Binding var themePreference: PlaygroundThemePreference
    @Binding var themePreset: PlaygroundThemePreset
    @State private var locale = PlaygroundRuntimeLocale.english
    @State private var releaseNote = ""
    @State private var releaseNoteWasValidated = false
    @State private var showThemeFeedback = false

    var body: some View {
        PlaygroundPage(
            "Settings",
            subtitle: "Preview appearance, understand accessibility context, and review local app resources."
        ) {
            AdaptiveColumns {
                appearanceSection
            } secondary: {
                accessibilitySection
            }
            localizationSection
            AdaptiveColumns {
                appSection
            } secondary: {
                resourcesSection
            }
        }
    }

    private var appearanceSection: some View {
        PlaygroundSection(
            "Appearance",
            description: "Choose a theme and preview the semantic surface hierarchy immediately."
        ) {
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                LumenPicker("Theme", selection: $themePreset, style: .segmented) {
                    ForEach(PlaygroundThemePreset.allCases) { preset in
                        Text(preset.title).tag(preset)
                    }
                }
                LumenPicker("Appearance", selection: $themePreference, style: .segmented) {
                    ForEach(PlaygroundThemePreference.allCases) { preference in
                        Text(preference.title).tag(preference)
                    }
                }
                .onChange(of: themePreference) { _ in
                    showThemeFeedback = true
                }
                .onChange(of: themePreset) { _ in
                    showThemeFeedback = true
                }
                themePreview
                if showThemeFeedback {
                    LumenToast(
                        "Appearance updated",
                        description: "The selected theme now applies across every playground destination.",
                        variant: .success,
                        onDismiss: { showThemeFeedback = false }
                    )
                }
            }
        }
    }

    private var themePreview: some View {
        LumenCard(variant: .accent) {
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                HStack {
                    VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                        LumenText("Theme preview", variant: .label)
                        LumenText(
                            "\(themePreset.title) semantic roles preserve hierarchy in \(themePreference.title.lowercased()) appearance.",
                            variant: .caption,
                            tone: .muted
                        )
                    }
                    Spacer()
                    LumenBadge("\(themePreset.title) · \(themePreference.title)", tone: .accent)
                }
                HStack(spacing: LumenSpacing.sm) {
                    previewSurface("Canvas", tone: .canvas)
                    previewSurface("Surface", tone: .surface)
                    previewSurface("Muted", tone: .muted)
                }
                FlowLayout {
                    LumenBadge("Ready", tone: .success)
                    LumenBadge("Review", tone: .warning)
                    LumenBadge("Blocked", tone: .danger)
                }
            }
        }
    }

    private func previewSurface(_ label: LocalizedStringKey, tone: LumenSurfaceTone) -> some View {
        LumenSurface(tone: tone, padding: .md) {
            LumenText(label, variant: .caption)
                .frame(maxWidth: .infinity)
        }
        .frame(maxWidth: .infinity)
    }

    private var accessibilitySection: some View {
        PlaygroundSection(
            "Accessibility context",
            description: "Read-only values reflect current Apple settings; Lumen responds through SwiftUI environments."
        ) {
            VStack(spacing: LumenSpacing.md) {
                preferenceRow(
                    "Reduce motion",
                    detail: reduceMotion ? "On" : "Off",
                    systemName: "figure.walk.motion"
                )
                LumenDivider()
                preferenceRow(
                    "Differentiate without color",
                    detail: differentiateWithoutColor ? "On" : "Off",
                    systemName: "circle.lefthalf.filled"
                )
                LumenDivider()
                preferenceRow(
                    "Dynamic Type",
                    detail: dynamicTypeDescription,
                    systemName: "textformat.size"
                )
                LumenAlert(variant: .success) {
                    VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                        LumenText("Native preferences active", variant: .label, tone: .success)
                        LumenText(
                            "VoiceOver, focus, Dynamic Type, contrast, and reduced motion remain platform-owned.",
                            tone: .soft
                        )
                    }
                }
            }
        }
    }

    private var appSection: some View {
        PlaygroundSection(
            "App and platform",
            description: "Reference build details are grouped for quick support and review checks."
        ) {
            VStack(spacing: LumenSpacing.md) {
                detailRow("Version", value: appVersion, systemName: "number")
                LumenDivider()
                detailRow("Platform", value: platformName, systemName: "apple.logo")
                LumenDivider()
                detailRow(
                    "Catalog",
                    value: "\(PlaygroundCatalog.componentNames.count) entries",
                    systemName: "square.grid.2x2"
                )
                LumenDivider()
                detailRow("Data collection", value: "None", systemName: "hand.raised")
                LumenStatusBar("Local reference app", tone: .success) {
                    LumenBadge("Offline", tone: .success)
                }
            }
        }
    }

    private var localizationSection: some View {
        let copy = locale.copy
        let validation = releaseNoteWasValidated && releaseNote.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ? LumenTextContent.verbatim(copy.validation)
            : nil

        return PlaygroundSection(
            "Runtime localization",
            description: "Switch application-owned English and Spanish copy while the controls remain mounted."
        ) {
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                LumenPicker("Language", selection: $locale, style: .segmented) {
                    ForEach(PlaygroundRuntimeLocale.allCases) { option in
                        Text(verbatim: option.title).tag(option)
                    }
                }
                LumenText(.verbatim(copy.title), variant: .label)
                LumenText(.verbatim(copy.description), variant: .caption, tone: .muted)
                LumenTextarea(
                    .verbatim(copy.fieldLabel),
                    text: $releaseNote,
                    description: .verbatim(copy.fieldDescription),
                    errorMessage: validation
                )
                LumenButton(.verbatim(copy.action)) {
                    releaseNoteWasValidated = true
                }
                if releaseNoteWasValidated && validation == nil {
                    LumenAlert(variant: .success) {
                        LumenText(.verbatim(copy.success), variant: .label, tone: .success)
                    }
                }
            }
        }
        .environment(\.locale, Locale(identifier: locale.rawValue))
    }

    private var resourcesSection: some View {
        PlaygroundSection(
            "Privacy and resources",
            description: "The playground requires no account and links directly to canonical project information."
        ) {
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                LumenCard(variant: .muted) {
                    VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                        HStack {
                            LumenIcon(systemName: "hand.raised.fill", label: "Privacy")
                            LumenText("Private by default", variant: .label)
                            Spacer()
                            LumenBadge("No analytics", tone: .success)
                        }
                        LumenText(
                            "Example preferences stay in memory and no profile, notification, or release data leaves the device.",
                            variant: .caption,
                            tone: .muted
                        )
                    }
                }
                resourceRow(
                    "Apple documentation",
                    detail: "Components, installation, and platform guidance",
                    destination: safeURL("https://lumen.santi020k.com/docs/apple")
                )
                LumenDivider()
                resourceRow(
                    "Privacy",
                    detail: "Data handling and playground expectations",
                    destination: safeURL("https://lumen.santi020k.com/privacy")
                )
                LumenDivider()
                resourceRow(
                    "Support",
                    detail: "Project help and issue guidance",
                    destination: safeURL("https://lumen.santi020k.com/support")
                )
                LumenDivider()
                resourceRow(
                    "Santiago Molina",
                    detail: "Author and maintainer",
                    destination: safeURL("https://santi020k.com")
                )
            }
        }
    }

    private func preferenceRow(
        _ title: LocalizedStringKey,
        detail: String,
        systemName: String
    ) -> some View {
        LumenSettingsRow(title, description: "System preference", systemName: systemName) {
            LumenBadge(LocalizedStringKey(detail), tone: detail == "On" ? .accent : .neutral)
        }
    }

    private func detailRow(_ title: LocalizedStringKey, value: String, systemName: String) -> some View {
        LumenSettingsRow(title, systemName: systemName) {
            LumenBadge(LocalizedStringKey(value), tone: .neutral)
        }
    }

    private func resourceRow(
        _ title: LocalizedStringKey,
        detail: LocalizedStringKey,
        destination: URL
    ) -> some View {
        LumenListRow {
            LumenIcon(systemName: "link", label: title)
        } content: {
            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                LumenLink(title, destination: destination, showsExternalIndicator: true)
                LumenText(detail, variant: .caption, tone: .muted)
            }
        }
    }

    private var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
            ?? "Development"
    }

    private var dynamicTypeDescription: String {
        String(describing: dynamicTypeSize).replacingOccurrences(of: "_", with: " ").capitalized
    }

    private var platformName: String {
        #if os(macOS)
        "macOS"
        #else
        UIDevice.current.userInterfaceIdiom == .pad ? "iPadOS" : "iOS"
        #endif
    }

    private func safeURL(_ value: String) -> URL {
        URL(string: value) ?? URL(fileURLWithPath: "/")
    }
}
