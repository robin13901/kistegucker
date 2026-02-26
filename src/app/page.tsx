import Image from 'next/image';
import Link from 'next/link';
import { AnimatedSection } from '@/components/animated-section';
import { formatDateTime } from '@/lib/date-time';
import { events } from '@/lib/mock-data';

export default function HomePage() {
  const upcoming = events.find((event) => !event.is_past);
  const past = events
    .filter((event) => event.is_past)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container-default space-y-16 py-12">
      <AnimatedSection>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
              Theaterverein Linsengericht
            </span>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Bühne frei für <span className="text-accent">Die Kistegucker</span>
            </h1>
            <p className="text-lg text-zinc-700">
              Wir bringen modernes Amateurtheater mit Herz, Humor und Haltung auf die Bühne.
            </p>
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
            <article className="rounded-2xl bg-white p-6 shadow-card">
              <p className="text-sm text-zinc-500">{formatDateTime(upcoming.date, upcoming.performance_time)}</p>
              <h3 className="mt-2 text-xl font-semibold">{upcoming.title}</h3>
              <p className="mt-2 text-zinc-700">{upcoming.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Link href="/tickets" className="inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
                  Tickets reservieren
                </Link>
                <Link href={`/events/${upcoming.slug}`} className="inline-flex text-sm font-semibold text-accent">
                  Details →
                </Link>
              </div>
            </article>
          </section>
        </AnimatedSection>
      )}

      <AnimatedSection>
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Vergangene Aufführungen</h2>
          <div className="space-y-4">
            {past.map((event) => (
              <article key={event.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card">
                <p className="text-sm text-zinc-500">{formatDateTime(event.date, event.performance_time)}</p>
                <h3 className="mt-2 text-xl font-semibold">{event.title}</h3>
                <p className="mt-2 text-zinc-700">{event.description}</p>
                <Link href={`/events/${event.slug}`} className="mt-4 inline-flex text-sm font-semibold text-accent">
                  Details →
                </Link>
              </article>
            ))}
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
