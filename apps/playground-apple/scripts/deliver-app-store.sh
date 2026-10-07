#!/usr/bin/env bash
# cspell:words agvtool keychain plist iphoneos mobileprovision codesign xcarchive
set -euo pipefail
set +x
umask 077

platform="${1:-}"
[[ "$platform" == iOS || "$platform" == macOS ]]
[[ "${GITHUB_REF:-}" == refs/heads/main ]]
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
[[ "$build_number" =~ ^[1-9][0-9]*$ ]]

work="$(mktemp -d "${RUNNER_TEMP:?}/lumen-signing.XXXXXX")"
keychain="$work/signing.keychain-db"
keychain_password="$(openssl rand -hex 32)"
cleanup() {
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

if [[ "$platform" == iOS ]]; then
  scheme=LumenApplePlayground
  destination='generic/platform=iOS'
  signing_identity='Apple Distribution'
else
  scheme=LumenMacPlayground
  destination='generic/platform=macOS'
  signing_identity='3rd Party Mac Developer Application'
fi

cd "$apple_root"
xcrun agvtool new-marketing-version "$version"
xcrun agvtool new-version -all "$build_number"
auth=(-allowProvisioningUpdates -authenticationKeyPath "$work/AuthKey.p8" -authenticationKeyID "$APP_STORE_CONNECT_KEY_ID" -authenticationKeyIssuerID "$APP_STORE_CONNECT_ISSUER_ID")
xcodebuild -project LumenApplePlayground.xcodeproj -scheme "$scheme" -configuration Release -destination "$destination" -derivedDataPath "$work/DerivedData" -archivePath "$work/Playground.xcarchive" "${auth[@]}" CODE_SIGN_STYLE=Automatic CODE_SIGN_IDENTITY="$signing_identity" OTHER_CODE_SIGN_FLAGS="--keychain $keychain" archive
cat > "$work/ExportOptions.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>destination</key><string>upload</string>
<key>signingStyle</key><string>automatic</string>
<key>teamID</key><string>BY4995HQ3J</string>
<key>manageAppVersionAndBuildNumber</key><false/>
</dict></plist>
PLIST
xcodebuild -exportArchive -archivePath "$work/Playground.xcarchive" -exportOptionsPlist "$work/ExportOptions.plist" -exportPath "$work/export" "${auth[@]}"
printf 'Uploaded %s %s (%s) from %s. Store processing/review remains to be verified.\n' "$platform" "$version" "$build_number" "$GITHUB_SHA" >> "$GITHUB_STEP_SUMMARY"
