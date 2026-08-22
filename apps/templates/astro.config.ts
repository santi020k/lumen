import { defineConfig, passthroughImageService } from 'astro/config'

export default defineConfig({
  base: '/templates',
  image: {
    service: passthroughImageService()
  },
  output: 'static',
  site: 'https://lumen.santi020k.com'
})
