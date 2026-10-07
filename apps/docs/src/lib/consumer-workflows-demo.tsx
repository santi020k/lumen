import { useState } from 'react'

import { AmountField, Button, Card, DataTable, type DataTableSort, Field, FieldError, Input, Label, Message, MessageScroller, Stack } from '@santi020k/lumen-react'

import { OperationalRecordsRecipe } from '../../../../packages/lumen/templates/react/operational-records/src/lumen/operational-records'
import { ValidatedFormRecipe } from '../../../../packages/lumen/templates/react/validated-form/src/lumen/validated-form'

import { ConsumerThemeAuditDemo } from './consumer-theme-audit-demo'
import { OperationalWorkflowsDemo } from './operational-workflows-demo'

const records = [
  { id: 'sample-2', name: 'Registro de ejemplo B', amount: '1.234,50 COP', detail: 'Datos sintéticos. Ningún registro financiero real.' },
  { id: 'sample-1', name: 'Registro de ejemplo A', amount: '999,00 COP', detail: 'El servidor conserva el orden de estas filas.' }
]

export const ConsumerWorkflowsDemo = () => {
  const [sort, setSort] = useState<DataTableSort | null>(null)
  const [submitted, setSubmitted] = useState('')
  const [serverFailure, setServerFailure] = useState(false)
  const [messages, setMessages] = useState([{ id: 1, text: 'Synthetic activity feed. Scroll up to read without following new messages.' }])

  return (
    <Stack gap="section" className="consumer-workflows">
      <ConsumerThemeAuditDemo />
      <OperationalWorkflowsDemo />
      <Card>
        <h2>Formulario editable</h2>
        <ValidatedFormRecipe
          id="consumer-form"
          label="Formulario de ejemplo"
          summaryHeading="Revisa estos campos"
          failureMessage="No se pudo guardar. Conserva tus datos e inténtalo de nuevo."
          successMessage="Ejemplo guardado."
          validate={form => {
            const input = form.querySelector<HTMLInputElement>('#consumer-name')

            return input && input.value.trim().length < 3 ? [{ name: 'name', controlId: 'consumer-name', message: 'Escribe al menos tres caracteres.' }] : undefined
          }}
          submit={async values => {
            await new Promise<void>(resolve => {
              window.setTimeout(resolve, 200)
            })

            if (serverFailure) return [{ name: 'name', controlId: 'consumer-name', message: 'El servidor de ejemplo solicita otro nombre.' }]

            const amount = values.get('amount')

            setSubmitted(typeof amount === 'string' ? amount : '')

            return undefined
          }}
        >
          {({ errors, pending }) => {
            const nameError = errors.fields.find(item => item.controlId === 'consumer-name')?.message
            const amountError = errors.fields.find(item => item.controlId === 'consumer-amount')?.message

            return (
              <Stack gap="group">
                <Field invalid={Boolean(nameError)}>
                  <Label htmlFor="consumer-name">Nombre del registro</Label>
                  <Input id="consumer-name" name="name" required disabled={pending} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'consumer-name-error' : undefined} />
                  <FieldError id="consumer-name-error" message={nameError} />
                </Field>
                <Field invalid={Boolean(amountError)}>
                  <Label htmlFor="consumer-amount">Monto de ejemplo (COP)</Label>
                  <AmountField id="consumer-amount" name="amount" locale="es-CO" defaultValue="1234.50" required disabled={pending} invalidMessage="Escribe un monto completo con hasta dos decimales." aria-invalid={Boolean(amountError)} aria-describedby="consumer-amount-description consumer-amount-error" />
                  <p id="consumer-amount-description">La aplicación define unidades, límites y reglas financieras.</p>
                  <FieldError id="consumer-amount-error" message={amountError} />
                </Field>
                <Stack direction="horizontal" wrap gap="related">
                  <Button type="submit" loading={pending}>Guardar ejemplo</Button>
                  <Button type="reset" variant="outline" disabled={pending}>Restablecer</Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      setServerFailure(previous => !previous)
                    }}
                  >
                    {serverFailure ? 'Desactivar error del servidor' : 'Simular error del servidor'}
                  </Button>
                </Stack>
              </Stack>
            )
          }}
        </ValidatedFormRecipe>
        <output aria-live="polite" data-submitted-amount>{submitted ? `Submitted decimal string: ${submitted}` : 'No submission yet.'}</output>
      </Card>
      <Card>
        <h2>Registros y acciones</h2>
        <p>Datos sintéticos. Ordenar solicita un cambio; el ejemplo conserva el orden del servidor.</p>
        <OperationalRecordsRecipe columns={[{ key: 'name', header: 'Nombre', sortable: true }, { key: 'amount', header: 'Monto COP' }]} rows={records} sort={sort} onSortChange={setSort} label="Registros sintéticos" actionsLabel="Acciones" editLabel="Ver registro" closeLabel="Cerrar registro" detailsLabel="Detalle del registro" expandLabel="Mostrar detalle" collapseLabel="Ocultar detalle" />
        <output aria-live="polite" data-sort-request>{sort ? `${sort.key}: ${sort.direction}` : 'Sin solicitud de orden'}</output>
      </Card>
      <Card>
        <h2>Empty and error states</h2>
        <DataTable role="region" tabIndex={0} aria-label="Empty synthetic records" rows={[]} columns={[{ key: 'name', header: 'Name' }]} />
        <p>Server failures preserve the form draft above; retry uses the same editable controls.</p>
      </Card>
      <Card>
        <h2>Follow an activity feed</h2>
        <Stack direction="horizontal" wrap gap="related">
          <Button onClick={() => {
            setMessages(previous => [...previous, { id: (previous.at(-1)?.id ?? 0) + 1, text: 'New synthetic event with a long description.' }])
          }}
          >
            Append event
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setMessages(previous => [{ id: (previous[0]?.id ?? 0) - 1, text: 'Earlier synthetic event.' }, ...previous])
            }}
          >
            Load earlier
          </Button>
        </Stack>
        <MessageScroller autoScroll tabIndex={0} aria-label="Synthetic activity feed" style={{ height: '16rem', overflowY: 'auto', overflowAnchor: 'none' }}>
          {messages.map(item => <Message key={item.id} data-ui-message-item>{item.text}</Message>)}
          <Button data-ui-message-jump>Jump to latest</Button>
        </MessageScroller>
      </Card>
    </Stack>
  )
}
