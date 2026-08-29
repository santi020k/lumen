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

components=(
    "Theme"
    "Text"
    "Surface"
    "Icon"
    "Icon button"
    "Button"
    "Button group"
    "Chip"
    "Floating action button"
    "Text field"
    "Textarea"
    "Field group"
    "Toggle"
    "Settings row"
    "Search field"
    "Phone input"
    "Date field"
    "Date range field"
    "Checkbox"
    "Radio group"
    "Segmented control"
    "Tabs"
    "Picker"
    "Slider"
    "Badge"
    "Divider"
    "Spinner"
    "Alert"
    "Progress"
    "Banner"
    "Toast"
    "Status bar"
    "Skeleton"
    "Disclosure"
    "Graphic"
    "Backdrop"
    "Illustration"
    "Image"
    "Sparkline"
    "Line chart"
    "Bar chart"
    "Pie chart"
    "Scatter chart"
    "Heatmap"
    "Range chart"
    "Combo chart"
    "Card"
    "Avatar"
    "Empty state"
    "Error state"
    "List row"
    "Stat"
    "Gauge"
    "Section header"
    "Alert dialog"
    "Sheet"
    "Menu"
    "Share button"
    "Navigation bar"
    "Navigation bar scroll behavior"
    "Navigation bar accessory"
    "Adaptive navigation scaffold"
)

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
        "Sparkline"|"Line chart"|"Bar chart"|"Pie chart"|"Scatter chart"|"Heatmap"|"Range chart"|"Combo chart") scroll_count=2 ;;
        "Card"|"Avatar"|"List row") scroll_count=1 ;;
        "Empty state") scroll_count=3 ;;
        "Error state") scroll_count=4 ;;
        "Error state") scroll_count=5 ;;
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
