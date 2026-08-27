#!/usr/bin/env bash

# cspell:words bootstatus simctl udid UDID

set -euo pipefail

playground_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="${1:-${playground_dir}/Screenshots}"
derived_data="${playground_dir}/.build/screenshots"
bundle_id="com.santi020k.lumen.playground.apple"

components=(
  "Theme" "Text" "Surface" "Icon" "Icon button" "Button" "Button group"
  "Text field" "Textarea" "Field group" "Phone input" "Toggle" "Settings row" "Checkbox"
  "Radio group" "Segmented control" "Picker" "Slider" "Date field" "Date range field" "Search field"
  "Tabs"
  "Chip" "Badge" "Link" "Divider" "Spinner" "Card" "Alert" "Alert dialog"
  "Toast" "Banner" "Progress" "Skeleton" "Graphic" "Backdrop" "Illustration" "Image"
  "Sparkline" "Line chart" "Bar chart" "Pie chart" "Scatter chart" "Heatmap" "Range chart" "Combo chart"
  "Disclosure" "Avatar" "Empty state" "Error state" "List row" "Stat" "Gauge" "Section header"
  "Status bar" "Navigation bar" "Sheet" "Menu" "Share button" "Tab bar minimization"
  "Tab accessory"
)

if (( $# > 1 )); then
  components=("${@:2}")
fi

device_id="${LUMEN_SIMULATOR_UDID:-}"
if [[ -z "${device_id}" ]]; then
  device_id="$({ xcrun simctl list devices available --json \
    | /usr/bin/python3 -c 'import json,sys; data=json.load(sys.stdin); print(next(device["udid"] for runtime in data["devices"].values() for device in runtime if "iPhone" in device["name"]))'; })"
fi

mkdir -p "${output_dir}"
xcrun simctl boot "${device_id}" 2>/dev/null || true
if [[ "${CI:-}" != "true" ]]; then
  open -a Simulator
fi
xcrun simctl bootstatus "${device_id}" -b

xcodebuild \
  -project "${playground_dir}/LumenApplePlayground.xcodeproj" \
  -scheme LumenApplePlayground \
  -destination "platform=iOS Simulator,id=${device_id}" \
  -derivedDataPath "${derived_data}" \
  CODE_SIGNING_ALLOWED=NO \
  build

app_path="${derived_data}/Build/Products/Debug-iphonesimulator/LumenApplePlayground.app"
xcrun simctl install "${device_id}" "${app_path}"

for component in "${components[@]}"; do
  slug="$(printf '%s' "${component}" | tr '[:upper:] ' '[:lower:]-')"
  xcrun simctl terminate "${device_id}" "${bundle_id}" 2>/dev/null || true
  xcrun simctl launch "${device_id}" "${bundle_id}" --dark --component "${component}"
  # Allow SwiftUI layout and the generated icon asset catalog to settle before capture.
  sleep 2
  xcrun simctl io "${device_id}" screenshot "${output_dir}/${slug}.png"
done

printf 'Captured %s component screenshots in %s\n' "${#components[@]}" "${output_dir}"
