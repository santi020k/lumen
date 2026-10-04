# Homepage platform previews

These WebP images show real Lumen interfaces. Keep each capture at its original aspect ratio;
the homepage displays the complete image without a cover crop or a fading overlay.

- `web.webp`: the homepage `HomeWorkbench` canvas, captured in the Lumen light theme at a
  1440 px viewport. Only the canvas bounds are captured (1184 × 802 px).
- `react-native.webp`: the local Expo browser preview at
  `/native-previews/react-native-live/index.html?destination=examples&pattern=profile`, captured
  at 390 × 844 px. The caption explicitly identifies this as a browser preview.
- `apple.webp`: `apps/playground-apple/Store/Screenshots/iphone-02-examples-light.png`, resized to
  792 px wide.
- `android.webp`: `apps/playground-android/Store/Screenshots/phone-02-examples-light.png`, resized
  to 720 px wide.

The web and React Native screenshots were captured from the local v4 candidate on October 3, 2026.
The native images reuse the committed store captures; they do not establish v4 device qualification.
All images use WebP quality 88, generated with the docs app's existing Sharp dependency. Refresh
them from these sources when the showcased compositions change. Do not recreate native controls
in HTML or generate illustrative replacements for product screenshots.
