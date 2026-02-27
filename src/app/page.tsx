import Image from 'next/image';
import { AnimatedSection } from '@/components/animated-section';
import { PlayCard } from '@/components/play-card';
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
              <PlayCard
                key={play.id}
                title={play.title}
                description={play.description}
                posterImage={play.poster_image}
                performances={play.performances}
                slug={play.slug}
                mode="upcoming"
              />
            ))}
          </div>
        </section>
      </AnimatedSection>
      <AnimatedSection>
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Vergangene Aufführungen</h2>
          <div className="space-y-4">
            {pastPlays.map((play) => (
              <PlayCard
                key={play.id}
                title={play.title}
                description={play.description}
                posterImage={play.poster_image}
                performances={play.performances}
                slug={play.slug}
                mode="past"
              />
            ))}
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
