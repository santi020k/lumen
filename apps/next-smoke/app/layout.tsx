import '@santi020k/lumen-react/styles.css'

import type { ReactNode } from 'react'

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
