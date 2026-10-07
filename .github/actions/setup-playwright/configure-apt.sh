#!/usr/bin/env bash
set -euo pipefail

if [[ "${RUNNER_OS:-}" != Linux ]]; then
  exit 0
fi

# Keep the runner's configured HTTPS fallback when its Azure HTTP mirror stalls.
mirror_list="${1:-/etc/apt/apt-mirrors.txt}"
if [[ -f "$mirror_list" ]] \
  && awk '$1 == "https://archive.ubuntu.com/ubuntu/" || $1 == "https://archive.ubuntu.com/ubuntu" { found = 1 } END { exit !found }' "$mirror_list" \
  && awk '$1 == "http://azure.archive.ubuntu.com/ubuntu/" || $1 == "http://azure.archive.ubuntu.com/ubuntu" { found = 1 } END { exit !found }' "$mirror_list"; then
  filtered="$(mktemp)"
  trap 'rm -f "$filtered"' EXIT
  awk '$1 != "http://azure.archive.ubuntu.com/ubuntu/" && $1 != "http://azure.archive.ubuntu.com/ubuntu"' "$mirror_list" > "$filtered"
  sudo cp "$filtered" "$mirror_list"
fi

# Bound stalled connections while retaining package signature and TLS verification.
printf '%s\n' \
  'Acquire::http::Timeout "30";' \
  'Acquire::https::Timeout "30";' \
  'Acquire::Retries "2";' \
  | sudo tee /etc/apt/apt.conf.d/99-lumen-network > /dev/null
