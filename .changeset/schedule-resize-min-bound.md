---
'@santi020k/lumen-core': patch
---

Fix `resizeScheduleEvent` so a `min` resize bound is enforced when no `max` bound is also given.
Previously, resizing an event's start earlier than a configured `min` (a common case, since start
edges are usually resized without a `max`) silently produced a time before `min` instead of
clamping to it.
