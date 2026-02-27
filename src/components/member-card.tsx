import Image from 'next/image';
import type { ReactNode } from 'react';
import { formatRoles } from '@/lib/format';

type Participation = { piece: string; role: string };

type MemberCardProps = {
  id?: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  clubRoles: string[];
  participations?: Participation[];
  actions?: ReactNode;
};

export function MemberCard({ id, name, description, imageUrl, clubRoles, participations = [], actions }: MemberCardProps) {
  return (
    <article id={id} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-zinc-200 transition hover:-translate-y-1">
      {imageUrl ? (
        <Image src={imageUrl} alt={name} width={800} height={600} className="aspect-[4/3] w-full rounded-xl object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
      ) : (
        <div className="aspect-[4/3] w-full rounded-xl bg-zinc-100" />
      )}
      <div className="mt-4 flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold">{name}</h2>
        {actions}
      </div>
      <p className="text-sm font-medium text-accent">{formatRoles(clubRoles)}</p>
      <p className="mt-2 text-sm text-zinc-700">{description}</p>

      {participations.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-zinc-600">
          {participations.map((participation) => (
            <li key={`${participation.piece}-${participation.role}`}>Mitgespielt in: {participation.piece} — Rolle: {participation.role}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
