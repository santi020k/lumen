import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createCards, pathnameOutput } from '@santi020k/og'
import { auditSite } from '@santi020k/og/audit'
import { definePresetConfig } from '@santi020k/og/presets'

import nativeCaptureManifest from '../src/data/native-component-captures.json' with { type: 'json' }
import { getSocialCardMetadata } from '../src/lib/social-cards.ts'

import { decodeMetadataText } from './seo-rules.mjs'

const directory = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(directory, '..')
const buildDirectory = process.env.LUMEN_DOCS_OUT_DIR ?? 'dist'

// Discover routes from final HTML. Image checks run again after generation after the build.
const { pages: builtPages } = await auditSite({
  directory: buildDirectory,
  exclude: ['internal/**'],
  root
})

const pages = builtPages.filter(item => item.indexable && !item.redirect).map(item => {
  const metadata = getSocialCardMetadata({
    ...item,
    description: decodeMetadataText(item.description ?? ''),
    title: decodeMetadataText(item.title ?? '')
  })

  const capture = nativeCaptureManifest.captures.find(entry => (
    metadata.pathname === `/docs/${entry.platform}/components/${entry.slug}`
  ))

  return { ...metadata, image: capture ? `public${capture.src}` : undefined }
})

if (pages.length === 0) throw new Error('Build the documentation before generating social images.')

export default definePresetConfig({
  cards: createCards(pages, item => ({
    badge: item.badge,
    description: item.description,
    title: item.cardTitle,
    eyebrow: item.eyebrow,
    image: item.image,
    imagePresentation: { fit: 'contain', padding: 12 },
    variant: 'docs'
  }), {
    output: item => pathnameOutput(item.pathname),
    sources: item => ['scripts/generate-og-images.mjs', 'public/icon.svg', ...(item.image ? [item.image] : [])],
    route: item => ({
      alt: item.alt,
      description: item.description,
      pathname: item.pathname,
      title: item.title
    })
  }),
  clean: true,
  concurrency: 'auto',
  outputDirectory: 'public/og/pages',
  routeManifest: { file: 'public/og/manifest.json', publicPath: '/og/pages' },
  preset: {
    brand: {
      domain: 'lumen.santi020k.com',
      logo: 'public/icon.svg',
      name: 'Lumen UI'
    },
    decoration: (data, _context, { accent, theme }) => {
      if (data.image) return undefined

      if (data.eyebrow === 'Charts & reporting') return `
        <g transform="translate(810 198)">
          <rect width="310" height="300" rx="32" fill="${theme.panel}" stroke="${accent}" stroke-opacity="0.2"/>
          <path d="M36 66H274M36 132H274M36 198H274M36 264H274" stroke="${theme.foreground}" opacity="0.1"/>
          <path d="M36 232L90 178L142 200L202 92L274 54" fill="none" stroke="${accent}" stroke-width="8" stroke-linejoin="round"/>
          <circle cx="202" cy="92" r="11" fill="${accent}"/>
          <rect x="36" y="28" width="108" height="10" rx="5" fill="${theme.foreground}" opacity="0.5"/>
        </g>`

      if (data.eyebrow === 'AI & developer tools') return `
        <g transform="translate(810 198)">
          <rect width="310" height="300" rx="32" fill="${theme.panel}" stroke="${accent}" stroke-opacity="0.2"/>
          <path d="M94 86L54 126L94 166M216 86L256 126L216 166M174 76L138 176" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="54" y="222" width="202" height="12" rx="6" fill="${theme.foreground}" opacity="0.3"/>
          <rect x="54" y="250" width="146" height="12" rx="6" fill="${theme.foreground}" opacity="0.15"/>
        </g>`

      return `
      <g transform="translate(790 164)">
        <circle cx="94" cy="86" r="122" fill="${accent}" opacity="0.11"/>
        <circle cx="304" cy="96" r="142" fill="#0fa6a0" opacity="0.10"/>
        <rect x="20" y="34" width="300" height="300" rx="40" fill="${theme.panel}" stroke="${theme.foreground}" stroke-opacity="0.16"/>
        <rect x="54" y="72" width="126" height="48" rx="14" fill="${accent}" opacity="0.16"/>
        <rect x="70" y="88" width="58" height="16" rx="8" fill="${accent}" opacity="0.82"/>
        <rect x="54" y="148" width="232" height="18" rx="9" fill="${theme.foreground}" opacity="0.70"/>
        <rect x="54" y="188" width="190" height="13" rx="6.5" fill="${theme.foreground}" opacity="0.34"/>
        <rect x="54" y="221" width="216" height="13" rx="6.5" fill="${theme.foreground}" opacity="0.24"/>
        <rect x="54" y="270" width="112" height="34" rx="17" fill="${accent}" opacity="0.86"/>
      </g>`
    },
    theme: {
      accent: '#620ae6',
      background: '#faf9fb',
      foreground: '#332e38',
      muted: '#5b5463',
      panel: '#f5f3f7'
    },
    variant: 'docs'
  },
  root
})
