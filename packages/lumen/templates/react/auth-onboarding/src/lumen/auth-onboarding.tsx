import './lumen-template.css'

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Label,
  Progress,
  Stepper
} from '@santi020k/lumen-react'

export const AuthOnboardingTemplate = () => (
  <main className="lumen-template lumen-template__form-shell">
    <Card className="lumen-template__form">
      <Stepper
        currentStep={1}
        steps={['Account', 'Workspace', 'Preferences', 'Invite']}
      />
      <header>
        <p className="lumen-template__muted">Step 2 of 4</p>
        <h1>Create your workspace</h1>
        <p className="lumen-template__muted">
          We’ll prepare the right starting point.
        </p>
      </header>
      <form className="lumen-template__form">
        <Field className="lumen-template__field">
          <Label htmlFor="workspace-name">Workspace name</Label>
          <Input
            id="workspace-name"
            name="workspace"
            placeholder="Northstar Labs"
            required
          />
        </Field>
        <Field className="lumen-template__field">
          <Label htmlFor="work-email">Work email</Label>
          <Input
            aria-invalid="true"
            id="work-email"
            name="email"
            type="email"
            defaultValue="maya@example"
            required
          />
          <Alert role="alert" variant="destructive">
            Enter a complete email address.
          </Alert>
        </Field>
        <fieldset className="lumen-template__choices">
          <legend>What are you setting up?</legend>
          <label className="lumen-template__choice">
            <input defaultChecked name="intent" type="radio" value="team" />
            {' '}
            A
            team workspace
          </label>
          <label className="lumen-template__choice">
            <input name="intent" type="radio" value="personal" />
            {' '}
            A personal
            workspace
          </label>
        </fieldset>
        <label>
          <Checkbox defaultChecked name="updates" value="updates" />
          {' '}
          Send
          occasional onboarding tips
        </label>
        <div>
          <div className="lumen-template__section-header">
            <span>Setup progress</span>
            <strong>50%</strong>
          </div>
          <Progress aria-label="Setup is 50% complete" value={50} />
        </div>
        <div className="lumen-template__actions">
          <Button variant="ghost">Back</Button>
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </Card>
  </main>
)
