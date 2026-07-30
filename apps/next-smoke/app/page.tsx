import { Badge, Card } from '@santi020k/lumen-react'

import { ClientPanel } from './client-panel'
import { ProductButtonLink } from './lumen-wrappers'

export default function Page() {
  return (
    <main>
      <Card>
        <Badge>Ready</Badge>
        <p>Lumen renders through a Next.js client boundary.</p>
        <ProductButtonLink href="/server-import">Server-imported wrapper</ProductButtonLink>
        <ClientPanel />
      </Card>
    </main>
  )
}
