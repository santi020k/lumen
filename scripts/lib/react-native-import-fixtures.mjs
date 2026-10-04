import assert from 'node:assert/strict'

import ts from 'typescript'

// Extract canonical declarations without relying on whitespace or comment delimiters.
export const extractNativeGraphics = (source, names) => {
  assert.ok(names.length > 0 && new Set(names).size === names.length, 'Expected unique graphic names')

  const file = ts.createSourceFile('icons.generated.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const requested = new Set(names)
  const declarations = new Map()
  const elements = new Set()

  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !requested.has(declaration.name.text)) continue

      assert.ok(!declarations.has(declaration.name.text), `Duplicate graphic: ${declaration.name.text}`)

      assert.ok(declaration.initializer && ts.isArrowFunction(declaration.initializer), 'Expected a graphic function')

      declarations.set(declaration.name.text, `const ${declaration.getText(file)}`)

      const visit = node => {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          assert.ok(ts.isIdentifier(node.tagName), 'Expected a native SVG element identifier')

          elements.add(node.tagName.text)
        }

        ts.forEachChild(node, visit)
      }

      visit(declaration.initializer)
    }
  }

  for (const name of names) assert.ok(declarations.has(name), `Missing canonical graphic: ${name}`)

  return { source: names.map(name => declarations.get(name)).join('\n\n'), elements: [...elements].sort() }
}
