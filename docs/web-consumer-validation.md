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
immutable HTTPS workflow or revision URLs.

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
