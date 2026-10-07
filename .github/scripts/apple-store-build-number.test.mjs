import assert from 'node:assert/strict';
import test from 'node:test';

import { nextBuildNumber } from './apple-store-build-number.mjs';

const page = (platform, numbers, next = null) => ({
  data: numbers.map(version => ({ attributes: { version }, relationships: { preReleaseVersion: { data: { id: 'train' } } } })),
  included: [{ id: 'train', attributes: { platform } }],
  links: { next },
});

test('next live build follows all pages and isolates platforms', async () => {
  const pages = [page('MAC_OS', ['90'], '/v1/builds?page=2'), page('IOS', ['54', '53'])];

  assert.equal(await nextBuildNumber('iOS', async () => pages.shift()), 55);
});

test('build allocation fails closed without numeric live records', async () => {
  for (const response of [page('IOS', []), page('IOS', ['1.2']), page('IOS', ['9007199254740991']), { data: [] }])
    await assert.rejects(nextBuildNumber('iOS', async () => response));
});

test('pagination cannot transmit the API token to another host or loop', async () => {
  await assert.rejects(nextBuildNumber('macOS', async () => page('MAC_OS', ['25'], 'https://example.com')), /pagination/u);

  await assert.rejects(nextBuildNumber('macOS', async url => page('MAC_OS', ['25'], url.href)), /pagination/u);
});
