import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { data, error } = await admin.supabase
    .from('reservations')
    .select('id,name,email,ticket_count,created_at,event:events(title,date,time)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
