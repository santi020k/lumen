import SwiftUI

public enum LumenCarouselStatus: Sendable { case ready, loading, error }
public struct LumenCarouselLabels {
    public var previous: String; public var next: String; public var empty: String; public var invalid: String
    public var loading: String; public var error: String
    public var position: (LumenCarouselSlide, Int, Int) -> String
    public init(previous: String = "Previous slide", next: String = "Next slide", empty: String = "No slides",
                invalid: String = "Invalid carousel selection", loading: String = "Loading slides", error: String = "Unable to load slides",
                position: @escaping (LumenCarouselSlide, Int, Int) -> String = { "\($0.label), slide \($1 + 1) of \($2)" }) {
        self.previous = previous; self.next = next; self.empty = empty; self.invalid = invalid
        self.loading = loading; self.error = error; self.position = position
    }
}
public struct LumenCarousel<Content: View>: View {
    @Binding private var index: Int
    @State private var pagingIndex: Int
    @Environment(\.lumenTheme) private var theme
    private let label: String; private let slides: [LumenCarouselSlide]; private let height: CGFloat
    private let disabled: Bool; private let status: LumenCarouselStatus; private let labels: LumenCarouselLabels
    private let content: (LumenCarouselSlide, Int) -> Content
    public init(_ label: String, slides: [LumenCarouselSlide], index: Binding<Int>, height: CGFloat = 200,
                disabled: Bool = false, status: LumenCarouselStatus = .ready, labels: LumenCarouselLabels = .init(),
                @ViewBuilder content: @escaping (LumenCarouselSlide, Int) -> Content) {
        self.label = label; self.slides = slides; _index = index; self.height = height
        _pagingIndex = State(initialValue: index.wrappedValue)
        self.disabled = disabled; self.status = status; self.labels = labels; self.content = content
    }
    private var state: LumenCarouselState { .init(slides: slides, index: index) }
    private func navigate(_ requested: Int) {
        guard !disabled, status == .ready, let target = state.target(requested) else { return }
        index = target
    }
    private var selection: Binding<Int> {
        Binding(get: { pagingIndex }, set: { requested in
            guard !disabled, status == .ready, state.target(requested) != nil else { pagingIndex = index; return }
            pagingIndex = requested
            navigate(requested)
            Task { @MainActor in
                await Task.yield()
                pagingIndex = index
            }
        })
    }
    private var announcement: String? {
        if status == .loading { return labels.loading }
        if status == .error { return labels.error }
        if !height.isFinite || height <= 0 || height > 4096 { return labels.invalid }
        switch state { case .ready: return nil; case .empty: return labels.empty; case .invalid: return labels.invalid }
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: LumenSpacing.sm) {
            if let announcement { Text(announcement).accessibilityLabel(Text(announcement)) }
            else {
                viewport.frame(height: height).clipped()
                LumenButtonGroup {
                    LumenButton(.verbatim(labels.previous)) { navigate(index - 1) }.disabled(disabled || index == 0)
                    LumenButton(.verbatim(labels.next)) { navigate(index + 1) }.disabled(disabled || index == slides.count - 1)
                }
                ScrollView(.horizontal) {
                    HStack(spacing: LumenSpacing.xs) {
                        ForEach(Array(slides.enumerated()), id: \.element.id) { offset, slide in
                            Button { navigate(offset) } label: {
                                Text("\(offset + 1)").frame(minWidth: 44, minHeight: 44)
                                    .foregroundStyle(theme.colors.ink)
                                    .background(offset == index ? theme.colors.brandSoft : theme.colors.surface)
                                    .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm))
                            }.buttonStyle(.plain).accessibilityLabel(Text(labels.position(slide, offset, slides.count)))
                                .accessibilityAddTraits(offset == index ? .isSelected : []).disabled(disabled)
                        }
                    }
                }
            }
        }.accessibilityLabel(Text(label))
            .lumenOnValueChange(of: index) { pagingIndex = $0 }
            .lumenOnValueChange(of: slides.map(\.id)) { _ in pagingIndex = index }
            .lumenOnValueChange(of: disabled) { _ in pagingIndex = index }
    }
    @ViewBuilder private var viewport: some View {
        #if os(iOS) || os(visionOS)
        TabView(selection: selection) {
            ForEach(Array(slides.enumerated()), id: \.element.id) { offset, slide in
                content(slide, offset).tag(offset)
                    .accessibilityLabel(Text(labels.position(slide, offset, slides.count)))
                    .accessibilityHidden(offset != index)
                    .allowsHitTesting(offset == index && !disabled)
            }
        }.tabViewStyle(.page(indexDisplayMode: .never)).allowsHitTesting(!disabled)
        #else
        if slides.indices.contains(index) {
            content(slides[index], index).accessibilityLabel(Text(labels.position(slides[index], index, slides.count)))
                .allowsHitTesting(!disabled)
        }
        #endif
    }
}
