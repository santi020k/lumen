---
"@santi020k/lumen-core": minor
"@santi020k/lumen-react-native": patch
---

Expose focused locale and native-input helpers and complete the chart helper entrypoint. Keep React Native imports on these entrypoints to avoid loading the unrelated web icon lookup catalog in native bundles.
