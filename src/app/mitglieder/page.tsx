import { MemberCard } from '@/components/member-card';
import { getPublicMembers } from '@/lib/public-data';

// Force dynamic rendering to ensure on-demand revalidation works
export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const members = await getPublicMembers();

  return (
    <div className="container-default py-12">
      <h1 className="mb-8 text-3xl font-bold">Unser Ensemble</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            id={`member-${member.id}`}
            name={member.name}
            description={member.description}
            imageUrl={member.image_url}
            clubRoles={member.club_roles}
            participations={member.participations}
          />
        ))}
      </div>
    </div>
  );
}
