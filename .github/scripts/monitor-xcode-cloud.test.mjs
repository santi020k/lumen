import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(
  new URL("./monitor-xcode-cloud.mjs", import.meta.url),
);

const runMonitor = (environment) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      env: { ...process.env, ...environment },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk;
    });

    child.stderr.on("data", (chunk) => {
      output += chunk;
    });

    child.on("close", (code) => resolve({ code, output }));
  });

const successfulBuildDocument = {
  data: [
    {
      type: "ciBuildRuns",
      id: "build-1",
      attributes: {
        number: 42,
        executionProgress: "COMPLETE",
        completionStatus: "SUCCEEDED",
        sourceCommit: { commitSha: "abc123" },
      },
      relationships: {
        workflow: { data: { type: "ciWorkflows", id: "workflow-1" } },
        sourceBranchOrTag: { data: { type: "scmGitReferences", id: "tag-1" } },
      },
    },
  ],
  included: [
    {
      type: "ciWorkflows",
      id: "workflow-1",
      attributes: { name: "App Store Release" },
    },
    {
      type: "scmGitReferences",
      id: "tag-1",
      attributes: { canonicalName: "refs/tags/ios-v1.0" },
    },
  ],
};

const monitorEnvironment = (privateKey, port, overrides = {}) => ({
  APP_STORE_CONNECT_ISSUER_ID: "issuer",
  APP_STORE_CONNECT_KEY_ID: "key",
  APP_STORE_CONNECT_PRIVATE_KEY: privateKey.export({
    format: "pem",
    type: "pkcs8",
  }),
  XCODE_CLOUD_PRODUCT_ID: "product",
  XCODE_CLOUD_WORKFLOW_NAME: "App Store Release",
  SOURCE_COMMIT_SHA: "abc123",
  RELEASE_TAG: "ios-v1.0",
  APP_STORE_CONNECT_API_ORIGIN: `http://127.0.0.1:${port}`,
  MAXIMUM_WAIT_MINUTES: "1",
  POLL_INTERVAL_SECONDS: "0.01",
  ...overrides,
});

test("reports a matching successful Xcode Cloud build", async (context) => {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });

  const server = createServer((request, response) => {
    assert.match(request.headers.authorization ?? "", /^Bearer /);

    response.setHeader("Content-Type", "application/json");

    response.end(JSON.stringify(successfulBuildDocument));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  context.after(() => server.close());

  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "xcode-cloud-monitor-"),
  );

  const summaryPath = join(temporaryDirectory, "summary.md");
  const address = server.address();

  const result = await runMonitor(
    monitorEnvironment(privateKey, address.port, {
      GITHUB_STEP_SUMMARY: summaryPath,
    }),
  );

  assert.equal(result.code, 0, result.output);

  assert.match(result.output, /release succeeded/);

  assert.match(
    await readFile(summaryPath, "utf8"),
    /Result: \*\*SUCCEEDED\*\*/,
  );
});

test("retries transient App Store Connect responses", async (context) => {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  let requestCount = 0;

  const server = createServer((_request, response) => {
    requestCount += 1;

    if (requestCount === 1) {
      response.statusCode = 503;

      response.setHeader("Retry-After", "0");

      response.end("temporarily unavailable");

      return;
    }

    response.setHeader("Content-Type", "application/json");

    response.end(JSON.stringify(successfulBuildDocument));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  context.after(() => server.close());

  const address = server.address();
  const result = await runMonitor(monitorEnvironment(privateKey, address.port));

  assert.equal(result.code, 0, result.output);

  assert.equal(requestCount, 2);

  assert.match(result.output, /retryable status 503/);

  assert.match(result.output, /release succeeded/);
});

test("uses exponential backoff when Retry-After is absent", async (context) => {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  let requestCount = 0;

  const server = createServer((_request, response) => {
    requestCount += 1;

    if (requestCount === 1) {
      response.statusCode = 503;

      response.end("temporarily unavailable");

      return;
    }

    response.setHeader("Content-Type", "application/json");

    response.end(JSON.stringify(successfulBuildDocument));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  context.after(() => server.close());

  const address = server.address();

  const result = await runMonitor(
    monitorEnvironment(privateKey, address.port, {
      POLL_INTERVAL_SECONDS: "0.05",
    }),
  );

  assert.equal(result.code, 0, result.output);

  assert.equal(requestCount, 2);

  assert.match(result.output, /Retrying in 0\.05 seconds/);
});

test("retries transient network failures", async (context) => {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  let requestCount = 0;

  const server = createServer((request, response) => {
    requestCount += 1;

    if (requestCount === 1) {
      request.socket.destroy();

      return;
    }

    response.setHeader("Content-Type", "application/json");

    response.end(JSON.stringify(successfulBuildDocument));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  context.after(() => server.close());

  const address = server.address();
  const result = await runMonitor(monitorEnvironment(privateKey, address.port));

  assert.equal(result.code, 0, result.output);

  assert.equal(requestCount, 2);

  assert.match(result.output, /request failed/);

  assert.match(result.output, /release succeeded/);
});

test("retries malformed successful response bodies", async (context) => {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  let requestCount = 0;

  const server = createServer((_request, response) => {
    requestCount += 1;

    response.setHeader("Content-Type", "application/json");

    response.end(
      requestCount === 1 ? '{"data":' : JSON.stringify(successfulBuildDocument),
    );
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  context.after(() => server.close());

  const address = server.address();
  const result = await runMonitor(monitorEnvironment(privateKey, address.port));

  assert.equal(result.code, 0, result.output);

  assert.equal(requestCount, 2);

  assert.match(result.output, /response JSON failed/);

  assert.match(result.output, /release succeeded/);
});

test("fails immediately for permanent App Store Connect responses", async (context) => {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  let requestCount = 0;

  const server = createServer((_request, response) => {
    requestCount += 1;

    response.statusCode = 401;

    response.end("unauthorized");
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  context.after(() => server.close());

  const address = server.address();
  const result = await runMonitor(monitorEnvironment(privateKey, address.port));

  assert.equal(result.code, 1, result.output);

  assert.equal(requestCount, 1);

  assert.match(result.output, /App Store Connect returned 401/);
});

test("fails immediately when the signing key is malformed", async () => {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });

  const result = await runMonitor(
    monitorEnvironment(privateKey, 1, {
      APP_STORE_CONNECT_PRIVATE_KEY: "not-a-private-key",
    }),
  );

  assert.equal(result.code, 1, result.output);

  assert.doesNotMatch(result.output, /Retrying in/);

  assert.match(result.output, /private key|DECODER|unsupported/i);
});
