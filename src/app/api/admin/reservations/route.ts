import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

type ReservationRow = {
  id: string;
  name: string;
  email: string;
  ticket_count: number;
  created_at: string;
  event: {
    title: string;
    event_date: string;
    performance_time: string;
  } | null;
};

function asCsv(rows: ReservationRow[]) {
  const header = ['Name', 'E-Mail', 'Tickets', 'Aufführung', 'Aufführungsdatum', 'Aufführungszeit', 'Reserviert am'];
  const lines = rows.map((row) => [
    row.name,
    row.email,
    String(row.ticket_count),
    row.event?.title ?? '',
    row.event?.event_date ?? '',
    row.event?.performance_time ?? '',
    row.created_at
  ]);

  return [header, ...lines]
    .map((cols) => cols.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';'))
    .join('\n');
}

function asExcelXml(rows: ReservationRow[]) {
  const escape = (value: string) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

  const dataRows = rows
    .map(
      (row) => `
      <Row>
        <Cell><Data ss:Type="String">${escape(row.name)}</Data></Cell>
        <Cell><Data ss:Type="String">${escape(row.email)}</Data></Cell>
        <Cell><Data ss:Type="Number">${row.ticket_count}</Data></Cell>
        <Cell><Data ss:Type="String">${escape(row.event?.title ?? '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escape(row.event?.event_date ?? '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escape(row.event?.performance_time ?? '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escape(row.created_at)}</Data></Cell>
      </Row>`
    )
    .join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Reservierungen">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Name</Data></Cell>
    <Cell><Data ss:Type="String">E-Mail</Data></Cell>
    <Cell><Data ss:Type="String">Tickets</Data></Cell>
    <Cell><Data ss:Type="String">Aufführung</Data></Cell>
    <Cell><Data ss:Type="String">Aufführungsdatum</Data></Cell>
    <Cell><Data ss:Type="String">Aufführungszeit</Data></Cell>
    <Cell><Data ss:Type="String">Reserviert am</Data></Cell>
   </Row>${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const format = searchParams.get('format');

  let query = admin.supabase
    .from('reservations')
    .select('id,name,email,ticket_count,created_at,event:events(title,event_date,performance_time,id)')
    .order('created_at', { ascending: false });

    if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows: ReservationRow[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    ticket_count: row.ticket_count,
    created_at: row.created_at,
    event: Array.isArray(row.event) ? (row.event[0] ?? null) : row.event
  }));

  if (format === 'csv') {
    return new NextResponse(asCsv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reservierungen-${eventId ?? 'alle'}.csv"`
      }
    });
  }

  if (format === 'xls') {
    return new NextResponse(asExcelXml(rows), {
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="reservierungen-${eventId ?? 'alle'}.xls"`
      }
    });
  }

  return NextResponse.json({ data: rows });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Reservierungs-ID fehlt' }, { status: 400 });
  }

  const { data: reservation, error: reservationError } = await admin.supabase
    .from('reservations')
    .select('ticket_count,event_id')
    .eq('id', id)
    .single();

  if (reservationError || !reservation) {
    return NextResponse.json({ error: 'Reservierung nicht gefunden' }, { status: 404 });
  }

  const { error } = await admin.supabase.from('reservations').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await admin.supabase.rpc('decrement_reserved_tickets', {
    event_id_input: reservation.event_id,
    ticket_amount: reservation.ticket_count
  });

  return NextResponse.json({ ok: true });
}
