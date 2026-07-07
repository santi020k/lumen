import {
  Autocomplete,
  ColorPicker,
  DatePicker,
  DateRangePicker,
  NumberField,
  SearchField,
  TagGroup,
  TimeField
} from '@santi020k/lumen-react'

export const AdvancedFieldsRecipe = () => (
  <form className="lumen-recipe lumen-recipe--advanced-fields">
    <SearchField name="q" placeholder="Search records" />
    <Autocomplete list="assignees" placeholder="Assign to..." />
    <datalist id="assignees">
      <option value="Design" />
      <option value="Engineering" />
      <option value="Operations" />
    </datalist>
    <NumberField aria-label="Seats" min="1" defaultValue="3" />
    <TimeField aria-label="Start time" defaultValue="09:30" />
    <DateRangePicker>
      <DatePicker aria-label="Start date" />
      <DatePicker aria-label="End date" />
    </DateRangePicker>
    <ColorPicker aria-label="Brand color" defaultValue="#2563eb" />
    <TagGroup aria-label="Selected filters">
      <span data-ui-tag role="listitem">Active <button data-ui-tag-remove type="button">Remove</button></span>
    </TagGroup>
  </form>
)
