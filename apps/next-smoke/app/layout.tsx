import type { ReactNode } from 'react'

import '@santi020k/lumen-react/styles.css'
import '@santi020k/lumen-elements/styles.css'
import './visual-host.css'

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
