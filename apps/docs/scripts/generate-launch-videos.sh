#!/usr/bin/env bash
# cspell:ignore faststart libx movflags setsar webp

set -euo pipefail

project_root="$(cd "$(dirname "$0")/../../.." && pwd)"
output_directory="$project_root/apps/docs/public/launch"
launch_temp_directory="$(mktemp -d)"

cleanup() {
  rm -rf "$launch_temp_directory"
}

trap cleanup EXIT

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required to generate launch videos." >&2
  exit 1
fi

mkdir -p "$output_directory"

node "$project_root/apps/docs/scripts/render-launch-video-cards.mjs" "$launch_temp_directory"

common_video=(
  -r 30
  -c:v libx264
  -preset medium
  -crf 20
  -pix_fmt yuv420p
  -movflags +faststart
  -an
  -y
)

render_video() {
  local card_prefix="$1"
  local output_name="$2"

  ffmpeg \
    -loop 1 -t 4 -i "$launch_temp_directory/$card_prefix-1.webp" \
    -loop 1 -t 4 -i "$launch_temp_directory/$card_prefix-2.webp" \
    -loop 1 -t 4 -i "$launch_temp_directory/$card_prefix-3.webp" \
    -filter_complex "[0:v]scale=1280:720,setsar=1[v0];[1:v]scale=1280:720,setsar=1[v1];[2:v]scale=1280:720,setsar=1[v2];[v0][v1][v2]concat=n=3:v=1:a=0,format=yuv420p[v]" \
    -map "[v]" \
    "${common_video[@]}" \
    "$output_directory/$output_name"
}

render_vertical_video() {
  local card_prefix="$1"
  local output_name="$2"

  ffmpeg \
    -loop 1 -t 4 -i "$launch_temp_directory/$card_prefix-1-vertical.webp" \
    -loop 1 -t 4 -i "$launch_temp_directory/$card_prefix-2-vertical.webp" \
    -loop 1 -t 4 -i "$launch_temp_directory/$card_prefix-3-vertical.webp" \
    -filter_complex "[0:v]scale=1080:1920,setsar=1[v0];[1:v]scale=1080:1920,setsar=1[v1];[2:v]scale=1080:1920,setsar=1[v2];[v0][v1][v2]concat=n=3:v=1:a=0,format=yuv420p[v]" \
    -map "[v]" \
    "${common_video[@]}" \
    "$output_directory/$output_name"
}

render_video "web" "one-screen-three-web-targets.mp4"
render_video "skill" "prompt-to-verified-ui.mp4"
render_video "figma" "figma-to-native-foundations.mp4"

render_vertical_video "web" "one-screen-three-web-targets-vertical.mp4"
render_vertical_video "skill" "prompt-to-verified-ui-vertical.mp4"
render_vertical_video "figma" "figma-to-native-foundations-vertical.mp4"

echo "Generated launch videos in $output_directory"
