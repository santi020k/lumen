#if os(iOS) || os(macOS) || os(visionOS)
import Testing
@testable import LumenUI

@Test func breadcrumbStableIDsRejectAmbiguousPaths() {
    #expect(lumenBreadcrumbHasValidIDs([]))
    let home = LumenBreadcrumbItem(id: "home", label: "Home")
    #expect(lumenBreadcrumbHasValidIDs([home, LumenBreadcrumbItem(id: "current", label: "Home")]))
    #expect(!lumenBreadcrumbHasValidIDs([home, home]))
    #expect(!lumenBreadcrumbHasValidIDs([LumenBreadcrumbItem(id: " \n", label: "Missing")]))
}

@Test @MainActor func breadcrumbAcceptsLocalizedHostNavigationAndLongPaths() {
    let items = (0..<200).map { LumenBreadcrumbItem(id: "location-\($0)", label: "Location \($0)", isDisabled: $0 == 2) }
    #expect(lumenBreadcrumbHasValidIDs(items))
    _ = LumenBreadcrumb("Ubicación", items: items, currentLabel: "Página actual", onNavigate: { _ in })
}
#endif
