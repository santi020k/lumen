#!/usr/bin/env bash
# cspell:words agvtool keychain plist iphoneos mobileprovision codesign xcarchive
set -euo pipefail
set +x
umask 077

platform="${1:-}"
if [[ "$platform" != iOS && "$platform" != macOS ]]; then
  printf 'Unsupported Apple release platform; use iOS or macOS.\n' >&2
  exit 1
fi
if [[ "${GITHUB_REF:-}" != refs/heads/main ]]; then
  printf 'Apple delivery requires merged main.\n' >&2
  exit 1
fi
for name in APPLE_DISTRIBUTION_P12_BASE64 APPLE_DISTRIBUTION_P12_PASSWORD APP_STORE_CONNECT_API_KEY_P8 APP_STORE_CONNECT_KEY_ID APP_STORE_CONNECT_ISSUER_ID; do
  if [[ -z "${!name:-}" ]]; then
    printf 'Missing required signing credential: %s\n' "$name" >&2
    exit 1
  fi
done

apple_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repository_root="$(cd "$apple_root/../.." && pwd)"
cd "$repository_root"
"$apple_root/scripts/check-app-store-toolchain.sh"
build_number="$(node .github/scripts/apple-store-build-number.mjs "$platform")"
version="$(node -p "require('./apps/playground-apple/release.json').version")"
if [[ ! "$build_number" =~ ^[1-9][0-9]*$ ]]; then
  printf 'Invalid live Apple build number.\n' >&2
  exit 1
fi

work="$(mktemp -d "${RUNNER_TEMP:?}/lumen-signing.XXXXXX")"
keychain="$work/signing.keychain-db"
keychain_password="$(openssl rand -hex 32)"
profile_directory="$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles"
cleanup() {
  if [[ -f "$work/installed-profile-uuids.txt" ]]; then
    while IFS= read -r profile_uuid; do
      if [[ "$profile_uuid" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]; then
        if ! rm -f "$profile_directory/$profile_uuid.mobileprovision"; then
          printf 'Could not remove an installed distribution profile; continuing private signing cleanup.\n' >&2
        fi
      fi
    done < "$work/installed-profile-uuids.txt"
  fi
  security delete-keychain "$keychain" >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT
export LUMEN_SIGNING_TEMP="$work"
node --input-type=module <<'JS'
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const root = process.env.LUMEN_SIGNING_TEMP;
writeFileSync(join(root, 'distribution.p12'), Buffer.from(process.env.APPLE_DISTRIBUTION_P12_BASE64, 'base64'), { mode: 0o600 });
writeFileSync(join(root, 'AuthKey.p8'), process.env.APP_STORE_CONNECT_API_KEY_P8.replace(/\\n/gu, '\n'), { mode: 0o600 });
JS
security create-keychain -p "$keychain_password" "$keychain"
security set-keychain-settings -lut 21600 "$keychain"
security unlock-keychain -p "$keychain_password" "$keychain"
security import "$work/distribution.p12" -P "$APPLE_DISTRIBUTION_P12_PASSWORD" -T /usr/bin/codesign -T /usr/bin/security -t cert -f pkcs12 -k "$keychain" >/dev/null
security set-key-partition-list -S apple-tool:,apple: -s -k "$keychain_password" "$keychain" >/dev/null
security list-keychains -d user -s "$keychain" "$HOME/Library/Keychains/login.keychain-db"
mkdir -p "$profile_directory"
node .github/scripts/apple-store-profiles.mjs "$platform" "$keychain" "$work" "$profile_directory"

if [[ "$platform" == iOS ]]; then
  scheme=LumenApplePlayground
  destination='generic/platform=iOS'
else
  scheme=LumenMacPlayground
  destination='generic/platform=macOS'
fi

cd "$apple_root"
xcrun agvtool new-marketing-version "$version"
xcrun agvtool new-version -all "$build_number"
auth=(-allowProvisioningUpdates -authenticationKeyPath "$work/AuthKey.p8" -authenticationKeyID "$APP_STORE_CONNECT_KEY_ID" -authenticationKeyIssuerID "$APP_STORE_CONNECT_ISSUER_ID")
xcodebuild -project LumenApplePlayground.xcodeproj -scheme "$scheme" -configuration Release -destination "$destination" -derivedDataPath "$work/DerivedData" -archivePath "$work/Playground.xcarchive" "${auth[@]}" CODE_SIGN_STYLE=Automatic CODE_SIGN_IDENTITY="Apple Development" DEVELOPMENT_TEAM=BY4995HQ3J archive
xcodebuild -exportArchive -archivePath "$work/Playground.xcarchive" -exportOptionsPlist "$work/ExportOptions.plist" -exportPath "$work/export" "${auth[@]}"
printf 'Uploaded %s %s (%s) from %s. Store processing/review remains to be verified.\n' "$platform" "$version" "$build_number" "$GITHUB_SHA" >> "$GITHUB_STEP_SUMMARY"
