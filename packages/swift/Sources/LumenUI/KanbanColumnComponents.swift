#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenKanbanColumn<CardContent: View>: View {
    @Binding private var column: LumenKanbanColumnData
    @Environment(\.isEnabled) private var enabled
    private let readOnly: Bool
    private let loading: Bool
    private let error: String?
    private let onAdd: (() -> Void)?
    private let onCardPress: ((String) -> Void)?
    private let addLabel: String
    private let loadingLabel: String
    private let emptyLabel: String
    private let invalidLabel: String
    private let formatCount: (Int, Int?) -> String
    private let formatMove: (String, Int) -> String
    private let formatOpen: (String) -> String
    private let cardContent: (LumenKanbanCard) -> CardContent

    public init(column: Binding<LumenKanbanColumnData>, readOnly: Bool = false,
                loading: Bool = false, error: String? = nil, onAdd: (() -> Void)? = nil,
                onCardPress: ((String) -> Void)? = nil, addLabel: String = "Add card",
                loadingLabel: String = "Loading", emptyLabel: String = "No cards",
                invalidLabel: String = "Invalid column data",
                formatCount: @escaping (Int, Int?) -> String = { count, capacity in capacity.map { "\(count) of \($0) cards" } ?? "\(count) cards" },
                formatMove: @escaping (String, Int) -> String = { "Move \($0) to position \($1)" },
                formatOpen: @escaping (String) -> String = { "Open \($0)" },
                @ViewBuilder cardContent: @escaping (LumenKanbanCard) -> CardContent) {
        _column = column; self.readOnly = readOnly; self.loading = loading; self.error = error
        self.onAdd = onAdd; self.onCardPress = onCardPress; self.addLabel = addLabel
        self.loadingLabel = loadingLabel; self.emptyLabel = emptyLabel; self.invalidLabel = invalidLabel
        self.formatCount = formatCount; self.formatMove = formatMove; self.formatOpen = formatOpen
        self.cardContent = cardContent
    }
    private var interactive: Bool { enabled && !readOnly && !column.disabled && !loading && error == nil }
    private var model: LumenKanbanModel { LumenKanbanModel(columns: [column]) }
    private func move(_ id: String, index: Int) -> Bool {
        guard interactive, let next = model.moving(id, toColumnId: column.id, toIndex: index)?.first else { return false }
        column = next
        return true
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) {
            LumenText(.verbatim(column.label)).accessibilityAddTraits(.isHeader)
            if loading { LumenText(.verbatim(loadingLabel)) }
            else if let error { LumenText(.verbatim(error)) }
            else if !model.valid { LumenText(.verbatim(invalidLabel)) }
            else {
                LumenText(.verbatim(formatCount(column.cards.count, column.capacity)))
                if column.cards.isEmpty { LumenText(.verbatim(emptyLabel)) }
                ForEach(Array(column.cards.enumerated()), id: \.element.id) { index, card in
                    VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                        if interactive && !card.disabled {
                            LumenCard(padding: .md, radius: .md) { cardContent(card) }.draggable(card.id)
                        } else { LumenCard(padding: .md, radius: .md) { cardContent(card) } }
                        if let onCardPress {
                            LumenButton(disabled: column.disabled || card.disabled, action: {
                                if enabled && !column.disabled && !card.disabled { onCardPress(card.id) }
                            }) { Text(formatOpen(card.label)) }
                        }
                        ForEach([index - 1, index + 1], id: \.self) { position in
                            LumenButton(disabled: !interactive || model.moving(card.id, toColumnId: column.id, toIndex: position) == nil,
                                        action: { _ = move(card.id, index: position) }) {
                                Text(formatMove(card.label, position + 1))
                            }
                        }
                    }.dropDestination(for: String.self) { ids, _ in
                        guard ids.count == 1, let id = ids.first else { return false }
                        let current = column.cards.firstIndex(where: { $0.id == id })
                        return move(id, index: current.map { $0 < index ? index - 1 : index } ?? index)
                    }
                }
                if let onAdd {
                    LumenButton(disabled: !interactive || column.capacity.map { column.cards.count >= $0 } == true,
                                action: { if interactive && column.capacity.map({ column.cards.count < $0 }) != false { onAdd() } }) {
                        Text(addLabel)
                    }
                }
            }
        }.frame(minHeight: 88, alignment: .topLeading)
            .accessibilityElement(children: .contain).accessibilityLabel(Text(column.label))
            .dropDestination(for: String.self) { ids, _ in
                guard ids.count == 1, let id = ids.first else { return false }
                return move(id, index: column.cards.filter { $0.id != id }.count)
            }
    }
}
public extension LumenKanbanColumn where CardContent == Text {
    init(column: Binding<LumenKanbanColumnData>, readOnly: Bool = false, loading: Bool = false,
         error: String? = nil, onAdd: (() -> Void)? = nil, onCardPress: ((String) -> Void)? = nil,
         addLabel: String = "Add card", loadingLabel: String = "Loading", emptyLabel: String = "No cards",
         invalidLabel: String = "Invalid column data",
         formatCount: @escaping (Int, Int?) -> String = { count, capacity in capacity.map { "\(count) of \($0) cards" } ?? "\(count) cards" },
         formatMove: @escaping (String, Int) -> String = { "Move \($0) to position \($1)" },
         formatOpen: @escaping (String) -> String = { "Open \($0)" }) {
        self.init(column: column, readOnly: readOnly, loading: loading, error: error, onAdd: onAdd,
                  onCardPress: onCardPress, addLabel: addLabel, loadingLabel: loadingLabel,
                  emptyLabel: emptyLabel, invalidLabel: invalidLabel, formatCount: formatCount,
                  formatMove: formatMove, formatOpen: formatOpen, cardContent: { Text($0.label) })
    }
}
#endif
