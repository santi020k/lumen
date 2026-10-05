#!/usr/bin/env bash

# cspell:words bootstatus simctl udid UDID pathlib shutil startswith copyfile xctestrun

set -euo pipefail

playground_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="${1:-${playground_dir}/Screenshots}"
derived_data="${playground_dir}/.build/screenshots"
bundle_id="com.santi020k.lumen.playground.apple"

components=()
while IFS= read -r component; do
  components+=("$component")
done < "${playground_dir}/scripts/component-capture-catalog.generated.txt"

if (( $# > 1 )); then
  components=("${@:2}")
fi

device_id="${LUMEN_SIMULATOR_UDID:-}"
if [[ -z "${device_id}" ]]; then
  device_id="$({ xcrun simctl list devices available --json \
    | /usr/bin/python3 -c 'import json,sys; data=json.load(sys.stdin); print(next(device["udid"] for runtime in data["devices"].values() for device in runtime if "iPhone" in device["name"]))'; })"
fi

mkdir -p "${output_dir}" "${derived_data}"
xcrun simctl boot "${device_id}" 2>/dev/null || true
if [[ "${CI:-}" != "true" && "${CI:-}" != "TRUE" && -z "${CI_XCODE_CLOUD:-}" ]]; then
  open -a Simulator
fi
xcrun simctl bootstatus "${device_id}" -b
xcrun simctl ui "${device_id}" appearance light

if [[ -n "${LUMEN_CAPTURE_PRODUCTS:-}" ]]; then
  node "${playground_dir}/../../.github/scripts/apple-capture-products.mjs" verify "$LUMEN_CAPTURE_PRODUCTS"
  app_path="$LUMEN_CAPTURE_PRODUCTS/Debug-iphonesimulator/LumenApplePlayground.app"
else
  xcodebuild \
    -project "${playground_dir}/LumenApplePlayground.xcodeproj" \
    -scheme LumenApplePlayground \
    -destination "platform=iOS Simulator,id=${device_id}" \
    -derivedDataPath "${derived_data}" \
    CODE_SIGNING_ALLOWED=NO \
    build

  app_path="${derived_data}/Build/Products/Debug-iphonesimulator/LumenApplePlayground.app"
fi
xcrun simctl install "${device_id}" "${app_path}"

for component in "${components[@]}"; do
  slug="$(printf '%s' "${component}" | tr '[:upper:] ' '[:lower:]-')"
  xcrun simctl terminate "${device_id}" "${bundle_id}" 2>/dev/null || true
  xcrun simctl launch "${device_id}" "${bundle_id}" --component "${component}"
  # Allow SwiftUI layout and the generated icon asset catalog to settle before capture.
  sleep "${LUMEN_CAPTURE_SETTLE_SECONDS:-6}"
  xcrun simctl io "${device_id}" screenshot "${output_dir}/${slug}.png"
done

if [[ " ${components[*]} " == *" Tour "* ]]; then
  # The documentation baseline shows step one open after its trigger is revealed.
  # Reproduce that interaction instead of comparing an unrelated closed launch state.
  interaction_dir="$(mktemp -d "${derived_data}/tour-capture.XXXXXX")"
  if [[ -n "${LUMEN_CAPTURE_PRODUCTS:-}" ]]; then
    test_run=("$LUMEN_CAPTURE_PRODUCTS"/*.xctestrun)
    xcodebuild -xctestrun "${test_run[0]}" \
      -destination "platform=iOS Simulator,id=${device_id}" \
      -resultBundlePath "${interaction_dir}/tour.xcresult" \
      -parallel-testing-enabled NO \
      -only-testing:LumenApplePlaygroundUITests/CatalogParityInteractionTests/testTourCaptureMatchesDocumentation \
      test-without-building
  else
    xcodebuild \
      -project "${playground_dir}/LumenApplePlayground.xcodeproj" \
      -scheme LumenApplePlaygroundPerformance \
      -configuration Debug \
      -destination "platform=iOS Simulator,id=${device_id}" \
      -derivedDataPath "${derived_data}" \
      -resultBundlePath "${interaction_dir}/tour.xcresult" \
      -parallel-testing-enabled NO \
      -only-testing:LumenApplePlaygroundUITests/CatalogParityInteractionTests/testTourCaptureMatchesDocumentation \
      CODE_SIGNING_ALLOWED=NO \
      test
  fi
  xcrun xcresulttool export attachments \
    --path "${interaction_dir}/tour.xcresult" \
    --output-path "${interaction_dir}/attachments"
  /usr/bin/python3 - "${interaction_dir}/attachments" "${output_dir}/tour.png" <<'PY'
import json
import shutil
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
manifest = json.loads((root / "manifest.json").read_text())
matches = [
    attachment
    for test in manifest
    for attachment in test["attachments"]
    if attachment["suggestedHumanReadableName"].startswith("tour-light-ready_")
]
if len(matches) != 1:
    raise SystemExit("Expected exactly one verified Tour step-one screenshot")
source = (root / matches[0]["exportedFileName"]).resolve()
if source.parent != root or source.suffix != ".png" or not source.is_file():
    raise SystemExit("Invalid exported Tour screenshot")
shutil.copyfile(source, sys.argv[2])
PY
fi

printf 'Captured %s component screenshots in %s\n' "${#components[@]}" "${output_dir}"
