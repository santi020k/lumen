// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "LumenUI",
    platforms: [
        .iOS(.v16),
        .macOS(.v13),
        .tvOS(.v16),
        .watchOS(.v9)
    ],
    products: [
        .library(name: "LumenUI", targets: ["LumenUI"])
    ],
    targets: [
        .target(name: "LumenUI"),
        .testTarget(name: "LumenUITests", dependencies: ["LumenUI"])
    ]
)
