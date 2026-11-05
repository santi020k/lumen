const bindCarousel = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  const viewport = root.querySelector<HTMLElement>('[data-ui-carousel-viewport]')

  if (!viewport) return

  root.dataset.uiBound = 'true'

  for (const button of root.querySelectorAll<HTMLElement>('[data-ui-carousel-prev]')) {
    button.addEventListener('click', () => {
      viewport.scrollBy({ behavior: 'smooth', left: -viewport.clientWidth })
    })
  }

  for (const button of root.querySelectorAll<HTMLElement>('[data-ui-carousel-next]')) {
    button.addEventListener('click', () => {
      viewport.scrollBy({ behavior: 'smooth', left: viewport.clientWidth })
    })
  }
}

export const initCarousel = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-carousel]')) bindCarousel(root)
}
