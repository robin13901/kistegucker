import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

type Participation = { piece: string; role: string };

type MemberPayload = {
  name: string;
  description: string;
  image_url: string | null;
  club_roles: string[];
  participations: Participation[];
};

function validateMemberPayload(body: Record<string, unknown>) {
  const fieldErrors: Record<string, string> = {};

  const payload: MemberPayload = {
    name: String(body.name ?? '').trim(),
    description: String(body.description ?? '').trim(),
    image_url: String(body.image_url ?? '').trim() || null,
    club_roles: Array.isArray(body.club_roles)
      ? body.club_roles.map((role) => String(role).trim()).filter(Boolean)
      : [],
    participations: Array.isArray(body.participations)
      ? body.participations
          .map((entry) => ({
            piece: String((entry as Participation)?.piece ?? '').trim(),
            role: String((entry as Participation)?.role ?? '').trim()
          }))
          .filter((entry) => entry.piece || entry.role)
      : []
  };

  if (!payload.name) {
    fieldErrors.name = 'Bitte einen Namen eingeben.';
  }

  if (!payload.description) {
    fieldErrors.description = 'Bitte eine Beschreibung eingeben.';
  }

  if (!payload.image_url) {
    fieldErrors.image_url = 'Bitte ein Foto hochladen.';
  }

  payload.participations.forEach((entry, index) => {
    if (!entry.piece) {
      fieldErrors[`participations.${index}.piece`] = 'Bitte ein Stück auswählen.';
    }

    if (!entry.role) {
      fieldErrors[`participations.${index}.role`] = 'Bitte eine Rolle eingeben.';
    }
  });

  return { payload, fieldErrors };
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
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
    return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const { payload, fieldErrors } = validateMemberPayload(body);

  if (Object.keys(fieldErrors).length) {
    return NextResponse.json({ error: 'Bitte korrigiere die Eingaben im Formular.', fieldErrors }, { status: 400 });
  }

  const { data, error } = await admin.supabase.from('members').insert(payload).select('*').single();

  if (error) {
    return NextResponse.json({ error: `Datenbankfehler: ${error.message}` }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  if (!body.id) {
    return NextResponse.json({ error: 'Mitglieds-ID fehlt' }, { status: 400 });
  }

  const { payload, fieldErrors } = validateMemberPayload(body);

  if (Object.keys(fieldErrors).length) {
    return NextResponse.json({ error: 'Bitte korrigiere die Eingaben im Formular.', fieldErrors }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from('members')
    .update(payload)
    .eq('id', body.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: `Datenbankfehler: ${error.message}` }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
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
