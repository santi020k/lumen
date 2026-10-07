import assert from 'node:assert/strict'
import test from 'node:test'

import { extractNativeGraphics } from './lib/react-native-import-fixtures.mjs'

const source = `// const FakeGraphic = () => <NotAnElement />
const SearchGraphic = ({ color }: Props) => (<Svg><Circle stroke={color} /><Path d="M0 0" /></Svg>);
const OtherGraphic = () => <Svg><Rect /></Svg>;
const Catalog = { SearchGraphic, OtherGraphic };
`

test('extracts requested declarations and SVG imports without copying the catalog or comments', () => {
  const result = extractNativeGraphics(source, ['OtherGraphic', 'SearchGraphic'])

  assert.deepEqual(result.elements, ['Circle', 'Path', 'Rect', 'Svg'])

  assert.ok(result.source.startsWith('const OtherGraphic'))

  assert.ok(result.source.includes('const SearchGraphic'))

  assert.ok(!result.source.includes('Catalog'))

  assert.ok(!result.source.includes('FakeGraphic'))
})

test('rejects missing, duplicate, empty and non-function selections', () => {
  for (const names of [[], ['SearchGraphic', 'SearchGraphic'], ['FakeGraphic'], ['MissingGraphic'], ['Catalog']]) {
    assert.throws(() => extractNativeGraphics(source, names))
  }

  assert.throws(() => extractNativeGraphics('const Graphic = () => <Svg />; const Graphic = () => <Svg />;', ['Graphic']))
})

test('ignores delimiters inside strings and handles multiple declarations without leaking neighbors', () => {
  const result = extractNativeGraphics('const Graphic = () => <Svg><Path d={"const Bogus ="} /></Svg>, Neighbor = 42;', ['Graphic'])

  assert.deepEqual(result.elements, ['Path', 'Svg'])

  assert.ok(!result.source.includes('Neighbor'))

  assert.ok(result.source.includes('const Bogus ='))
})
