import {
  Button,
  ButtonGroup,
  RichTextEditor,
  Textarea,
  ToggleGroup
} from '@santi020k/lumen-react'

export const RichTextEditorRecipe = () => (
  <RichTextEditor className="lumen-recipe lumen-recipe--rich-text-editor">
    <div role="toolbar" aria-label="Editor toolbar">
      <ButtonGroup>
        <Button data-ui-editor-command="bold" type="button">Bold</Button>
        <Button data-ui-editor-command="italic" type="button">Italic</Button>
      </ButtonGroup>
      <ToggleGroup><button data-ui-editor-command="insertUnorderedList" type="button">List</button></ToggleGroup>
    </div>
    <div contentEditable suppressContentEditableWarning>Draft release notes...</div>
    <Textarea name="fallback" placeholder="Plain text fallback" />
  </RichTextEditor>
)
