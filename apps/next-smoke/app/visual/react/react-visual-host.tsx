'use client'

import { useState } from 'react'

import {
  Alert,
  Badge,
  Button,
  Calendar,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Combobox,
  DataTable,
  Dialog,
  Progress,
  Stat,
  StatDescription,
  StatTrend,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger
} from '@santi020k/lumen-react'

const releaseColumns = [
  { header: 'Package', key: 'package', sortable: true },
  { header: 'Platform', key: 'platform', sortable: true },
  { header: 'Status', key: 'status', sortable: true }
]

const releaseRows = [
  { id: 'react', package: 'lumen-react', platform: 'Web', status: 'Ready' },
  { id: 'swift', package: 'LumenUI', platform: 'Apple', status: 'Ready' },
  {
    id: 'compose',
    package: 'lumen-compose',
    platform: 'Android',
    status: 'Review'
  }
]

export const ReactVisualHost = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [progress, setProgress] = useState(68)

  return (
    <main className="visual-host" data-framework="react">
      <header className="visual-host__hero">
        <div>
          <Badge variant="secondary">React 19 runtime</Badge>
          <h1>Real React rendering</h1>
          <p>
            Interactive Lumen primitives mounted through a Next.js client
            boundary.
          </p>
        </div>
        <Button
          onClick={() => {
            setProgress(value => (value >= 100 ? 24 : value + 8))
          }}
        >
          Advance release
        </Button>
      </header>

      <section className="visual-host__stats" aria-label="Release status">
        <Stat label="Components" value="156" variant="accent">
          <StatDescription>Shared catalog</StatDescription>
        </Stat>
        <Stat label="Coverage" value={`${progress}%`}>
          <StatTrend tone="success">+8 this run</StatTrend>
        </Stat>
        <Stat label="Framework" value="React">
          <StatDescription>Client rendered</StatDescription>
        </Stat>
      </section>

      <section className="visual-host__grid">
        <Card as="article">
          <CardHeader>
            <CardTitle>Release readiness</CardTitle>
            <CardDescription>
              State changes are owned by this React host.
            </CardDescription>
          </CardHeader>
          <CardContent className="visual-host__stack">
            <Progress aria-label="Release readiness" value={progress} />
            <Alert variant={progress >= 92 ? 'success' : 'default'}>
              {progress >= 92 ?
                'Ready for final review.' :
                'Verification is still running.'}
            </Alert>
            <Button onClick={() => {
              setDialogOpen(true)
            }}
            >
              Review release details
            </Button>
            <Dialog
              aria-labelledby="react-release-dialog-title"
              onOpenChange={setDialogOpen}
              open={dialogOpen}
            >
              <h2 id="react-release-dialog-title">Release details</h2>
              <p>
                All framework adapters must pass the same interaction contract.
              </p>
              <Button onClick={() => {
                setDialogOpen(false)
              }}
              >
                Close release details
              </Button>
            </Dialog>
          </CardContent>
        </Card>

        <Card as="article">
          <CardHeader>
            <CardTitle>Delivery window</CardTitle>
            <CardDescription>
              Keyboard-ready calendar behavior from the React package.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar defaultValue="2026-08-25" name="releaseDate" />
          </CardContent>
        </Card>

        <Card as="article">
          <CardHeader>
            <CardTitle>Framework selector</CardTitle>
            <CardDescription>
              Shared filtering and roving option focus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Combobox
              label="Framework selector"
              list="react-framework-options"
              options={['Astro', 'React', 'Web Components']}
              placeholder="Search frameworks"
            />
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="packages" glass>
        <TabsList aria-label="React visual evidence">
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsPanel value="packages">
          <DataTable columns={releaseColumns} rows={releaseRows} />
        </TabsPanel>
        <TabsPanel value="notes">
          <p className="visual-host__note">
            Tabs, calendar navigation, progress updates, and sortable table
            markup are rendered by the published React adapter.
          </p>
        </TabsPanel>
      </Tabs>
    </main>
  )
}
