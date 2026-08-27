import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireComplete = process.argv.includes("--require-complete");

const ledgerArgument = process.argv.find((argument) =>
  argument.startsWith("--ledger="),
);

const ledgerPath = ledgerArgument
  ? path.resolve(process.cwd(), ledgerArgument.slice(9))
  : path.join(root, "registry/web-consumer-evidence.json");

const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
const requiredAdapters = ["astro", "elements", "react"];

const requiredChecks = [
  "accessibility",
  "browser",
  "build",
  "exactCandidate",
  "installation",
  "lint",
  "migration",
  "tests",
  "typecheck",
];

const isRecord = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validateStringArray = (value, label) => {
  assert.ok(Array.isArray(value), `${label} must be an array`);

  for (const entry of value) {
    assert.equal(typeof entry, "string", `${label} entries must be strings`);

    assert.ok(entry.trim().length > 0, `${label} entries must not be empty`);
  }
};

const parseHttpsUrl = (value, label) => {
  assert.equal(typeof value, "string", `${label} must be a string`);

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    assert.fail(`${label} must be a valid HTTPS URL`);
  }

  assert.equal(parsed.protocol, "https:", `${label} must be a valid HTTPS URL`);

  assert.equal(parsed.username, "", `${label} must not embed credentials`);

  assert.equal(parsed.password, "", `${label} must not embed credentials`);

  assert.equal(parsed.search, "", `${label} must not use a query string`);

  assert.equal(parsed.hash, "", `${label} must not use a fragment`);

  return parsed;
};

const normalizeRepositoryIdentity = (repositoryUrl) =>
  `${repositoryUrl.hostname}${repositoryUrl.pathname}`
    .replace(/\/+$/u, "")
    .replace(/\.git$/u, "")
    .toLowerCase();

const repositoryPath = (repositoryUrl) =>
  repositoryUrl.pathname
    .replace(/\/+$/u, "")
    .replace(/\.git$/u, "")
    .toLowerCase();

const belongsToRepository = (url, repositoryUrl) =>
  url.hostname.toLowerCase() === repositoryUrl.hostname.toLowerCase() &&
  url.pathname.toLowerCase().startsWith(`${repositoryPath(repositoryUrl)}/`);

const isImmutableRunUrl = (url) =>
  /\/(?:actions\/runs|builds|jobs|pipelines|runs)\/[\w-]+(?:\/|$)/u.test(
    url.pathname,
  );

const isImmutableRevisionUrl = (url) =>
  /\/(?:blob|commit|commits)\/[\da-f]{40}(?:\/|$)/iu.test(url.pathname);

const isExactRevisionUrl = (url, revision) =>
  new RegExp(`/(?:blob|commit|commits)/${revision}(?:/|$)`, "u").test(
    url.pathname,
  );

const validateCompleteEntry = (entry, label) => {
  assert.match(
    entry.consumer.name,
    /\S/u,
    `${label} requires an active consumer name`,
  );

  const repositoryUrl = parseHttpsUrl(
    entry.consumer.repository,
    `${label} consumer repository`,
  );

  assert.notEqual(
    normalizeRepositoryIdentity(repositoryUrl),
    "github.com/santi020k/lumen",
    `${label} cannot qualify with a Lumen-owned fixture`,
  );

  assert.match(
    entry.consumer.workflow,
    /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))\S+$/u,
    `${label} requires a repository-relative workflow path`,
  );

  assert.ok(isRecord(entry.upgrade), `${label} requires an upgrade record`);

  assert.match(
    entry.upgrade.fromVersion,
    /^(0|1)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u,
    `${label} requires an ordinary pre-2 source version`,
  );

  assert.match(
    entry.upgrade.revision,
    /^[\da-f]{40}$/u,
    `${label} requires a full lowercase consumer revision`,
  );

  assert.equal(
    entry.upgrade.toVersion,
    ledger.candidate.version,
    `${label} must upgrade the exact candidate`,
  );

  assert.ok(
    Object.values(entry.checks).every(Boolean),
    `${label} must pass every required check`,
  );

  assert.ok(
    entry.evidence.length >= 2,
    `${label} requires revision and workflow evidence`,
  );

  const evidenceUrls = entry.evidence.map((item, index) =>
    parseHttpsUrl(item, `${label} evidence ${index + 1}`),
  );

  assert.ok(
    evidenceUrls.every((item) => belongsToRepository(item, repositoryUrl)),
    `${label} evidence must belong to the declared consumer repository`,
  );

  assert.ok(
    evidenceUrls.every(
      (item) => isImmutableRevisionUrl(item) || isImmutableRunUrl(item),
    ),
    `${label} evidence must use immutable workflow or revision URLs`,
  );

  assert.ok(
    evidenceUrls.some((item) =>
      isExactRevisionUrl(item, entry.upgrade.revision),
    ),
    `${label} evidence must include the exact consumer revision`,
  );

  assert.ok(
    evidenceUrls.some(isImmutableRunUrl),
    `${label} evidence must include an immutable workflow run URL`,
  );

  assert.deepEqual(
    entry.blockingIssues,
    [],
    `${label} cannot retain blockers when complete`,
  );
};

