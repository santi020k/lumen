#!/usr/bin/env bash
set -euo pipefail

package="$1"
mirror="$2"
tag="$3"
manifest=.claude-plugin/plugin.json

cd "$mirror"
git switch -C main
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'

source_version="$(jq -er .version "$package/$manifest")"
if [[ -f "$manifest" ]]; then
  previous="$(jq -er .version "$manifest")"
  [[ "$previous" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
  if [[ "$(printf '%s\n' "$source_version" "$previous" | sort -V | tail -n1)" == "$previous" ]]; then
    # Ignore the mirror's generated version while checking whether the contents changed.
    jq --arg version "$previous" '.version = $version' "$package/$manifest" > "$package/$manifest.tmp"
    mv "$package/$manifest.tmp" "$package/$manifest"
    source_version="${previous%.*}.$(( ${previous##*.} + 1 ))"
  fi
fi

rsync --archive --delete --exclude=/.git/ "$package/" ./
git add --all
if git diff --cached --quiet; then
  echo "Claude plugin contents are unchanged."
  exit 0
fi

jq --arg version "$source_version" '.version = $version' "$manifest" > "$manifest.tmp"
mv "$manifest.tmp" "$manifest"
git add -- "$manifest"
git commit -m "Publish Lumen UI plugin $source_version from Lumen $tag"
git push origin HEAD:refs/heads/main
