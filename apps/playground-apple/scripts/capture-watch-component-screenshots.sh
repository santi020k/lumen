#!/usr/bin/env bash

# cspell:words bootstatus simctl udid UDID watchos

set -euo pipefail

playground_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="${1:-${playground_dir}/Screenshots/watchOS}"
derived_data="${playground_dir}/.build/watch-screenshots"
bundle_id="com.santi020k.lumen.playground.watch"

components=(
  "Wearable action"
  "Wearable progress"
  "Wearable status"
  "Wearable metric"
  "Wearable list row"
)

device_id="${LUMEN_WATCH_SIMULATOR_UDID:-}"
if [[ -z "${device_id}" ]]; then
  device_id="$({ xcrun simctl list devices available --json \
    | /usr/bin/python3 -c 'import json,sys; data=json.load(sys.stdin); print(next(device["udid"] for runtime,devices in data["devices"].items() if "watchOS" in runtime for device in devices))'; })"
fi

mkdir -p "${output_dir}"
xcrun simctl boot "${device_id}" 2>/dev/null || true
xcrun simctl bootstatus "${device_id}" -b

xcodebuild \
  -project "${playground_dir}/LumenApplePlayground.xcodeproj" \
  -scheme LumenWatchPlayground \
  -destination "platform=watchOS Simulator,id=${device_id}" \
  -derivedDataPath "${derived_data}" \
  CODE_SIGNING_ALLOWED=NO \
  build

app_path="${derived_data}/Build/Products/Debug-watchsimulator/LumenWatchPlayground.app"
xcrun simctl install "${device_id}" "${app_path}"

for component in "${components[@]}"; do
  slug="$(printf '%s' "${component}" | tr '[:upper:] ' '[:lower:]-')"
  xcrun simctl terminate "${device_id}" "${bundle_id}" 2>/dev/null || true
  xcrun simctl launch "${device_id}" "${bundle_id}" --component "${component}"
  sleep 2
  xcrun simctl io "${device_id}" screenshot "${output_dir}/${slug}.png"
done

printf 'Captured %s watchOS component screenshots in %s\n' "${#components[@]}" "${output_dir}"
