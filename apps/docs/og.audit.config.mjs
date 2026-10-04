import { defineAuditConfig } from '@santi020k/og/audit/config'
import { standardAuditRules } from '@santi020k/og/audit/rules'

import { auditSocialCardMetadata } from './scripts/seo-rules.mjs'

const standards = standardAuditRules({ sitemap: { reportOrphans: true } })

export default defineAuditConfig({
  directory: process.env.LUMEN_DOCS_OUT_DIR ?? 'dist',
  exclude: ['internal/**'],
  manifest: 'public/og/manifest.json',
  siteUrl: 'https://lumen.santi020k.com',
  siteRules: [...standards.siteRules, auditSocialCardMetadata]
})
