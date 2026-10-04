---
"@santi020k/lumen-react-native": patch
---

Respect Android accessibility time-to-action settings when automatically dismissing native toasts.
Never shorten the requested duration; retain it if the native timeout recommendation fails or is
invalid. Ignore stale recommendations after updates, dismissal, eviction, clearing or unmount,
while preserving persistent toasts and iOS/web durations.
