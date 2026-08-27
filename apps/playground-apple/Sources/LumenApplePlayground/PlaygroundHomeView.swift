import LumenUI
import SwiftUI

struct PlaygroundHomeView: View {
    let openDestination: (PlaygroundDestination) -> Void

    var body: some View {
        PlaygroundPage(
            "Release workspace",
            subtitle: "Review the Apple reference surface, exercise product patterns, and inspect every public component."
        ) {
            compactHero
            AdaptiveColumns {
                readinessCard
            } secondary: {
                categoryChart
            }
            AdaptiveColumns {
                featuredWorkflows
            } secondary: {
                quickActions
            }
            LumenAlert(variant: .success) {
                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    LumenText("Reference workspace ready", variant: .label, tone: .success)
                    LumenText(
                        "All four destinations are available locally with no account, analytics, or network dependency.",
                        tone: .soft
                    )
                }
            }
        }
    }

    private var compactHero: some View {
        LumenCard(variant: .accent) {
            ViewThatFits(in: .horizontal) {
                HStack(alignment: .center, spacing: LumenSpacing.lg) {
                    heroCopy
                    Spacer(minLength: LumenSpacing.md)
                    heroActions
                }
                VStack(alignment: .leading, spacing: LumenSpacing.md) {
                    heroCopy
                    heroActions
                }
            }
        }
    }

    private var heroCopy: some View {
        HStack(alignment: .top, spacing: LumenSpacing.md) {
            LumenSurface(tone: .muted, padding: .md) {
                LumenIcon(name: .sparkles, size: .lg, label: "Lumen")
            }
            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                FlowLayout {
                    LumenBadge("SwiftUI", tone: .accent)
                    LumenBadge("\(PlaygroundCatalog.componentNames.count) components", tone: .neutral)
                }
                LumenText("Component release workspace", variant: .title)
                LumenText(
                    "A production-shaped reference for Apple platform components and states.",
                    variant: .caption,
                    tone: .muted
                )
            }
        }
    }

    private var heroActions: some View {
        FlowLayout {
            LumenButton("Open examples") { openDestination(.examples) }
            LumenButton("Browse catalog", intent: .secondary) { openDestination(.components) }
        }
    }

    private var readinessCard: some View {
        PlaygroundSection(
            "Release readiness",
            description: "Workspace structure and deterministic launch behavior are available for review."
        ) {
            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                HStack(alignment: .center, spacing: LumenSpacing.md) {
                    LumenGauge(
                        "Workspace readiness",
                        value: 100,
                        valueLabel: "100%",
                        systemName: "checkmark.seal",
                        tone: .success
                    )
                    .frame(maxWidth: 150)
                    VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                        readinessRow("Destinations", value: "4 of 4", tone: .success)
                        readinessRow("Product patterns", value: "3", tone: .accent)
                        readinessRow("Launch modes", value: "Standard · Filtered", tone: .neutral)
                    }
                }
                LumenProgress(value: 100, label: "Reference workspace coverage")
                LumenButton("Review release pattern", intent: .secondary) {
                    openDestination(.examples)
                }
            }
        }
    }

    private func readinessRow(
        _ label: LocalizedStringKey,
        value: LocalizedStringKey,
        tone: LumenBadgeTone
    ) -> some View {
        HStack {
            LumenText(label, variant: .caption, tone: .muted)
            Spacer()
            LumenBadge(value, tone: tone)
        }
    }

    private var categoryChart: some View {
        PlaygroundSection(
            "Catalog distribution",
            description: "Actual public playground entries grouped by product intent."
        ) {
            LumenBarChart(
                label: "Components by category",
                series: PlaygroundCatalog.categoryChartSeries,
                summary: "\(PlaygroundCatalog.componentNames.count) components across six product categories.",
                showData: false
            )
        }
    }

    private var featuredWorkflows: some View {
        PlaygroundSection(
            "Featured workflows",
            description: "Complete patterns demonstrate how primitives behave together."
        ) {
            VStack(spacing: LumenSpacing.sm) {
                workflowRow(
                    "Release readiness",
                    detail: "Validation, review progress, sync states, and approval",
                    systemName: "checkmark.seal"
                )
                LumenDivider()
                workflowRow(
                    "Catalog health",
                    detail: "Factual category metrics, trend context, and recovery",
                    systemName: "chart.xyaxis.line"
                )
                LumenDivider()
                workflowRow(
                    "Contributor profile",
                    detail: "Onboarding, preferences, save feedback, and reset",
                    systemName: "person.crop.circle"
                )
            }
        }
    }

    private func workflowRow(
        _ title: LocalizedStringKey,
        detail: LocalizedStringKey,
        systemName: String
    ) -> some View {
        LumenListRow {
            LumenIcon(systemName: systemName, label: title)
        } content: {
            VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                LumenText(title, variant: .label)
                LumenText(detail, variant: .caption, tone: .muted)
            }
        } trailing: {
            LumenBadge("Example", tone: .accent)
        }
    }

    private var quickActions: some View {
        PlaygroundSection(
            "Quick actions",
            description: "Move directly to the reference area needed for the current review."
        ) {
            VStack(spacing: LumenSpacing.sm) {
                destinationRow(
                    "Explore product patterns",
                    detail: "Three interactive, composed flows",
                    systemName: "rectangle.stack",
                    destination: .examples
                )
                LumenDivider()
                destinationRow(
                    "Find a component",
                    detail: "Search or filter by category",
                    systemName: "square.grid.2x2",
                    destination: .components
                )
                LumenDivider()
                destinationRow(
                    "Review environment",
                    detail: "Theme, accessibility, platform, and privacy",
                    systemName: "gearshape",
                    destination: .settings
                )
            }
        }
    }

    private func destinationRow(
        _ title: LocalizedStringKey,
        detail: LocalizedStringKey,
        systemName: String,
        destination: PlaygroundDestination
    ) -> some View {
        LumenCard(variant: .muted, action: { openDestination(destination) }) {
            LumenListRow {
                LumenIcon(systemName: systemName, label: title)
            } content: {
                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    LumenText(title, variant: .label)
                    LumenText(detail, variant: .caption, tone: .muted)
                }
            } trailing: {
                LumenIcon(systemName: "chevron.right", label: "Open")
            }
        }
    }
}
