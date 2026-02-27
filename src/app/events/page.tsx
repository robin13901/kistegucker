import Link from 'next/link';
import { getPublicPlays } from '@/lib/public-data';

export default async function EventsPage() {
  const plays = await getPublicPlays();

  return (
    <div className="container-default py-12">
      <h1 className="mb-6 text-3xl font-bold">Theaterstücke</h1>
      <div className="grid gap-5 md:grid-cols-2">
        {plays.map((event) => (
          <article key={event.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
            <div className="p-6">
              <h3 className="mt-2 text-xl font-semibold">{event.title}</h3>
              <p className="mt-2 text-zinc-700">{event.description}</p>
              <p className="mt-2 text-sm text-zinc-500">Termine: {event.performances.map((p) => new Date(p.start_datetime).toLocaleDateString('de-DE')).join(' · ') || '—'}</p>
              <Link href={`/events/${event.slug}`} className="mt-4 inline-flex text-sm font-semibold text-accent">Details →</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
