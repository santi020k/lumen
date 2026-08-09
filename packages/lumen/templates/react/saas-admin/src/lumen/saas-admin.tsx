import './lumen-template.css'

import {
  Alert,
  Badge,
  Button,
  Card,
  Progress,
  SearchField,
  Sidebar,
  Stat,
  Table
} from '@santi020k/lumen-react'

export const SaasAdminTemplate = () => (
  <div className="lumen-template lumen-template__shell">
    <Sidebar className="lumen-template__sidebar">
      <strong>Orbit Admin</strong>
      <nav aria-label="Administration">
        <a aria-current="page" href="#overview">
          Overview
        </a>
        <a href="#members">Members</a>
        <a href="#billing">Billing</a>
      </nav>
    </Sidebar>
    <main className="lumen-template__main" id="overview">
      <header className="lumen-template__header">
        <div>
          <Badge variant="outline">Workspace administration</Badge>
          <h1>Good morning, Maya</h1>
          <p>Access, billing, and operational health.</p>
        </div>
        <Button>Invite members</Button>
      </header>
      <Alert>
        <strong>Quarterly access review is ready.</strong>
        {' '}
        Confirm eight
        elevated roles before July 12.
      </Alert>
      <section
        className="lumen-template__metrics"
        aria-label="Workspace metrics"
      >
        <Card className="lumen-template__metric">
          <Stat label="Workspace members" value="248" />
          <Badge variant="success">+24</Badge>
        </Card>
        <Card className="lumen-template__metric">
          <Stat label="Seat activation" value="91%" />
          <Badge variant="success">Healthy</Badge>
        </Card>
        <Card className="lumen-template__metric">
          <Stat label="Access reviews" value="8" />
          <Badge variant="warning">3 pending</Badge>
        </Card>
        <Card className="lumen-template__metric">
          <Stat label="Availability" value="99.99%" />
          <Badge variant="success">Normal</Badge>
        </Card>
      </section>
      <section className="lumen-template__grid" id="billing">
        <Card className="lumen-template__panel">
          <h2>Plan utilization</h2>
          <Stat label="Seats used" value="248 / 300" />
          <Progress aria-label="248 of 300 seats used" max={300} value={248} />
        </Card>
        <Card className="lumen-template__panel">
          <h2>Security posture</h2>
          <ul className="lumen-template__list">
            <li>Single sign-on enforced</li>
            <li>Domain verification complete</li>
            <li>3 recovery codes need rotation</li>
          </ul>
        </Card>
      </section>
      <Card className="lumen-template__panel" id="members">
        <div className="lumen-template__section-header">
          <h2>Recently active members</h2>
          <SearchField
            aria-label="Search members"
            placeholder="Search members"
          />
        </div>
        <Table className="lumen-template__table">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Team</th>
                <th>Status</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Amina Bello</td>
                <td>Design</td>
                <td>
                  <Badge variant="success">Active</Badge>
                </td>
                <td>Admin</td>
              </tr>
              <tr>
                <td>Theo Martin</td>
                <td>Success</td>
                <td>
                  <Badge variant="warning">Pending</Badge>
                </td>
                <td>Member</td>
              </tr>
            </tbody>
          </table>
        </Table>
      </Card>
    </main>
  </div>
)
