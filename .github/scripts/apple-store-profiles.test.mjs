import assert from 'node:assert/strict';
import { X509Certificate } from 'node:crypto';
import test from 'node:test';

import { identityFingerprint, selectDistributionProfiles, validateProfileMetadata } from './apple-store-profiles.mjs';

const certificate = 'MIIDLzCCAhegAwIBAgIUMRXQAipyWhnojEh8pn/Mf8u9bUMwDQYJKoZIhvcNAQELBQAwJzElMCMGA1UEAwwcTHVtZW4gU3ludGhldGljIFByb2ZpbGUgVGVzdDAeFw0yNjEwMDcxNDAzMDJaFw0yNjEwMDgxNDAzMDJaMCcxJTAjBgNVBAMMHEx1bWVuIFN5bnRoZXRpYyBQcm9maWxlIFRlc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCdzNX2B4FNtZMqCXd95qTqokqJ98yQp0BuaJWmgNVXZzO271/qMpZRK+9Y4IGhJQyeGxLKA8Dqz4CIpjhwJfOVe0Omf4PSlho9oTMX+ffNpP5wO9eWFNNmRVkIvD87p0i4aof9W4BXmMfrDWMVprBABARUMQWaUb0hN5kCnMPE8RxILFsR6nHTSpif2jc9AMt9ZAgA7OWh1GkuwpUJ2XvERei1xYVwADQOPhOQl53jKalAnG6AyYEnhjSw/RPyHPfbad0lgUs/AtpljpVh6fpcvZhdG0NlCHo9xwQ6CI4k0xzjifjEYDyIkMx6mga0iNfojAIkv2YcJSM7ZwML3cI7AgMBAAGjUzBRMB0GA1UdDgQWBBQrUxC7dj0A6rlFZdpdz7qhjj4mUzAfBgNVHSMEGDAWgBQrUxC7dj0A6rlFZdpdz7qhjj4mUzAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCYdQHiqqq8AvmnGUOEf6e4a69m8fxQDLPcxBkeje1edHjnRMeIVBVGNiOfy3+/UJrVlLr13olbI6akmdY+W/wzHaS6eclQ+PGXDJwm5GeB1I53jcpzB8CDXMHVXjjTrsWVEzr8Ve0zsU08lDgKHfy+jmicRgaEBmBbu1Jm3rap6JWW5F8qhkRqmdbiVf1lQBUpkpQR/GxuOsGSqkT6evt4vs6DuIix8YRJHLoZsS6V2QJpKZu1N6s1jI8HaQSKkeQeVaLrXlsTKmU9IbJv5Z3mBZGf4YS7dWGVBkpDiqJchGhHy8an92R4eX0F7vSMJKd7P6c0bMlERyIldLSE30zL';
const fingerprint = new X509Certificate(Buffer.from(certificate, 'base64')).fingerprint.replaceAll(':', '');
const app = 'com.santi020k.lumen.playground.apple';
const uuid = '6c37ff35-48de-403b-a5af-0aa35c5f82c6';
const now = Date.parse('2026-10-07T00:00:00Z');

const page = (platform = 'iOS') => ({
  data: (platform === 'iOS' ? [app, `${app}.widget`] : [app]).map((identifier, index) => ({
    id: `profile${index}`, type: 'profiles', attributes: { uuid, profileType: platform === 'iOS' ? 'IOS_APP_STORE' : 'MAC_APP_STORE', profileState: 'ACTIVE', expirationDate: '2027-10-05T00:00:00Z', profileContent: 'ZmFrZQ==' },
    relationships: { bundleId: { data: { id: identifier } }, certificates: { data: [{ id: 'certificate' }] } },
  })),
  included: [{ id: 'certificate', type: 'certificates', attributes: { certificateContent: certificate } }, ...[app, `${app}.widget`].map(identifier => ({ id: identifier, type: 'bundleIds', attributes: { identifier } }))],
  links: {},
});

test('selects each iOS target and the separate Mac distribution profile', async () => {
  for (const platform of ['iOS', 'macOS']) {
    const profiles = await selectDistributionProfiles(platform, async () => page(platform), [fingerprint], now);

    assert.equal(profiles.length, platform === 'iOS' ? 2 : 1);

    assert.ok(profiles.every(profile => profile.fingerprint === fingerprint));
  }
});

test('rejects missing, expired, inactive, wrong-platform and mismatched-certificate profiles', async () => {
  for (const mutate of [p => p.data.pop(), p => p.data[0].attributes.expirationDate = '2025-01-01', p => p.data[0].attributes.profileState = 'INVALID', p => p.data[0].attributes.profileType = 'MAC_APP_STORE', p => p.included[1].attributes.identifier = 'other.app']) {
    const response = page();

 mutate(response);

    await assert.rejects(selectDistributionProfiles('iOS', async () => response, [fingerprint], now), /Expected one active/u);
  }

  await assert.rejects(selectDistributionProfiles('iOS', async () => page(), ['0'.repeat(40)], now), /Expected one active/u);
});

test('rejects ambiguous, malformed and missing certificate payloads', async () => {
  for (const mutate of [p => p.data.push(p.data[0]), p => p.data[0].attributes.uuid = '../../unsafe', p => p.data[0].attributes.profileContent = '', p => p.data[0].relationships.certificates.data = null, p => p.included[0].attributes.certificateContent = undefined]) {
    const response = page();

 mutate(response);

    await assert.rejects(selectDistributionProfiles('iOS', async () => response, [fingerprint], now));
  }
});

test('profile pagination follows same-origin pages and rejects external hosts and loops', async () => {
  const first = page(); const second = page();

 first.data = [first.data[0]];

 second.data = [second.data[1]];

 first.links.next = '/v1/profiles?page=2';

  const pages = [first, second];

  assert.equal((await selectDistributionProfiles('iOS', async () => pages.shift(), [fingerprint], now)).length, 2);

  for (const next of ['https://example.com/profiles', '/v1/profiles?limit=200&include=bundleId,certificates']) {
    const response = page();

 response.links.next = next;

    await assert.rejects(selectDistributionProfiles('iOS', async () => response, [fingerprint], now), /pagination/u);
  }

  await assert.rejects(selectDistributionProfiles('other', async () => page(), [fingerprint], now), /Unsupported/u);

  await assert.rejects(selectDistributionProfiles('iOS', async () => ({ data: [] }), [fingerprint], now), /Invalid profile response/u);
});

test('signed profile metadata must match UUID, team, bundle, certificate, expiry and release entitlements', () => {
  const profile = { attributes: { uuid }, identifier: app, fingerprint };
  const metadata = { uuid, team: 'BY4995HQ3J', identifier: `BY4995HQ3J.${app}`, debugging: false, expiration: '2027-10-05T00:00:00Z', fingerprints: [fingerprint] };

  validateProfileMetadata(metadata, profile, now);

  for (const overrides of [{ uuid: 'other' }, { team: 'other' }, { identifier: app }, { debugging: true }, { expiration: '2025-01-01' }, { expiration: 'invalid' }, { fingerprints: [] }])
    assert.throws(() => validateProfileMetadata({ ...metadata, ...overrides }, profile, now), /does not match/u);
});

test('signing preflight requires exactly one valid platform identity', () => {
  const name = 'Apple Distribution: Test (BY4995HQ3J)';
  const line = `  1) ${fingerprint} "${name}"`;

  assert.equal(identityFingerprint(`${line}\n  1 valid identities found`, name), fingerprint);

  for (const output of ['', line.replace(name, 'Apple Development: Test'), `${line}\n${line}`])
    assert.throws(() => identityFingerprint(output, name), /Expected one valid/u);
});
