import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { slugify } from '@/lib/format';

const DEFAULT_VENUE = 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)';

type CastEntry = { member_name: string; role: string };
type PerformancePayload = {
  id?: string;
  event_date: string;
  performance_time: string;
  admission_time: string;
  total_seats: number;
  online_seat_limit: number;
  venue?: string;
};

function parseDateTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

async function ensurePlay(admin: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>, title: string, description: string, posterImage?: string) {
  const slug = slugify(title);
  const { data: existing } = await admin.supabase.from('plays').select('*').eq('slug', slug).maybeSingle();
  if (existing) {
    const { data } = await admin.supabase
      .from('plays')
      .update({ title, description, poster_image: posterImage ?? null, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('*')
      .single();
    return data;
  }
  const { data } = await admin.supabase.from('plays').insert({ title, description, poster_image: posterImage ?? null, slug }).select('*').single();
  return data;
}

async function syncCast(admin: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>, playId: string, castEntries: CastEntry[]) {
  await admin.supabase.from('play_cast').delete().eq('play_id', playId);
  const { data: members } = await admin.supabase.from('members').select('id,name');
  const memberByName = new Map((members ?? []).map((member) => [member.name, member.id]));
  const payload = castEntries
    .filter((entry) => entry.member_name && entry.role)
    .map((entry) => ({ play_id: playId, member_id: memberByName.get(entry.member_name), role: entry.role }))
    .filter((entry) => entry.member_id);

  if (payload.length > 0) await admin.supabase.from('play_cast').insert(payload as Array<{ play_id: string; member_id: string; role: string }>);
}

function mapPerformancePayload(playId: string, performance: PerformancePayload, fallbackVenue: string) {
  return {
    play_id: playId,
    start_datetime: parseDateTime(String(performance.event_date ?? ''), String(performance.performance_time ?? '00:00')),
    doors_datetime: performance.admission_time ? parseDateTime(String(performance.event_date ?? ''), String(performance.admission_time)) : null,
    venue: String(performance.venue ?? '') || fallbackVenue || DEFAULT_VENUE,
    capacity: Number(performance.total_seats ?? 0),
    online_quota: Number(performance.online_seat_limit ?? 0)
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });

  const { data, error } = await admin.supabase
    .from('plays')
    .select('id,slug,title,description,poster_image,performances(id,start_datetime,doors_datetime,venue,capacity,online_quota,reserved_online_tickets),play_cast(role,member:members(name))')
    .order('title', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const mapped = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    hero_image_url: row.poster_image,
    cast_entries: (row.play_cast ?? []).map((entry: { role: string; member: { name: string } | Array<{ name: string }> }) => ({
      role: entry.role,
      member_name: Array.isArray(entry.member) ? entry.member[0]?.name : entry.member?.name
    })),
    performances: (row.performances ?? [])
      .map((performance) => ({
        id: performance.id,
        event_date: performance.start_datetime.slice(0, 10),
        performance_time: performance.start_datetime.slice(11, 16),
        admission_time: performance.doors_datetime?.slice(11, 16) ?? '',
        venue: performance.venue,
        total_seats: performance.capacity,
        online_seat_limit: performance.online_quota,
        reserved_online_tickets: performance.reserved_online_tickets
      }))
      .sort((a, b) => `${a.event_date}T${a.performance_time}`.localeCompare(`${b.event_date}T${b.performance_time}`))
  }));

  return NextResponse.json({ data: mapped });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
  const body = await request.json();

  const play = await ensurePlay(admin, String(body.title ?? ''), String(body.description ?? ''), String(body.hero_image_url ?? ''));
  if (!play) return NextResponse.json({ error: 'Stück konnte nicht gespeichert werden.' }, { status: 400 });

  const performances = (Array.isArray(body.performances) ? body.performances : []) as PerformancePayload[];
  const performancePayload = performances.map((performance) => mapPerformancePayload(play.id, performance, String(body.venue ?? '')));

  if (performancePayload.length > 0) {
    const { error } = await admin.supabase.from('performances').insert(performancePayload);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await syncCast(admin, play.id, Array.isArray(body.cast_entries) ? body.cast_entries : []);
  return NextResponse.json({ data: play });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'Stück-ID fehlt' }, { status: 400 });

  const play = await ensurePlay(admin, String(body.title ?? ''), String(body.description ?? ''), String(body.hero_image_url ?? ''));
  if (!play) return NextResponse.json({ error: 'Stück konnte nicht gespeichert werden.' }, { status: 400 });

  const performances = (Array.isArray(body.performances) ? body.performances : []) as PerformancePayload[];
  const existingPerformanceIds = performances.map((entry) => entry.id).filter(Boolean) as string[];

  const { data: existingPerformances } = await admin.supabase.from('performances').select('id').eq('play_id', body.id);
  const deletableIds = (existingPerformances ?? []).map((entry) => entry.id).filter((id) => !existingPerformanceIds.includes(id));

  if (deletableIds.length > 0) {
    const { error } = await admin.supabase.from('performances').delete().in('id', deletableIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  for (const performance of performances) {
    const payload = mapPerformancePayload(play.id, performance, String(body.venue ?? ''));
    if (performance.id) {
      const { error } = await admin.supabase.from('performances').update(payload).eq('id', performance.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      const { error } = await admin.supabase.from('performances').insert(payload);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  await syncCast(admin, play.id, Array.isArray(body.cast_entries) ? body.cast_entries : []);
  return NextResponse.json({ data: play });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Stück-ID fehlt' }, { status: 400 });

  const { error: castError } = await admin.supabase.from('play_cast').delete().eq('play_id', id);
  if (castError) return NextResponse.json({ error: castError.message }, { status: 400 });

  const { error: perfError } = await admin.supabase.from('performances').delete().eq('play_id', id);
  if (perfError) return NextResponse.json({ error: perfError.message }, { status: 400 });

  const { error } = await admin.supabase.from('plays').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
