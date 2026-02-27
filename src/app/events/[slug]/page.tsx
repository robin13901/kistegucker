import Image from 'next/image';
import Link from 'next/link';
import { formatDateTime } from '@/lib/format';
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
          {play.cast.map((entry, index) => (
            <li key={`${entry.member_name}-${entry.role}-${index}`} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
              <Link href={`/mitglieder#member-${entry.member_id}`} className="font-semibold text-accent">{entry.member_name}</Link>{' '}
              <span className="text-zinc-500">als</span>{' '}
              <span className="font-semibold text-zinc-900">{entry.role}</span>
            </li>))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Aufführungen</h2>
        <div className="mt-2 space-y-2">
          {play.performances.map((performance) => (
            <div key={performance.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-3 text-sm">
              <span>{formatDateTime(performance.start_datetime)}</span>
              {!performance.is_past && <Link href={`/tickets?performance=${performance.id}`} className="font-semibold text-accent">Tickets reservieren →</Link>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
