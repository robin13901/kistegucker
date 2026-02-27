import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicPlays } from '@/lib/public-data';

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const plays = await getPublicPlays();
  const play = plays.find((entry) => entry.slug === params.slug);
  if (!play) notFound();

  return (
    <div className="container-default space-y-6 py-12">
      {play.poster_image ? <Image src={play.poster_image} alt={play.title} width={1400} height={900} className="h-64 w-full rounded-2xl object-cover" /> : null}
      <h1 className="text-3xl font-bold">{play.title}</h1>
      <p className="max-w-3xl text-zinc-700">{play.description}</p>

      <section>
        <h2 className="text-xl font-semibold">Besetzung</h2>
        <ul className="mt-2 grid gap-2 md:grid-cols-2">
          {play.cast.map((entry) => (
            <li key={`${entry.member_id}-${entry.role}`} className="rounded-lg border bg-white px-3 py-2 text-sm"><span className="font-semibold">{entry.member_name}</span> — {entry.role}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Aufführungen</h2>
        <div className="mt-2 space-y-2">
          {play.performances.map((performance) => (
            <div key={performance.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-3 text-sm">
              <span>{new Date(performance.start_datetime).toLocaleString('de-DE')}</span>
              <span>Kapazität: {performance.capacity}</span>
              <span>Online: {performance.reserved_online_tickets}/{performance.online_quota}</span>
              {!performance.is_past && <Link href={`/tickets?performance=${performance.id}`} className="font-semibold text-accent">Reservieren</Link>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
