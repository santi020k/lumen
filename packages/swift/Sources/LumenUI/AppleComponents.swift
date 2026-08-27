#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public enum LumenDateFieldComponents: Sendable {
    case date
    case dateAndTime
    case time

    fileprivate var displayedComponents: DatePickerComponents {
        switch self {
        case .date:
            [.date]
        case .dateAndTime:
            [.date, .hourAndMinute]
        case .time:
            [.hourAndMinute]
        }
    }
}

public enum LumenDateFieldBounds: Equatable, Sendable {
    case closed(ClosedRange<Date>)
    case from(Date)
    case through(Date)
    case unbounded

    public func clamped(_ value: Date) -> Date {
        switch self {
        case let .closed(range):
            min(max(value, range.lowerBound), range.upperBound)
        case let .from(lowerBound):
            max(value, lowerBound)
        case let .through(upperBound):
            min(value, upperBound)
        case .unbounded:
            value
        }
    }
}

func resolveLumenDateRange(
    start: Date,
    end: Date,
    bounds: LumenDateFieldBounds
) -> (start: Date, end: Date) {
    let clampedStart = bounds.clamped(start)
    let clampedEnd = bounds.clamped(end)

    return (clampedStart, max(clampedEnd, clampedStart))
}

/// A token-aware Apple date input with native picker behavior and Lumen validation messaging.
public struct LumenDateField: View {
    @Binding private var selection: Date
    @Environment(\.lumenTheme) private var theme

    private let bounds: LumenDateFieldBounds
    private let components: LumenDateFieldComponents
    private let description: LocalizedStringKey?
    private let errorMessage: LocalizedStringKey?
    private let title: LocalizedStringKey

    public init(
        _ title: LocalizedStringKey,
        selection: Binding<Date>,
        components: LumenDateFieldComponents = .date,
        bounds: LumenDateFieldBounds = .unbounded,
        description: LocalizedStringKey? = nil,
        errorMessage: LocalizedStringKey? = nil
    ) {
        self.title = title
        _selection = selection
        self.components = components
        self.bounds = bounds
        self.description = description
        self.errorMessage = errorMessage
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            datePicker
                .tint(theme.colors.brandSolid)
                .lumenAccessibilityHint(errorMessage ?? description)

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(theme.colors.danger)
                    .fixedSize(horizontal: false, vertical: true)
            } else if let description {
                Text(description)
                    .font(.caption)
                    .foregroundStyle(theme.colors.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .accessibilityElement(children: .contain)
    }

    @ViewBuilder
    private var datePicker: some View {
        switch bounds {
        case let .closed(range):
            DatePicker(
                title,
                selection: boundedSelection,
                in: range,
                displayedComponents: components.displayedComponents
            )
        case let .from(lowerBound):
            DatePicker(
                title,
                selection: boundedSelection,
                in: lowerBound...,
                displayedComponents: components.displayedComponents
            )
        case let .through(upperBound):
            DatePicker(
                title,
                selection: boundedSelection,
                in: ...upperBound,
                displayedComponents: components.displayedComponents
            )
        case .unbounded:
            DatePicker(
                title,
                selection: boundedSelection,
                displayedComponents: components.displayedComponents
            )
        }
    }

    private var boundedSelection: Binding<Date> {
        Binding(
            get: { bounds.clamped(selection) },
            set: { selection = bounds.clamped($0) }
        )
    }
}

/// A coordinated pair of native Apple date inputs that preserves a valid inclusive range.
public struct LumenDateRangeField: View {
    @Binding private var end: Date
    @Binding private var start: Date
    @Environment(\.lumenTheme) private var theme

    private let bounds: LumenDateFieldBounds
    private let components: LumenDateFieldComponents
    private let description: LocalizedStringKey?
    private let endLabel: LocalizedStringKey
    private let errorMessage: LocalizedStringKey?
    private let startLabel: LocalizedStringKey
    private let title: LocalizedStringKey

    public init(
        _ title: LocalizedStringKey,
        start: Binding<Date>,
        end: Binding<Date>,
        components: LumenDateFieldComponents = .date,
        bounds: LumenDateFieldBounds = .unbounded,
        startLabel: LocalizedStringKey = "Start date",
        endLabel: LocalizedStringKey = "End date",
        description: LocalizedStringKey? = nil,
        errorMessage: LocalizedStringKey? = nil
    ) {
        self.title = title
        _start = start
        _end = end
        self.components = components
        self.bounds = bounds
        self.startLabel = startLabel
        self.endLabel = endLabel
        self.description = description
        self.errorMessage = errorMessage
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            Text(title)
                .font(.headline)
                .foregroundStyle(theme.colors.ink)

            LumenDateField(
                startLabel,
                selection: startSelection,
                components: components,
                bounds: bounds
            )

            LumenDateField(
                endLabel,
                selection: endSelection,
                components: components,
                bounds: endBounds
            )

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(theme.colors.danger)
                    .fixedSize(horizontal: false, vertical: true)
            } else if let description {
                Text(description)
                    .font(.caption)
                    .foregroundStyle(theme.colors.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .accessibilityElement(children: .contain)
    }

    private var clampedStart: Date {
        bounds.clamped(start)
    }

    private var endBounds: LumenDateFieldBounds {
        switch bounds {
        case let .closed(range):
            .closed(max(range.lowerBound, clampedStart)...range.upperBound)
        case let .from(lowerBound):
            .from(max(lowerBound, clampedStart))
        case let .through(upperBound):
            .closed(clampedStart...upperBound)
        case .unbounded:
            .from(clampedStart)
        }
    }

    private var startSelection: Binding<Date> {
        Binding(
            get: { resolveLumenDateRange(start: start, end: end, bounds: bounds).start },
            set: { value in
                let range = resolveLumenDateRange(start: value, end: end, bounds: bounds)

                start = range.start
                end = range.end
            }
        )
    }

    private var endSelection: Binding<Date> {
        Binding(
            get: { resolveLumenDateRange(start: start, end: end, bounds: bounds).end },
            set: { value in
                let range = resolveLumenDateRange(start: start, end: value, bounds: bounds)

                start = range.start
                end = range.end
            }
        )
    }
}

/// A token-aware URL action that preserves SwiftUI's native link-opening behavior.
public struct LumenLink<Label: View>: View {
    @Environment(\.lumenTheme) private var theme

    private let destination: URL
    private let label: Label
    private let showsExternalIndicator: Bool

    public init(
        destination: URL,
        showsExternalIndicator: Bool = false,
        @ViewBuilder label: () -> Label
    ) {
        self.destination = destination
        self.label = label()
        self.showsExternalIndicator = showsExternalIndicator
    }

    public var body: some View {
        Link(destination: destination) {
            HStack(spacing: LumenSpacing.xs) {
                label

                if showsExternalIndicator {
                    Image(systemName: "arrow.up.right")
                        .font(.caption2.weight(.semibold))
                        .accessibilityHidden(true)
                }
            }
        }
        .foregroundStyle(theme.colors.brandSolid)
        .underline()
    }
}

public extension LumenLink where Label == Text {
    init(
        _ title: LocalizedStringKey,
        destination: URL,
        showsExternalIndicator: Bool = false
    ) {
        self.init(destination: destination, showsExternalIndicator: showsExternalIndicator) {
            Text(title)
        }
    }
}
#endif
