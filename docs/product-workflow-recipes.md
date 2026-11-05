# Product workflow recipes

Install the Astro adapter in the application and the Lumen CLI separately for recipe installation.

    pnpm add @santi020k/lumen-astro
    pnpm add -D @santi020k/lumen
    pnpm exec lumen add code-example --target astro
    pnpm exec lumen add share --target astro
    pnpm exec lumen add editorial --target astro

The installer copies editable source into src/lumen and preserves existing edits. The registry
records runtime package dependencies and setup for each workflow. These instructions describe
setup and do not install dependencies or execute application code automatically. A target-specific
setup dependency list overrides the recipe-wide default list when both exist.

Keep each recipe's selective component imports. Astro components load their foundation and
component CSS. Mount the default export from @santi020k/lumen-astro/runtime once in the root
layout. The runtime enhances dialog, code, copy, and scrolling behavior. There is no full stylesheet
import in these recipes.

## Product video

The editorial-video-dialog composition uses native video controls. Pass a unique id, title, src,
optional poster, and the existing localized control labels. Supply captions as an array with src,
language, label, and optional default fields, or provide authored track elements in the tracks slot.
Caption resources and the video source stay deferred until the reader opens the viewer.

The artwork slot remains separate from the play control. Playback starts through the native play
control. Closing, Astro navigation, page exit, and disconnection pause playback. Failure exposes an
explicit retry and the direct-file link. Supply loadingLabel and retryLabel for localized feedback.

Put the transcript in the transcript slot. It appears in a native disclosure before enhancement,
then the same disclosure moves into the video dialog. IDs in the transcript stay unique. Keep the
transcript useful when media playback is unavailable and provide caption tracks for meaningful audio.

## Long examples and Markdown

CodeExample accepts a stable caller-owned id, title, complete source, optional language, open,
highlighted, and localized labels. A native Collapsible contains the complete Code block. The reader
can expand it with or without JavaScript. Set open when the example should start expanded.

    ---
    import CodeExample from '../lumen/code-example.astro'
    import source from '../examples/config.ts?raw'
    ---

    <CodeExample id="setup-config" title="Complete configuration" source={source} language="ts" />

The copy action always receives the full source, including while folded. Clipboard denial offers
a selected readonly recovery field with the complete source. Without JavaScript, the native
disclosure and source remain readable and the inactive copy control stays hidden. Reuse CodeTabs
directly for package-manager or language choices and give its groups stable storage keys.

For an MDX article, import this Astro recipe and the full source as shown above. Supply an authored
highlighted pre/code tree in the default slot with highlighted enabled. The slot preserves the
renderer’s spans, token classes, and language attributes. The required source prop is the authoritative
plain text for full copying. Keep the source and highlighted content generated from the same input.
This is an explicit composition for an example chosen by the author. Applications own Markdown
compilation, prose policy, and the decision about which examples should fold.

Use a stable descriptive id per example, unique across the rendered page. The recipe derives its
title and source IDs from that value. Do not derive IDs from translated labels or random values.
Keep the complete source in server HTML so no-JavaScript readers can use the disclosure.

## Sharing

Share accepts a unique id, canonical url, title, optional text, and application-supplied destinations.
Each destination has label, href, and an optional newTab value. Pass translated labels for every
visible action and status. Validate destinations in the application's data boundary.

    <Share
      id="article-share"
      title="Integration guide"
      url="https://example.com/guide/"
      destinations={[{ label: 'Email this guide', href: 'mailto:?subject=Integration%20guide' }]}
    />

The main action opens a Dialog containing destinations, a readonly URL, and CopyButton. When the
device exposes native sharing, an explicit button invokes it. Cancellation retains the dialog and
returns focus to that button. A failed share leaves the same fallback actions available. Completing
native sharing closes the dialog and returns focus to its trigger.

The unsupported-native-share path uses the same destinations and copy action. Copy denial displays
a manual-copy field. Without JavaScript, a native disclosure exposes the URL and destination links.
Opening a destination or invoking native sharing is always an explicit reader action. Pending native
share results are ignored after the viewer closes, navigation, or disconnection.

## Verification

The installed consumer uses the public CLI to install these files. Browser checks cover deferred
media and caption requests, recovery and transcript access, full-source copying, native-share
cancellation, failures, focus, navigation, and no-JavaScript use. The rendered Markdown fixture
passes a highlighted pre/code tree from Astro's existing Markdown processor into CodeExample.
