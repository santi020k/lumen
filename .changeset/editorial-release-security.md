---
"@santi020k/lumen-mcp": patch
---

Refresh the release dependency graph to body-parser 2.4.0 and undici 8.12.3, fixing the compressed
request-body denial of service and three undici advisories. Raise the existing qs override to
6.16.1 to satisfy body-parser's declared dependency range. Existing local security patches and
the production audit gate remain enforced.
