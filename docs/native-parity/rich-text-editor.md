# Native RichTextEditor

The native document stores plain text and UTF-16 spans (`start`, exclusive `end`,
`format`). Bold, italic and underline compose independently. Hosts own document and
selection; toolbar commands update only a nonempty selection. No HTML is executed,
no URLs are opened, and no network or persistence behavior belongs to the editor.

Compose exposes `LumenRichTextEditor`, `LumenRichTextDocument`, `LumenRichTextSpan`
and `LumenRichTextFormat`; pass `TextRange` selection and controlled callbacks.
iOS/visionOS expose the same names with Swift bindings and `NSRange` selection.
The Swift adapter uses UITextView, keeps native editing/selection and avoids replacing
marked text during IME composition. Compose uses BasicTextField with AnnotatedString.
Disabled/read-only editors block document mutation; read-only selection remains usable.
Hosts localize the editor label, error and each formatting label.

React Native's installed TextInput only supports attributed children on Android,
so it cannot supply equivalent iOS rich editing. Its portable model is implemented,
but a real React Native editor requires a maintained native engine or native module.
The user explicitly deferred the React Native editor and requested no new native
dependency. Its editor gap remains open; the pure model is useful for future adapters.

The scope is inline formatting. Heading, lists, links, HTML import/export, rich paste,
and collapsed-caret typing-format controls are not yet provided by these adapters.
Native device/IME, toolbar focus retention, screen-reader and narrow-width rendering
checks remain required before claiming full reference parity.
