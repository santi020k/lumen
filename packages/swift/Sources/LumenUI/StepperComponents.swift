#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public enum LumenStepState: String, Sendable {
    case complete, current, upcoming

    public static func resolve(index: Int, currentStep: Int, count: Int) -> Self {
        let current = min(max(0, count), max(0, currentStep))
        if index < current { return .complete }
        return index == current ? .current : .upcoming
    }
}

public struct LumenStepItem: Identifiable, Equatable, Sendable {
    public let id: String
    public let title: String
    public let description: String?

    public init(id: String, title: String, description: String? = nil) {
        self.id = id
        self.title = title
        self.description = description
    }
}

func isLumenStepItemsValid(_ steps: [LumenStepItem]) -> Bool {
    var ids = Set<String>()
    for step in steps {
        if step.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || !ids.insert(step.id).inserted { return false }
    }
    return true
}

public struct LumenStepper: View {
    @Environment(\.lumenTheme) private var theme
    private let label: String
    private let steps: [LumenStepItem]
    private let currentStep: Int
    private let invalidText: String
    private let horizontal: Bool
    private let formatState: (LumenStepState) -> String

    public init(_ label: String, steps: [LumenStepItem], currentStep: Int,
                horizontal: Bool = false, invalidText: String = "Steps unavailable",
                formatState: @escaping (LumenStepState) -> String = {
                    switch $0 {
                    case .complete: "Complete"
                    case .current: "Current"
                    case .upcoming: "Upcoming"
                    }
                }) {
        self.label = label
        self.steps = steps
        self.currentStep = currentStep
        self.invalidText = invalidText
        self.horizontal = horizontal
        self.formatState = formatState
    }

    public var body: some View {
        Group {
            if !isLumenStepItemsValid(steps) {
                Text(invalidText).foregroundStyle(theme.colors.ink)
            } else if horizontal {
                ScrollView(.horizontal) {
                    HStack(alignment: .top, spacing: LumenSpacing.md) { content }
                }
            } else {
                VStack(alignment: .leading, spacing: LumenSpacing.md) { content }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(label))
    }

    private var content: some View {
        ForEach(Array(steps.enumerated()), id: \.element.id) { index, step in
            let state = LumenStepState.resolve(index: index, currentStep: currentStep, count: steps.count)
            HStack(alignment: .top, spacing: LumenSpacing.sm) {
                Text("\(index + 1)")
                    .foregroundStyle(state == .upcoming ? theme.colors.ink : theme.colors.onBrand)
                    .frame(minWidth: 32, minHeight: 32)
                    .background(state == .upcoming ? theme.colors.surfaceMuted : theme.colors.brandSolid,
                                in: Circle())
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                    Text(step.title).font(.callout.weight(.semibold)).foregroundStyle(theme.colors.ink)
                    if let description = step.description {
                        Text(description).foregroundStyle(theme.colors.inkMuted)
                    }
                    Text(formatState(state)).font(.caption).foregroundStyle(theme.colors.inkMuted)
                }
                .fixedSize(horizontal: false, vertical: true)
            }
            .frame(width: horizontal ? 220 : nil, alignment: .leading)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(Text("\(index + 1) / \(steps.count), \(step.title)" +
                                    (step.description.map { ", " + $0 } ?? "")))
            .accessibilityValue(Text(formatState(state)))
            .accessibilityAddTraits(state == .current ? .isSelected : [])
        }
    }
}
#endif
