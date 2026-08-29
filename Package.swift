// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "LumenUI",
    platforms: [
        .iOS(.v16),
        .macOS(.v13),
        .tvOS(.v16),
        .visionOS(.v1),
        .watchOS(.v9)
    ],
    products: [
        .library(name: "LumenUI", targets: ["LumenUI"]),
        .library(name: "LumenWidgetUI", targets: ["LumenWidgetUI"])
    ],
    targets: [
        .target(
            name: "LumenUI",
            path: "packages/swift/Sources/LumenUI",
            resources: [
                .process("Resources")
            ]
        ),
        .target(
            name: "LumenWidgetUI",
            path: "packages/swift-widget/Sources/LumenWidgetUI"
        ),
        .testTarget(
            name: "LumenUITests",
            dependencies: ["LumenUI"],
            path: "packages/swift/Tests/LumenUITests"
        ),
        .testTarget(
            name: "LumenWidgetUITests",
            dependencies: ["LumenWidgetUI"],
            path: "packages/swift-widget/Tests/LumenWidgetUITests"
        )
    ]
)
