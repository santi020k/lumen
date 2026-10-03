const repository = 'https://github.com/santi020k/lumen'

const issues = (query: string): string => {
  const url = new URL(`${repository}/issues`)

  url.searchParams.set('q', query)

  return url.href
}

export const communityLinks = {
  announcements: `${repository}/discussions/categories/announcements`,
  bugs: `${repository}/issues/new?template=bug-report.yml`,
  ideas: `${repository}/discussions/categories/ideas`,
  inProgress: issues('is:issue is:open label:roadmap label:"in progress"'),
  planned: issues('is:issue is:open label:roadmap -label:"in progress"'),
  questions: `${repository}/discussions/categories/q-a`,
  releases: `${repository}/releases`,
  roadmap: issues('is:issue label:roadmap'),
  security: `${repository}/security/advisories/new`,
  shipped: issues('is:issue is:closed label:roadmap label:shipped')
} as const

interface FeedbackContext {
  documentationPath: string
  subject: string
}

export const bugReportUrl = ({ documentationPath, subject }: FeedbackContext): string => {
  const url = new URL(communityLinks.bugs)

  url.searchParams.set('title', `Bug: ${subject}`)

  url.searchParams.set('component', subject)

  url.searchParams.set('reference', `https://lumen.santi020k.com${documentationPath}`)

  return url.href
}
