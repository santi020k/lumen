import { spawnSync } from 'node:child_process';
import { sign, X509Certificate } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// cspell:words appstoreconnect codesigning hashlib hexdigest isoformat keychain mobileprovision plistlib

const origin = 'https://api.appstoreconnect.apple.com';
const team = 'BY4995HQ3J';
const app = 'com.santi020k.lumen.playground.apple';
const targets = { iOS: [app, `${app}.widget`], macOS: [app] };

const readProfiles = async request => {
  const records = [];
  const included = new Map();
  const visited = new Set();
  let url = new URL('/v1/profiles?limit=200&include=bundleId,certificates', origin);

  while (url) {
    if (url.origin !== origin || visited.has(url.href)) throw new Error('Invalid profile pagination');

    visited.add(url.href);

    const page = await request(url);

    if (!Array.isArray(page.data) || !Array.isArray(page.included)) throw new Error('Invalid profile response');

    records.push(...page.data);

    for (const item of page.included) included.set(`${item.type}:${item.id}`, item);

    url = page.links?.next ? new URL(page.links.next, origin) : null;
  }

  return { records, included };
};

export const selectDistributionProfiles = async (platform, request, fingerprints, now = Date.now()) => {
  if (!Object.hasOwn(targets, platform)) throw new Error('Unsupported Apple platform');

  const { records, included } = await readProfiles(request);
  const type = platform === 'iOS' ? 'IOS_APP_STORE' : 'MAC_APP_STORE';

  return targets[platform].map(identifier => {
    const matching = records.filter(record => {
      const attributes = record.attributes;
      const bundle = included.get(`bundleIds:${record.relationships?.bundleId?.data?.id}`);

      return bundle?.attributes?.identifier === identifier && attributes?.profileType === type && attributes.profileState === 'ACTIVE' && Date.parse(attributes.expirationDate) > now;
    }).flatMap(record => {
      const certificates = record.relationships?.certificates?.data;

      if (!Array.isArray(certificates)) throw new Error('Missing profile certificate relationships');

      return certificates.flatMap(reference => {
        const certificate = included.get(`certificates:${reference.id}`);

        if (typeof certificate?.attributes?.certificateContent !== 'string') throw new Error('Missing profile certificate content');

        const parsed = new X509Certificate(Buffer.from(certificate.attributes.certificateContent, 'base64'));
        const fingerprint = parsed.fingerprint.replaceAll(':', '');

        return fingerprints.includes(fingerprint) ? [{ ...record, identifier, fingerprint }] : [];
      });
    });

    if (matching.length !== 1) throw new Error(`Expected one active distribution profile matching the imported identity for ${identifier}; found ${matching.length}`);

    const profile = matching[0];

    if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu.test(profile.attributes.uuid) || typeof profile.attributes.profileContent !== 'string' || !profile.attributes.profileContent || profile.attributes.profileContent.length > 2_000_000) throw new Error('Invalid distribution profile payload');

    return profile;
  });
};

export const validateProfileMetadata = (metadata, profile, now = Date.now()) => {
  if (metadata.uuid !== profile.attributes.uuid || metadata.team !== team || metadata.identifier !== `${team}.${profile.identifier}` || metadata.debugging !== false || Date.parse(metadata.expiration) <= now || !Number.isFinite(Date.parse(metadata.expiration)) || !metadata.fingerprints.includes(profile.fingerprint)) throw new Error('Downloaded distribution profile does not match the team, bundle, certificate, UUID, expiry or release entitlements');
};

const securityOutput = argumentsList => {
  const result = spawnSync('security', argumentsList, { encoding: 'utf8' });

  if (result.status !== 0) throw new Error(`Signing preflight failed at security ${argumentsList[0]}`);

  return result.stdout;
};

