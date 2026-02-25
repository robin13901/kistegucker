import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const body = await request.json();
  const { error } = await admin.supabase.from('members').insert(body);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
