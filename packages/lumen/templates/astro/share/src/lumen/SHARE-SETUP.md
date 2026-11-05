# Share setup

Install @santi020k/lumen-astro in the application. Install @santi020k/lumen separately for the CLI,
then run lumen add share --target astro.

Keep the selective imports and mount @santi020k/lumen-astro/runtime once in the root layout.
Pass a unique id, canonical url, title, and optional text. Destinations are explicit application-owned
links with label, href, and optional newTab. Validate them in the application's data boundary.

The native disclosure exposes destinations and the readonly URL without JavaScript. Enhancement
opens the public Dialog with CopyButton, manual-copy recovery, and an explicit native-share button
when available. Supply localized labels. Cancellation keeps fallback actions available.
