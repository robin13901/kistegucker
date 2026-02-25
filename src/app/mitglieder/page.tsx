import Image from 'next/image';
import { members } from '@/lib/mock-data';

export default function MembersPage() {
  return (
    <div className="container-default py-12">
      <h1 className="mb-8 text-3xl font-bold">Unser Ensemble</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <article key={member.id} className="rounded-2xl bg-white p-5 shadow-card transition hover:-translate-y-1">
            <Image
              src={member.image_url}
              alt={member.name}
              width={600}
              height={600}
              className="h-56 w-full rounded-xl object-cover"
            />
            <h2 className="mt-4 text-xl font-semibold">{member.name}</h2>
            <p className="text-sm font-medium text-accent">{member.role}</p>
            <p className="mt-2 text-sm text-zinc-700">{member.bio}</p>
            <ul className="mt-4 space-y-1 text-sm text-zinc-600">
              {member.played_works.map((work) => (
                <li key={work.title}>
                  • {work.title} ({work.year})
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
