import Image from 'next/image';
import Link from 'next/link';
import { getPublicPlays } from '@/lib/public-data';

// Force dynamic rendering to ensure on-demand revalidation works
export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const plays = await getPublicPlays();

  return (
    <div className="container-default py-12">
      <h1 className="mb-8 text-3xl font-bold">Theaterstücke</h1>
      {plays.length === 0 && (
        <p className="text-zinc-500">Aktuell keine Theaterstücke vorhanden.</p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {plays.map((event) => (
          <article key={event.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card transition hover:-translate-y-1">
            {event.poster_image && (
              <Image src={event.poster_image} alt={event.title} width={800} height={400} className="h-48 w-full object-cover" />
            )}
            <div className="p-6">
              <h3 className="text-xl font-semibold">{event.title}</h3>
              <p className="mt-2 line-clamp-3 text-zinc-700">{event.description}</p>
              <p className="mt-3 text-sm text-zinc-500">
                {event.performances.length > 0
                  ? `Termine: ${event.performances.map((p) => new Date(p.start_datetime).toLocaleDateString('de-DE')).join(' · ')}`
                  : 'Keine Termine'}
              </p>
              <Link href={`/events/${event.slug}`} className="mt-4 inline-flex font-semibold text-accent transition hover:text-accent/80">Details →</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
