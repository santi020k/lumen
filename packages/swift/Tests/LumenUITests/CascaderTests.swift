import Testing
@testable import LumenUI

@Test func cascaderCommitsOnlyEnabledSelectableLeaves() {
    let model = LumenCascaderModel(nodes: [.init(id: "r", label: "Root"), .init(id: "l", label: "Leaf", parentId: "r"),
        .init(id: "no", label: "No", selectable: false), .init(id: "d", label: "Disabled", disabled: true),
        .init(id: "x", label: "Inherited", parentId: "d")])
    for id in ["r", "no", "d", "x", "missing"] {
        #expect(!model.canSelect(id))
        #expect(model.selecting(id, current: ["unknown"]) == ["unknown"])
    }
    #expect(model.selecting("l", current: ["unknown"]) == ["r", "l"])
    #expect(model.isPathValid(["r", "l"]))
    #expect(!model.isPathValid(["l"]))
    #expect(!model.isPathValid(["r", "unknown"]))
    #expect(!model.isPathValid(["l", "r"]))
}
@Test func cascaderRejectsInvalidGraphWithoutMutatingHost() {
    let model = LumenCascaderModel(nodes: [.init(id: "a", label: "", parentId: "a")])
    #expect(!model.canSelect("a"))
    #expect(!model.isPathValid(["a"]))
    #expect(model.selecting("a", current: ["host"]) == ["host"])
}
