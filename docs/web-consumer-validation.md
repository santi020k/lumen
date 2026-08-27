# Web consumer validation

Lumen 2 web qualification uses active applications outside this repository. Package fixtures,
documentation examples, `apps/next-smoke`, and the framework playground prove packaging or shared
contracts, but they do not qualify as independent consumer evidence.

The machine-readable ledger is `registry/web-consumer-evidence.json`. Validate its structure with:

```bash
pnpm run check:web-consumer-evidence
pnpm run test:web-consumer-evidence
```

The first command deliberately accepts truthful `pending` and `partial` records so ordinary
development can record progress without inventing success. Lumen 2 graduation requires:

```bash
pnpm run check:web-consumer-evidence:complete
```

That completion gate requires an immutable Lumen candidate revision and release-manifest URL plus
one active external consumer for Astro, React, and Elements. Every consumer must install the exact
candidate, run the v2 migrator (including a second idempotence pass), typecheck, lint, test, build,
exercise a production browser path, and record an accessibility pass. Evidence links must be
immutable HTTPS workflow or revision URLs. For the initial coordinated Lumen 2 launch, the
candidate revision must equal the contract's `approval.reviewedRevision`; changing the candidate
requires a new approval and consumer qualification against that revision.

The version-sensitive `pnpm run check:native-stable-readiness` command invokes this completion
check for every stable Lumen 2 release. Despite its historical name, it is the coordinated web and
native publication gate, so npm and Compose publication cannot proceed while any web adapter is
pending or partial.

The completion checker rejects mutable evidence even when it uses HTTPS. The release-manifest URL
must use the canonical `raw.githubusercontent.com/santi020k/lumen` origin, include the full lowercase
candidate revision, and end in `registry/release-manifest.json`. Each complete consumer must name
its repository-relative workflow, include a revision URL for the exact 40-character consumer commit,
and include a permanent workflow-run, pipeline, build, or job URL from that same declared consumer
repository. Evidence from unrelated repositories, branch URLs, workflow-definition pages, query
strings, fragments, and Lumen's own fixtures do not qualify.

## Maintained canaries

The Astro canary targets `santi020k.com`, currently on `@santi020k/lumen-astro` 1.6.0. The React
canary targets the active `aaronmgz` web application, currently on `@santi020k/lumen-react` 1.4.0.
Both consumer repositories contain candidate workflows that resolve package versions from the exact
Lumen release manifest rather than a mutable tag or workspace source substitution.

An active external Elements consumer has not yet been identified. The ledger therefore keeps that
adapter explicitly pending; the Lumen docs and Next smoke host cannot satisfy this requirement.

## Recording a qualifying run

For each adapter:

1. Publish or otherwise expose the exact candidate packages and immutable release manifest.
2. Dispatch the maintained consumer workflow with that manifest URL.
3. Review the migration diff and verify a second dry run reports no further edits.
4. Record the consumer's full 40-character revision and immutable successful workflow URL.
5. Set each check only when its named command or browser/a11y evidence actually passed.
6. Remove blockers and mark the record `complete` only when every required field is proven.

Never replace a failed consumer with a newly generated fixture merely to make the completion gate
green. A failure should produce a package fix, migration improvement, or explicit supported-contract
decision before the canary is rerun.
