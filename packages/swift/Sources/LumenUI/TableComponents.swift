#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenTable: View {
    private let label: String
    private let columns: [LumenTableColumn]
    private let rows: [LumenTableRow]
    private let layout: LumenTableLayout
    private let emptyLabel: String
    private let invalidLabel: String
    private let missingLabel: String
    public init(_ label: String, columns: [LumenTableColumn], rows: [LumenTableRow],
                layout: LumenTableLayout = .records, emptyLabel: String = "No records",
                invalidLabel: String = "Invalid table data", missingLabel: String = "") {
        self.label = label; self.columns = columns; self.rows = rows; self.layout = layout
        self.emptyLabel = emptyLabel; self.invalidLabel = invalidLabel; self.missingLabel = missingLabel
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) {
            Text(label).font(.headline)
            if !LumenTableModel.isValid(columns: columns, rows: rows) { Text(invalidLabel) }
            else if rows.isEmpty || columns.isEmpty { Text(emptyLabel) }
            else { LumenNativeTableContent(columns: columns, rows: rows, layout: layout, missingLabel: missingLabel) }
        }
        .accessibilityElement(children: .contain).accessibilityLabel(Text(label))
    }
}

public struct LumenDataTable: View {
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.locale) private var locale
    private let label: String
    private let columns: [LumenTableColumn]
    private let rows: [LumenTableRow]
    private let layout: LumenTableLayout
    private let sort: Binding<LumenTableSort?>?
    private let sortMode: LumenTableSortMode
    private let selection: Binding<Set<String>>?
    private let readOnly: Bool
    private let loading: Bool
    private let error: String?
    private let onRetry: (() -> Void)?
    private let loadingLabel: String
    private let emptyLabel: String
    private let invalidLabel: String
    private let missingLabel: String
    private let retryLabel: String
    private let selectAllLabel: String
    private let deselectAllLabel: String
    private let formatSort: (LumenTableSort?) -> String

    public init(_ label: String, columns: [LumenTableColumn], rows: [LumenTableRow],
                layout: LumenTableLayout = .records, sort: Binding<LumenTableSort?>? = nil,
                sortMode: LumenTableSortMode = .manual, selection: Binding<Set<String>>? = nil,
                readOnly: Bool = false, loading: Bool = false, error: String? = nil,
                onRetry: (() -> Void)? = nil, loadingLabel: String = "Loading", emptyLabel: String = "No records",
                invalidLabel: String = "Invalid table data", missingLabel: String = "", retryLabel: String = "Retry",
                selectAllLabel: String = "Select visible", deselectAllLabel: String = "Deselect visible",
                formatSort: @escaping (LumenTableSort?) -> String = { $0?.direction.rawValue ?? "" }) {
        self.label = label; self.columns = columns; self.rows = rows; self.layout = layout
        self.sort = sort; self.sortMode = sortMode; self.selection = selection
        self.readOnly = readOnly; self.loading = loading; self.error = error; self.onRetry = onRetry
        self.loadingLabel = loadingLabel; self.emptyLabel = emptyLabel; self.invalidLabel = invalidLabel
        self.missingLabel = missingLabel; self.retryLabel = retryLabel
        self.selectAllLabel = selectAllLabel; self.deselectAllLabel = deselectAllLabel; self.formatSort = formatSort
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) {
            Text(label).font(.headline)
            if loading { ProgressView { Text(loadingLabel) } }
            else if let error {
                Text(error)
                if let onRetry { LumenButton(intent: .secondary, action: onRetry) { Text(retryLabel) } }
            } else if !LumenTableModel.isValid(columns: columns, rows: rows) { Text(invalidLabel) }
            else if rows.isEmpty || columns.isEmpty { Text(emptyLabel) }
            else {
                if let selection {
                    let available = rows.filter { !$0.isDisabled }
                    let allSelected = !available.isEmpty && available.allSatisfy { selection.wrappedValue.contains($0.id) }
                    LumenButton(intent: .secondary, disabled: readOnly || available.isEmpty, action: {
                        if isEnabled && !readOnly {
                            selection.wrappedValue = LumenTableModel.togglingVisible(rows, selection: selection.wrappedValue)
                        }
                    }) { Text(allSelected ? deselectAllLabel : selectAllLabel) }
                }
                LumenNativeTableContent(columns: columns,
                    rows: LumenTableModel.sorted(rows, columns: columns, sort: sort?.wrappedValue, mode: sortMode, locale: locale),
                    layout: layout, missingLabel: missingLabel, sort: sort, selection: selection,
                    readOnly: readOnly, formatSort: formatSort)
            }
        }
        .accessibilityElement(children: .contain).accessibilityLabel(Text(label))
    }
}

