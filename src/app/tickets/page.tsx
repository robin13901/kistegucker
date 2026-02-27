import { ReservationForm } from '@/components/reservation-form';
import { formatDateTime } from '@/lib/date-time';
import { getPublicEvents } from '@/lib/public-data';

export default async function TicketsPage() {
  const events = await getPublicEvents();
  const upcomingEvent = events
    .filter((event) => !event.is_past)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0];

  if (!upcomingEvent) {
    return (
      <div className="container-default py-12">
        <h1 className="text-3xl font-bold">Ticket-Reservierung</h1>
        <p className="mt-3 text-zinc-700">
          Aktuell gibt es keine kommende Aufführung. Sobald eine neue Aufführung feststeht, kannst
          du hier wieder reservieren.
        </p>
      </div>
    );
  }

  return (
    <div className="container-default grid gap-8 py-12 md:grid-cols-[1fr_1.2fr]">
      <section>
        <h1 className="text-3xl font-bold">Ticket-Reservierung</h1>
        <p className="mt-3 text-zinc-700">
          Reserviere deine Plätze einfach online. Du erhältst eine automatische Bestätigung per
          E-Mail.
        </p>
        <p className="mt-2 text-sm text-zinc-600">{formatDateTime(upcomingEvent.event_date, upcomingEvent.performance_time)}</p>
      </section>
      <ReservationForm eventId={upcomingEvent.id} />
    </div>
  );
}
