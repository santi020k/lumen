# Documentation navigation audit

Audited the documentation source on 2026-10-04. Size alone is not a reason to split a page:
catalogs and interactive tools need browse controls, while independent tasks need their own URLs.
Keep live examples visible and place detailed code next to the example it explains.

## Page decisions

| Surface | Original content | Navigation decision |
| --- | --- | --- |
| Data visualization | One gallery plus six complete recipes, selection, setup, data, accessibility, and native guidance | Keep a visual chart directory at `/docs/web/data-visualization`; give every chart a focused guide and separate the shared setup and guidance. |
| React framework | 19 hook references, 81 option rows, 127 controller rows, and 345 example code lines on the installation page | Keep `/docs/frameworks/react` focused on setup. Add `/docs/frameworks/react/hooks` and `/docs/frameworks/react/hooks/:slug`, preserving every hook's reference and example. |
| Native platform overviews | Installation, playground, theme, AI setup, component list, and platform principles in `PlatformOverview.astro` | Keep visual overview pages; move independently useful installation, theming, and AI instructions into platform child guides. Link to the existing playground and component catalogs. |
| MCP server | Seven main sections including tools, five client configurations, two plugin setup paths, resources, workflow, and package information | Separate connection instructions from the tool/resource reference. Retain a concise landing page linking to each task. |
| AI skill | Six primary sections covering installation, targets, workflow, skill/MCP roles, and a prompt | Keep one cohesive page with section navigation. Its visual workflow and installation are a single task. |
| Web component references | One component per page; preview, installation, API, optional keyboard/events; largest API has 21 rows | Keep existing component URLs and previews. Add section navigation so API lookup does not require scrolling past the whole example. |
| Native component references | Usage, API, design/accessibility, availability, and adjacent components | Keep one page per component; add section navigation and include native component routes in global search. |
| Migration guides | v1→v2: six sections; v2→v3: four sections; v3→v4: nine sections and one subsection | Keep each upgrade checklist together with section navigation. Preserve Markdown heading IDs and existing migration URLs. |
| React Native hooks | Five sections, eight hook families, shared-state guidance, and three examples | Keep the compact guide with section navigation. Keep it distinct from DOM-oriented React hook pages. |
| Web overview | Installation, styles, themes, glass surfaces, packages, runtime, and next steps | Link clearly to focused framework guides and provide section navigation for the remaining shared guidance. |
| Forms | Existing overview plus React Hook Form, Astro Actions, and Elements pages | Preserve the existing task split; add page navigation and cross-links between integrations. |
| Component and icon catalogs | Large source files include grid styling, filtering, and preview controls | Preserve searchable visual catalogs. Do not split catalogs merely to reduce source line count. |
| Theme and web playgrounds | Long source files primarily implement interactive controls and live previews | Keep cohesive interactive tools with section navigation and links back to setup/reference pages. |
| Foundations and Figma | Visual foundations, installation/coverage, or a design-to-code workflow | Keep coherent guides and add section navigation. Avoid fragmenting short supporting explanations. |

## Shared navigation and discoverability

- Provide an “On this page” navigation for long guides and reference pages. Match existing heading
  IDs, include only sections present on that page, and respect the measured sticky header height.
  Keep its popup aligned beneath the trigger in a compact single-column list, with full-height
  keyboard and touch targets at mobile and desktop widths.
- Give focused guides visible paths in both desktop navigation and the mobile documentation menu.
  Native hooks and the chart directory were missing from the relevant sidebar sections.
- Keep shared Figma, AI, MCP, and migration guidance discoverable when browsing a platform. The
  earlier sidebar filtered most shared links out of platform views.
- Index focused guide URLs, React hook pages, and native component pages in global documentation
  search. The earlier search index included web components but not native component references.
- Keep document titles, descriptions, canonical URLs, structured breadcrumbs, sitemap entries,
  and generated social metadata aligned. Canonical and sitemap support already exists; a page split
  still needs unique metadata and meaningful internal links. Most older guides rendered a visible
  breadcrumb without passing the corresponding structured breadcrumb to `DocsLayout`.

## Existing links

Keep the original landing URLs. When moving a section, leave its former anchor on a useful onward
link to the new guide so existing bookmarks still identify the intended topic without JavaScript.
For React, this includes `/docs/frameworks/react#hooks-title` and all 19 case-sensitive hook names,
such as `/docs/frameworks/react#useDialog`. Update first-party search and navigation to link directly
to the focused page. Avoid duplicating the full moved reference on both URLs.

## Verification

Check representative desktop and narrow mobile pages, keyboard navigation, visible focus, anchor
placement below sticky navigation, search discovery, old fragment links, live examples, copyable
code, and absence of page overflow. Validate generated routes and links against the built site;
check each new page's unique title, canonical, description, and breadcrumbs. A source-file line count
does not prove that the rendered documentation is short or easy to navigate.
