import selectorParser from 'postcss-selector-parser'

export const compositionMatchingSelector = selector => selectorParser(selectors => {
  selectors.walkPseudos(pseudo => {
    if (pseudo.value.startsWith('::')) pseudo.remove()
  })
}).processSync(selector) || '*'
