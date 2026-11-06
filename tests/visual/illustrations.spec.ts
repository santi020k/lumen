import { expect, test } from '@playwright/test'

test('every illustration draws its semantic outlines over the wash', async ({ page }) => {
  await page.goto('/docs/components/illustration')

  const illustrations = page.locator('.framework-example__preview .ui-illustration svg')

  await expect(illustrations).toHaveCount(4)
  await expect.poll(() => illustrations.evaluateAll(items => items.map(svg => {
    const shapes = [...svg.children].filter((shape): shape is SVGGeometryElement =>
      shape instanceof SVGGeometryElement && !shape.classList.contains('ui-illustration__wash')
    )

    return shapes.filter(shape => {
      const style = getComputedStyle(shape)

      return shape.getTotalLength() > 0 && style.stroke === style.color && Number.parseFloat(style.strokeWidth) > 0
    }).length
  }))).toEqual([3, 2, 3, 2])
})
