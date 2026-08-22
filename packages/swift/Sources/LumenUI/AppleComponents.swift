#if os(iOS) || os(macOS)
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
#endif
