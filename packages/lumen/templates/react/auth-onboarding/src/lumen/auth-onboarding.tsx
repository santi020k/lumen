import './lumen-template.css'

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Field,
  Grid,
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
    <section className="lumen-login-examples" aria-labelledby="login-examples-title">
      <header>
        <p>Returning members</p>
        <h2 id="login-examples-title">A familiar way back in.</h2>
        <p>Email codes and passkeys, composed with Lumen. These visual examples do not send codes or sign you in.</p>
      </header>
      <Grid className="lumen-login-examples__grid" minItemWidth="18rem">
        <Card className="lumen-login-examples__card">
          <h3>Welcome back</h3>
          <p>Use a saved passkey or receive a code by email.</p>
          <Button disabled type="button">Sign in with a passkey</Button>
          <Field>
            <Label htmlFor="login-email">Email address</Label>
            <Input autoComplete="email" id="login-email" name="login-email" readOnly type="email" value="member@example.com" />
          </Field>
          <Button disabled type="button">Send sign-in code</Button>
          <p>No password to remember.</p>
        </Card>
        <Card className="lumen-login-examples__card">
          <h3>Check your inbox</h3>
          <p>If this address can sign in, a code will arrive shortly.</p>
          <Field>
            <Label htmlFor="login-code">Email code</Label>
            <Input aria-describedby="login-code-hint" autoComplete="one-time-code" id="login-code" inputMode="numeric" name="login-code" placeholder="Enter your code" readOnly />
            <p id="login-code-hint">Paste the complete code from your email.</p>
          </Field>
          <Button disabled type="button">Verify and continue</Button>
          <Button disabled type="button" variant="outline">Resend code</Button>
          <p>Entered the wrong address? Return to email sign-in.</p>
        </Card>
        <Card className="lumen-login-examples__card">
          <h3>Try another way</h3>
          <Alert variant="destructive">Passkey sign-in was canceled. You can try again or request a code by email.</Alert>
          <p>You can still use email when your passkey is unavailable.</p>
          <Button disabled type="button">Try passkey again</Button>
          <Button disabled type="button" variant="outline">Use an email code</Button>
          <p>Your existing account and workspace stay the same.</p>
        </Card>
      </Grid>
    </section>
  </main>
)