export const identityFingerprint = (output, name) => {
  const matches = output.split('\n').flatMap(line => {
    const match = /^\s*\d+\) ([A-F0-9]{40}) "([^"]+)"\s*$/u.exec(line);

    return match && match[2] === name ? [match[1]] : [];
  });

  if (matches.length !== 1) throw new Error(`Expected one valid signing identity for ${name}; found ${matches.length}`);

  return matches[0];
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [platform, keychain, work, directory] = process.argv.slice(2);

  if (!Object.hasOwn(targets, platform) || !keychain || !work || !directory) throw new Error('Expected platform, keychain, temporary workspace and profile directory');

  const identities = securityOutput(['find-identity', '-v', '-p', 'codesigning', keychain]);
  const fingerprint = identityFingerprint(identities, platform === 'iOS' ? `Apple Distribution: Santiago Molina Orozco (${team})` : `3rd Party Mac Developer Application: Santiago Molina Orozco (${team})`);
  const installer = platform === 'macOS' ? identityFingerprint(securityOutput(['find-identity', '-v', keychain]), `3rd Party Mac Developer Installer: Santiago Molina Orozco (${team})`) : null;
  const issuer = process.env.APP_STORE_CONNECT_ISSUER_ID;
  const keyId = process.env.APP_STORE_CONNECT_KEY_ID;
  const key = process.env.APP_STORE_CONNECT_API_KEY_P8;

  if (!issuer || !keyId || !key) throw new Error('Missing App Store Connect API credentials');

  const now = Math.floor(Date.now() / 1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'ES256', kid: keyId, typ: 'JWT' })}.${encode({ iss: issuer, aud: 'appstoreconnect-v1', iat: now, exp: now + 1200 })}`;
  const signature = sign('sha256', Buffer.from(token), { key: key.replace(/\\n/gu, '\n'), dsaEncoding: 'ieee-p1363' }).toString('base64url');

  const profiles = await selectDistributionProfiles(platform, async url => {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}.${signature}` }, redirect: 'error', signal: AbortSignal.timeout(30_000) });

    if (!response.ok) throw new Error(`App Store profile lookup failed: HTTP ${response.status}`);

    return response.json();
  }, [fingerprint]);

  const downloaded = profiles.map(profile => {
    const bytes = Buffer.from(profile.attributes.profileContent, 'base64');
    const path = join(work, `${profile.attributes.uuid}.mobileprovision`);

    writeFileSync(path, bytes, { mode: 0o600 });

    const verified = spawnSync('swift', [join(import.meta.dirname, 'verify-apple-profile.swift'), path], { encoding: 'utf8' });

    if (verified.status !== 0) throw new Error('Distribution profile CMS signature or signer trust is invalid');

    const xml = verified.stdout;
    const decoded = spawnSync('python3', ['-c', 'import sys,plistlib,json,hashlib; p=plistlib.loads(sys.stdin.buffer.read()); e=p["Entitlements"]; print(json.dumps({"uuid":p["UUID"],"team":p["TeamIdentifier"][0] if len(p["TeamIdentifier"])==1 else None,"identifier":e.get("application-identifier",e.get("com.apple.application-identifier")),"debugging":e.get("get-task-allow",False),"expiration":p["ExpirationDate"].isoformat()+"Z","fingerprints":[hashlib.sha1(c).hexdigest().upper() for c in p["DeveloperCertificates"]]}))'], { input: xml, encoding: 'utf8' });

    if (decoded.status !== 0) throw new Error('Could not decode distribution profile metadata');

    validateProfileMetadata(JSON.parse(decoded.stdout), profile);

    return { profile, bytes };
  });

  for (const { profile, bytes } of downloaded) {
    const path = join(directory, `${profile.attributes.uuid}.mobileprovision`);

    if (existsSync(path)) {
      if (!readFileSync(path).equals(bytes)) throw new Error('Existing profile UUID has different contents; preserve it');
    } else {
      writeFileSync(path, bytes, { mode: 0o600, flag: 'wx' });

      appendFileSync(join(work, 'installed-profile-uuids.txt'), `${profile.attributes.uuid}\n`, { mode: 0o600 });
    }
  }

  const mapping = profiles.map(profile => `<key>${profile.identifier}</key><string>${profile.attributes.uuid}</string>`).join('');
  const installerOption = installer ? `<key>installerSigningCertificate</key><string>${installer}</string>` : '';

  writeFileSync(join(work, 'ExportOptions.plist'), `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>method</key><string>app-store-connect</string><key>destination</key><string>upload</string><key>signingStyle</key><string>manual</string><key>teamID</key><string>${team}</string><key>signingCertificate</key><string>${fingerprint}</string>${installerOption}<key>provisioningProfiles</key><dict>${mapping}</dict><key>manageAppVersionAndBuildNumber</key><false/></dict></plist>\n`, { mode: 0o600 });

  process.stdout.write(`Verified ${profiles.length} ${platform} distribution profiles and required signing identities before archiving.\n`);
}
