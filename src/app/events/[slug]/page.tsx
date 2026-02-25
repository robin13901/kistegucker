import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDateTime } from '@/lib/date-time';
import { events } from '@/lib/mock-data';

const UPCOMING_LOCATION = 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)';

export default function EventDetailPage({ params }: { params: { slug: string } }) {
  const event = events.find((entry) => entry.slug === params.slug);

  if (!event) {
    notFound();
  }

  const isUpcoming = !event.is_past;

  return (
    <div className="container-default space-y-8 py-12">
      <div>
        <p className="text-sm text-zinc-500">
           {formatDateTime(event.date, event.time)}
        </p>
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="mt-3 max-w-2xl text-zinc-700">{event.description}</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold">Besetzung</h2>
         <ul className="mt-3 space-y-2">
          {event.cast.map((entry) => (
            <li key={`${entry.member_id}-${entry.role}`} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
              <Link href={`/mitglieder#member-${entry.member_id}`} className="font-semibold text-accent">
                {entry.actor}
              </Link>{' '}
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
            <span className="font-semibold">Wann:</span> {formatDateTime(event.date, event.time)}
          </p>
          <p className="mt-1 text-zinc-700">
            <span className="font-semibold">Wo:</span> {UPCOMING_LOCATION}
          </p>
        </section>
      )}

      {!isUpcoming && (
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