assert.equal(
  ledger.schemaVersion,
  1,
  "Unsupported web consumer evidence schema",
);

assert.ok(
  isRecord(ledger.candidate),
  "Web consumer evidence requires a candidate",
);

assert.match(
  ledger.candidate.version,
  /^2\.0\.0(?:-|$)/u,
  "The web candidate must target Lumen 2",
);

assert.ok(
  Array.isArray(ledger.adapters),
  "Web consumer evidence requires adapters",
);

assert.deepEqual(
  ledger.adapters.map((entry) => entry.id).sort(),
  requiredAdapters,
  "Web consumer evidence must cover Astro, React, and Elements exactly once",
);

for (const entry of ledger.adapters) {
  const label = `web consumer ${entry.id}`;

  assert.ok(isRecord(entry), `${label} must be an object`);

  assert.ok(
    ["complete", "partial", "pending"].includes(entry.status),
    `${label} has an invalid status`,
  );

  assert.ok(isRecord(entry.consumer), `${label} requires a consumer record`);

  assert.ok(isRecord(entry.checks), `${label} requires checks`);

  assert.deepEqual(
    Object.keys(entry.checks).sort(),
    requiredChecks,
    `${label} checks must cover the complete qualification matrix`,
  );

  validateStringArray(entry.evidence, `${label} evidence`);

  validateStringArray(entry.blockingIssues, `${label} blocking issues`);

  for (const check of requiredChecks) {
    assert.equal(
      typeof entry.checks[check],
      "boolean",
      `${label} requires boolean ${check} evidence`,
    );
  }

  const completedChecks = Object.values(entry.checks).filter(Boolean).length;

  if (entry.status === "pending") {
    assert.equal(completedChecks, 0, `${label} pending checks must be false`);

    assert.equal(
      entry.evidence.length,
      0,
      `${label} pending evidence must be empty`,
    );
  } else {
    assert.ok(
      completedChecks > 0,
      `${label} partial or complete evidence requires a completed check`,
    );

    assert.ok(
      entry.evidence.length > 0,
      `${label} partial or complete evidence requires a record`,
    );
  }

  if (entry.status === "complete") {
    validateCompleteEntry(entry, label);
  } else {
    assert.ok(
      entry.blockingIssues.length > 0,
      `${label} must explain why qualification is incomplete`,
    );
  }
}

if (requireComplete) {
  assert.equal(
    ledger.candidate.version,
    "2.0.0",
    "Complete web evidence must target the stable Lumen 2.0.0 release",
  );

  assert.match(
    ledger.candidate.revision,
    /^[\da-f]{40}$/u,
    "Complete web evidence requires the full lowercase Lumen candidate revision",
  );

  const manifestUrl = parseHttpsUrl(
    ledger.candidate.releaseManifestUrl,
    "Complete web evidence release manifest URL",
  );

  assert.equal(
    manifestUrl.hostname.toLowerCase(),
    "raw.githubusercontent.com",
    "Complete web evidence must use the immutable Lumen release manifest origin",
  );

  assert.equal(
    manifestUrl.pathname,
    `/santi020k/lumen/${ledger.candidate.revision}/registry/release-manifest.json`,
    "Complete web evidence must reference the exact immutable Lumen release manifest",
  );

  assert.ok(
    ledger.adapters.every((entry) => entry.status === "complete"),
    "Every web adapter requires complete consumer evidence",
  );
}

console.log(
  `Web consumer evidence is valid${requireComplete ? " and complete" : ""}.`,
);
