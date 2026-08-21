# @santi020k/lumen-tokens

The canonical, platform-neutral foundations for Lumen UI. `lumen.tokens.json` uses Design Tokens
Community Group token types and carries the semantic light and dark colors, spacing, radii,
typography, motion, and elevation shared by every adapter.

```js
import tokens from '@santi020k/lumen-tokens' with { type: 'json' }

tokens.color.light.brand.$value
```

Platform packages expose native generated values, so most application code should consume
`@santi020k/lumen-react-native`, `LumenUI`, or the Compose module instead of parsing this file.
