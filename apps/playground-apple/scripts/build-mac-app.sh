#!/usr/bin/env bash

# cspell:words codesign

set -euo pipefail

playground_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
build_dir="${LUMEN_MAC_BUILD_PATH:-${playground_dir}/.build/mac-app}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "The Mac playground requires macOS and Xcode." >&2
  exit 1
fi

xcodebuild \
  -project "${playground_dir}/LumenApplePlayground.xcodeproj" \
  -scheme LumenMacPlayground \
  -configuration Debug \
  -destination "platform=macOS,arch=$(uname -m)" \
  -derivedDataPath "${build_dir}" \
  PRODUCT_BUNDLE_IDENTIFIER=com.santi020k.lumen.playground.local \
  CODE_SIGNING_ALLOWED=NO \
  build

app_path="${build_dir}/Build/Products/Debug/Lumen Playground.app"

# Local ad-hoc signing enables launching the development bundle without a team.
# Distribution continues through the repository's protected release workflow.
codesign --force --sign - "${app_path}"
codesign --verify --strict "${app_path}"

echo "Built ${app_path}"
echo "Open this bundle in Finder to run Lumen Playground with its app icon and native menus."
