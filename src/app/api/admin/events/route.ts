import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { slugify } from '@/lib/format';

const DEFAULT_VENUE = 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)';

type CastEntry = { member_name: string; role: string };

function parseDateTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

async function ensurePlay(admin: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>, title: string, description: string, posterImage?: string) {
  const slug = slugify(title);
  const { data: existing } = await admin.supabase.from('plays').select('*').eq('slug', slug).maybeSingle();
  if (existing) {
    const { data } = await admin.supabase.from('plays').update({ title, description, poster_image: posterImage ?? null, updated_at: new Date().toISOString() }).eq('id', existing.id).select('*').single();
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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });

  const { data, error } = await admin.supabase
    .from('performances')
    .select('id,start_datetime,doors_datetime,venue,capacity,online_quota,reserved_online_tickets,play:plays(id,title,description,slug,poster_image),play_cast:plays(play_cast(role,member:members(name)))')
    .order('start_datetime', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const mapped = (data ?? []).map((row) => {
    const play = Array.isArray(row.play) ? row.play[0] : row.play;
    const castWrap = Array.isArray(row.play_cast) ? row.play_cast[0] : row.play_cast;
    const castEntries = (castWrap?.play_cast ?? []).map((entry: { role: string; member: { name: string } | Array<{ name: string }> }) => ({
      role: entry.role,
      member_name: Array.isArray(entry.member) ? entry.member[0]?.name : entry.member?.name
    }));
    return {
      id: row.id,
      slug: play?.slug,
      title: play?.title,
      description: play?.description,
      event_date: row.start_datetime.slice(0, 10),
      performance_time: row.start_datetime.slice(11, 16),
      admission_time: row.doors_datetime?.slice(11, 16) ?? '',
      venue: row.venue,
      hero_image_url: play?.poster_image,
      cast_entries: castEntries,
      total_seats: row.capacity,
      online_seat_limit: row.online_quota,
      reserved_online_tickets: row.reserved_online_tickets
    };
  });

  return NextResponse.json({ data: mapped });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
  const body = await request.json();

  const play = await ensurePlay(admin, String(body.title ?? ''), String(body.description ?? ''), String(body.hero_image_url ?? ''));
  if (!play) return NextResponse.json({ error: 'Stück konnte nicht gespeichert werden.' }, { status: 400 });

  const payload = {
    play_id: play.id,
    start_datetime: parseDateTime(String(body.event_date ?? ''), String(body.performance_time ?? '00:00')),
    doors_datetime: body.admission_time ? parseDateTime(String(body.event_date ?? ''), String(body.admission_time)) : null,
    venue: String(body.venue ?? '') || DEFAULT_VENUE,
    capacity: Number(body.total_seats ?? 0),
    online_quota: Number(body.online_seat_limit ?? 0)
  };

  const { data, error } = await admin.supabase.from('performances').insert(payload).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await syncCast(admin, play.id, Array.isArray(body.cast_entries) ? body.cast_entries : []);
  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'Event-ID fehlt' }, { status: 400 });

  const play = await ensurePlay(admin, String(body.title ?? ''), String(body.description ?? ''), String(body.hero_image_url ?? ''));
  if (!play) return NextResponse.json({ error: 'Stück konnte nicht gespeichert werden.' }, { status: 400 });

  const { data, error } = await admin.supabase
    .from('performances')
    .update({
      play_id: play.id,
      start_datetime: parseDateTime(String(body.event_date ?? ''), String(body.performance_time ?? '00:00')),
      doors_datetime: body.admission_time ? parseDateTime(String(body.event_date ?? ''), String(body.admission_time)) : null,
      venue: String(body.venue ?? '') || DEFAULT_VENUE,
      capacity: Number(body.total_seats ?? 0),
      online_quota: Number(body.online_seat_limit ?? 0)
    })
    .eq('id', body.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await syncCast(admin, play.id, Array.isArray(body.cast_entries) ? body.cast_entries : []);
  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Event-ID fehlt' }, { status: 400 });
  const { error } = await admin.supabase.from('performances').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
