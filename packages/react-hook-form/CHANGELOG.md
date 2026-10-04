# @santi020k/lumen-react-hook-form

## 4.0.0

### Patch Changes

- Updated dependencies [`cc91b3e`, `c71c50a`, `ef5187d`, `788125f`, `55a1032`, `19964b1`, `20aa235`, `85f332c`, `0ea4a4e`, `79d9b0a`, `4e80faa`, `bd11bc0`, `bd11bc0`, `1639935`, `059aae9`, `177aedf`, `aba0839`]:
  - @santi020k/lumen-react@4.0.0

- Updated dependencies []:
  - @santi020k/lumen-react@4.0.0

### Major Changes

- Prepare the coordinated Lumen 4 family from twenty real consumer audits.

  - Make chart axes readable, preserve complete detail labels, center single observations, use
    deterministic duplicate handling, and expose formatted native axes and compact plot layouts.
  - Add controlled date-range drafting with strict calendar bounds, localized labels, and safe
    disabled/read-only behavior. Keep form labels and keyboard focus attached to the active control.
  - Keep server-paginated tables in supplied order with controlled manual sorting, and make dialog
    dismissal and opener restoration explicit for pending and nested workflows.
  - Preserve native hidden semantics, loading-button dimensions, and disabled slotted activation.
  - Give code-copy actions localized success and failure feedback, preserve normal navigation Tab
    order, and improve readable prose and code-theme defaults.
  - Add ImageComparison with a fixed image frame, native range control, RTL support, and matching
    Astro, React, and Web Component contracts.
  - Improve native slider announcements, long text layout, and contextual symbol selection.
  - Refresh usage examples, migration guidance, machine-readable contracts, and the public consumer
    showcase. Token, icon, and form-integration packages join the coordinated major family.

  Migration: use unique stable chart X values, rebuild native consumers for updated initializer
  contracts, and review custom button selectors against the content wrapper. Loading actions now
  prevent repeated activation. See `docs/migrating-to-lumen.md` for the full v4 migration. No
  application data migration is performed, and this candidate is not publication authorization.

## 3.0.0

### Major Changes

- Support the Lumen React 3 package family. Update `@santi020k/lumen-react` and this adapter
  together; the form component API is unchanged.

## 2.0.0

### Major Changes

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Align the remaining public npm packages at the coordinated Lumen 2 production-support milestone.
  This keeps the initial package family on `2.0.0` while preserving independent semantic versioning
  for later 2.x releases.

### Patch Changes

- Updated dependencies [[`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105)]:
  - @santi020k/lumen-react@2.0.0

## 1.0.2

## 1.0.2-rc.0

### Patch Changes

- Updated dependencies [[`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92)]:
  - @santi020k/lumen-react@1.7.0-rc.0

## 1.0.1

### Patch Changes

- [#25](https://github.com/santi020k/lumen/pull/25) [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684) Thanks [@santi020k](https://github.com/santi020k)! - Improve package discovery with framework-specific documentation homepages and npm search keywords.

## 1.0.0

### Major Changes

- [#13](https://github.com/santi020k/lumen/pull/13) [`da44247`](https://github.com/santi020k/lumen/commit/da44247c127a77744bdd84ace78b85a9ba586839) Thanks [@santi020k](https://github.com/santi020k)! - Release Lumen 1.0 with stable public component, token, styling, framework, registry, and MCP
  contracts. Remove the deprecated `surface="glass"` overlay alias and
  `ui:datatable-selection-change` event; use the `glass` prop or attribute and
  `ui:data-table-selection-change` instead.

### Minor Changes

- [#13](https://github.com/santi020k/lumen/pull/13) [`32448b0`](https://github.com/santi020k/lumen/commit/32448b02030177788ebcdbb4ee91eb55f3bbfbff) Thanks [@santi020k](https://github.com/santi020k)! - Add native-first form contracts and the Form, FieldError, ErrorSummary, PasswordField,
  CheckboxGroup, ListBox, Container, Stack, Grid, and VisuallyHidden components across Astro, React,
  and Elements.

  Ship an optional React Hook Form adapter package, Astro Actions error normalization, form-associated
  custom element behavior, accessible validation and error-summary focus, documented serialization,
  and generated registry and MCP metadata.

### Patch Changes

- Updated dependencies [[`6e84499`](https://github.com/santi020k/lumen/commit/6e84499b05e1e3cda0087e686db88663de351c48), [`46c2aca`](https://github.com/santi020k/lumen/commit/46c2aca5bac0579f8265b77a4991a7c640903914), [`32448b0`](https://github.com/santi020k/lumen/commit/32448b02030177788ebcdbb4ee91eb55f3bbfbff), [`da44247`](https://github.com/santi020k/lumen/commit/da44247c127a77744bdd84ace78b85a9ba586839)]:
  - @santi020k/lumen-react@1.0.0
