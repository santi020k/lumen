#!/usr/bin/env bash

# cspell:words bootstatus loglevel simctl udid UDID

set -euo pipefail

playground_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="${1:-${playground_dir}/Store/Screenshots}"
derived_data="${playground_dir}/.build/store-screenshots"
bundle_id="com.santi020k.lumen.playground.apple"
capture_dir="$(mktemp -d "${TMPDIR:-/tmp}/lumen-apple-store-screenshots.XXXXXX")"
started_device_ids=()
status_bar_device_ids=()

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

cleanup() {
  local device_id
  for device_id in "${status_bar_device_ids[@]}"; do
    xcrun simctl status_bar "${device_id}" clear 2>/dev/null || true
  done
  for device_id in "${started_device_ids[@]}"; do
    xcrun simctl shutdown "${device_id}" 2>/dev/null || true
  done
  rm -rf "${capture_dir}"
}
trap cleanup EXIT

device_is_booted() {
  local device_id="$1"
  xcrun simctl list devices --json | /usr/bin/python3 -c \
    'import json,sys; data=json.load(sys.stdin); target=sys.argv[1]; print("true" if any(device["udid"] == target and device["state"] == "Booted" for devices in data["devices"].values() for device in devices) else "false")' \
    "${device_id}"
}

capture_rendered_frame() {
  local device_id="$1"
  local screenshot_path="$2"
  local _
  for _ in {1..20}; do
    sleep 1
    xcrun simctl io "${device_id}" screenshot "${screenshot_path}"
    if [[ "$(stat -f '%z' "${screenshot_path}")" -ge 100000 ]]; then
      return 0
    fi
  done
  echo "The app did not finish rendering a complete frame for ${screenshot_path}." >&2
  return 1
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

  if [[ "$(device_is_booted "${device_id}")" == "false" ]]; then
    xcrun simctl boot "${device_id}"
    started_device_ids+=("${device_id}")
  fi
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
  status_bar_device_ids+=("${device_id}")

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
    local screenshot_path="${capture_dir}/${prefix}-${sequence}-${destination}-${appearance}.png"
    capture_rendered_frame "${device_id}" "${screenshot_path}"
    strip_alpha "${screenshot_path}"
  done

  xcrun simctl status_bar "${device_id}" clear
  printf 'Captured six %s store screenshots from %s.\n' "${prefix}" "${device_name}"
}

iphone_id="${LUMEN_IPHONE_STORE_UDID:-$(device_id_for_name "iPhone 17 Pro Max")}"
ipad_id="${LUMEN_IPAD_STORE_UDID:-$(device_id_for_name "iPad Pro 13-inch (M5)")}"

capture_device "iPhone 17 Pro Max" iphone "${iphone_id}"
capture_device "iPad Pro 13-inch (M5)" ipad "${ipad_id}"

mkdir -p "${output_dir}"
rm -f "${output_dir}"/iphone-*.png "${output_dir}"/ipad-*.png
for screenshot_path in "${capture_dir}"/*.png; do
  mv "${screenshot_path}" "${output_dir}/"
done

printf 'Captured App Store screenshots in %s.\n' "${output_dir}"
