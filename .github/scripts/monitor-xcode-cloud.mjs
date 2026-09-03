import { sign } from "node:crypto";

// cspell:words appstoreconnect

const requiredEnvironment = [
  "APP_STORE_CONNECT_ISSUER_ID",
  "APP_STORE_CONNECT_KEY_ID",
  "APP_STORE_CONNECT_PRIVATE_KEY",
  "XCODE_CLOUD_PRODUCT_ID",
  "XCODE_CLOUD_WORKFLOW_NAME",
  "SOURCE_COMMIT_SHA",
  "RELEASE_TAG",
];

for (const name of requiredEnvironment) {
  if (!process.env[name])
    throw new Error(`Missing required environment variable: ${name}`);
}

const issuerId = process.env.APP_STORE_CONNECT_ISSUER_ID;
const keyId = process.env.APP_STORE_CONNECT_KEY_ID;

const privateKey = process.env.APP_STORE_CONNECT_PRIVATE_KEY.replace(
  /\\n/g,
  "\n",
);

const productId = process.env.XCODE_CLOUD_PRODUCT_ID;
const workflowName = process.env.XCODE_CLOUD_WORKFLOW_NAME;
const sourceCommitSha = process.env.SOURCE_COMMIT_SHA.toLowerCase();
const releaseTag = process.env.RELEASE_TAG;

const pollIntervalMs =
  Number(process.env.POLL_INTERVAL_SECONDS ?? "30") * 1_000;

const maximumWaitMs =
  Number(process.env.MAXIMUM_WAIT_MINUTES ?? "150") * 60_000;

const apiOrigin =
  process.env.APP_STORE_CONNECT_API_ORIGIN ??
  "https://api.appstoreconnect.apple.com";

const startedAt = Date.now();
const base64Url = (value) => Buffer.from(value).toString("base64url");
const maximumRetryDelayMs = 60_000;

class RetryableRequestError extends Error {
  constructor(message, retryAfterMs) {
    super(message);

    this.name = "RetryableRequestError";

    this.retryAfterMs = retryAfterMs;
  }
}

const authorizationToken = () => {
  const issuedAt = Math.floor(Date.now() / 1_000);

  const header = base64Url(
    JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }),
  );

  const payload = base64Url(
    JSON.stringify({
      aud: "appstoreconnect-v1",
      exp: issuedAt + 15 * 60,
      iat: issuedAt,
      iss: issuerId,
    }),
  );

  const unsignedToken = `${header}.${payload}`;

  const signature = sign("sha256", Buffer.from(unsignedToken), {
    dsaEncoding: "ieee-p1363",
    key: privateKey,
  });

  return `${unsignedToken}.${signature.toString("base64url")}`;
};

const buildsUrl = () => {
  const url = new URL(`/v1/ciProducts/${productId}/buildRuns`, apiOrigin);

  url.searchParams.set("sort", "-number");

  url.searchParams.set("limit", "50");

  url.searchParams.set(
    "fields[ciBuildRuns]",
    "number,createdDate,startedDate,finishedDate,sourceCommit,executionProgress,completionStatus,issueCounts,workflow,sourceBranchOrTag",
  );

  url.searchParams.set("include", "workflow,sourceBranchOrTag");

  url.searchParams.set("fields[ciWorkflows]", "name");

  url.searchParams.set("fields[scmGitReferences]", "name,canonicalName,kind");

  return url;
};

const relatedResource = (build, relationshipName, includedById) => {
  const relationship = build.relationships?.[relationshipName]?.data;

  if (!relationship?.id) return undefined;

  return includedById.get(`${relationship.type}:${relationship.id}`);
};

const matchesTag = (sourceReference) => {
  if (!sourceReference) return true;

  const attributes = sourceReference.attributes ?? {};

  const referenceNames = new Set(
    [attributes.name, attributes.canonicalName].filter(Boolean),
  );

  return (
    referenceNames.size === 0 ||
    referenceNames.has(releaseTag) ||
    referenceNames.has(`refs/tags/${releaseTag}`)
  );
};

const matchesRelease = (build, includedById) => {
  const commit = build.attributes?.sourceCommit?.commitSha;
  const workflow = relatedResource(build, "workflow", includedById);

  const sourceReference = relatedResource(
    build,
    "sourceBranchOrTag",
    includedById,
  );

  const commitMatches = commit?.toLowerCase() === sourceCommitSha;
  const workflowMatches = workflow?.attributes?.name === workflowName;

  return commitMatches && workflowMatches && matchesTag(sourceReference);
};

const findReleaseBuild = (document) => {
  const includedById = new Map(
    (document.included ?? []).map((resource) => [
      `${resource.type}:${resource.id}`,
      resource,
    ]),
  );

  return (document.data ?? []).find((build) =>
    matchesRelease(build, includedById),
  );
};

