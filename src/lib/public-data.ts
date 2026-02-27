import { unstable_cache } from 'next/cache';
import { getSupabaseClient } from '@/lib/supabase';

export type PublicPerformance = {
  id: string;
  start_datetime: string;
  doors_datetime: string | null;
  venue: string;
  capacity: number;
  online_quota: number;
  reserved_online_tickets: number;
  gallery: string[];
  is_past: boolean;
};

export type PublicPlay = {
  id: string;
  slug: string;
  title: string;
  description: string;
  poster_image: string | null;
  performances: PublicPerformance[];
  cast: Array<{ member_id: string; member_name: string; role: string }>;
};

export type PublicMember = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  club_roles: string[];
  participations: Array<{ piece: string; role: string }>;
};

type PlayCastRow = { role: string; member: { id: string; name: string } | Array<{ id: string; name: string }> };
type PlayRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  poster_image: string | null;
  performances: Array<Omit<PublicPerformance, 'is_past'>>;
  play_cast: PlayCastRow[];
};

type MemberCastRow = { member_id: string; role: string; play: { title: string } | Array<{ title: string }> };

const loadPublicPlays = unstable_cache(async (): Promise<PublicPlay[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('plays')
    .select('id,slug,title,description,poster_image,performances(*),play_cast(role,member:members(id,name))')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return (data as PlayRow[]).map((play) => ({
    id: play.id,
    slug: play.slug,
    title: play.title,
    description: play.description,
    poster_image: play.poster_image,
    performances: (play.performances ?? [])
      .map((performance) => ({ ...performance, is_past: new Date(performance.start_datetime).getTime() < Date.now() }))
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()),
    cast: (play.play_cast ?? [])
      .map((entry) => ({
        role: entry.role,
        member_id: Array.isArray(entry.member) ? entry.member[0]?.id : entry.member?.id,
        member_name: Array.isArray(entry.member) ? entry.member[0]?.name : entry.member?.name
      }))
      .filter((entry) => entry.member_id && entry.member_name)
      .map((entry) => ({ ...entry, member_id: entry.member_id as string, member_name: entry.member_name as string }))
  }));
}, ['public-plays'], { revalidate: 120 });

const loadPublicMembers = unstable_cache(async (): Promise<PublicMember[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const [{ data: members }, { data: castData }] = await Promise.all([
    supabase.from('members').select('*').order('name', { ascending: true }),
    supabase.from('play_cast').select('role,play:plays(title),member_id')
  ]);

  const castByMember = new Map<string, Array<{ piece: string; role: string }>>();
  (castData as MemberCastRow[] | null ?? []).forEach((entry) => {
    const piece = Array.isArray(entry.play) ? entry.play[0]?.title : entry.play?.title;
    if (!entry.member_id || !piece) return;
    const current = castByMember.get(entry.member_id) ?? [];
    if (!current.some((item) => item.piece === piece && item.role === entry.role)) current.push({ piece, role: entry.role });
    castByMember.set(entry.member_id, current);
  });

  return (members ?? []).map((member) => ({ ...member, participations: castByMember.get(member.id) ?? [] }));
}, ['public-members'], { revalidate: 120 });

export async function getPublicPlays(): Promise<PublicPlay[]> {
  return await loadPublicPlays();
}

export async function getPublicMembers(): Promise<PublicMember[]> {
  return await loadPublicMembers();
}
