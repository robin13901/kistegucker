import Image from 'next/image';
import Link from 'next/link';
import { formatDateTime } from '@/lib/date-time';
import { getPublicEvents } from '@/lib/public-data';

export default async function EventsPage() {
  const events = await getPublicEvents();
  const upcoming = events
    .filter((event) => !event.is_past)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  const past = events
    .filter((event) => event.is_past)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  return (
    <div className="container-default space-y-12 py-12">
      <section>
        <h1 className="mb-6 text-3xl font-bold">Aufführungen</h1>
        <div className="space-y-4">
          {upcoming.map((event) => (
            <article key={event.id} className="overflow-hidden rounded-2xl bg-white shadow-card">
              {event.hero_image_url && <Image src={event.hero_image_url} alt={event.title} width={1200} height={700} className="h-56 w-full object-cover" />}
              <div className="p-6">
                <p className="text-sm text-zinc-500">{formatDateTime(event.event_date, event.performance_time)}</p>
                <h2 className="mt-1 text-xl font-semibold">{event.title}</h2>
                <p className="mt-2 text-zinc-700">{event.description}</p>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                    <span>Online-Auslastung</span>
                    <span>{event.reserved_online_tickets}/{event.online_seat_limit}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min((event.reserved_online_tickets / event.online_seat_limit) * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="mt-3 flex gap-4">
                  <Link href={`/events/${event.slug}`} className="font-semibold text-accent">Detailseite</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Vergangene Aufführungen</h2>
        <div className="space-y-4">
          {past.map((event) => (
            <article key={event.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
              {event.hero_image_url && <Image src={event.hero_image_url} alt={event.title} width={1200} height={700} className="h-52 w-full object-cover" />}
              <div className="p-6">
                <p className="text-sm text-zinc-500">{formatDateTime(event.event_date, event.performance_time)}</p>
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <p className="text-zinc-700">{event.description}</p>
                <Link href={`/events/${event.slug}`} className="mt-2 inline-flex font-semibold text-accent">Zur Galerie & Besetzung</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
