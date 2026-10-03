import { defineAuditConfig } from '@santi020k/og/audit/config'
import { standardAuditRules } from '@santi020k/og/audit/rules'

export default defineAuditConfig({
  directory: 'dist',
  exclude: ['internal/**'],
  manifest: 'public/og/manifest.json',
  siteUrl: 'https://lumen.santi020k.com',
  ...standardAuditRules({ sitemap: { reportOrphans: true } })
})
