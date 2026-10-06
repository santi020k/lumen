import type { APIRoute, GetStaticPaths } from 'astro'

import { brandCatalog, interfaceCatalog } from '../../data/icon-catalogs'

export const getStaticPaths: GetStaticPaths = () => [interfaceCatalog, brandCatalog].map(catalog => ({
  params: { hash: catalog.hash },
  props: { json: catalog.json }
}))

export const GET: APIRoute = ({ props }) => {
  const json: unknown = props.json

  if (typeof json !== 'string') throw new Error('Missing generated icon catalog.')

  return new Response(json, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}
