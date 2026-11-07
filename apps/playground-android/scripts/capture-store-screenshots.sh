#!/usr/bin/env bash

# cspell:words keyevent keyguard loglevel screencap sysui systemui

set -euo pipefail

sdk_root="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/Library/Android/sdk}}"
adb="${sdk_root}/platform-tools/adb"
output_directory="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/Store/Screenshots}"
activity="com.santi020k.lumen.playground.compose/.MainActivity"
package="com.santi020k.lumen.playground.compose"
store_scale="${LUMEN_ANDROID_STORE_SCALE:-2}"
case "${store_scale}" in
  1|2) ;;
  *) echo "LUMEN_ANDROID_STORE_SCALE must be 1 or 2." >&2; exit 1 ;;
esac
store_width="$((1080 * store_scale))"
store_height="$((1920 * store_scale))"
store_density="$((420 * store_scale))"
capture_directory="$(mktemp -d "${TMPDIR:-/tmp}/lumen-android-store-screenshots.XXXXXX")"

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

if [[ ! -x "${adb}" ]]; then
  echo "Android Debug Bridge was not found at ${adb}." >&2
  exit 1
fi

if [[ -z "$(${adb} devices | sed -n '2p')" ]]; then
  echo "No booted Android emulator or connected device was found." >&2
  exit 1
fi

original_size="$(${adb} shell wm size | tr -d '\r')"
original_density="$(${adb} shell wm density | tr -d '\r')"
original_demo_allowed="$(${adb} shell settings get global sysui_demo_allowed | tr -d '\r')"
original_size_override="$(printf '%s\n' "${original_size}" | sed -n 's/^Override size: //p')"
original_density_override="$(printf '%s\n' "${original_density}" | sed -n 's/^Override density: //p')"

restore_display() {
  ${adb} shell am broadcast -a com.android.systemui.demo -e command exit >/dev/null
  if [[ -n "${original_size_override}" ]]; then
    ${adb} shell wm size "${original_size_override}" >/dev/null
  else
    ${adb} shell wm size reset >/dev/null
  fi
  if [[ -n "${original_density_override}" ]]; then
    ${adb} shell wm density "${original_density_override}" >/dev/null
  else
    ${adb} shell wm density reset >/dev/null
  fi
  if [[ "${original_demo_allowed}" == "null" ]]; then
    ${adb} shell settings delete global sysui_demo_allowed >/dev/null
  else
    ${adb} shell settings put global sysui_demo_allowed "${original_demo_allowed}" >/dev/null
  fi
  rm -rf "${capture_directory}"
}
trap restore_display EXIT

# Preserve the same native layout at either supported 9:16 capture resolution.
${adb} shell wm size "${store_width}x${store_height}" >/dev/null
${adb} shell wm density "${store_density}" >/dev/null
${adb} shell input keyevent 224
${adb} shell wm dismiss-keyguard
${adb} shell settings put global sysui_demo_allowed 1
${adb} shell am broadcast -a com.android.systemui.demo -e command enter >/dev/null
${adb} shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941 >/dev/null
${adb} shell am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged true >/dev/null
${adb} shell am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4 >/dev/null

for index in "${!destinations[@]}"; do
  destination="${destinations[$index]}"
  appearance="${appearances[$index]}"
  sequence="$(printf '%02d' "$((index + 1))")"
  dark=false
  if [[ "${appearance}" == "dark" ]]; then
    dark=true
  fi

  ${adb} shell am force-stop "${package}"
  ${adb} shell am start -W -n "${activity}" \
    --es destination "${destination}" \
    --ez darkTheme "${dark}" >/dev/null
  sleep 2
  screenshot_path="${capture_directory}/phone-${sequence}-${destination}-${appearance}.png"
  ${adb} exec-out screencap -p > "${screenshot_path}"
  strip_alpha "${screenshot_path}"
done

mkdir -p "${output_directory}"
rm -f "${output_directory}"/phone-*.png
for screenshot_path in "${capture_directory}"/*.png; do
  mv "${screenshot_path}" "${output_directory}/"
done

printf 'Captured six %sx%s Google Play screenshots in %s.\n' "${store_width}" "${store_height}" "${output_directory}"
printf 'Restoring display settings (%s; %s).\n' "${original_size}" "${original_density}"
