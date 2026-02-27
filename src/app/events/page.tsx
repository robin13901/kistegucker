import Link from 'next/link';
import { getPublicPlays } from '@/lib/public-data';

export default async function EventsPage() {
  const plays = await getPublicPlays();

  const upcoming = plays
    .filter((play) => play.performances.some((p) => !p.is_past))
    .sort((a, b) => {
      const aDate = new Date(a.performances.find((p) => !p.is_past)?.start_datetime ?? '9999-01-01').getTime();
      const bDate = new Date(b.performances.find((p) => !p.is_past)?.start_datetime ?? '9999-01-01').getTime();
      return aDate - bDate;
    });

  const past = plays
    .filter((play) => play.performances.every((p) => p.is_past))
    .sort((a, b) => {
      const aDate = new Date(a.performances.at(-1)?.start_datetime ?? '1970-01-01').getTime();
      const bDate = new Date(b.performances.at(-1)?.start_datetime ?? '1970-01-01').getTime();
      return bDate - aDate;
    });

  return (
    <div className="container-default space-y-12 py-12">
      <section>
        <h1 className="mb-6 text-3xl font-bold">Aufführungen</h1>
        <div className="space-y-4">
          {upcoming.map((play) => (
            <article key={play.id} className="overflow-hidden rounded-2xl bg-white shadow-card">
              {play.poster_image && <Image src={play.poster_image} alt={play.title} width={1200} height={700} className="h-56 w-full object-cover" sizes="100vw" />}
              <div className="p-6">
                <p className="text-sm text-zinc-500">{play.performances.filter((p) => !p.is_past).map((p) => new Date(p.start_datetime).toLocaleDateString('de-DE')).join(' · ')}</p>
                <h2 className="mt-1 text-xl font-semibold">{play.title}</h2>
                <p className="mt-2 text-zinc-700">{play.description}</p>
                <div className="mt-3 flex gap-4">
                  <Link href={`/events/${play.slug}`} className="font-semibold text-accent">Detailseite</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Vergangene Aufführungen</h2>
        <div className="space-y-4">
          {past.map((play) => (
            <article key={play.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
              {play.poster_image && <Image src={play.poster_image} alt={play.title} width={1200} height={700} className="h-52 w-full object-cover" sizes="100vw" />}
              <div className="p-6">
                <p className="text-sm text-zinc-500">{play.performances.map((p) => new Date(p.start_datetime).toLocaleDateString('de-DE')).join(' · ')}</p>
                <h3 className="text-lg font-semibold">{play.title}</h3>
                <p className="text-zinc-700">{play.description}</p>
                <Link href={`/events/${play.slug}`} className="mt-2 inline-flex font-semibold text-accent">Zur Galerie & Besetzung</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
