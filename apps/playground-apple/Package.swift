// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "LumenApplePlayground",
    platforms: [.macOS(.v13)],
    dependencies: [
        .package(path: "../..")
    ],
    targets: [
        .executableTarget(
            name: "LumenApplePlayground",
            dependencies: [
                .product(name: "LumenUI", package: "lumen")
            ]
        )
    ]
)
