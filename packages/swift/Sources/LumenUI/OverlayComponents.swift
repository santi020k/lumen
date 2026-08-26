import CoreTransferable
import SwiftUI

private struct LumenAlertDialogModifier: ViewModifier {
    @Binding var isPresented: Bool

    let cancelLabel: LocalizedStringKey
    let confirmDisabled: Bool
    let confirmLabel: LocalizedStringKey
    let confirmLoading: Bool
    let confirmRole: ButtonRole?
    let description: LocalizedStringKey?
    let onConfirm: () -> Void
    let title: LocalizedStringKey

    func body(content: Content) -> some View {
        content.alert(title, isPresented: $isPresented) {
            Button(cancelLabel, role: .cancel) {}
            Button(role: confirmRole, action: onConfirm) {
                HStack(spacing: LumenSpacing.sm) {
                    if confirmLoading {
                        ProgressView()
                            .controlSize(.small)
                    }
                    Text(confirmLabel)
                }
            }
            .disabled(confirmDisabled || confirmLoading)
            .accessibilityValue(confirmLoading ? Text("Loading") : Text(""))
        } message: {
            if let description {
                Text(description)
            }
        }
    }
}

public extension View {
    /// Presents a controlled native confirmation alert with explicit cancel and confirm actions.
    func lumenAlertDialog(
        isPresented: Binding<Bool>,
        title: LocalizedStringKey,
        description: LocalizedStringKey? = nil,
        confirmLabel: LocalizedStringKey,
        cancelLabel: LocalizedStringKey = "Cancel",
        confirmRole: ButtonRole? = nil,
        confirmDisabled: Bool = false,
        confirmLoading: Bool = false,
        onConfirm: @escaping () -> Void
    ) -> some View {
        modifier(
            LumenAlertDialogModifier(
                isPresented: isPresented,
                cancelLabel: cancelLabel,
                confirmDisabled: confirmDisabled,
                confirmLabel: confirmLabel,
                confirmLoading: confirmLoading,
                confirmRole: confirmRole,
                description: description,
                onConfirm: onConfirm,
                title: title
            )
        )
    }
}

private struct LumenSheetModifier<SheetContent: View, Actions: View>: ViewModifier {
    @Binding var isPresented: Bool

    let actions: Actions
    let description: LocalizedStringKey?
    let onDismiss: () -> Void
    let sheetContent: SheetContent
    let title: LocalizedStringKey?

    func body(content: Content) -> some View {
        content.sheet(isPresented: $isPresented, onDismiss: onDismiss) {
            VStack(alignment: .leading, spacing: LumenSpacing.lg) {
                if title != nil || description != nil {
                    VStack(alignment: .leading, spacing: LumenSpacing.sm) {
                        if let title {
                            Text(title)
                                .font(.title2.weight(.semibold))
                                .accessibilityAddTraits(.isHeader)
                        }
                        if let description {
                            Text(description)
                                .font(.callout)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                sheetContent

                actions
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
            .padding(LumenSpacing.xl)
        }
    }
}

public extension View {
    /// Presents application-owned content in a native sheet with an optional heading and actions.
    func lumenSheet<SheetContent: View, Actions: View>(
        isPresented: Binding<Bool>,
        title: LocalizedStringKey? = nil,
        description: LocalizedStringKey? = nil,
        onDismiss: @escaping () -> Void = {},
        @ViewBuilder actions: () -> Actions,
        @ViewBuilder content: () -> SheetContent
    ) -> some View {
        modifier(
            LumenSheetModifier(
                isPresented: isPresented,
                actions: actions(),
                description: description,
                onDismiss: onDismiss,
                sheetContent: content(),
                title: title
            )
        )
    }

    func lumenSheet<SheetContent: View>(
        isPresented: Binding<Bool>,
        title: LocalizedStringKey? = nil,
        description: LocalizedStringKey? = nil,
        onDismiss: @escaping () -> Void = {},
        @ViewBuilder content: () -> SheetContent
    ) -> some View {
        lumenSheet(
            isPresented: isPresented,
            title: title,
            description: description,
            onDismiss: onDismiss,
            actions: { EmptyView() },
            content: content
        )
    }
}

public struct LumenMenuItem {
    fileprivate let action: () -> Void
    fileprivate let disabled: Bool
    fileprivate let role: ButtonRole?
    fileprivate let systemName: String?
    fileprivate let title: LocalizedStringKey

    public init(
        _ title: LocalizedStringKey,
        systemName: String? = nil,
        role: ButtonRole? = nil,
        disabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.systemName = systemName
        self.role = role
        self.disabled = disabled
        self.action = action
    }
}

/// A native anchored menu that preserves disabled and destructive action semantics.
#if !os(watchOS)
@available(tvOS 17.0, *)
public struct LumenMenu<MenuLabel: View>: View {
    private let items: [LumenMenuItem]
    private let label: MenuLabel

    public init(
        items: [LumenMenuItem],
        @ViewBuilder label: () -> MenuLabel
    ) {
        self.items = items
        self.label = label()
    }

    public var body: some View {
        Menu {
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                Button(role: item.role, action: item.action) {
                    if let systemName = item.systemName {
                        SwiftUI.Label(item.title, systemImage: systemName)
                    } else {
                        Text(item.title)
                    }
                }
                .disabled(item.disabled)
            }
        } label: {
            label
        }
    }
}
#endif

/// A Lumen-styled button backed by SwiftUI's native ShareLink presentation.
#if !os(tvOS)
public struct LumenShareButton: View {
    private let shareLink: AnyView

    public init<Label: View>(
        item: String,
        @ViewBuilder label: () -> Label
    ) {
        shareLink = AnyView(
            ShareLink(item: item, label: label)
                .buttonStyle(LumenButtonStyle(intent: .secondary))
        )
    }

    public init<Label: View>(
        item: URL,
        @ViewBuilder label: () -> Label
    ) {
        shareLink = AnyView(
            ShareLink(item: item, label: label)
                .buttonStyle(LumenButtonStyle(intent: .secondary))
        )
    }

    @available(tvOS, unavailable)
    public init<
        Item: Transferable,
        PreviewImage: Transferable,
        PreviewIcon: Transferable,
        Label: View
    >(
        item: Item,
        preview: SharePreview<PreviewImage, PreviewIcon>,
        @ViewBuilder label: () -> Label
    ) {
        shareLink = AnyView(
            ShareLink(item: item, preview: preview, label: label)
                .buttonStyle(LumenButtonStyle(intent: .secondary))
        )
    }

    public init(_ label: LocalizedStringKey = "Share", item: String) {
        self.init(item: item) {
            Text(label)
        }
    }

    public init(_ label: LocalizedStringKey = "Share", item: URL) {
        self.init(item: item) {
            Text(label)
        }
    }

    public var body: some View {
        shareLink
    }
}
#endif
