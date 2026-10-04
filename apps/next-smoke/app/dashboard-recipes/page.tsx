'use client'

import { useState } from 'react'

import {
  Badge, Button, ChangeSummary, Container, DataTable, type DataTableColumn, type DataTableSort,
  DataTableSortControls, Field, FilterBar, Label, Popover, PopoverPanel, PopoverTrigger,
  ScatterChart, SearchField, Stack, Typography
} from '@santi020k/lumen-react'

const records = [
  { id: 'studio', client: 'Example studio with a long account name', balance: 25000 },
  { id: 'cooperative', client: 'Example cooperative', balance: 100000000000 }
]

const number = new Intl.NumberFormat('en-US')

const columns: DataTableColumn[] = [
  { key: 'client', label: 'Client', sortable: true, wide: true },
  { key: 'balance',
    label: 'Balance',
    sortable: true,
    sort: 'number',
    render: cell => <Badge>{typeof cell === 'number' ? `COP ${number.format(cell)}` : 'Unavailable'}</Badge> }
]

export default function DashboardRecipes() {
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [sort, setSort] = useState<DataTableSort | null>(null)
  const [selected, setSelected] = useState('')
  const rows = records.filter(row => row.client.toLowerCase().includes(query.toLowerCase()))

  return (
    <Container as="main" style={{ fontFamily: 'var(--ui-font)', maxWidth: '70rem', padding: '1rem', margin: 'auto' }}>
      <Stack gap="section">
        <Typography><h1>Dashboard composition</h1></Typography>
        <FilterBar
          label="Filters"
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          resultLabel={`${rows.length} matching records`}
          filters={query ? [{ id: 'query', label: 'Search', value: query }] : []}
          onRemoveFilter={() => {
            setQuery('')
          }}
          onReset={() => {
            setQuery('')
          }}
        >
          <Field>
            <Label htmlFor="dashboard-search">Search clients</Label>
            <SearchField
              id="dashboard-search"
              value={query}
              onChange={event => {
                setQuery(event.currentTarget.value)
              }}
            />
          </Field>
        </FilterBar>
        <DataTableSortControls columns={columns} sort={sort} onSortChange={setSort} />
        <DataTable
          columns={columns}
          rows={rows}
          layout="records"
          sort={sort}
          onSortChange={setSort}
          renderDetails={row => (
            <p>
              Record details for
              {' '}
              {typeof row.client === 'string' ? row.client : ''}
            </p>
          )}
        />
        <ChangeSummary
          label="Review allocation"
          summary="1 changed field"
          items={[
            { id: 'amount', label: 'Amount', before: 'COP 25,000', after: 'COP 30,000', changed: true },
            { id: 'owner', label: 'Owner', before: 'Example studio', after: 'Example studio', changed: false }
          ]}
        />
        <Popover>
          <PopoverTrigger>Open record actions</PopoverTrigger>
          <PopoverPanel role="region" aria-label="Record actions">
            <Button onClick={() => {
              setSelected('Example studio')
            }}
            >
              Choose example studio
            </Button>
          </PopoverPanel>
        </Popover>
        <p role="status">{selected ? `Selected ${selected}` : 'No record selected'}</p>
        <ScatterChart
          aria-label="Reach and momentum"
          xScale="log"
          xDomain={{ min: 1, max: 100000 }}
          domain={{ min: -10, max: 10 }}
          formatX={value => number.format(Number(value))}
          formatY={value => `${value}%`}
          series={[{ id: 'growth', label: 'Products', data: [{ x: 10, y: -4 }, { x: 1000, y: 2 }, { x: 10000, y: 7 }] }]}
          references={[{ id: 'reach', label: 'Reach threshold: 1,000', x: 1000 },
            { id: 'momentum', label: 'No change: 0%', y: 0 },
            { id: 'target', label: 'High reach and positive momentum', x: 1000, xEnd: 100000, y: 0, yEnd: 10 }]}
        />
      </Stack>
    </Container>
  )
}
