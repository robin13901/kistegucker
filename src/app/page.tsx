import Image from 'next/image';
import Link from 'next/link';
import { AnimatedSection } from '@/components/animated-section';
import { events } from '@/lib/mock-data';

export default function HomePage() {
  const upcoming = events.filter((event) => !event.is_past).slice(0, 2);

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
            <p className="text-lg text-zinc-700">
              Wir bringen modernes Amateurtheater mit Herz, Humor und Haltung auf die Bühne.
            </p>
            <div className="flex gap-3">
              <Link href="/tickets" className="rounded-xl bg-accent px-5 py-3 font-semibold text-white">
                Tickets reservieren
              </Link>
              <Link href="/events" className="rounded-xl border border-zinc-300 px-5 py-3 font-semibold">
                Nächste Aufführungen
              </Link>
            </div>
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
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((event) => (
              <article key={event.id} className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-zinc-500">
                  {event.date} · {event.time} · {event.venue}
                </p>
                <h3 className="mt-2 text-xl font-semibold">{event.title}</h3>
                <p className="mt-2 text-zinc-700">{event.description}</p>
                <Link href={`/events/${event.slug}`} className="mt-4 inline-flex text-sm font-semibold text-accent">
                  Details ansehen →
                </Link>
              </article>
            ))}
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
