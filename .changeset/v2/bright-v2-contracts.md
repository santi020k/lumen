---
'@santi020k/lumen': major
'@santi020k/lumen-astro': major
'@santi020k/lumen-core': major
'@santi020k/lumen-elements': major
'@santi020k/lumen-react': major
'@santi020k/lumen-react-native': major
'@santi020k/lumen-mcp': patch
---

Finalize the Lumen 2 breaking contracts: import the Astro runtime from its dedicated subpath,
replace the deprecated Sonner viewport name with ToastViewport, reserve native `size` for numeric
form-control sizing, and move React Native date fields to the optional `datetime` subpath. The v2
migrator automates the supported source changes, while the Swift surface enums gain the reviewed
larger semantic roles.
