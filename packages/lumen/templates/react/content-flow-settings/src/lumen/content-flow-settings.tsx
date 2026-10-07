import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Field, Input, Label, Stack } from '@santi020k/lumen-react'

export const ContentFlowSettingsRecipe = () => (
  <Card as="section" aria-labelledby="notification-heading">
    <CardHeader>
      <CardTitle as="h2" id="notification-heading">Notifications</CardTitle>
      <CardDescription>Choose where your team receives updates.</CardDescription>
    </CardHeader>
    <CardContent>
      <Stack gap="group">
        <Field>
          <Label htmlFor="team-name">Team name</Label>
          <Input id="team-name" name="team" autoComplete="organization" />
        </Field>
        <Field>
          <Label htmlFor="team-email">Team email</Label>
          <Input id="team-email" name="email" type="email" autoComplete="email" />
        </Field>
      </Stack>
    </CardContent>
    <CardFooter>
      <Button>Save preferences</Button>
      <Button variant="secondary">Discard changes</Button>
    </CardFooter>
  </Card>
)
