import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatDate } from '@/lib/format';

type PlayCardPerformance = {
  id: string;
  start_datetime: string;
  reserved_online_tickets?: number;
  online_quota?: number;
  is_past: boolean;
};

type PlayCardProps = {
  title: string;
  description: string;
  posterImage?: string | null;
  performances: PlayCardPerformance[];
  slug?: string;
  mode: 'upcoming' | 'past';
  actions?: ReactNode;
  showReservationLink?: boolean;
};

export function PlayCard({
  title,
  description,
  posterImage,
  performances,
  slug,
  mode,
  actions,
  showReservationLink = true
}: PlayCardProps) {
  const filteredPerformances = performances.filter((performance) => (mode === 'upcoming' ? !performance.is_past : performance.is_past));

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
      {posterImage && <Image src={posterImage} alt={title} width={1200} height={700} className="h-52 w-full object-cover" />}
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="mt-2 text-xl font-semibold">{title}</h3>
          {actions}
        </div>
        <p className="mt-2 text-zinc-700">{description}</p>

        {mode === 'upcoming' ? (
          <div className="mt-3 space-y-2">
            {filteredPerformances.map((performance) => (
              <div key={performance.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span>{formatDate(performance.start_datetime)}</span>
                <span>{performance.reserved_online_tickets ?? 0}/{performance.online_quota ?? 0}</span>
                {showReservationLink ? <Link href={`/tickets?performance=${performance.id}`} className="font-semibold text-accent">Tickets reservieren →</Link> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">{filteredPerformances.map((performance) => formatDate(performance.start_datetime)).join(' · ') || '—'}</p>
        )}

        {slug ? <Link href={`/events/${slug}`} className={`inline-flex font-semibold text-accent ${mode === 'upcoming' ? 'mt-3' : 'mt-4 text-sm'}`}>Details →</Link> : null}
      </div>
    </article>
  );
}
