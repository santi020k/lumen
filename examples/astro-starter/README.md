# Lumen Astro Starter

Four free, editable Astro templates with public Lumen UI components and seven theme families.
Use them for personal or commercial projects under the included MIT license.

## Start locally

Use Node.js 22.23.4 or newer and pnpm 12.18.0.

```bash
pnpm install
pnpm dev
```

Open the local address printed by Astro. Build and inspect the static output with:

```bash
pnpm check
pnpm build
pnpm preview
```

The starter is independent of the Lumen monorepo. Its dependencies resolve from npm and its local
workspace configuration lets it run both inside the repository and after downloading the ZIP.

## Choose a page

| Route | Source | Included behavior |
| --- | --- | --- |
| `/` | `src/components/Landing.astro` | Template links and a component-based hero composition |
| `/ecommerce/` | `src/components/Storefront.astro` | Local sample cart, quantities, removal, totals, demo checkout |
| `/dashboard/` | `src/components/Dashboard.astro` | Sample metrics and charts for 7, 30, and 90 days, plus order-status filters |
| `/portfolio/` | `src/components/Portfolio.astro` | Project filters and editable project stories |

`src/Starter.astro` owns the shared document, navigation, stylesheet imports, and one Lumen runtime.
`src/styles/starter.css` owns layout and original illustrative artwork. Change the content and data in
the page components, then remove any pages you do not need.

The portfolio identity and storefront are fictional examples. Replace the sample content before
publishing your own site. The storefront stores product identifiers and quantities in this browser.
Connect your commerce provider for checkout, server-validated prices, inventory, shipping, and tax.
The dashboard uses illustrative data and owns no authentication or backend service.

## Themes

Choose Lumen, Santi020k, Studio, Paper, Field, Glass, or Harbor in the header. The adjacent control
switches between light and dark. Preferences persist across pages when browser storage is available.
A first visit follows the system color scheme.

The first six families use Lumen's public theme stylesheets. Harbor is the MIT-licensed community
example from Lumen, included in `src/styles/harbor.css`. All page colors use semantic Lumen tokens.

The theme controller lives in `src/scripts/theme.ts`. The small script in `src/Starter.astro` applies
saved preferences before the page paints. Keep those family lists aligned when adding a theme.

## Deploy

Run `pnpm build` and serve the `dist` directory with your static host. Set Astro's `site` option in
`astro.config.mjs` to your canonical production URL before deployment. The page will then include a
canonical URL and WebPage structured data. For deployment under a path prefix, also configure
Astro's `base`. The page wrappers pass it through to the shared navigation.

Pass an absolute image URL as `socialImage` to `Starter` for social previews. The default image size
is 1200 by 630 pixels; set `socialImageWidth` and `socialImageHeight` when using a different size.

## Resources

- [Lumen Astro documentation](https://lumen.santi020k.com/docs/frameworks/astro)
- [Lumen components](https://lumen.santi020k.com/docs/components)
- [Lumen source](https://github.com/santi020k/lumen)
- [Santiago Molina](https://santi020k.com)
