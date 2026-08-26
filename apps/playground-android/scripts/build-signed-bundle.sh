#!/usr/bin/env bash

set -euo pipefail

required_values=(
  LUMEN_PLAYGROUND_KEYSTORE_BASE64
  LUMEN_PLAYGROUND_KEYSTORE_PASSWORD
  LUMEN_PLAYGROUND_KEY_ALIAS
  LUMEN_PLAYGROUND_KEY_PASSWORD
)

for value_name in "${required_values[@]}"; do
  if [[ -z "${!value_name:-}" ]]; then
    echo "Missing required signing value: ${value_name}." >&2
    exit 1
  fi
done

repository_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
temporary_dir="$(mktemp -d "${TMPDIR:-/tmp}/lumen-playground-signing.XXXXXX")"
temporary_keystore="${temporary_dir}/upload-key.jks"

cleanup() {
  rm -f "${temporary_keystore}"
  rmdir "${temporary_dir}"
}
trap cleanup EXIT

if base64 --help 2>&1 | grep -q -- "--decode"; then
  printf '%s' "${LUMEN_PLAYGROUND_KEYSTORE_BASE64}" | base64 --decode > "${temporary_keystore}"
else
  printf '%s' "${LUMEN_PLAYGROUND_KEYSTORE_BASE64}" | base64 -D > "${temporary_keystore}"
fi

chmod 600 "${temporary_keystore}"
export LUMEN_PLAYGROUND_KEYSTORE_PATH="${temporary_keystore}"

"${repository_dir}/packages/compose/gradlew" \
  -p "${repository_dir}/apps/playground-android" \
  :app:bundleForPlay
