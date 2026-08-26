#!/usr/bin/env bash

# cspell:words hdpi mdpi qlmanage xhdpi xxhdpi xxxhdpi

set -euo pipefail

playground_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repository_dir="$(cd "${playground_dir}/../.." && pwd)"
source_icon="${repository_dir}/apps/store-assets/lumen-playground-icon.svg"
feature_graphic="${playground_dir}/Store/feature-graphic.svg"
resources_dir="${playground_dir}/app/src/main/res"
store_dir="${playground_dir}/Store"
temporary_dir="$(mktemp -d)"

cleanup() {
  rm -r "${temporary_dir}"
}
trap cleanup EXIT

qlmanage -t -s 1024 -o "${temporary_dir}" "${source_icon}" >/dev/null 2>&1
sips -s format jpeg -s formatOptions 100 "${temporary_dir}/lumen-playground-icon.svg.png" \
  --out "${temporary_dir}/master.jpg" >/dev/null
sips -s format png "${temporary_dir}/master.jpg" --out "${temporary_dir}/master.png" >/dev/null

generate_icon() {
  local destination="$1"
  local pixels="$2"
  mkdir -p "$(dirname "${destination}")"
  sips -z "${pixels}" "${pixels}" "${temporary_dir}/master.png" --out "${destination}" >/dev/null
}

generate_icon "${resources_dir}/mipmap-mdpi/app_icon.png" 48
generate_icon "${resources_dir}/mipmap-mdpi/app_icon_round.png" 48
generate_icon "${resources_dir}/mipmap-hdpi/app_icon.png" 72
generate_icon "${resources_dir}/mipmap-hdpi/app_icon_round.png" 72
generate_icon "${resources_dir}/mipmap-xhdpi/app_icon.png" 96
generate_icon "${resources_dir}/mipmap-xhdpi/app_icon_round.png" 96
generate_icon "${resources_dir}/mipmap-xxhdpi/app_icon.png" 144
generate_icon "${resources_dir}/mipmap-xxhdpi/app_icon_round.png" 144
generate_icon "${resources_dir}/mipmap-xxxhdpi/app_icon.png" 192
generate_icon "${resources_dir}/mipmap-xxxhdpi/app_icon_round.png" 192
generate_icon "${store_dir}/icon-512.png" 512

pnpm exec playwright screenshot \
  --viewport-size="1024,500" \
  "file://${feature_graphic}" \
  "${store_dir}/feature-graphic.png" >/dev/null
