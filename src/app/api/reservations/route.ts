import { NextResponse } from 'next/server';
import { reservationSchema } from '@/lib/validation';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = reservationSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
  }

  const { error } = await supabase.from('reservations').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    ticket_count: parsed.data.tickets,
    event_id: parsed.data.eventId
  });

  if (error) {
    return NextResponse.json({ error: 'Datenbankfehler beim Speichern.' }, { status: 500 });
  }

  return NextResponse.json({
    message: 'Reservierung gespeichert. Bestätigungsmail wurde angestoßen.'
  });
}
