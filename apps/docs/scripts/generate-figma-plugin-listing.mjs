import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { defineConfig } from '@santi020k/og'
import { createSatoriRenderer, html } from '@santi020k/og/satori'
import { createSharpRenderer } from '@santi020k/og/sharp'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const asset = path => readFile(new URL(`../public/${path}`, import.meta.url))

const [regular, bold, icon, logo] = await Promise.all([
  asset('fonts/Montserrat-Regular.ttf'),
  asset('fonts/Montserrat-ExtraBold.ttf'),
  asset('icon.svg'),
  asset('logo.svg')
])

// Resolve the existing SVG's CSS colors for image renderers; preserve its canonical paths.
const logoSource = logo.toString('utf8')
  .replaceAll('var(--lumen-ink)', '#0f172a')
  .replaceAll('var(--lumen-ink-soft)', '#64748b')

const logoUrl = `data:image/svg+xml;base64,${Buffer.from(logoSource).toString('base64')}`
const palette = { canvas: '#faf9fb', ink: '#0f172a', muted: '#5b5463', brand: '#620ae6', onBrand: '#ffffff' }

const thumbnail = createSatoriRenderer({
  satori: {
    fonts: [
      { name: 'Montserrat', data: regular, weight: 400 },
      { name: 'Montserrat', data: bold, weight: 800 }
    ]
  },
  template: () => html`
    <div style="display:flex;flex-direction:column;width:100%;height:100%;padding:92px 104px;background:${palette.canvas};color:${palette.ink};font-family:Montserrat;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <img src="${logoUrl}" style="width:310px;height:80px;" />
        <div style="display:flex;align-items:center;gap:22px;font-size:26px;">
          <span>Figma plugin</span>
          <span style="background:#eee5ff;color:${palette.brand};padding:14px 25px;border-radius:100px;font-weight:800;">BETA</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;flex:1;gap:68px;">
        <div style="display:flex;flex-direction:column;width:940px;">
          <div style="display:flex;flex-direction:column;font-size:84px;line-height:1.08;letter-spacing:-4px;font-weight:800;">
            <div>From your canvas</div><div>to your components.</div>
          </div>
          <div style="display:flex;font-size:30px;line-height:1.5;color:${palette.muted};margin-top:34px;max-width:820px;">Turn Lumen Figma instances into an Astro starter and a handoff for your coding agent.</div>
          <div style="display:flex;gap:14px;align-items:center;margin-top:44px;font-size:23px;color:${palette.brand};font-weight:800;">
            <span>Inspect</span><span style="padding:0 6px;">→</span><span>Review</span><span style="padding:0 6px;">→</span><span>Export</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;width:670px;border:1px solid #273248;border-radius:30px;padding:46px;background:${palette.ink};color:${palette.onBrand};">
          <div style="display:flex;font-size:19px;letter-spacing:2px;color:#c4b5fd;font-weight:800;">LUMEN COMPONENTS</div>
          <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:26px;">
            <div style="display:flex;width:174px;padding:17px 20px;border:1px solid #475569;border-radius:10px;font-size:24px;">Button</div>
            <div style="display:flex;width:174px;padding:17px 20px;border:1px solid #475569;border-radius:10px;font-size:24px;">Input</div>
            <div style="display:flex;width:174px;padding:17px 20px;border:1px solid #475569;border-radius:10px;font-size:24px;">Field</div>
            <div style="display:flex;width:174px;padding:17px 20px;border:1px solid #475569;border-radius:10px;font-size:24px;">Card</div>
            <div style="display:flex;width:174px;padding:17px 20px;border:1px solid #475569;border-radius:10px;font-size:24px;">Tabs</div>
            <div style="display:flex;width:174px;padding:17px 20px;border:1px solid #475569;border-radius:10px;font-size:24px;">Dialog</div>
          </div>
          <div style="display:flex;height:1px;background:#334155;margin-top:36px;margin-bottom:32px;"></div>
          <div style="display:flex;font-size:19px;letter-spacing:2px;color:#c4b5fd;font-weight:800;">TWO USEFUL EXPORTS</div>
          <div style="display:flex;font-size:36px;font-weight:800;margin-top:24px;">Astro starter</div>
          <div style="display:flex;font-size:26px;color:#cbd5e1;margin-top:10px;">Real Lumen components.</div>
          <div style="display:flex;font-size:36px;font-weight:800;margin-top:30px;">AI handoff</div>
          <div style="display:flex;font-size:26px;color:#cbd5e1;margin-top:10px;">Context for your coding agent.</div>
          <div style="display:flex;font-size:19px;line-height:1.5;color:#cbd5e1;margin-top:34px;">A starting point. Review layout and connect your application behavior.</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #d8d4de;padding-top:28px;font-size:21px;color:${palette.muted};">
        <span>Astro only · No model API keys · No network access</span>
        <span>lumen.santi020k.com</span>
      </div>
    </div>`
})

const iconRenderer = createSharpRenderer({ renderSvg: () => icon.toString('utf8') })

export default defineConfig({
  root,
  outputDirectory: 'apps/figma-plugin/community/assets',
  cache: {
    manifest: '.cache/figma-listing.json',
    sources: [
      'apps/docs/scripts/generate-figma-plugin-listing.mjs',
      'apps/docs/public/icon.svg',
      'apps/docs/public/logo.svg',
      'apps/docs/public/fonts/Montserrat-Regular.ttf',
      'apps/docs/public/fonts/Montserrat-ExtraBold.ttf'
    ]
  },
  cards: [
    { output: 'icon.png', width: 128, height: 128, data: { kind: 'icon' } },
    { output: 'thumbnail.png', width: 1920, height: 1080, data: { kind: 'thumbnail' } }
  ],
  renderer: (data, context) => data.kind === 'icon' ? iconRenderer(data, context) : thumbnail(data, context)
})
