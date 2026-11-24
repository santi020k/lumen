#!/usr/bin/env bash
set -euo pipefail

if [[ "${RUNNER_OS:-}" != Linux ]]; then
  exit 0
fi

# Keep the runner's configured HTTPS fallback when its cloud HTTP mirrors stall.
mirror_list="${1:-/etc/apt/apt-mirrors.txt}"
cloud_mirror_pattern='^http://(azure|[a-z0-9-]+[.]ec2)[.]archive[.]ubuntu[.]com/ubuntu/?$'
if [[ -f "$mirror_list" ]] \
  && awk '$1 == "https://archive.ubuntu.com/ubuntu/" || $1 == "https://archive.ubuntu.com/ubuntu" { found = 1 } END { exit !found }' "$mirror_list" \
  && awk -v pattern="$cloud_mirror_pattern" '$1 ~ pattern { found = 1 } END { exit !found }' "$mirror_list"; then
  filtered="$(mktemp)"
  trap 'rm -f "$filtered"' EXIT
  awk -v pattern="$cloud_mirror_pattern" '$1 !~ pattern' "$mirror_list" > "$filtered"
  sudo cp "$filtered" "$mirror_list"
fi

# Bound stalled connections while retaining package signature and TLS verification.
printf '%s\n' \
  'Acquire::http::Timeout "30";' \
  'Acquire::https::Timeout "30";' \
  'Acquire::Retries "2";' \
  | sudo tee /etc/apt/apt.conf.d/99-lumen-network > /dev/null
