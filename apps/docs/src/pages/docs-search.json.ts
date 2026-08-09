import type { APIRoute } from 'astro'

import { docsSearchIndex } from '../data/search'

export const GET: APIRoute = () => new Response(JSON.stringify(docsSearchIndex), {
  headers: {
    'Cache-Control': 'public, max-age=3600',
    'Content-Type': 'application/json; charset=utf-8'
  }
})
