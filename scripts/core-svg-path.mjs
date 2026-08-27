const pathCommandParameterCounts = new Map([
  ['a', 7],
  ['c', 6],
  ['h', 1],
  ['l', 2],
  ['m', 2],
  ['q', 4],
  ['s', 4],
  ['t', 2],
  ['v', 1]
])

const numberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/
const isSeparator = character => character === ',' || /\s/.test(character)
const isPathCommand = command => pathCommandParameterCounts.has(command) || command === 'z'

const requiresArcSeparator = (previousToken, token, tokenStart) => (
  Boolean(previousToken) &&
  previousToken.end === tokenStart &&
  (previousToken.isArcFlag || token.isArcFlag)
)

const skipSeparators = (pathData, startIndex) => {
  let index = startIndex

  while (index < pathData.length && isSeparator(pathData[index])) index += 1

  return index
}

const readPathToken = (pathData, index, command, parameterIndex) => {
  const character = pathData[index]
  const isArcFlag = command === 'a' && (parameterIndex === 3 || parameterIndex === 4)

  if (isArcFlag) {
    if (character !== '0' && character !== '1') {
      throw new Error(`Invalid SVG arc flag near character ${index}.`)
    }

    return { end: index + 1, isArcFlag }
  }

  const match = numberPattern.exec(pathData.slice(index))

  if (!match) throw new Error(`Invalid SVG path number near character ${index}.`)

  return { end: index + match[0].length, isArcFlag }
}

export const normalizeCoreSvgPathData = pathData => {
  const insertions = []
  let command
  let index = 0
  let parameterIndex = 0
  let previousToken

  while (index < pathData.length) {
    index = skipSeparators(pathData, index)

    if (index >= pathData.length) break

    const character = pathData[index]
    const normalizedCommand = character.toLowerCase()

    if (isPathCommand(normalizedCommand)) {
      command = normalizedCommand

      index += 1

      parameterIndex = 0

      previousToken = undefined

      continue
    }

    if (!command || command === 'z') {
      throw new Error(`Invalid SVG path data near character ${index}.`)
    }

    const tokenStart = index
    const token = readPathToken(pathData, index, command, parameterIndex)

    if (requiresArcSeparator(previousToken, token, tokenStart)) {
      insertions.push(tokenStart)
    }

    previousToken = token

    parameterIndex = (parameterIndex + 1) % pathCommandParameterCounts.get(command)

    index = token.end
  }

  let normalized = pathData

  for (const insertion of insertions.reverse()) {
    normalized = `${normalized.slice(0, insertion)} ${normalized.slice(insertion)}`
  }

  return normalized
}
