import AppKit
import LumenUI
import SwiftUI

private struct AppleCatalogPreview: View {
    var body: some View {
        LumenSurface(tone: .canvas, padding: .lg, radius: .none) {
            VStack(alignment: .leading, spacing: 20) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        LumenText("SwiftUI", variant: .caption, tone: .muted)
                        LumenText("Native component gallery", variant: .title)
                    }
                    Spacer()
                    LumenBadge("Apple", tone: .accent)
                }

                HStack(spacing: 12) {
                    LumenButton("Continue", action: {})
                    LumenButton("Later", intent: .secondary, action: {})
                    LumenButton("Delete", intent: .danger, action: {})
                }

                HStack(spacing: 16) {
                    LumenCard(variant: .muted) {
                        VStack(alignment: .leading, spacing: 8) {
                            LumenBadge("Active", tone: .success)
                            LumenText("Team workspace", variant: .label)
                            LumenText("Shared tokens with native SwiftUI behavior.", tone: .soft)
                        }
                    }

                    LumenAlert(variant: .success) {
                        VStack(alignment: .leading, spacing: 6) {
                            LumenText("Changes saved", variant: .label, tone: .success)
                            LumenText("Your preferences are up to date.", tone: .soft)
                        }
                    }
                }

                LumenBanner(
                    "Native SwiftUI implementation",
                    description: "This image is rendered directly from the LumenUI Swift package.",
                    systemName: "swift",
                    variant: .accent
                )

                HStack(spacing: 16) {
                    LumenStat(
                        "Components",
                        value: "24",
                        detail: "SwiftUI primitives",
                        systemName: "square.grid.2x2",
                        tone: .brand
                    )
                    LumenStat(
                        "Coverage",
                        value: "92%",
                        detail: "Shared semantic roles",
                        systemName: "checkmark.seal",
                        tone: .success
                    )
                    LumenGauge(
                        "Documentation",
                        value: 68,
                        valueLabel: "68%",
                        systemName: "book.closed",
                        tone: .accent
                    )
                    .frame(maxWidth: .infinity)
                }

                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        LumenText("Documentation", variant: .label)
                        Spacer()
                        LumenText("68%", variant: .caption, tone: .muted)
                    }
                    LumenProgress(value: 68, label: "Documentation progress")
                }

                LumenListRow {
                    LumenAvatar(fallback: "SM", label: "Santiago")
                } content: {
                    VStack(alignment: .leading, spacing: 3) {
                        LumenText("Santiago", variant: .label)
                        LumenText("Design systems", variant: .caption, tone: .muted)
                    }
                } trailing: {
                    LumenBadge("Admin")
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .lumenControlDensity(.regular)
        .lumenTheme(.light)
        .frame(width: 820, height: 720)
        .background(Color.white)
    }
}

@main
private struct LumenApplePreviewRenderer {
    @MainActor
    static func main() throws {
        guard CommandLine.arguments.count > 1 else {
            throw PreviewError.missingOutputPath
        }

        let outputURL = URL(fileURLWithPath: CommandLine.arguments[1])
        let renderer = ImageRenderer(content: AppleCatalogPreview())

        renderer.scale = 2

        guard
            let image = renderer.nsImage,
            let tiffData = image.tiffRepresentation,
            let bitmap = NSBitmapImageRep(data: tiffData),
            let pngData = bitmap.representation(using: .png, properties: [:])
        else {
            throw PreviewError.renderFailed
        }

        try pngData.write(to: outputURL, options: .atomic)
    }
}

private enum PreviewError: Error {
    case missingOutputPath
    case renderFailed
}
