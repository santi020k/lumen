/** Update generated URLs without accumulating cache versions on repeated generation. */
export const versionSocialImageUrls = (html, imageUrl) => {
  const unversioned = imageUrl.split('?')[0]
  const escaped = unversioned.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&')
  const existingImage = new RegExp(`${escaped}(?:\\?v=[a-f\\d]+)?(?=["'\\s<])`, 'gu')

  return html.replaceAll(existingImage, imageUrl)
}
