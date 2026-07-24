---
"@santi020k/lumen-mcp": minor
---

Make MCP discovery framework-aware and release-verifiable. Component usage now includes authored
React hook/controller examples, Astro runtime setup, custom-element registration, richer Elements
examples, and corrected runtime event contracts. Natural-language search supports partial
multi-component product queries, aliases, framework filtering, and normalized recipe names.

Add `lumen_get_meta` and `lumen://meta` with deterministic catalog and package provenance, support
Node.js 20.20+, keep the MCP versioned with framework releases, reject stale generated snapshots in
CI, and smoke-test the packed package through a real external stdio connection.

Add a catalog manifest and diff workflow, deterministic connection diagnostics, a self-hostable
Streamable HTTP entrypoint, and release evaluations that benchmark natural-language search, exercise
every framework contract over MCP, parse Astro and Elements examples, and type-check every generated
React example against the package.
