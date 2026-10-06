# Verify the Changed Interface

Use the consumer's existing checks and representative synthetic data. Select the interactions
changed by the task; this checklist does not require adding unrelated product states.

## Interactions

- Overlays: open from the trigger, confirm initial focus, traverse focus with the keyboard,
  close with Escape and the visible close action, and verify focus returns to the trigger.
  Check nested dismissal when the changed surface includes nested overlays.
- Forms: verify labels and error associations, invalid submission, pending and successful
  submission, and recovery from failure. Preserve entered values when validation fails or a
  supplemental surface closes, unless the requested product behavior intentionally resets them.
- Navigation and selection: verify keyboard activation, active/selected announcements, and
  the destination or application callback. Check pointer and touch paths where supported.
- Async content: verify the relevant loading, empty, error, and recovery states. Keep retry,
  persistence, and authorization policy in the consumer.
- Charts: verify real zeros, missing values, unique identities, readable exact values, and
  supported keyboard inspection. Read the visualization reference for encoding-specific checks.

## Rendered Evidence

For material visual changes, capture before and after at the same route, viewport, theme,
synthetic data, and interaction state when the app can run locally. Capture only the result for
new surfaces. Use phone and desktop widths for responsive changes and both themes when appearance
changes. Check long translated labels, enlarged text, overflow, shared borders, and visible focus.
Respect reduced motion and verify that clipping does not hide focus rings or overlays.

For native adapters, use their supported platform, accessibility, and text-scaling conventions.
Distinguish compilation, simulator/emulator checks, and physical-device evidence. An unavailable
browser or device leaves that behavior unverified; source inspection does not prove it worked.

## Handoff

Report the changed behavior, commands actually run and their results, rendered evidence, and
remaining limitations. Distinguish local source, installed package, published catalog, and deployed
application evidence. Screenshots and automated accessibility scans supplement interaction tests;
they do not establish WCAG certification. Keep screenshots temporary unless the project tracks
visual baselines, and exclude credentials and personal data.
