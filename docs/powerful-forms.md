# Composable React form workflows

Lumen's optional `@santi020k/lumen-react/forms` entry point supplies form workflow hooks without
adding a form-state or schema dependency. It uses React only and does not load styles. Continue
using the public `Form`, `Field`, `FieldError`, `ErrorSummary`, `Stepper`, and `ChangeSummary`
components for presentation. Astro and Elements retain their existing native form contracts;
these hooks are React-specific, not a new cross-platform schema engine.

## Validation and dependent fields

`useLumenFormWorkflow` returns `formProps`, `errors`, `dirty`, `attempted`, `validate`, `refresh`,
`setErrors`, and `markSaved`. Spread `formProps` onto `Form`, then compose its event handlers if
adding application handlers. Call `validate()` before submitting; it returns a boolean and focuses
the first invalid control. A named validation such as `validate(undefined, ['email'])` updates
only those fields without moving focus. Use that mode for steps and focus changes.

Native constraints supply the default messages. `validateControl` can supply localized messages,
and `validateValues` returns typed `{ name, controlId, message }` issues for cross-field or schema
rules. `getControlName` supports controls whose displayed input and submitted input differ.
Map `dependencies` from changed names to related field names. Disabled and read-only controls are
excluded from validity checks; external controls associated through `form` participate.

Errors include a visible `label` when available. Bind them to `FieldError` and `aria-invalid`, and
pass them to `ErrorSummary` as field errors. Applications control when summaries are announced.
`setErrors` accepts normalized field feedback from server responses. An edit refreshes validity;
applications must reapply server feedback that depends on other state. `refresh()` removes obsolete
errors and updates the edit comparison after conditional or programmatic changes. Call it after
React commits those changes, not while rendering.

Do not mount this hook and `useFormValidation` or React Hook Form on the same form. Choose one
validation owner. The existing React Hook Form adapter remains available for applications that
already use that library.

## Sections and repeatable rows

`useLumenFormSteps(steps, validate)` accepts stable step IDs and field-name lists. Moving forward
validates every preceding step, including skipped steps. Going back retains values. The host owns
step presentation, focus, and whether sections remain visible. Keep all required fields reachable
when a full-form validation fails. `Stepper` supplies the progress presentation.

`useLumenFieldArray(initialValues)` returns stable `{ id, value }` rows and `append`, `remove`,
`update`, and `move`. Use each row ID as its React key and associate labels/errors with the control
IDs. After append, focus the new row; after removal, focus the nearest remaining row or add action.
The host owns row limits, labels, domain IDs, and submitted values. A transient row ID must not
replace an existing financial record ID. Non-integer and out-of-range moves do nothing.

## Async checks and submission

`useLumenAsyncCheck(check)` returns `state`, `run`, and `cancel`. The callback receives a value and
an `AbortSignal`. Pass the signal to read-only requests. Starting a new check aborts the previous
one; even a callback that ignores cancellation cannot publish an obsolete result. Cancel on a
relevant edit or context change. Unmounting aborts the active check. Render localized pending,
success and safe error feedback from the discriminated state.

Applications retain requests, duplicate-submit protection, authorization, idempotency and retries.
Use `Form`'s `status` for accessible pending feedback. Keep entered values on failure and only call
`markSaved()` after confirmed success. Review snapshots must be invalidated on edits and checked
again before committing. A preview is not authorization to mutate financial data.

## Unsaved edits and drafts

`dirty` compares current controls against the mounted or last saved baseline, including checkboxes,
multiple selections, file metadata, and controls temporarily disabled during submission. Accepted
reset restores native defaults; it does not redefine the saved baseline. Canceled reset retains
both values and errors.

Use `useLumenBeforeUnload(dirty)` for the browser's reload/close prompt. Application dialogs and
routers should use the same dirty state for an accessible discard confirmation. Choosing to keep
editing retains values in memory. Browser prompt wording is controlled by the browser.

Lumen never persists a draft or logs form snapshots. A host that needs recovery after reload must
choose authenticated storage, schema versioning, retention, expiry, and account-bound cleanup.
Do not persist credentials, borrower details, or uploaded documents in browser storage by default.

## Review and commit a proposal

`useLumenReviewWorkflow<T>` receives a monotonic draft/server `revision`, an application `submit`
callback and a localized `uncertainMessage`. Call `review(proposal)` only after validation, with a
new immutable, explicitly allowlisted command. Render its `proposal` for the user; `confirm()`
submits that exact reviewed object. `edit()` discards the review, and a changed revision prevents
confirmation of stale values. Disable editing and dismissal while pending. The helper blocks
concurrent confirmations synchronously and does not store or log proposals.

The submit callback returns `{ status: 'success' }`, `{ status: 'failure', message }` for a confirmed
rejection, or `{ status: 'uncertain', message }` when acknowledgement is missing. Messages must be
safe for end users. A thrown exception becomes uncertain with the configured fallback message;
raw exceptions never become product copy. Confirmed failures retain the same proposal for explicit
retry. Uncertain results prevent edits and resubmission until the application checks the durable
command outcome and calls `reconcile({ status: 'success' })` or a confirmed failure result. Status
checks must not reissue the mutation. A changed revision is never marked saved by an older result.

The installable `review-workflow` React recipe composes these helpers with `Form`, `ErrorSummary`
and `ChangeSummary`. Its `prepare(FormData)` callback chooses the command and visible changes;
exclude passwords, hidden security values, files and unrelated fields. The recipe retains drafts,
invalidates review on edits and supports a caller-provided reconciliation action. An API must still
validate, authorize and enforce idempotency. Do not use a status-only UI as evidence of persistence.
