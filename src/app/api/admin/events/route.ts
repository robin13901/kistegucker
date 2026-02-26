import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

const DEFAULT_VENUE = 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)';
const allowedImageRatios = [1, 4 / 3, 16 / 9];

type CastEntry = { member_name: string; role: string };

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

function getImageSize(base64DataUrl: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const match = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
      resolve(null);
      return;
    }

    const mimeType = match[1];
    const buffer = Buffer.from(match[2], 'base64');

    if (mimeType.includes('png') && buffer.length >= 24) {
      resolve({ width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) });
      return;
    }

    if ((mimeType.includes('jpeg') || mimeType.includes('jpg')) && buffer.length > 4) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) {
          break;
        }

        const marker = buffer[offset + 1];
        const length = buffer.readUInt16BE(offset + 2);

        if (marker >= 0xc0 && marker <= 0xc3) {
          resolve({ height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) });
          return;
        }

        offset += 2 + length;
      }
    }

    resolve(null);
  });
}

function isAllowedImageRatio(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    return false;
  }

  const ratio = width / height;
  return allowedImageRatios.some((allowed) => Math.abs(ratio - allowed) <= 0.03);
}

async function validateEventPayload(body: Record<string, unknown>) {
  const fieldErrors: Record<string, string> = {};
  const castEntries: CastEntry[] = Array.isArray(body.cast_entries)
    ? body.cast_entries
        .map((entry) => ({
          member_name: String((entry as CastEntry)?.member_name ?? '').trim(),
          role: String((entry as CastEntry)?.role ?? '').trim()
        }))
        .filter((entry) => entry.member_name || entry.role)
    : [];

  const payload = {
    title: String(body.title ?? '').trim(),
    slug: toSlug(String(body.title ?? '')),
    description: String(body.description ?? '').trim(),
    event_date: body.event_date,
    performance_time: body.performance_time,
    admission_time: body.admission_time,
    venue: String(body.venue ?? '').trim() || DEFAULT_VENUE,
    hero_image_url: String(body.hero_image_url ?? '').trim() || null,
    cast_entries: castEntries,
    total_seats: Number(body.total_seats ?? 0),
    online_seat_limit: Number(body.online_seat_limit ?? 0),
    is_past: Boolean(body.is_past)
  };

  if (!payload.title) {
    fieldErrors.title = 'Bitte einen Titel eingeben.';
  }
  if (!payload.description) {
    fieldErrors.description = 'Bitte eine Beschreibung eingeben.';
  }
  if (!payload.event_date) {
    fieldErrors.event_date = 'Bitte ein Aufführungsdatum wählen.';
  }
  if (!payload.performance_time) {
    fieldErrors.performance_time = 'Bitte eine Aufführungszeit angeben.';
  }
  if (!payload.admission_time) {
    fieldErrors.admission_time = 'Bitte eine Einlasszeit angeben.';
  }
  if (!payload.hero_image_url) {
    fieldErrors.hero_image_url = 'Bitte ein Titelbild hochladen.';
  }

  if (payload.online_seat_limit > payload.total_seats) {
    fieldErrors.online_seat_limit = 'Online-Reservierungen dürfen nicht höher als die Gesamtplätze sein.';
  }

  castEntries.forEach((entry, index) => {
    if (!entry.role) {
      fieldErrors[`cast_entries.${index}.role`] = 'Bitte einen Rollennamen angeben.';
    }
    if (!entry.member_name) {
      fieldErrors[`cast_entries.${index}.member_name`] = 'Bitte ein Mitglied auswählen.';
    }
  });

  if (payload.hero_image_url) {
    const dimensions = await getImageSize(payload.hero_image_url);
    if (dimensions && !isAllowedImageRatio(dimensions.width, dimensions.height)) {
      fieldErrors.hero_image_url = 'Bitte ein Bild im Format 1:1, 4:3 oder 16:9 hochladen.';
    }
  }

  return { payload, fieldErrors };
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

  const body = (await request.json()) as Record<string, unknown>;
  const { payload, fieldErrors } = await validateEventPayload(body);

  if (Object.keys(fieldErrors).length) {
    return NextResponse.json({ error: 'Bitte korrigiere die Eingaben im Formular.', fieldErrors }, { status: 400 });
  }

  const { data, error } = await admin.supabase.from('events').insert(payload).select('*').single();

  if (error) {
    return NextResponse.json({ error: `Datenbankfehler: ${error.message}` }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  if (!body.id) {
    return NextResponse.json({ error: 'Event-ID fehlt' }, { status: 400 });
  }

  const { payload, fieldErrors } = await validateEventPayload(body);

  if (Object.keys(fieldErrors).length) {
    return NextResponse.json({ error: 'Bitte korrigiere die Eingaben im Formular.', fieldErrors }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from('events')
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
