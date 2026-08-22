// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "LumenApplePreview",
    platforms: [.macOS(.v13)],
    dependencies: [
        .package(path: "../../../..")
    ],
    targets: [
        .executableTarget(
            name: "LumenApplePreview",
            dependencies: [
                .product(name: "LumenUI", package: "lumen")
            ]
        )
    ]
)
