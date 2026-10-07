# Framework Contracts

Read only the setup reference for the application target:

- [Astro](astro.md)
- [React](react.md)
- [Web Components](elements.md)
- [React Native and Expo](react-native.md)
- [SwiftUI](swiftui.md)
- [Jetpack Compose](compose.md)

## Shared Rules

- Use direct named imports from the selected framework package.
- Install `@santi020k/lumen` separately only for the framework-neutral registry or CLI.
- Keep Tailwind optional. When present, import Lumen alongside Tailwind in the shared CSS entry.
- Use native attributes such as `required`, `type`, `min`, `max`, `pattern`, `aria-*`, and `data-*`
  where the component contract permits them.
- Keep state in the host framework or app. Lumen supplies primitives and behavior contracts, not
  product-specific data architecture.
