import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(new URL("./monitor-xcode-cloud.mjs", import.meta.url));

const runMonitor = (environment) => new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      env: { ...process.env, ...environment },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";

    child.stdout.on("data", (chunk) => { output += chunk; });

    child.stderr.on("data", (chunk) => { output += chunk; });

    child.on("close", (code) => resolve({ code, output }));
  });

test("reports a matching successful Xcode Cloud build", async (context) => {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });

  const server = createServer((request, response) => {
    assert.match(request.headers.authorization ?? "", /^Bearer /);

    response.setHeader("Content-Type", "application/json");

    response.end(JSON.stringify({
      data: [{
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
      }],
      included: [
        { type: "ciWorkflows", id: "workflow-1", attributes: { name: "App Store Release" } },
        { type: "scmGitReferences", id: "tag-1", attributes: { canonicalName: "refs/tags/ios-v1.0" } },
      ],
    }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  context.after(() => server.close());

  const temporaryDirectory = await mkdtemp(join(tmpdir(), "xcode-cloud-monitor-"));
  const summaryPath = join(temporaryDirectory, "summary.md");
  const address = server.address();

  const result = await runMonitor({
    APP_STORE_CONNECT_ISSUER_ID: "issuer",
    APP_STORE_CONNECT_KEY_ID: "key",
    APP_STORE_CONNECT_PRIVATE_KEY: privateKey.export({ format: "pem", type: "pkcs8" }),
    XCODE_CLOUD_PRODUCT_ID: "product",
    XCODE_CLOUD_WORKFLOW_NAME: "App Store Release",
    SOURCE_COMMIT_SHA: "abc123",
    RELEASE_TAG: "ios-v1.0",
    APP_STORE_CONNECT_API_ORIGIN: `http://127.0.0.1:${address.port}`,
    MAXIMUM_WAIT_MINUTES: "1",
    POLL_INTERVAL_SECONDS: "0.01",
    GITHUB_STEP_SUMMARY: summaryPath,
  });

  assert.equal(result.code, 0, result.output);

  assert.match(result.output, /release succeeded/);

  assert.match(await readFile(summaryPath, "utf8"), /Result: \*\*SUCCEEDED\*\*/);
});
