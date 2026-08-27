#!/bin/zsh

# cspell:words iphoneos IPHONEOS

set -euo pipefail

xcode_version_output="${LUMEN_XCODE_VERSION_OUTPUT:-$(xcodebuild -version)}"
macos_product_version="${LUMEN_MACOS_PRODUCT_VERSION:-$(sw_vers -productVersion)}"
macos_build_version="${LUMEN_MACOS_BUILD_VERSION:-$(sw_vers -buildVersion)}"
iphoneos_sdk_version="${LUMEN_IPHONEOS_SDK_VERSION:-$(xcrun --sdk iphoneos --show-sdk-version)}"

xcode_version="$(print -r -- "$xcode_version_output" | sed -nE 's/^Xcode ([0-9]+([.][0-9]+)*).*$/\1/p' | head -n 1)"

if [[ -z "$xcode_version" ]]; then
    print -u2 "Unable to determine the Xcode version for App Store validation."
    exit 1
fi

xcode_major="${xcode_version%%.*}"
sdk_major="${iphoneos_sdk_version%%.*}"
macos_major="${macos_product_version%%.*}"

# Apple accepts the stable Xcode 26 / iOS 26 toolchain for current submissions.
# Keep this deliberately pinned so selecting a future beta in Xcode Cloud fails
# before it can create another binary with unsupported build provenance.
if [[ "$xcode_major" != "26" || "$sdk_major" != "26" ]]; then
    print -u2 "App Store releases must use stable Xcode 26 with the iOS 26 SDK; found Xcode $xcode_version and iOS SDK $iphoneos_sdk_version."
    exit 1
fi

if [[ ! "$macos_major" =~ '^[0-9]+$' || "$macos_major" -ge 27 || "$macos_build_version" =~ '[a-z]$' ]]; then
    print -u2 "App Store releases must run on a stable macOS image supported by Xcode 26; found macOS $macos_product_version ($macos_build_version)."
    exit 1
fi

print "App Store toolchain accepted: Xcode $xcode_version, iOS SDK $iphoneos_sdk_version, macOS $macos_product_version ($macos_build_version)"
