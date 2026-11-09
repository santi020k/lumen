import type { APIRoute } from 'astro'

import { buildAstroStarterArchive } from '../../lib/astro-starter-archive'

export const GET: APIRoute = () => new Response(new Uint8Array(buildAstroStarterArchive()), {
  headers: {
    'Content-Disposition': 'attachment; filename="lumen-astro-starter.zip"',
    'Content-Type': 'application/zip'
  }
})
