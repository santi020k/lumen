/** Resolve visual horizontal navigation at event time, including inherited and changing direction. */
export const getLumenDirectionalKey = (element: HTMLElement, key: string): string => {
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return key

  const computed = element.ownerDocument.defaultView?.getComputedStyle(element).direction
  const direction = computed || element.closest('[dir]')?.getAttribute('dir')

  if (direction !== 'rtl') return key

  return key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft'
}
