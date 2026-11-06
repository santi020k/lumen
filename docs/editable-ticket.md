# Editable ticket

Install with the Lumen CLI:

    pnpm exec lumen add editable-ticket --target astro

Example usage after installation:

    ---
    import EditableTicket from "../lumen/editable-ticket.astro"
    ---
    <EditableTicket id="design-session" name="Type After Dark" venue="North Hall"
      dateTime="2026-11-14T19:30:00-05:00" dateLabel="14 Nov · 19:30" />
Import the copied editable-ticket.astro and provide id, name, venue, dateTime (ISO date)
and dateLabel (localized display). Every instance needs a unique id.

Edit buttons support pointer, Enter and Space activation. Typing previews the value in both views.
Enter or Save commits a trimmed, nonempty value of at most 120 characters. Escape or Cancel
restores the committed value. Undo restores the preceding event and focuses Edit event name.
An unchanged save retains undo. Opening another field cancels the draft.

The bubbling ui:event-change event contains detail.value (name and venue) and detail.reason
(save or undo). Drafts emit no events. The application owns permissions, persistence, retries
and validation. Adapt this local editor for asynchronous or shared editing. Disconnecting
cancels drafts; reconnecting retains committed values without duplicate listeners.

Translate the copy and validation messages in the installed source. Without JavaScript both
views remain readable and editing is hidden. This first recipe targets Astro. Its script and
scoped CSS load only when imported, with no dependency from base styles or the default runtime.
