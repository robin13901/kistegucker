import Link from 'next/link';
import { getPublicPlays } from '@/lib/public-data';

export default async function EventsPage() {
  const plays = await getPublicPlays();

  return (
    <div className="container-default py-12">
      <h1 className="mb-6 text-3xl font-bold">Theaterstücke</h1>
      <div className="grid gap-5 md:grid-cols-2">
        {plays.map((play) => (
          <article key={play.id} className="rounded-2xl border bg-white p-5 shadow-card">
            <h2 className="text-xl font-semibold">{play.title}</h2>
            <p className="mt-2 text-zinc-700">{play.description}</p>
            <p className="mt-2 text-sm text-zinc-500">Termine: {play.performances.map((p) => new Date(p.start_datetime).toLocaleDateString('de-DE')).join(' · ') || '—'}</p>
            <Link href={`/events/${play.slug}`} className="mt-3 inline-flex font-semibold text-accent">Details</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
