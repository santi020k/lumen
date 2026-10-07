#!/usr/bin/env bash
set -euo pipefail

android_sdk_root="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/usr/local/lib/android/sdk}}"
sdkmanager="$android_sdk_root/cmdline-tools/latest/bin/sdkmanager"
if [[ ! -x "$sdkmanager" ]]; then
    echo "Android SDK command-line tools are missing: $sdkmanager" >&2
    exit 1
fi
ndk_version="$(node --input-type=module -e '
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(new URL("./apps/playground-react-native/package.json", `file://${process.cwd()}/`));
const directory = dirname(require.resolve("react-native/package.json"));
const source = readFileSync(join(directory, "gradle/libs.versions.toml"), "utf8");
const version = /^ndkVersion = "([0-9]+\.[0-9]+\.[0-9]+)"$/m.exec(source)?.[1];
if (!version) throw new Error("Missing locked React Native NDK version");
console.log(version);
')"

for attempt in 1 2 3; do
    if "$sdkmanager" "ndk;$ndk_version"; then
        exit 0
    fi
    if [[ "$attempt" == 3 ]]; then
        echo "React Native NDK installation failed after three attempts." >&2
        exit 1
    fi
    echo "NDK download failed; retrying installation (attempt $((attempt + 1))/3)." >&2
    sleep 5
done
