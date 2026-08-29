#!/bin/zsh

# cspell:words archs libexec lipo pbxproj plutil xcarchive xcshareddata xcodecloud xcscheme xcschemes

set -euo pipefail

apple_root="${0:A:h:h}"
repo_root="${apple_root:h:h}"
cloud_script="$apple_root/ci_scripts/ci_post_clone.sh"
toolchain_check="$apple_root/scripts/check-app-store-toolchain.sh"
release_check="$repo_root/scripts/check-playground-apple-release.mjs"
project="$apple_root/LumenApplePlayground.xcodeproj"
scheme="$project/xcshareddata/xcschemes/LumenApplePlayground.xcscheme"
mac_scheme="$project/xcshareddata/xcschemes/LumenMacPlayground.xcscheme"
cloud_manifest="$project/xcshareddata/xcodecloud/manifest.json"
mac_entitlements="$apple_root/Supporting/LumenMacPlayground.entitlements"
mac_info="$apple_root/Supporting/MacInfo.plist"
archive_root="$(mktemp -d)"
mac_archive="$archive_root/LumenPlayground.xcarchive"
mac_archive_app="$mac_archive/Products/Applications/Lumen Playground.app"

cleanup() {
    rm -r "$archive_root"
}
trap cleanup EXIT

if [[ ! -x "$cloud_script" ]]; then
    print -u2 "Xcode Cloud's ci_post_clone.sh must be executable."
    exit 1
fi

if [[ ! -x "$toolchain_check" ]]; then
    print -u2 "The App Store toolchain check must be executable."
    exit 1
fi

zsh -n "$cloud_script"
zsh -n "$toolchain_check"
node "$release_check"
"$toolchain_check"
plutil -lint "$apple_root/Supporting/Info.plist"
plutil -lint "$mac_info"
plutil -lint "$mac_entitlements"

if [[ ! -f "$scheme" ]]; then
    print -u2 "The shared LumenApplePlayground archive scheme is missing."
    exit 1
fi

if [[ ! -f "$mac_scheme" ]]; then
    print -u2 "The shared LumenMacPlayground archive scheme is missing."
    exit 1
fi

if [[ ! -f "$cloud_manifest" ]]; then
    print -u2 "The shared Xcode Cloud product manifest is missing."
    exit 1
fi

/usr/bin/json_pp < "$cloud_manifest" > /dev/null

if ! rg -q '"name"\s*:\s*"LumenApplePlayground"' "$cloud_manifest"; then
    print -u2 "The Xcode Cloud product manifest must target LumenApplePlayground."
    exit 1
fi

if ! rg -q 'VERSIONING_SYSTEM = "?apple-generic"?;' "$project/project.pbxproj"; then
    print -u2 "The application target must use Apple Generic versioning for Xcode Cloud."
    exit 1
fi

if [[ "$(plutil -extract ITSAppUsesNonExemptEncryption raw "$apple_root/Supporting/Info.plist")" != "false" ]]; then
    print -u2 "Info.plist must declare exempt-only encryption for App Store export compliance."
    exit 1
fi

if [[ "$(plutil -extract ITSAppUsesNonExemptEncryption raw "$mac_info")" != "false" ]]; then
    print -u2 "MacInfo.plist must declare exempt-only encryption for App Store export compliance."
    exit 1
fi

if [[ "$(/usr/libexec/PlistBuddy -c 'Print :com.apple.security.app-sandbox' "$mac_entitlements")" != "true" ]]; then
    print -u2 "The Mac App Store target must enable App Sandbox."
    exit 1
fi

swift test --package-path "$apple_root"

xcodebuild \
    -project "$project" \
    -scheme LumenApplePlayground \
    -configuration Release \
    -destination 'generic/platform=iOS Simulator' \
    CODE_SIGNING_ALLOWED=NO \
    build

xcodebuild \
    -project "$project" \
    -scheme LumenMacPlayground \
    -configuration Release \
    -destination 'generic/platform=macOS' \
    -archivePath "$mac_archive" \
    CODE_SIGNING_ALLOWED=NO \
    archive

if [[ ! -d "$mac_archive_app" ]]; then
    print -u2 "The macOS archive does not contain Lumen Playground.app."
    exit 1
fi

if [[ "$(plutil -extract ApplicationProperties.CFBundleIdentifier raw "$mac_archive/Info.plist")" != "com.santi020k.lumen.playground.apple" ]]; then
    print -u2 "The macOS archive must use the shared App Store bundle identifier."
    exit 1
fi

archive_architectures="$(lipo -archs "$mac_archive_app/Contents/MacOS/Lumen Playground")"
if [[ "$archive_architectures" != *arm64* || "$archive_architectures" != *x86_64* ]]; then
    print -u2 "The macOS archive must contain both arm64 and x86_64 executables."
    exit 1
fi

git -C "$repo_root" diff --check

print "Lumen Playground iOS and macOS release preflight passed"
