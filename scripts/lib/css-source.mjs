const findStringEnd = (source, start, end) => {
  const quote = source[start]

  for (let index = start + 1; index < end; index += 1) {
    const character = source[index]

    if (character === '\\') index += 1
    else if (character === quote) return index
  }

  throw new Error('Unterminated CSS string.')
}

const findCommentEnd = (source, start) => {
  const commentEnd = source.indexOf('*/', start + 2)

  if (commentEnd < 0) throw new Error('Unterminated CSS comment.')

  return commentEnd + 1
}

/** Skip quoted strings, escaped characters, and comments without interpreting their contents. */
export const skipCssLiteral = (source, index) => {
  if (source[index] === '\\') return index + 1

  if (source[index] === '"' || source[index] === "'") return findStringEnd(source, index, source.length)

  if (source[index] === '/' && source[index + 1] === '*') return findCommentEnd(source, index)

  return index
}

export const findCssGroupEnd = (source, start) => {
  const opening = source[start]
  const closing = opening === '(' ? ')' : ']'
  let depth = 1

  for (let index = start + 1; index < source.length; index += 1) {
    const literalEnd = skipCssLiteral(source, index)

    if (literalEnd !== index) {
      index = literalEnd

      continue
    }

    if (source[index] === opening) depth += 1

    if (source[index] === closing) depth -= 1

    if (depth === 0) return index
  }

  throw new Error('Unterminated CSS selector group.')
}

const findOpeningBrace = (source, start, end) => {
  for (let index = start; index < end; index += 1) {
    const character = source[index]
    const next = source[index + 1]

    if (character === '"' || character === "'") index = findStringEnd(source, index, end)

    if (character === '/' && next === '*') {
      index = findCommentEnd(source, index)
    }

    if (character === '(' || character === '[') {
      index = findCssGroupEnd(source, index)

      continue
    }

    if (character === ';') return { index, statement: true }

    if (character === '{') return { index, statement: false }
  }

  return null
}

const findClosingBrace = (source, opening, end) => {
  let depth = 1

  for (let index = opening + 1; index < end; index += 1) {
    const character = source[index]
    const next = source[index + 1]

    if (character === '"' || character === "'") index = findStringEnd(source, index, end)

    if (character === '/' && next === '*') {
      index = findCommentEnd(source, index)
    }

    if (character === '{') depth += 1

    if (character === '}') depth -= 1

    if (depth === 0) return index
  }

  throw new Error('Unterminated CSS block.')
}

const skipTrivia = (source, start, end) => {
  let index = start

  while (index < end) {
    if (/\s/u.test(source[index])) {
      index += 1

      continue
    }

    if (source[index] === '/' && source[index + 1] === '*') {
      index = findCommentEnd(source, index) + 1

      continue
    }

    break
  }

  return index
}

/** Read CSS blocks without interpreting declaration values or splitting quoted delimiters. */
export const readCssNodes = source => {
  const nodes = []
  let cursor = 0

  while (cursor < source.length) {
    const start = skipTrivia(source, cursor, source.length)

    if (start >= source.length) break

    const opening = findOpeningBrace(source, start, source.length)

    if (!opening) break

    const header = source.slice(start, opening.index).trim()

    if (opening.statement) {
      nodes.push({ header, body: null, text: source.slice(start, opening.index + 1) })

      cursor = opening.index + 1

      continue
    }

    const closing = findClosingBrace(source, opening.index, source.length)

    nodes.push({ header, body: source.slice(opening.index + 1, closing), text: source.slice(start, closing + 1) })

    cursor = closing + 1
  }

  return nodes
}

/** Split only top-level commas; commas inside selectors and quoted attribute values stay intact. */
export const splitCssSelectors = selector => {
  const selectors = []
  let start = 0

  for (let index = 0; index < selector.length; index += 1) {
    const literalEnd = skipCssLiteral(selector, index)

    if (literalEnd !== index) { index = literalEnd;

 continue }

    if (selector[index] === '(' || selector[index] === '[') { index = findCssGroupEnd(selector, index);

 continue }

    if (selector[index] === ',') {
      selectors.push(selector.slice(start, index).trim())

      start = index + 1
    }
  }

  selectors.push(selector.slice(start).trim())

  return selectors
}
