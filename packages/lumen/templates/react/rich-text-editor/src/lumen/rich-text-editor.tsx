import {
  Button,
  ButtonGroup,
  RichTextEditor,
  Textarea,
  ToggleGroup,
  useRichTextEditor
} from '@santi020k/lumen-react'

export const RichTextEditorRecipe = () => {
  const editor = useRichTextEditor()

  return (
    <RichTextEditor className="lumen-recipe lumen-recipe--rich-text-editor">
      <div role="toolbar" aria-label="Editor toolbar">
        <ButtonGroup>
          <Button {...editor.getCommandProps('bold')}>Bold</Button>
          <Button {...editor.getCommandProps('italic')}>Italic</Button>
        </ButtonGroup>
        <ToggleGroup><button {...editor.getCommandProps('insertUnorderedList')} type="button">List</button></ToggleGroup>
      </div>
      <div contentEditable suppressContentEditableWarning>Draft release notes...</div>
      <Textarea name="fallback" placeholder="Plain text fallback" />
    </RichTextEditor>
  )
}
