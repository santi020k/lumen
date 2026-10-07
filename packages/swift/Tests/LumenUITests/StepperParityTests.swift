import Testing
@testable import LumenUI

@Test func stepperBoundaries() {
    func states(_ current: Int) -> [LumenStepState] { (0..<3).map { .resolve(index: $0, currentStep: current, count: 3) } }
    #expect(states(0) == [.current, .upcoming, .upcoming])
    #expect(states(1) == [.complete, .current, .upcoming])
    #expect(states(3) == [.complete, .complete, .complete])
    #expect(states(Int.max) == states(3))
    #expect(states(Int.min) == states(0))
}
@Test func stepperStableIDs() {
    #expect(isLumenStepItemsValid([]))
    #expect(isLumenStepItemsValid([.init(id: "first", title: "Uno"), .init(id: "last", title: "Dos")]))
    #expect(!isLumenStepItemsValid([.init(id: "same", title: "Uno"), .init(id: "same", title: "Dos")]))
    #expect(!isLumenStepItemsValid([.init(id: " \n", title: "Uno")]))
}
