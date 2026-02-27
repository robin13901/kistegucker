import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/format';
import { AnimatedSection } from '@/components/animated-section';
import { getPublicPlays } from '@/lib/public-data';

export default async function HomePage() {
  const plays = await getPublicPlays();
  const upcomingPlays = plays.filter((play) => play.performances.some((p) => !p.is_past));
  const pastPlays = plays.filter((play) => play.performances.some((p) => p.is_past));

  return (
    <div className="container-default space-y-12 py-12">
      <AnimatedSection>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
              Theaterverein Linsengericht
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
      <AnimatedSection>
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Demnächst bei uns</h2>
          <div className="space-y-4">
            {upcomingPlays.map((play) => (
              <article key={play.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
                {play.poster_image && <Image src={play.poster_image} alt={play.title} width={1200} height={700} className="h-52 w-full object-cover" />}
                <div className="p-6">
                  <h3 className="mt-2 text-xl font-semibold">{play.title}</h3>
                  <p className="mt-2 text-zinc-700">{play.description}</p>
                  <div className="mt-3 space-y-2">
                    {play.performances.filter((p) => !p.is_past).map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                        <span>{formatDate(p.start_datetime)}</span>
                        <span>{p.reserved_online_tickets}/{p.online_quota}</span>
                        <Link href={`/tickets?performance=${p.id}`} className="font-semibold text-accent">Tickets reservieren →</Link>
                      </div>
                    ))}
                  </div>
                  <Link href={`/events/${play.slug}`} className="mt-3 inline-flex font-semibold text-accent">Details →</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </AnimatedSection>
      <AnimatedSection>
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Vergangene Aufführungen</h2>
          <div className="space-y-4">
            {pastPlays.map((play) => (
              <article key={play.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
                {play.poster_image && <Image src={play.poster_image} alt={play.title} width={1200} height={700} className="h-52 w-full object-cover" />}
                <div className="p-6">
                  <h3 className="mt-2 text-xl font-semibold">{play.title}</h3>
                  <p className="mt-2 text-zinc-700">{play.description}</p>
                  <p className="mt-2 text-sm text-zinc-500">{play.performances.map((p) => formatDate(p.start_datetime)).join(' · ') || '—'}</p>
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
