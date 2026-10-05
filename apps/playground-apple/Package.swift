// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "LumenApplePlayground",
    platforms: [.macOS(.v13)],
    dependencies: [
        .package(name: "lumen", path: "../..")
    ],
    targets: [
        .executableTarget(
            name: "LumenApplePlayground",
            dependencies: [
                .product(name: "LumenUI", package: "lumen")
            ]
        ),
        .executableTarget(
            name: "LumenWidgetCaptures",
            dependencies: [.product(name: "LumenWidgetUI", package: "lumen")],
            path: "Sources/LumenWidgetCaptures"
        ),
        .testTarget(
            name: "LumenApplePlaygroundTests",
            dependencies: ["LumenApplePlayground"]
        )
    ]
)
