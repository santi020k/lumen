#!/usr/bin/env bash

# cspell:words qlmanage

set -euo pipefail

playground_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repository_dir="$(cd "${playground_dir}/../.." && pwd)"
source_icon="${repository_dir}/apps/store-assets/lumen-playground-icon.svg"
source_mark="${repository_dir}/apps/store-assets/lumen-playground-mark.svg"
assets_dir="${playground_dir}/assets"
temporary_dir="$(mktemp -d)"

cleanup() {
  rm -r "${temporary_dir}"
}
trap cleanup EXIT

mkdir -p "${assets_dir}"

qlmanage -t -s 1024 -o "${temporary_dir}" "${source_icon}" "${source_mark}" >/dev/null 2>&1

# App icons must be opaque. Converting through JPEG removes the alpha channel while preserving the
# shared source artwork used by the native store builds.
sips -s format jpeg -s formatOptions 100 "${temporary_dir}/lumen-playground-icon.svg.png" \
  --out "${temporary_dir}/icon.jpg" >/dev/null
sips -s format png "${temporary_dir}/icon.jpg" --out "${assets_dir}/icon.png" >/dev/null
sips -z 512 512 "${assets_dir}/icon.png" --out "${assets_dir}/favicon.png" >/dev/null

# Android adaptive icons and the native splash screen need a transparent foreground layer.
sips -z 1024 1024 "${temporary_dir}/lumen-playground-mark.svg.png" \
  --out "${assets_dir}/adaptive-icon.png" >/dev/null
cp "${assets_dir}/adaptive-icon.png" "${assets_dir}/splash-icon.png"
