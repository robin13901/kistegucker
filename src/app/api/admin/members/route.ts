import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { data, error } = await admin.supabase.from('members').select('*').order('name', { ascending: true });

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
    name: String(body.name ?? '').trim(),
    description: String(body.description ?? body.bio ?? '').trim(),
    bio: String(body.bio ?? body.description ?? '').trim(),
    image_url: body.image_url || null,
    club_roles: Array.isArray(body.club_roles) ? body.club_roles : [],
    participations: Array.isArray(body.participations) ? body.participations : []
  };

  const { data, error } = await admin.supabase.from('members').insert(payload).select('*').single();

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
    return NextResponse.json({ error: 'Mitglieds-ID fehlt' }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from('members')
    .update({
      name: String(body.name ?? '').trim(),
      description: String(body.description ?? body.bio ?? '').trim(),
      bio: String(body.bio ?? body.description ?? '').trim(),
      image_url: body.image_url || null,
      club_roles: Array.isArray(body.club_roles) ? body.club_roles : [],
      participations: Array.isArray(body.participations) ? body.participations : []
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
    return NextResponse.json({ error: 'Mitglieds-ID fehlt' }, { status: 400 });
  }

  const { error } = await admin.supabase.from('members').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
