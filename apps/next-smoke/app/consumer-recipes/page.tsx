'use client'

import { useState } from 'react'

import { Badge, Button, Card, Label, Select } from '@santi020k/lumen-react'
import { Icon, Search } from '@santi020k/lumen-react/icons'

import { RecordTable } from './record-table'
import { WholeAmountField } from './whole-amount-field'

const copy = {
  en: { amount: 'Amount', caption: 'Upcoming collections', client: 'Client', due: 'Due', status: 'Status', actions: 'Actions', open: 'Open record', partial: 'Partial', pending: 'Pending', hint: 'Enter whole pesos without separators.', error: 'Enter a whole amount from 0 to 100,000,000,000.' },
  es: { amount: 'Importe', caption: 'Próximos cobros', client: 'Cliente', due: 'Vence', status: 'Estado', actions: 'Acciones', open: 'Abrir registro', partial: 'Parcial', pending: 'Pendiente', hint: 'Ingresa pesos enteros sin separadores.', error: 'Ingresa un importe entero entre 0 y 100.000.000.000.' }
}

const rows = [
  { id: 'example-1', client: 'Example cooperative with a deliberately long account name', amount: 100_000_000_000, due: '2026-09-30', partial: true },
  { id: 'example-2', client: 'Example studio', amount: 25_000, due: '2026-10-02', partial: false }
]

export default function ConsumerRecipes() {
  const [locale, setLocale] = useState<'en' | 'es'>('en')
  const [value, setValue] = useState('25000')
  const [selected, setSelected] = useState('')
  const t = copy[locale]
  const format = new Intl.NumberFormat(locale === 'es' ? 'es-CO' : 'en-US', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

  return (
    <main lang={locale} style={{ fontFamily: 'var(--ui-font)', background: 'hsl(var(--canvas))', color: 'hsl(var(--ink))', minHeight: '100vh', maxWidth: '70rem', margin: 'auto', padding: '1rem', display: 'grid', gap: '1.5rem' }}>
      <h1>Consumer UI recipes</h1>
      <Label htmlFor="recipe-language-trigger">Language / Idioma</Label>
      <Select
        id="recipe-language"
        onValueChange={value => {
          setLocale(value === 'es' ? 'es' : 'en')
        }}
        options={[{ value: 'en', label: 'English' }, { value: 'es', label: 'Español' }]}
        value={locale}
      />
      <RecordTable
        caption={t.caption}
        columns={[
          { key: 'client', label: t.client, render: row => row.client, wide: true },
          { key: 'amount', label: t.amount, render: row => format.format(row.amount) },
          { key: 'due', label: t.due, render: row => row.due },
          { key: 'status', label: t.status, render: row => <Badge variant={row.partial ? 'warning' : 'outline'}>{row.partial ? t.partial : t.pending}</Badge> },
          { key: 'actions',
            label: t.actions,
            render: row => (
              <Button onClick={() => {
                setSelected(row.id)
              }}
              >
                <Icon icon={Search} />
                {t.open}
              </Button>
            ),
            wide: true }
        ]}
        rowKey={row => row.id}
        rows={rows}
      />
      <p role="status">{selected}</p>
      <Card>
        <WholeAmountField currency="COP" errorLabel={t.error} hint={t.hint} label={t.amount} locale={locale === 'es' ? 'es-CO' : 'en-US'} max={100_000_000_000} onChange={setValue} value={value} />
      </Card>
    </main>
  )
}
