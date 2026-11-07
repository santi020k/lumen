# Code example setup

Install @santi020k/lumen-astro in the application. Install @santi020k/lumen separately when using
its CLI, then run lumen add code-example --target astro.

Keep the copied component's selective imports and mount @santi020k/lumen-astro/runtime once in
the root layout. Each component automatically includes its required CSS.

Pass a unique stable id, title, and complete source. The full source supplies copying and manual
recovery. The native disclosure remains usable without JavaScript. For highlighted Markdown or MDX,
pass highlighted and supply the renderer's pre/code tree in the default slot, using the same source
input for both representations. Set open to start expanded.

All visible labels can be translated through labels. Application content, Markdown compilation,
prose styles, and folding policy remain application-owned.
