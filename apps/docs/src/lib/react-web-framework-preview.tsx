import { useState } from 'react'

import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger
} from '@santi020k/lumen-react'

export const ReactWebFrameworkPreview = () => {
  const [progress, setProgress] = useState(68)

  return (
    <div className="web-framework-preview__surface" data-framework-runtime="react">
      <div className="web-framework-preview__heading">
        <div>
          <Badge variant="secondary">React 19</Badge>
          <h2>Launch workspace</h2>
          <p>Your next release, coming together.</p>
        </div>
        <Button
          onClick={() => {
            setProgress(value => value >= 96 ? 32 : value + 8)
          }}
        >
          Advance
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Release readiness</CardTitle>
          <CardDescription>Move your release forward. Hit Advance to see progress and feedback update.</CardDescription>
        </CardHeader>
        <CardContent className="web-framework-preview__stack">
          <Progress aria-label="React web readiness" value={progress} />
          <Alert variant={progress >= 92 ? 'success' : 'default'}>
            {progress >= 92 ? 'Ready for review.' : `${progress}% verified`}
          </Alert>
        </CardContent>
      </Card>
      <Tabs defaultValue="behavior">
        <TabsList aria-label="React playground details">
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>
        <TabsPanel value="behavior">
          Keyboard navigation, focus, and state run through React components.
        </TabsPanel>
        <TabsPanel value="delivery">
          Import only the primitives needed by the application.
        </TabsPanel>
      </Tabs>
    </div>
  )
}
