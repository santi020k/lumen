import { useId, useState } from 'react'

import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Field, Input, Label, Stack } from '@santi020k/lumen-react'

export default function NotificationPreferences() {
  const id = useId()
  const [email, setEmail] = useState('ada@example.com')
  const [details, setDetails] = useState(false)
  const [savedEmail, setSavedEmail] = useState<string | null>(null)

  return (
    <Card as="section" aria-labelledby={`${id}-title`}>
      <CardHeader>
        <CardTitle as="h2" id={`${id}-title`}>Notification preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={event => {
          event.preventDefault()

          setSavedEmail(email)
        }}
        >
          <Stack gap="group">
            <Field>
              <Label htmlFor={`${id}-email`}>Email address</Label>
              <Input
                id={`${id}-email`}
                name="email"
                required
                type="email"
                value={email}
                onChange={event => {
                  setEmail(event.target.value)

                  setSavedEmail(null)
                }}
              />
            </Field>
            <Stack direction="horizontal" gap="related" wrap>
              <Button
                aria-controls={`${id}-details`}
                aria-expanded={details}
                onClick={() => {
                  setDetails(!details)
                }}
                type="button"
                variant="outline"
              >
                Show delivery details
              </Button>
              <Button type="submit">Save preferences</Button>
            </Stack>
            <p hidden={!details} id={`${id}-details`}>Weekly summaries arrive on Monday.</p>
            <Alert hidden={savedEmail === null} role="status" variant="success">
              {savedEmail === null ? '' : `Preferences saved for ${savedEmail}.`}
            </Alert>
          </Stack>
        </form>
      </CardContent>
    </Card>
  )
}
