#!/bin/zsh

# cspell:words agvtool

set -euo pipefail

release_tag="${CI_TAG:-}"
ios_release_prefix="playground-ios-v"
mac_release_prefix="playground-macos-v"

# Xcode Cloud runs this script for every workflow attached to the project. Only
# release tags created by the GitHub launcher should change App Store versions.
if [[ "$release_tag" != ${ios_release_prefix}* && "$release_tag" != ${mac_release_prefix}* ]]; then
    print "No Lumen Playground release tag detected; keeping the committed development versions."
    exit 0
fi

if [[ "$release_tag" == ${ios_release_prefix}* ]]; then
    tag_version="${release_tag#$ios_release_prefix}"
    platform="iOS"
else
    tag_version="${release_tag#$mac_release_prefix}"
    platform="macOS"
fi
marketing_version="${tag_version%-r*}"
release_run="${tag_version##*-r}"
build_number="${CI_BUILD_NUMBER:-}"
version_pattern='^[0-9]+\.[0-9]+(\.[0-9]+)?$'
integer_pattern='^[1-9][0-9]*$'

if [[ "$tag_version" == "$marketing_version" ]] || [[ ! "$marketing_version" =~ $version_pattern ]]; then
    print -u2 "Release tag $release_tag must look like playground-ios-v1.0.0-r123 or playground-macos-v1.0.0-r123."
    exit 1
fi

if [[ ! "$release_run" =~ $integer_pattern ]]; then
    print -u2 "Release tag $release_tag must end with a positive GitHub run number."
    exit 1
fi

if [[ ! "$build_number" =~ $integer_pattern ]]; then
    print -u2 "CI_BUILD_NUMBER must be a positive integer for an App Store release."
    exit 1
fi

# Build 1 for iOS version 1.0.0 was uploaded before Xcode Cloud was enabled.
# macOS has its own build train and can use the workflow counter directly.
if [[ "$platform" == "iOS" ]]; then
    app_store_build_number=$((build_number + 1))
else
    app_store_build_number=$build_number
fi

apple_root="${0:A:h:h}"
project="$apple_root/LumenApplePlayground.xcodeproj"
toolchain_check="$apple_root/scripts/check-app-store-toolchain.sh"

if [[ ! -d "$project" ]]; then
    print -u2 "Required Xcode project is missing: $project"
    exit 1
fi

"$toolchain_check"

cd "$apple_root"
xcrun agvtool new-marketing-version "$marketing_version"
xcrun agvtool new-version -all "$app_store_build_number"

print "Prepared Lumen Playground $platform $marketing_version ($app_store_build_number) from $release_tag"
