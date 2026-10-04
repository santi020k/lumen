#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

public struct LumenKanbanBoard<CardContent: View>: View {
    @Binding private var columns: [LumenKanbanColumnData]
    @Environment(\.isEnabled) private var enabled
    private let label: String
    private let readOnly: Bool
    private let loading: Bool
    private let error: String?
    private let loadingLabel: String
    private let emptyLabel: String
    private let invalidLabel: String
    private let formatMove: (String, String, Int) -> String
    private let cardContent: (LumenKanbanCard) -> CardContent

    public init(_ label: String, columns: Binding<[LumenKanbanColumnData]>, readOnly: Bool = false,
                loading: Bool = false, error: String? = nil, loadingLabel: String = "Loading",
                emptyLabel: String = "No cards", invalidLabel: String = "Invalid board data",
                formatMove: @escaping (String, String, Int) -> String = { "Move \($0) to \($1), position \($2)" },
                @ViewBuilder cardContent: @escaping (LumenKanbanCard) -> CardContent) {
        self.label = label; _columns = columns; self.readOnly = readOnly; self.loading = loading; self.error = error
        self.loadingLabel = loadingLabel; self.emptyLabel = emptyLabel; self.invalidLabel = invalidLabel
        self.formatMove = formatMove; self.cardContent = cardContent
    }
    private var interactive: Bool { enabled && !readOnly && !loading && error == nil }
    private var model: LumenKanbanModel { LumenKanbanModel(columns: columns) }
    private func move(_ cardId: String, to targetId: String, index: Int) -> Bool {
        guard interactive, let next = model.moving(cardId, toColumnId: targetId, toIndex: index) else { return false }
        columns = next
        return true
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.md) {
            LumenText(.verbatim(label)).accessibilityAddTraits(.isHeader)
            if loading { LumenText(.verbatim(loadingLabel)) }
            else if let error { LumenText(.verbatim(error)) }
            else if !model.valid { LumenText(.verbatim(invalidLabel)) }
            else if columns.isEmpty { LumenText(.verbatim(emptyLabel)) }
            else {
                ScrollView(.horizontal) {
                    HStack(alignment: .top, spacing: LumenSpacing.md) {
                        ForEach(columns) { column in
                            VStack(alignment: .leading, spacing: LumenSpacing.md) {
                                LumenText(.verbatim(column.label)).accessibilityAddTraits(.isHeader)
                                if column.cards.isEmpty { LumenText(.verbatim(emptyLabel)) }
                                ForEach(Array(column.cards.enumerated()), id: \.element.id) { index, card in
                                    VStack(alignment: .leading, spacing: LumenSpacing.xs) {
                                        if interactive && !column.disabled && !card.disabled {
                                            LumenCard(padding: .md, radius: .md) { cardContent(card) }.draggable(card.id)
                                        } else { LumenCard(padding: .md, radius: .md) { cardContent(card) } }
                                        ForEach(columns) { target in
                                            let positions = target.id == column.id ? [index - 1, index + 1] : [target.cards.count]
                                            ForEach(positions, id: \.self) { position in
                                                LumenButton(disabled: !interactive || model.moving(card.id, toColumnId: target.id, toIndex: position) == nil,
                                                            action: { _ = move(card.id, to: target.id, index: position) }) {
                                                    Text(formatMove(card.label, target.label, position + 1))
                                                }
                                            }
                                        }
                                    }.dropDestination(for: String.self) { ids, _ in
                                        guard ids.count == 1, let id = ids.first else { return false }
                                        let currentIndex = column.cards.firstIndex(where: { $0.id == id })
                                        return move(id, to: column.id, index: currentIndex.map { $0 < index ? index - 1 : index } ?? index)
                                    }
                                }
                            }.padding(LumenSpacing.md).frame(width: 272, alignment: .leading).frame(minHeight: 88, alignment: .topLeading)
                                .dropDestination(for: String.self) { ids, _ in
                                    guard ids.count == 1, let id = ids.first else { return false }
                                    let count = column.cards.filter { $0.id != id }.count
                                    return move(id, to: column.id, index: count)
                                }
                        }
                    }
                }
            }
        }.accessibilityElement(children: .contain).accessibilityLabel(Text(label))
    }
}
public extension LumenKanbanBoard where CardContent == Text {
    init(_ label: String, columns: Binding<[LumenKanbanColumnData]>, readOnly: Bool = false,
         loading: Bool = false, error: String? = nil, loadingLabel: String = "Loading",
         emptyLabel: String = "No cards", invalidLabel: String = "Invalid board data",
         formatMove: @escaping (String, String, Int) -> String = { "Move \($0) to \($1), position \($2)" }) {
        self.init(label, columns: columns, readOnly: readOnly, loading: loading, error: error,
                  loadingLabel: loadingLabel, emptyLabel: emptyLabel, invalidLabel: invalidLabel,
                  formatMove: formatMove, cardContent: { Text($0.label) })
    }
}
#endif
