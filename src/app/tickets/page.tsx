import { ReservationForm } from '@/components/reservation-form';
import { formatDateTime } from '@/lib/format';
import { getPublicPlays } from '@/lib/public-data';

export default async function TicketsPage({ searchParams }: { searchParams?: { performance?: string } }) {
  const plays = await getPublicPlays();
  const upcoming = plays.flatMap((play) => play.performances.filter((p) => !p.is_past).map((p) => ({ ...p, playTitle: play.title })))
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

  const selected = upcoming.find((performance) => performance.id === searchParams?.performance) ?? upcoming[0];

  if (!selected) return <div className="container-default py-12">Aktuell keine kommende Aufführung.</div>;

  return (
    <div className="container-default grid gap-8 py-12 md:grid-cols-[1fr_1.2fr]">
      <section>
        <h1 className="text-3xl font-bold">Ticket-Reservierung</h1>
        <p className="mt-2 text-zinc-700">{selected.playTitle} · {formatDateTime(selected.start_datetime)}</p>
      </section>
      <ReservationForm eventId={selected.id} />
    </div>
  );
}
