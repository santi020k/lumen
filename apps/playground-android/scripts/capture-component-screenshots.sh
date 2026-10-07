#!/usr/bin/env bash

# cspell:words keyevent keyguard screencap

set -euo pipefail

sdk_root="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/Library/Android/sdk}}"
adb="$sdk_root/platform-tools/adb"
output_directory="${1:-build/screenshots}"
phone_activity="com.santi020k.lumen.playground.compose/.MainActivity"
wear_activity="com.santi020k.lumen.playground.wear/.WearMainActivity"

if [[ ! -x "$adb" ]]; then
    echo "Android Debug Bridge was not found at $adb." >&2
    exit 1
fi

if [[ -z "$($adb devices | sed -n '2p')" ]]; then
    echo "No booted Android emulator or connected device was found." >&2
    exit 1
fi

mkdir -p "$output_directory/phone" "$output_directory/wear"

# Capture settled component states rather than a device-dependent transition frame.
# Preserve the developer's animation settings when this also runs outside CI.
animation_keys=(window_animation_scale transition_animation_scale animator_duration_scale)
animation_values=()
for key in "${animation_keys[@]}"; do
    animation_values+=("$($adb shell settings get global "$key" | tr -d '\r')")
done
restore_capture_animation_settings() {
    local status=$?
    local restore_failed=false
    trap - EXIT
    for index in "${!animation_keys[@]}"; do
        if [[ "${animation_values[$index]}" == null ]]; then
            if ! $adb shell settings delete global "${animation_keys[$index]}" >/dev/null; then
                restore_failed=true
            fi
        elif ! $adb shell settings put global "${animation_keys[$index]}" "${animation_values[$index]}"; then
            restore_failed=true
        fi
    done
    if [[ "$restore_failed" == true ]]; then
        echo 'Could not restore Android capture animation settings.' >&2
        if [[ "$status" == 0 ]]; then status=1; fi
    fi
    exit "$status"
}
trap restore_capture_animation_settings EXIT
for key in "${animation_keys[@]}"; do
    $adb shell settings put global "$key" 0
done

if $adb shell pm list features | grep -q 'android.hardware.type.watch'; then
    wear_components=("Theme" "Action button" "Progress ring" "Status" "Metric" "List row")
    $adb shell input keyevent 224
    $adb shell wm dismiss-keyguard

    for component in "${wear_components[@]}"; do
        filename="$(printf '%s' "$component" | tr '[:upper:] ' '[:lower:]-')"
        $adb shell am force-stop com.santi020k.lumen.playground.wear
        $adb shell am start -W -n "$wear_activity" --es component "\"$component\"" >/dev/null
        $adb shell input keyevent 224
        sleep 1
        $adb exec-out screencap -p > "$output_directory/wear/$filename.png"
    done

    echo "Captured Lumen Wear component screenshots in $output_directory/wear."
    exit 0
fi

script_directory="$(cd "$(dirname "$0")" && pwd)"
components=()
while IFS= read -r component; do
    components+=("$component")
done < "$script_directory/component-capture-catalog.generated.txt"

if (( $# > 1 )); then
    components=("${@:2}")
fi

for component in "${components[@]}"; do
    filename="$(printf '%s' "$component" | tr '[:upper:] ' '[:lower:]-')"
    scroll_count=0
    case "$component" in
        "Floating action button") scroll_count=1 ;;
        "Textarea"|"Field group") scroll_count=1 ;;
        "Toggle"|"Settings row"|"Checkbox") scroll_count=2 ;;
        "Radio group") scroll_count=3 ;;
        "Segmented control") scroll_count=4 ;;
        "Tabs") scroll_count=5 ;;
        "Picker") scroll_count=6 ;;
        "Slider") scroll_count=7 ;;
        "Progress"|"Banner") scroll_count=1 ;;
        "Toast"|"Status bar") scroll_count=2 ;;
        "Disclosure") scroll_count=1 ;;
        "Backdrop") scroll_count=1 ;;
        "Illustration") scroll_count=2 ;;
        "Image") scroll_count=2 ;;
        "Heatmap"|"Lollipop chart"|"Dumbbell chart") scroll_count=4 ;;
        "Bullet chart") scroll_count=5 ;;
        "Sparkline"|"Line chart"|"Bar chart"|"Pie chart"|"Scatter chart"|"Waterfall chart"|"Histogram"|"Range chart"|"Combo chart") scroll_count=2 ;;
        "Card"|"Avatar"|"List row") scroll_count=1 ;;
        "Empty state") scroll_count=3 ;;
        "Error state") scroll_count=4 ;;
        "Adaptive navigation scaffold") scroll_count=2 ;;
    esac

    # Long catalog runs can outlive the emulator's display timeout. Keep each
    # capture deterministic even when an earlier accessibility suite left the
    # device locked or the screen turned off.
    $adb shell input keyevent 224
    $adb shell wm dismiss-keyguard
    sleep 0.5
    $adb shell am force-stop com.santi020k.lumen.playground.compose
    $adb shell am start -W -n "$phone_activity" --es component "\"$component\"" >/dev/null
    for ((index = 0; index < scroll_count; index += 1)); do
        $adb shell input swipe 540 1500 540 650 250
        sleep 0.3
    done
    sleep 1
    $adb exec-out screencap -p > "$output_directory/phone/$filename.png"
done

echo "Captured Lumen component screenshots in $output_directory."
