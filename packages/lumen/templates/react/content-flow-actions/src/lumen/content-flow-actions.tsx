import { Button, Stack } from '@santi020k/lumen-react'

export const ContentFlowActionsRecipe = () => (
  <Stack role="group" aria-label="Changes" gap="related">
    <p role="status">You have unsaved changes.</p>
    <Stack direction="horizontal" gap="related" wrap>
      <Button>Save changes</Button>
      <Button variant="secondary">Discard changes</Button>
    </Stack>
  </Stack>
)
