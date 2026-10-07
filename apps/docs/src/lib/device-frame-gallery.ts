export const initDeviceGallery = (gallery: HTMLElement): (() => void) => {
  const viewport = gallery.querySelector<HTMLElement>('[data-ui-carousel-viewport]')
  const slides = [...gallery.querySelectorAll<HTMLElement>('[data-device-slide]')]
  const selectors = [...gallery.querySelectorAll<HTMLButtonElement>('[data-device-select]')]
  const previous = gallery.querySelector<HTMLButtonElement>('[data-device-prev]')
  const next = gallery.querySelector<HTMLButtonElement>('[data-device-next]')
  const position = gallery.querySelector<HTMLElement>('[data-device-position]')
  const input = gallery.querySelector<HTMLInputElement>('input[type="color"]')
  const finishes = gallery.querySelectorAll<HTMLButtonElement>('[data-device-finish]')
  let active = 0

  if (!viewport) return () => undefined

  const controller = new AbortController()
  const { signal } = controller

  const update = (): void => {
    const edge = viewport.getBoundingClientRect().left
    let nearest = Infinity

    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().left - edge)

      if (distance < nearest) {
        nearest = distance

        active = index
      }
    })

    slides.forEach((slide, index) => {
      slide.inert = index !== active

      slide.setAttribute('aria-hidden', String(index !== active))

      selectors[index]?.setAttribute('aria-pressed', String(index === active))
    })

    const slide = slides[active]

    if (slide) viewport.style.height = `${slide.offsetHeight}px`

    if (previous) previous.disabled = active === 0

    if (next) next.disabled = active === slides.length - 1

    if (position) position.textContent = `${slides[active]?.dataset.deviceName ?? 'Device'} · ${active + 1} of ${slides.length}`
  }

  const move = (index: number): void => {
    const slide = slides[Math.max(0, Math.min(index, slides.length - 1))]

    if (!slide) return

    viewport.scrollTo({
      left: viewport.scrollLeft + slide.getBoundingClientRect().left - viewport.getBoundingClientRect().left,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    })
  }

  selectors.forEach((button, index) => {
    button.addEventListener('click', () => {
      move(index)
    }, { signal })
  })

  previous?.addEventListener('click', () => {
    move(active - 1)
  }, { signal })

  next?.addEventListener('click', () => {
    move(active + 1)
  }, { signal })

  viewport.addEventListener('scroll', update, { passive: true, signal })

  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport) return

    const positions: Partial<Record<string, number>> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: slides.length - 1
    }

    const index = positions[event.key]

    if (index !== undefined) {
      event.preventDefault()

      move(index)
    }
  }, { signal })

  const finish = (value: string): void => {
    const color = value === 'custom' ? input?.value : value

    if (!color) return

    for (const frame of gallery.querySelectorAll<HTMLElement>('.ui-device-frame')) {
      frame.style.setProperty('--ui-device-color', color)
    }

    for (const button of finishes) button.setAttribute('aria-pressed', String(button.dataset.deviceFinish === value))
  }

  for (const button of finishes) button.addEventListener('click', () => {
    finish(button.dataset.deviceFinish ?? 'white')
  }, { signal })

  input?.addEventListener('input', () => {
    finish('custom')
  }, { signal })

  const observer = new ResizeObserver(update)

  for (const slide of slides) observer.observe(slide)

  update()

  return () => {
    controller.abort()

    observer.disconnect()
  }
}
