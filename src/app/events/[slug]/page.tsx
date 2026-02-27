import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDateTime } from '@/lib/date-time';
import { getPublicEvents } from '@/lib/public-data';

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const events = await getPublicEvents();
  const event = events.find((entry) => entry.slug === params.slug);

  if (!event) {
    notFound();
  }

  const isUpcoming = !event.is_past;

  return (
    <div className="container-default space-y-8 py-12">
      <div>
        <p className="text-sm text-zinc-500">
          {formatDateTime(event.event_date, event.performance_time)}
        </p>
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="mt-3 max-w-2xl text-zinc-700">{event.description}</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold">Besetzung</h2>
         <ul className="mt-3 space-y-2">
          {event.cast_entries.map((entry, index) => (
            <li key={`${entry.member_name}-${entry.role}-${index}`} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
              <span className="font-semibold text-accent">{entry.member_name}</span>{' '}
              <span className="text-zinc-500">als</span>{' '}
              <span className="font-semibold text-zinc-900">{entry.role}</span>
            </li>
          ))}
        </ul>
      </section>

      {isUpcoming && (
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="text-xl font-semibold">Ort & Zeit</h2>
          <p className="mt-2 text-zinc-700">
            <span className="font-semibold">Wann:</span> {formatDateTime(event.event_date, event.performance_time)}
          </p>
          <p className="mt-1 text-zinc-700">
            <span className="font-semibold">Einlass:</span> {event.admission_time} Uhr
          </p>
          <p className="mt-1 text-zinc-700">
            <span className="font-semibold">Wo:</span> {event.venue}
          </p>
        </section>
      )}

      {!isUpcoming && event.gallery.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Bildergalerie</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {event.gallery.map((image) => (
              <Image
                key={image}
                src={image}
                alt={`Szene aus ${event.title}`}
                width={1200}
                height={900}
                className="h-64 w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </section>
      )}

      {isUpcoming && (
        <Link href="/tickets" className="inline-flex rounded-xl bg-accent px-5 py-3 font-semibold text-white">
          Tickets reservieren
        </Link>
      )}
    </div>
  );
}
