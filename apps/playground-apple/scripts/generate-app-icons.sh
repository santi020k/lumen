#!/usr/bin/env bash

# cspell:words appiconset qlmanage

set -euo pipefail

playground_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repository_dir="$(cd "${playground_dir}/../.." && pwd)"
source_icon="${repository_dir}/apps/store-assets/lumen-playground-icon.svg"
icon_set="${playground_dir}/Supporting/Assets.xcassets/AppIcon.appiconset"
temporary_dir="$(mktemp -d)"

cleanup() {
  rm -r "${temporary_dir}"
}
trap cleanup EXIT

mkdir -p "${icon_set}"
qlmanage -t -s 1024 -o "${temporary_dir}" "${source_icon}" >/dev/null 2>&1
sips -s format jpeg -s formatOptions 100 "${temporary_dir}/lumen-playground-icon.svg.png" \
  --out "${temporary_dir}/master.jpg" >/dev/null
sips -s format png "${temporary_dir}/master.jpg" --out "${temporary_dir}/master.png" >/dev/null

generate_icon() {
  local filename="$1"
  local pixels="$2"
  sips -z "${pixels}" "${pixels}" "${temporary_dir}/master.png" \
    --out "${icon_set}/${filename}" >/dev/null
}

generate_icon "AppIcon-20.png" 20
generate_icon "AppIcon-20@2x.png" 40
generate_icon "AppIcon-20@3x.png" 60
generate_icon "AppIcon-29.png" 29
generate_icon "AppIcon-29@2x.png" 58
generate_icon "AppIcon-29@3x.png" 87
generate_icon "AppIcon-40.png" 40
generate_icon "AppIcon-40@2x.png" 80
generate_icon "AppIcon-40@3x.png" 120
generate_icon "AppIcon-60@2x.png" 120
generate_icon "AppIcon-60@3x.png" 180
generate_icon "AppIcon-76.png" 76
generate_icon "AppIcon-76@2x.png" 152
generate_icon "AppIcon-83.5@2x.png" 167
generate_icon "AppIcon-1024.png" 1024
generate_icon "AppIcon-Mac-16.png" 16
generate_icon "AppIcon-Mac-16@2x.png" 32
generate_icon "AppIcon-Mac-32.png" 32
generate_icon "AppIcon-Mac-32@2x.png" 64
generate_icon "AppIcon-Mac-128.png" 128
generate_icon "AppIcon-Mac-128@2x.png" 256
generate_icon "AppIcon-Mac-256.png" 256
generate_icon "AppIcon-Mac-256@2x.png" 512
generate_icon "AppIcon-Mac-512.png" 512
generate_icon "AppIcon-Mac-512@2x.png" 1024