private struct LumenNativeTableContent: View {
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.lumenTheme) private var theme
    let columns: [LumenTableColumn]
    let rows: [LumenTableRow]
    let layout: LumenTableLayout
    let missingLabel: String
    var sort: Binding<LumenTableSort?>? = nil
    var selection: Binding<Set<String>>? = nil
    var readOnly: Bool = false
    var formatSort: (LumenTableSort?) -> String = { $0?.direction.rawValue ?? "" }

    var body: some View {
        if layout == .scroll { ScrollView(.horizontal) { content } }
        else { content }
    }
    private var content: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) {
            if layout == .scroll {
                HStack(alignment: .top, spacing: 0) {
                    ForEach(columns) { column in header(column).frame(width: 180, alignment: .leading) }
                }.padding(LumenSpacing.sm)
            } else if sort != nil {
                VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                    ForEach(columns.filter(\.sortable)) { column in header(column) }
                }
            }
            ForEach(rows) { row in
                VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                    if let selection {
                        LumenCheckbox(row.label, isChecked: Binding(
                            get: { selection.wrappedValue.contains(row.id) },
                            set: { checked in
                                if isEnabled && !readOnly && !row.isDisabled && checked != selection.wrappedValue.contains(row.id) {
                                    selection.wrappedValue = LumenTableModel.toggling(row, selection: selection.wrappedValue)
                                }
                            }))
                            .disabled(readOnly || row.isDisabled)
                    }
                    if layout == .scroll {
                        HStack(alignment: .top, spacing: 0) {
                            ForEach(columns) { column in cell(row, column).frame(width: 180, alignment: .leading) }
                        }
                    } else {
                        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                            ForEach(columns) { column in cell(row, column) }
                        }
                    }
                }
                .padding(LumenSpacing.sm)
                .overlay(RoundedRectangle(cornerRadius: LumenRadius.md).stroke(theme.colors.line, lineWidth: 1))
                .accessibilityElement(children: .contain).accessibilityLabel(Text(row.label))
            }
        }
    }
    @ViewBuilder private func header(_ column: LumenTableColumn) -> some View {
        if column.sortable, let sort {
            LumenButton(intent: .secondary, disabled: readOnly, action: {
                if isEnabled && !readOnly { sort.wrappedValue = LumenTableSort.next(sort.wrappedValue, key: column.key) }
            }) {
                Text(column.label + (sort.wrappedValue?.key == column.key ? ", " + formatSort(sort.wrappedValue) : ""))
            }
        } else { Text(column.label).font(.callout.weight(.semibold)) }
    }
    private func cell(_ row: LumenTableRow, _ column: LumenTableColumn) -> some View {
        VStack(alignment: .leading, spacing: LumenSpacing.xs) {
            if layout == .records { Text(column.label).font(.caption).foregroundStyle(theme.colors.inkMuted) }
            Text(row.cells[column.key]?.text ?? missingLabel).foregroundStyle(theme.colors.ink)
        }
        .fixedSize(horizontal: false, vertical: true)
        .padding(LumenSpacing.sm)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(column.label + ", " + (row.cells[column.key]?.text ?? missingLabel)))
    }
}
#endif
