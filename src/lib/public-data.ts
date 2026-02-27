import { unstable_noStore as noStore } from 'next/cache';
import { getSupabaseClient } from '@/lib/supabase';
import { isPastEvent } from '@/lib/date-time';

type CastEntry = { member_name: string; role: string; member_id?: string };

type Participation = { piece: string; role: string };

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  event_date: string;
  performance_time: string;
  admission_time: string;
  venue: string;
  hero_image_url: string | null;
  cast_entries: CastEntry[];
  gallery: string[];
  total_seats: number;
  online_seat_limit: number;
  reserved_online_tickets: number;
  is_past: boolean;
};

export type PublicMember = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  club_roles: string[];
  participations: Participation[];
};

export async function getPublicEvents(): Promise<PublicEvent[]> {
  noStore();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('performance_time', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((event) => ({
    ...event,
    is_past: isPastEvent(event.event_date, event.performance_time)
  }));
}

export async function getPublicMembers(): Promise<PublicMember[]> {
  noStore();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.from('members').select('*').order('name', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}