const requestBuilds = async () => {
  const token = authorizationToken();

  try {
    return await fetch(buildsUrl(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new RetryableRequestError(
      `App Store Connect request failed: ${reason}`,
    );
  }
};

const readResponseBody = async (response) => {
  try {
    return await response.text();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new RetryableRequestError(
      `App Store Connect response body failed: ${reason}`,
    );
  }
};

const parseResponseBody = (responseBody) => {
  try {
    return JSON.parse(responseBody);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new RetryableRequestError(
      `App Store Connect response JSON failed: ${reason}`,
    );
  }
};

const fetchBuilds = async () => {
  const response = await requestBuilds();
  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    const isRetryable = response.status === 429 || response.status >= 500;

    if (isRetryable) {
      const retryAfterHeader = response.headers.get("retry-after");

      const retryAfterSeconds =
        retryAfterHeader === null ? undefined : Number(retryAfterHeader);

      const retryAfterMs =
        retryAfterSeconds !== undefined &&
        Number.isFinite(retryAfterSeconds) &&
        retryAfterSeconds >= 0
          ? retryAfterSeconds * 1_000
          : undefined;

      throw new RetryableRequestError(
        `App Store Connect returned retryable status ${response.status}: ${responseBody}`,
        retryAfterMs,
      );
    }

    throw new Error(
      `App Store Connect returned ${response.status}: ${responseBody}`,
    );
  }

  return parseResponseBody(responseBody);
};

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const writeSummary = async (build, outcome) => {
  if (!process.env.GITHUB_STEP_SUMMARY) return;

  const { appendFile } = await import("node:fs/promises");
  const attributes = build?.attributes ?? {};

  const lines = [
    "## Xcode Cloud release status",
    "",
    `- Release: \`${releaseTag}\``,
    `- Commit: \`${sourceCommitSha}\``,
    `- Workflow: ${workflowName}`,
    `- Result: **${outcome}**`,
  ];

  if (attributes.number !== undefined)
    lines.push(`- Xcode Cloud build: ${attributes.number}`);

  if (attributes.startedDate)
    lines.push(`- Started: ${attributes.startedDate}`);

  if (attributes.finishedDate)
    lines.push(`- Finished: ${attributes.finishedDate}`);

  lines.push(
    "",
    "Open App Store Connect only when logs or distribution controls are needed.",
    "",
  );

  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
};

let lastReportedState;
let consecutiveRequestFailures = 0;

while (Date.now() - startedAt < maximumWaitMs) {
  let document;

  try {
    document = await fetchBuilds();

    consecutiveRequestFailures = 0;
  } catch (error) {
    if (!(error instanceof RetryableRequestError)) throw error;

    consecutiveRequestFailures += 1;

    const exponentialDelayMs =
      pollIntervalMs * 2 ** Math.min(consecutiveRequestFailures - 1, 6);

    const retryDelayMs = Math.min(
      error.retryAfterMs ?? exponentialDelayMs,
      maximumRetryDelayMs,
    );

    console.warn(
      `${error.message} Retrying in ${retryDelayMs / 1_000} seconds.`,
    );

    await wait(retryDelayMs);

    continue;
  }

  const build = findReleaseBuild(document);

  if (!build) {
    if (lastReportedState !== "WAITING_FOR_BUILD") {
      console.log(
        `Waiting for ${workflowName} to discover ${releaseTag} at ${sourceCommitSha}...`,
      );

      lastReportedState = "WAITING_FOR_BUILD";
    }

    await wait(pollIntervalMs);

    continue;
  }

  const progress = build.attributes?.executionProgress ?? "UNKNOWN";
  const completionStatus = build.attributes?.completionStatus;
  const state = `${progress}:${completionStatus ?? "IN_PROGRESS"}`;

  if (state !== lastReportedState) {
    console.log(
      `Xcode Cloud build ${build.attributes?.number ?? build.id}: ${state}`,
    );

    lastReportedState = state;
  }

  if (progress !== "COMPLETE") {
    await wait(pollIntervalMs);

    continue;
  }

  await writeSummary(build, completionStatus ?? "UNKNOWN");

  if (completionStatus === "SUCCEEDED") {
    console.log("Xcode Cloud release succeeded.");

    process.exit(0);
  }

  throw new Error(
    `Xcode Cloud release finished with status ${completionStatus ?? "UNKNOWN"}.`,
  );
}

await writeSummary(undefined, "TIMED OUT");

throw new Error(
  `Timed out after ${maximumWaitMs / 60_000} minutes waiting for ${releaseTag}.`,
);
