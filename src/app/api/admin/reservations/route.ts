import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { slugify } from '@/lib/format';
import { buildXlsx } from '@/lib/xlsx';

function formatReservationDateTime(value: string) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}, ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')} Uhr`;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const performanceId = searchParams.get('event_id');
  const playId = searchParams.get('play_id');
  const format = searchParams.get('format');

  let query = admin.supabase
    .from('reservations')
    .select('id,name,email,tickets,reserved_at,performance:performances(id,start_datetime,play:plays(id,title,slug))')
    .order('reserved_at', { ascending: false });

  if (performanceId) query = query.eq('performance_id', performanceId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const rows = (data ?? []).map((row) => {
    const performance = Array.isArray(row.performance) ? row.performance[0] : row.performance;
    const play = Array.isArray(performance?.play) ? performance?.play[0] : performance?.play;
    return { ...row, performance, play };
  }).filter((row) => (playId ? row.play?.id === playId : true));

  if (format === 'xlsx') {
    const byPerformance = new Map<string, typeof rows>();
    rows.forEach((row) => {
      const key = row.performance?.id ?? 'unbekannt';
      byPerformance.set(key, [...(byPerformance.get(key) ?? []), row]);
    });

    const sheets = [...byPerformance.values()].map((group) => {
      const date = group[0]?.performance?.start_datetime?.slice(0, 10) ?? 'auffuehrung';
      return {
        name: date,
        rows: [
          ['Name', 'E-Mail', 'Anzahl Tickets', 'Reservierungszeitpunkt'],
          ...group.map((row) => [row.name, row.email, String(row.tickets), formatReservationDateTime(row.reserved_at)])
        ]
      };
    });

    const playSlug = rows[0]?.play?.slug ?? 'alle';
    const fileName = `reservierungen-${slugify(playSlug)}.xlsx`;
    const xlsx = buildXlsx(sheets.length ? sheets : [{ name: 'reservierungen', rows: [['Name', 'E-Mail', 'Anzahl Tickets', 'Reservierungszeitpunkt']] }]);

    return new NextResponse(xlsx, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  }

  return NextResponse.json({ data: rows });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Reservierungs-ID fehlt' }, { status: 400 });

  const { data: reservation } = await admin.supabase.from('reservations').select('tickets,performance_id').eq('id', id).single();
  if (!reservation) return NextResponse.json({ error: 'Reservierung nicht gefunden' }, { status: 404 });

  const { error } = await admin.supabase.from('reservations').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await admin.supabase.rpc('decrement_reserved_tickets', { performance_id_input: reservation.performance_id, ticket_amount: reservation.tickets });
  return NextResponse.json({ ok: true });
}
