import SwiftUI

/// Text supplied to Lumen while preserving SwiftUI's native localization behavior.
///
/// Use ``localized(_:)`` for catalog-backed copy and ``verbatim(_:)`` for application-resolved
/// runtime strings such as user content or copy selected from an application-owned dictionary.
public enum LumenTextContent {
    case localizedKey(LocalizedStringKey)
    case localizedResource(LocalizedStringResource)
    case verbatim(String)

    public static func localized(_ key: LocalizedStringKey) -> Self {
        .localizedKey(key)
    }

    public static func localized(_ resource: LocalizedStringResource) -> Self {
        .localizedResource(resource)
    }

    var text: Text {
        switch self {
        case let .localizedKey(key):
            return Text(key)
        case let .localizedResource(resource):
            return Text(resource)
        case let .verbatim(value):
            return Text(verbatim: value)
        }
    }
}
