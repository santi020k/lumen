# Phone flag artwork

The canonical SVG artwork is vendored from [flag-icons 7.5.0](https://github.com/lipis/flag-icons/releases/tag/v7.5.0), under its [MIT license](LICENSE).

Run `pnpm run generate:phone-flags` from the repository root after changing the source artwork.
The generator uses the docs workspace's pinned Sharp dependency to render 64 × 48 PNGs. Web and
React Native use the same offline data sources; SwiftUI and Compose bundle identical image resources.
No flag CDN, tracking request, emoji font, or additional runtime dependency is needed.

Ascension Island and Tristan da Cunha use the upstream `sh-ac` and `sh-ta` artwork with their phone
metadata region codes `AC` and `TA`. Unknown codes fall back to text. Flag artwork supplements the
country name and calling code; it is never the accessible label of a phone selector.

Run `pnpm run check:phone-flags` to verify generated assets. Identical Android artwork shares one
resource while retaining each country code in the generated map.

The complete offline web artwork map is approximately 196 KiB compressed. It is used by phone and
flag views and can be eliminated by tree shaking when those exports are unused. The bundle gate
checks this map separately so artwork growth remains visible.
