import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDateTime } from '@/lib/date-time';
import { toHourMinute } from '@/lib/format';
import { getPublicEvents } from '@/lib/public-data';

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const events = await getPublicEvents();
  const event = events.find((entry) => entry.slug === params.slug);

  if (!event) notFound();

  const isUpcoming = !event.is_past;
  const load = Math.min((event.reserved_online_tickets / event.online_seat_limit) * 100, 100);

  return (
    <div className="container-default space-y-8 py-12">
      {event.hero_image_url && (
        <Image src={event.hero_image_url} alt={event.title} width={1400} height={788} className="h-64 w-full rounded-2xl object-cover" sizes="100vw" priority />
      )}
      <div>
        <p className="text-sm text-zinc-500">{formatDateTime(event.event_date, event.performance_time)}</p>
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="mt-3 max-w-2xl text-zinc-700">{event.description}</p>
      </div>

      {isUpcoming && (
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="text-xl font-semibold">Ort & Zeit</h2>
          <p className="mt-2 text-zinc-700"><span className="font-semibold">Wann:</span> {formatDateTime(event.event_date, event.performance_time)}</p>
          <p className="mt-1 text-zinc-700"><span className="font-semibold">Einlass:</span> {toHourMinute(event.admission_time)} Uhr</p>
          <p className="mt-1 text-zinc-700"><span className="font-semibold">Wo:</span> {event.venue}</p>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
              <span>Online-Auslastung</span>
              <span>{event.reserved_online_tickets}/{event.online_seat_limit}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-200"><div className="h-2 rounded-full bg-accent" style={{ width: `${load}%` }} /></div>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold">Besetzung</h2>
        <ul className="mt-3 space-y-2">
          {event.cast_entries.map((entry, index) => (
            <li key={`${entry.member_name}-${entry.role}-${index}`} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
              <span className="font-semibold text-accent">{entry.member_name}</span> <span className="text-zinc-500">als</span> <span className="font-semibold text-zinc-900">{entry.role}</span>
            </li>
          ))}
        </ul>
      </section>

      {!isUpcoming && event.gallery.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Bildergalerie</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {event.gallery.map((image) => (
              <Image key={image} src={image} alt={`Szene aus ${event.title}`} width={1200} height={900} className="h-64 w-full rounded-xl object-cover" />
            ))}
          </div>
        </section>
      )}

      {isUpcoming && <Link href="/tickets" className="inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Jetzt reservieren</Link>}
    </div>
  );
}
