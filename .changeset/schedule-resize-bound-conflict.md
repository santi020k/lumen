---
'@santi020k/lumen-core': patch
---

Fix `resizeScheduleEvent` so the explicit `min`/`max` resize bound is never exceeded, even when the
event's fixed edge already sits outside that bound. The unconditional `>=1 minute` duration floor
previously took priority over the caller's bound (for example resizing an event's `end` could
return a value past `max` when the event's own `start` was already at or after `max`), silently
letting the result escape a caller-configured drag range. The explicit bound now always wins; the
duration floor is applied only when compatible with it.
