import {
  Agenda,
  Calendar,
  DatePicker,
  Schedule,
  useSchedule
} from '@santi020k/lumen-react'

export const SchedulerRecipe = () => {
  const schedule = useSchedule()

  return (
    <section className="lumen-recipe lumen-recipe--scheduler">
      <Calendar aria-label="Choose schedule date" />
      <DatePicker aria-label="Jump to date" />
      <Schedule>
        <header><h2>Launch week</h2></header>
        <div data-ui-schedule-grid>
          <section {...schedule.getSlotProps('monday')}>
            <article {...schedule.getEventProps('schedule-planning')}>Planning</article>
          </section>
          <section {...schedule.getSlotProps('friday')}>
            <article {...schedule.getEventProps('schedule-ship')}>Ship</article>
          </section>
        </div>
      </Schedule>
      <Agenda>
        <ol>
          <li><strong>Design review</strong><span>10:00</span></li>
          <li><strong>Release notes</strong><span>14:30</span></li>
        </ol>
      </Agenda>
    </section>
  )
}
