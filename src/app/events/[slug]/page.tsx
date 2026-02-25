import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { events } from '@/lib/mock-data';

export default function EventDetailPage({ params }: { params: { slug: string } }) {
  const event = events.find((entry) => entry.slug === params.slug);

  if (!event) {
    notFound();
  }

  return (
    <div className="container-default space-y-8 py-12">
      <div>
        <p className="text-sm text-zinc-500">
          {event.date} · {event.time} · {event.venue}
        </p>
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="mt-3 max-w-2xl text-zinc-700">{event.description}</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold">Besetzung</h2>
        <ul className="mt-2 list-disc pl-6 text-zinc-700">
          {event.cast.map((actor) => (
            <li key={actor}>{actor}</li>
          ))}
        </ul>
      </section>

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

      <Link href="/tickets" className="inline-flex rounded-xl bg-accent px-5 py-3 font-semibold text-white">
        Ticket reservieren
      </Link>
    </div>
  );
}
