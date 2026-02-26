import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

const DEFAULT_VENUE = 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)';

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { data, error } = await admin.supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('performance_time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const body = await request.json();
  const payload = {
    title: String(body.title ?? '').trim(),
    slug: toSlug(String(body.title ?? '')),
    description: String(body.description ?? '').trim(),
    event_date: body.event_date,
    performance_time: body.performance_time,
    admission_time: body.admission_time,
    venue: String(body.venue ?? '').trim() || DEFAULT_VENUE,
    hero_image_url: body.hero_image_url || null,
    cast_entries: Array.isArray(body.cast_entries) ? body.cast_entries : [],
    total_seats: Number(body.total_seats ?? 0),
    online_seat_limit: Number(body.online_seat_limit ?? 0),
    is_past: Boolean(body.is_past)
  };

  const { data, error } = await admin.supabase.from('events').insert(payload).select('*').single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: 'Event-ID fehlt' }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from('events')
    .update({
      title: String(body.title ?? '').trim(),
      slug: toSlug(String(body.title ?? '')),
      description: String(body.description ?? '').trim(),
      event_date: body.event_date,
      performance_time: body.performance_time,
      admission_time: body.admission_time,
      venue: String(body.venue ?? '').trim() || DEFAULT_VENUE,
      hero_image_url: body.hero_image_url || null,
      cast_entries: Array.isArray(body.cast_entries) ? body.cast_entries : [],
      total_seats: Number(body.total_seats ?? 0),
      online_seat_limit: Number(body.online_seat_limit ?? 0),
      is_past: Boolean(body.is_past)
    })
    .eq('id', body.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Event-ID fehlt' }, { status: 400 });
  }

  const { error } = await admin.supabase.from('events').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
