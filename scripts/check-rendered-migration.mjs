import { chromium } from '@playwright/test'

const arguments_ = process.argv.slice(2)
let baseURL
const routeArguments = []

for (let index = 0; index < arguments_.length; index += 1) {
  const argument = arguments_[index]

  if (argument === '--url') {
    baseURL = arguments_[index + 1]

    index += 1
  } else if (argument === '--route') {
    const route = arguments_[index + 1]

    if (!route) throw new Error('--route requires a value')

    routeArguments.push(route)

    index += 1
  } else if (!baseURL) {
    baseURL = argument
  } else if (argument) {
    routeArguments.push(argument)
  }
}

if (!baseURL) {
  throw new Error(
    'Usage: pnpm check:rendered-migration -- --url <url> [--route <path> ...]'
  )
}

const routes = routeArguments.length > 0 ? routeArguments : ['/']

const viewports = [
  { height: 844, name: 'mobile', width: 390 },
  { height: 900, name: 'desktop', width: 1280 }
]

const browser = await chromium.launch()
const findings = []

try {
  for (const route of routes) {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport })
      const consoleMessages = []

      page.on('console', message => {
        if (message.type() === 'warning' || message.type() === 'error') {
          consoleMessages.push(`${message.type()}: ${message.text()}`)
        }
      })

      const url = new URL(route, baseURL).href

      await page.goto(url, { waitUntil: 'networkidle' })

      const measurement = await page.evaluate(() => {
        const documentWidth = document.documentElement.scrollWidth
        const viewportWidth = document.documentElement.clientWidth

        const overflowing = [...document.querySelectorAll('body *')].flatMap(element => {
          const bounds = element.getBoundingClientRect()
          const before = getComputedStyle(element, '::before')
          const after = getComputedStyle(element, '::after')

          if (bounds.left >= -0.5 && bounds.right <= viewportWidth + 0.5) return []

          return [{
            after: `${after.position} ${after.width}`,
            before: `${before.position} ${before.width}`,
            bounds: `${Math.round(bounds.left)}..${Math.round(bounds.right)}`,
            selector: element.id ? `#${element.id}` : element.className || element.tagName.toLowerCase()
          }]
        }).slice(0, 10)

        return { documentWidth, overflowing, viewportWidth }
      })

      if (measurement.documentWidth > measurement.viewportWidth || consoleMessages.length > 0) {
        findings.push({ consoleMessages, route: url, viewport, ...measurement })
      }

      await page.close()
    }
  }
} finally {
  await browser.close()
}

if (findings.length > 0) {
  process.stderr.write(`${JSON.stringify({ findings }, null, 2)}\n`)

  process.exitCode = 1
} else {
  process.stdout.write(`Rendered migration check passed for ${routes.length} route(s) at 390px and 1280px.\n`)
}
