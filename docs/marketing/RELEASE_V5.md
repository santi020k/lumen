# Lumen UI 5 release kit

Status: local preparation for `release/v5.0.0`. Publication, store submission, and scheduling remain
pending. These assets show a development candidate, not a published v5 release or physical-device
qualification. Playground applications retain their own versions and delivery workflows.

## Assets and capture evidence

Use the [release asset directory](../assets/releases/v5.0.0/README.md) for the image inventory,
capture revisions, dimensions, alternative text, and regeneration commands. Native store captures
remain beside each application's listing metadata. Website preview images share one source under
`apps/docs/src/assets/platforms`; the root and application READMEs reuse those files.

The kit contains a link-preview cover, a three-card carousel in square, portrait, and landscape
formats, and screenshots of the web workspace, web framework playground, theme studio, and React
Native browser preview. Native screenshots must match the exact binary submitted to each store.

Mac screenshot refresh remains pending: the local capture showed blank brand-image slots and a
system sharing overlay. Existing Mac store images are excluded from the new inventory.

## Release announcement draft

**Hold until v5 packages and documentation are published and verified.**

Lumen UI 5 brings modular delivery and editable recipes to the web component system. Start with the
components a page needs, compose them into your own workflows, and keep the shared foundations.

Explore the web playground, compare themes, or open the native playgrounds to try real SwiftUI and
Jetpack Compose components. The React Native playground is also available as an Expo browser preview.

Documentation: <https://lumen.santi020k.com/docs>

Migration guide: <https://lumen.santi020k.com/docs/migrations/v4-to-v5>

Created by [Santiago Molina](https://santi020k.com).

## Short caption draft

**Hold until the release is verified.**

Lumen UI 5: modular delivery, editable recipes, and shared design foundations. Explore real components
across the web and native playgrounds, then make the system your own.

Start at <https://lumen.santi020k.com/docs>.

Use the three square cards in numeric order. The corresponding alt text is in
[`artwork.json`](../assets/releases/v5.0.0/artwork.json). Portrait and landscape cards carry the same
story; their text is kept within the safe areas in [the asset briefs](ASSET_BRIEFS.md).

## Store metadata

The English release notes beside the Apple, Mac, and Android listings describe the candidate's
theme, browsing, and interaction changes without assigning a new store version. The Google Play
feature graphic uses the current Compose screenshot and avoids release timing or availability claims.
Existing app icons retain the canonical monogram.

## Final release handoff

- Select the final immutable candidate and rerun captures if a visible surface changed after the
  recorded source revision. Compare the screenshots with the signed store build before submission.
- Verify package versions, migration instructions, and the published docs destinations before using
  announcement copy. Native adapter and store-app versions are independent of the web major version.
- Run the normal release gates and native device checks in the
  [publication guide](../playground-publication.md) and [native runbook](../native-release-runbook.md).
- Review the raw screenshots at full size, the carousel at phone size, and the storefront preview.
  Keep React Native browser images out of Apple and Google Play screenshot slots.
- Obtain explicit approval for the exact channel, copy, assets, and timing before publication;
  record approved execution in [the publishing queue](PUBLISHING_QUEUE.md).

## Sources for claims

- [V5 plan](../lumen-5-plan.md): modular delivery, editable recipes, and their evidence boundaries.
- [Playground guide](../playgrounds.md): platform distribution and capture workflows.
- Application READMEs: named themes, category navigation, and composed example behavior.
- [Brand guide](../brand-guidelines.md): palette, mark, voice, and motion.

No adoption, performance percentage, store approval, or physical-device accessibility claim is
inferred from screenshots.
