import { Anchor, Pill } from '@santi020k/lumen-react'

import { readingLinks } from './reading-links'

export const ReadingPrimitives = () => (
  <>
    <Anchor activationOffset={40} items={readingLinks} />
    <div data-reading-pills>
      <Pill count={12}>Web development</Pill>
      <Pill count={1234}>Accessible interfaces and responsive layouts</Pill>
      <Pill count={99}>VeryLongUnbrokenComponentNameForNarrowLayouts</Pill>
    </div>
  </>
)
