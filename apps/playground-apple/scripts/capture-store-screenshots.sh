#!/usr/bin/env bash

# cspell:words bootstatus loglevel simctl udid UDID

set -euo pipefail

playground_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="${1:-${playground_dir}/Store/Screenshots}"
derived_data="${playground_dir}/.build/store-screenshots"
bundle_id="com.santi020k.lumen.playground.apple"

destinations=(home examples components components settings examples)
appearances=(light light light dark light dark)

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required to export opaque store PNGs." >&2
  exit 1
fi

strip_alpha() {
  local path="$1"
  local opaque_path="${path%.png}.opaque.png"
  ffmpeg -loglevel error -y -i "${path}" -frames:v 1 -pix_fmt rgb24 "${opaque_path}"
  mv "${opaque_path}" "${path}"
}

device_id_for_name() {
  local name="$1"
  xcrun simctl list devices available --json | /usr/bin/python3 -c \
    'import json,sys; data=json.load(sys.stdin); target=sys.argv[1]; print(next(device["udid"] for runtime, devices in data["devices"].items() if "iOS-26" in runtime for device in devices if device["name"] == target))' \
    "${name}"
}

capture_device() {
  local device_name="$1"
  local prefix="$2"
  local device_id="$3"

  xcrun simctl boot "${device_id}" 2>/dev/null || true
  xcrun simctl bootstatus "${device_id}" -b

  xcodebuild \
    -project "${playground_dir}/LumenApplePlayground.xcodeproj" \
    -scheme LumenApplePlayground \
    -destination "platform=iOS Simulator,id=${device_id}" \
    -derivedDataPath "${derived_data}" \
    CODE_SIGNING_ALLOWED=NO \
    build

  local app_path="${derived_data}/Build/Products/Debug-iphonesimulator/LumenApplePlayground.app"
  xcrun simctl install "${device_id}" "${app_path}"

  for index in "${!destinations[@]}"; do
    local destination="${destinations[$index]}"
    local appearance="${appearances[$index]}"
    local sequence
    sequence="$(printf '%02d' "$((index + 1))")"
    local arguments=(--destination "${destination}")

    if [[ "${appearance}" == "dark" ]]; then
      arguments+=(--dark)
    fi

    xcrun simctl terminate "${device_id}" "${bundle_id}" 2>/dev/null || true
    xcrun simctl ui "${device_id}" appearance "${appearance}"
    xcrun simctl status_bar "${device_id}" override \
      --time 9:41 --batteryState charged --batteryLevel 100 \
      --wifiBars 3 --cellularBars 4
    xcrun simctl launch "${device_id}" "${bundle_id}" "${arguments[@]}"
    sleep 2
    local screenshot_path="${output_dir}/${prefix}-${sequence}-${destination}-${appearance}.png"
    xcrun simctl io "${device_id}" screenshot "${screenshot_path}"
    strip_alpha "${screenshot_path}"
  done

  xcrun simctl status_bar "${device_id}" clear
  xcrun simctl shutdown "${device_id}"
  printf 'Captured six %s store screenshots from %s.\n' "${prefix}" "${device_name}"
}

mkdir -p "${output_dir}"
rm -f "${output_dir}"/iphone-*.png "${output_dir}"/ipad-*.png

iphone_id="${LUMEN_IPHONE_STORE_UDID:-$(device_id_for_name "iPhone 17 Pro Max")}"
ipad_id="${LUMEN_IPAD_STORE_UDID:-$(device_id_for_name "iPad Pro 13-inch (M5)")}"

capture_device "iPhone 17 Pro Max" iphone "${iphone_id}"
capture_device "iPad Pro 13-inch (M5)" ipad "${ipad_id}"

printf 'Captured App Store screenshots in %s.\n' "${output_dir}"
