import XCTest
@testable import LumenUI

final class CarouselTests: XCTestCase {
    private let slides = [LumenCarouselSlide(id: "a", label: "A"), .init(id: "b", label: "B"), .init(id: "c", label: "C")]
    func testBoundedControlledNavigation() {
        let first = LumenCarouselState(slides: slides, index: 0)
        XCTAssertEqual(first, .ready(index: 0, count: 3))
        XCTAssertNil(first.target(-1)); XCTAssertNil(first.target(0)); XCTAssertNil(first.target(3)); XCTAssertEqual(first.target(1), 1)
        XCTAssertEqual(LumenCarouselState(slides: slides, index: 2), .ready(index: 2, count: 3))
    }
    func testInvalidIdentityAndIndices() {
        XCTAssertEqual(LumenCarouselState(slides: [], index: 0), .empty)
        for index in [-1, 3, Int.max, Int.min] { XCTAssertEqual(LumenCarouselState(slides: slides, index: index), .invalid) }
        XCTAssertEqual(LumenCarouselState(slides: [.init(id: "", label: "Empty")], index: 0), .invalid)
        XCTAssertEqual(LumenCarouselState(slides: [slides[0], slides[0]], index: 0), .invalid)
        XCTAssertEqual(slides.map(\.id), ["a", "b", "c"])
    }
}
