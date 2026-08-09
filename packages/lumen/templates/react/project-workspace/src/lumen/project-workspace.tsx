import './lumen-template.css'

import {
  Badge,
  Button,
  Card,
  Progress,
  Sidebar,
  Stat,
  Table,
  Timeline,
  TimelineItem
} from '@santi020k/lumen-react'

export const ProjectWorkspaceTemplate = () => (
  <div className="lumen-template lumen-template__shell">
    <Sidebar className="lumen-template__sidebar">
      <strong>Relay Projects</strong>
      <nav aria-label="Projects">
        <a aria-current="page" href="#overview">
          Overview
        </a>
        <a href="#projects">Projects</a>
        <a href="#activity">Activity</a>
      </nav>
    </Sidebar>
    <main className="lumen-template__main" id="overview">
      <header className="lumen-template__header">
        <div>
          <Badge variant="outline">Team delivery</Badge>
          <h1>Team workspace</h1>
          <p>Priorities, delivery health, and next decisions.</p>
        </div>
        <Button>New project</Button>
      </header>
      <section
        className="lumen-template__metrics"
        aria-label="Delivery metrics"
      >
        <Card className="lumen-template__metric">
          <Stat label="Open tasks" value="42" />
          <Badge variant="warning">6 due soon</Badge>
        </Card>
        <Card className="lumen-template__metric">
          <Stat label="Milestones reached" value="18" />
          <Badge variant="success">+4</Badge>
        </Card>
        <Card className="lumen-template__metric">
          <Stat label="At-risk projects" value="2" />
          <Badge variant="destructive">Needs help</Badge>
        </Card>
        <Card className="lumen-template__metric">
          <Stat label="Delivery velocity" value="46 pts" />
          <Badge variant="success">+6.4%</Badge>
        </Card>
      </section>
      <section className="lumen-template__grid">
        <Card className="lumen-template__panel">
          <h2>Active workstreams</h2>
          <p>Mobile checkout · 72%</p>
          <Progress aria-label="Mobile checkout is 72% complete" value={72} />
          <p>Billing migration · 54%</p>
          <Progress aria-label="Billing migration is 54% complete" value={54} />
        </Card>
        <Card className="lumen-template__panel" id="activity">
          <h2>Recent activity</h2>
          <Timeline>
            <TimelineItem>Amina completed checkout validation</TimelineItem>
            <TimelineItem>Jon reviewed billing retries</TimelineItem>
            <TimelineItem>Nora moved tokens to review</TimelineItem>
          </Timeline>
        </Card>
      </section>
      <Card className="lumen-template__panel" id="projects">
        <div className="lumen-template__section-header">
          <h2>Priority projects</h2>
          <Button variant="ghost">View all</Button>
        </div>
        <Table className="lumen-template__table">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mobile checkout</td>
                <td>Amina</td>
                <td>
                  <Badge variant="success">Active</Badge>
                </td>
                <td>72%</td>
              </tr>
              <tr>
                <td>Billing migration</td>
                <td>Jon</td>
                <td>
                  <Badge variant="destructive">At risk</Badge>
                </td>
                <td>54%</td>
              </tr>
            </tbody>
          </table>
        </Table>
      </Card>
    </main>
  </div>
)
