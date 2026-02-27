import Image from 'next/image';
import Link from 'next/link';
import { AnimatedSection } from '@/components/animated-section';
import { getPublicPlays } from '@/lib/public-data';

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}

export default async function HomePage() {
  const plays = await getPublicPlays();

  const upcomingPerformances = plays
    .flatMap((play) => play.performances.filter((p) => !p.is_past).map((performance) => ({ play, performance })))
    .sort((a, b) => new Date(a.performance.start_datetime).getTime() - new Date(b.performance.start_datetime).getTime());

  const pastPerformances = plays
    .flatMap((play) => play.performances.filter((p) => p.is_past).map((performance) => ({ play, performance })))
    .sort((a, b) => new Date(b.performance.start_datetime).getTime() - new Date(a.performance.start_datetime).getTime());

  const upcoming = upcomingPerformances[0];

  return (
    <div className="container-default space-y-16 py-12">
      <AnimatedSection>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
              Theaterverein aus Linsengericht
            </span>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Bühne frei für <span className="text-accent">Die Kistegucker</span>
            </h1>
            <p className="text-lg text-zinc-700">Wir bringen modernes Amateurtheater mit Herz, Humor und Haltung auf die Bühne.</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl shadow-card">
            <Image
              src="https://images.unsplash.com/photo-1507924538820-ede94a04019d?auto=format&fit=crop&w=1400&q=80"
              alt="Theaterbühne mit Spotlights"
              width={1200}
              height={900}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </div>
      </AnimatedSection>

      {upcoming && (
        <AnimatedSection>
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Demnächst bei uns</h2>
            <article className="overflow-hidden rounded-2xl bg-white shadow-card">
              {upcoming.play.poster_image && (
                <Image src={upcoming.play.poster_image} alt={upcoming.play.title} width={1200} height={700} className="h-60 w-full object-cover" />
              )}
              <div className="p-6">
                <p className="text-sm text-zinc-500">{formatDateTime(upcoming.performance.start_datetime)}</p>
                <h3 className="mt-2 text-xl font-semibold">{upcoming.play.title}</h3>
                <p className="mt-2 text-zinc-700">{upcoming.play.description}</p>
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                    <span>Online-Auslastung</span>
                    <span>{upcoming.performance.reserved_online_tickets}/{upcoming.performance.online_quota}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${Math.min((upcoming.performance.reserved_online_tickets / upcoming.performance.online_quota) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <Link href={`/tickets?performance=${upcoming.performance.id}`} className="inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Tickets reservieren</Link>
                  <Link href={`/events/${upcoming.play.slug}`} className="inline-flex text-sm font-semibold text-accent">Details →</Link>
                </div>
              </div>
            </article>
          </section>
        </AnimatedSection>
      )}

      <AnimatedSection>
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Vergangene Aufführungen</h2>
          <div className="space-y-4">
            {pastPerformances.map(({ play, performance }) => (
              <article key={performance.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
                {play.poster_image && <Image src={play.poster_image} alt={play.title} width={1200} height={700} className="h-52 w-full object-cover" />}
                <div className="p-6">
                  <p className="text-sm text-zinc-500">{formatDateTime(performance.start_datetime)}</p>
                  <h3 className="mt-2 text-xl font-semibold">{play.title}</h3>
                  <p className="mt-2 text-zinc-700">{play.description}</p>
                  <Link href={`/events/${play.slug}`} className="mt-4 inline-flex text-sm font-semibold text-accent">Details →</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
