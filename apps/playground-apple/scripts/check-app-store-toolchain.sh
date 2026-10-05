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

# Apple published stable Xcode 27 (27A266a) on September 14, 2026.
# https://developer.apple.com/news/releases/
# Preserve stable Xcode 26 support and admit only the verified Xcode 27 release.
xcode_build="$(print -r -- "$xcode_version_output" | sed -nE 's/^Build version ([A-Za-z0-9]+)$/\1/p' | head -n 1)"

if [[ "${(L)xcode_version_output}" =~ 'beta|preview|rc|release candidate' ]]; then
    print -u2 "App Store releases require a stable Xcode release; prerelease Xcode is unsupported."
    exit 1
fi

if [[ "$xcode_major" == "26" && "$sdk_major" == "26" && ! "$xcode_build" =~ '[a-z]$' ]]; then
    maximum_macos_major=26
elif [[ ( "$xcode_version" == "27" || "$xcode_version" == "27.0" ) && "$xcode_build" == "27A266a" && "$iphoneos_sdk_version" == "27.0" ]]; then
    maximum_macos_major=27
    macos_minor="${macos_product_version#*.}"
    macos_minor="${macos_minor%%.*}"
    if [[ "$macos_major" -lt 26 || ( "$macos_major" == "26" && ( ! "$macos_minor" =~ '^[0-9]+$' || "$macos_minor" -lt 6 ) ) ]]; then
        print -u2 "Xcode 27 requires macOS 26.6 or later."
        exit 1
    fi
else
    print -u2 "App Store releases require a verified stable Xcode 26/iOS 26 or Xcode 27 (27A266a)/iOS 27.0 toolchain; found Xcode $xcode_version ($xcode_build) and iOS SDK $iphoneos_sdk_version."
    exit 1
fi

if [[ ! "$macos_major" =~ '^[0-9]+$' || "$macos_major" -gt "$maximum_macos_major" || "$macos_build_version" =~ '[a-z]$' ]]; then
    print -u2 "App Store releases must run on a stable macOS image supported by Xcode $xcode_major; found macOS $macos_product_version ($macos_build_version)."
    exit 1
fi

print "App Store toolchain accepted: Xcode $xcode_version, iOS SDK $iphoneos_sdk_version, macOS $macos_product_version ($macos_build_version)"
