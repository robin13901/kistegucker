import Link from 'next/link';
import { ReservationForm } from '@/components/reservation-form';
import { formatDateTime } from '@/lib/format';
import { getPublicPlays } from '@/lib/public-data';

export default async function TicketsPage({ searchParams }: { searchParams?: { performance?: string } }) {
  const plays = await getPublicPlays();
  const upcoming = plays.flatMap((play) => play.performances.filter((p) => !p.is_past).map((p) => ({ ...p, playTitle: play.title, playSlug: play.slug })))
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

  const selected = upcoming.find((performance) => performance.id === searchParams?.performance) ?? upcoming[0];

  if (!selected) {
    return (
      <div className="container-default py-12">
        <h1 className="text-3xl font-bold">Ticket-Reservierung</h1>
        <p className="mt-4 text-zinc-600">Aktuell gibt es keine kommenden Aufführungen.</p>
        <Link href="/events" className="mt-4 inline-flex font-semibold text-accent">Zu den Theaterstücken →</Link>
      </div>
    );
  }

  const availableSeats = selected.online_quota - selected.reserved_online_tickets;

  return (
    <div className="container-default grid gap-8 py-12 lg:grid-cols-[1fr_1.2fr]">
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ticket-Reservierung</h1>
          <p className="mt-2 text-lg text-zinc-700">{selected.playTitle}</p>
          <p className="text-zinc-500">{formatDateTime(selected.start_datetime)}</p>
          {selected.venue && <p className="text-sm text-zinc-500">{selected.venue}</p>}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-700">Verfügbare Online-Plätze</p>
          <p className="text-2xl font-bold text-accent">{availableSeats > 0 ? availableSeats : 'Ausgebucht'}</p>
          <p className="text-xs text-zinc-500">von {selected.online_quota} Online-Kontingent</p>
        </div>

        {upcoming.length > 1 && (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">Weitere Termine:</p>
            <div className="space-y-2">
              {upcoming.filter((p) => p.id !== selected.id).slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/tickets?performance=${p.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition hover:border-accent"
                >
                  <span className="font-medium">{p.playTitle}</span>
                  <span className="text-zinc-500"> · {formatDateTime(p.start_datetime)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
      <ReservationForm eventId={selected.id} maxTickets={Math.min(4, availableSeats)} disabled={availableSeats <= 0} />
    </div>
  );
}
