#!/bin/zsh

# cspell:words pbxproj plutil xcshareddata xcodecloud xcscheme xcschemes

set -euo pipefail

apple_root="${0:A:h:h}"
repo_root="${apple_root:h:h}"
cloud_script="$apple_root/ci_scripts/ci_post_clone.sh"
project="$apple_root/LumenApplePlayground.xcodeproj"
scheme="$project/xcshareddata/xcschemes/LumenApplePlayground.xcscheme"
cloud_manifest="$project/xcshareddata/xcodecloud/manifest.json"

if [[ ! -x "$cloud_script" ]]; then
    print -u2 "Xcode Cloud's ci_post_clone.sh must be executable."
    exit 1
fi

zsh -n "$cloud_script"
plutil -lint "$apple_root/Supporting/Info.plist"

if [[ ! -f "$scheme" ]]; then
    print -u2 "The shared LumenApplePlayground archive scheme is missing."
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

swift test --package-path "$apple_root"

xcodebuild \
    -project "$project" \
    -scheme LumenApplePlayground \
    -configuration Release \
    -destination 'generic/platform=iOS Simulator' \
    CODE_SIGNING_ALLOWED=NO \
    build

git -C "$repo_root" diff --check

print "Lumen Playground Apple release preflight passed"
