import Link from 'next/link';
import { events } from '@/lib/mock-data';

export default function EventsPage() {
  const upcoming = events.filter((event) => !event.is_past);
  const past = events.filter((event) => event.is_past);

  return (
    <div className="container-default space-y-12 py-12">
      <section>
        <h1 className="mb-6 text-3xl font-bold">Events & Aufführungen</h1>
        <div className="space-y-4">
          {upcoming.map((event) => (
            <article key={event.id} className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-sm text-zinc-500">{event.date} · {event.time} · {event.venue}</p>
              <h2 className="mt-1 text-xl font-semibold">{event.title}</h2>
              <p className="mt-2 text-zinc-700">{event.description}</p>
              <div className="mt-3 flex gap-4">
                <Link href={`/events/${event.slug}`} className="font-semibold text-accent">
                  Detailseite
                </Link>
                <Link href="/tickets" className="font-semibold text-zinc-700">
                  Ticket reservieren
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Vergangene Aufführungen</h2>
        <div className="space-y-4">
          {past.map((event) => (
            <article key={event.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-sm text-zinc-500">{event.date} · {event.venue}</p>
              <h3 className="text-lg font-semibold">{event.title}</h3>
              <p className="text-zinc-700">{event.description}</p>
              <Link href={`/events/${event.slug}`} className="mt-2 inline-flex font-semibold text-accent">
                Zur Galerie & Besetzung
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
