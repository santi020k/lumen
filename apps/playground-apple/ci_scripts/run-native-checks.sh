#!/bin/zsh

set -euo pipefail

mode="${1:-}"
apple_root="${0:A:h:h}"
repository_root="${CI_PRIMARY_REPOSITORY_PATH:-${apple_root:h:h}}"

if [[ ! -f "$repository_root/pnpm-lock.yaml" ]]; then
    print -u2 "Could not locate the Lumen repository at $repository_root"
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    brew install node@22
    export PATH="$(brew --prefix node@22)/bin:$PATH"
fi

corepack_command="$(command -v corepack || true)"
if [[ -z "$corepack_command" ]]; then
    corepack_root="${TMPDIR:-/tmp}/lumen-corepack-${CI_BUILD_NUMBER:-local}"
    mkdir -p "$corepack_root"
    npm install --prefix "$corepack_root" corepack@0.34.6
    corepack_command="$corepack_root/node_modules/.bin/corepack"
fi

pnpm() {
    "$corepack_command" pnpm "$@"
}

pnpm --version

cd "$repository_root"
pnpm install --frozen-lockfile

case "$mode" in
    pull-request)
        pnpm run check:swift-assets
        pnpm run check:swift-version
        pnpm run test:swift-version
        swift test
        pnpm run check:swift-source-compatibility
        pnpm run check:swift-api-baseline
        swift build --package-path apps/playground-apple
        pnpm run check:swift-package-candidate
        pnpm run check:react-native-native-package:ios
        CI_XCODE_CLOUD=1 apps/playground-apple/scripts/capture-component-screenshots.sh
        pnpm --filter @santi020k/lumen-docs exec node --experimental-strip-types \
            scripts/sync-native-component-captures.mjs \
            --compare --platform=apple --source=default --tolerance=0.12
        pnpm exec playwright install chromium
        pnpm run test:visual
        pnpm run test:framework-visual
        ;;
    published)
        react_native_version="${2:-}"
        swift_version="${3:-}"
        expected_revision="${4:-}"

        if [[ -z "$react_native_version" || -z "$swift_version" || -z "$expected_revision" ]]; then
            print -u2 "Published checks require React Native version, Swift version, and revision."
            exit 1
        fi

        pnpm run check:react-native-native-release:ios -- \
            --version "$react_native_version" \
            --revision "$expected_revision"
        node scripts/smoke-swift-package-candidate.mjs \
            --url https://github.com/santi020k/lumen \
            --version "$swift_version"
        ;;
    *)
        print -u2 "Usage: run-native-checks.sh pull-request|published [react-native-version swift-version revision]"
        exit 1
        ;;
esac
