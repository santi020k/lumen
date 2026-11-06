---
"@santi020k/lumen-core": patch
"@santi020k/lumen-astro": patch
"@santi020k/lumen-react": patch
"@santi020k/lumen-elements": patch
"@santi020k/lumen": patch
---

Keep one owner for media borders and corners across AspectRatio, CoverImage, DeviceFrame,
ImageComparison, MediaViewport, and MediaThumbnail, including selective Image style imports.
Preserve component-owned figures, captions, media, and link focus geometry inside Prose. Keep
avatar, flag, attachment, and QRCode images from inheriting article corner rounding.

Give custom-element media frames and reading surfaces block layout, and replace the AspectRatio
docs' clipped Cards with actual media examples. Card retains visible interactive overflow.

Image wrappers pass radius and fit to native image children, and AspectRatio keeps picture media
sized to its frame even when Image styles load later. Explicit Image fitting remains available.
