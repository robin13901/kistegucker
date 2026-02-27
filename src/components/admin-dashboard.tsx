'use client';

import {
  ChangeEvent,
  FormEvent,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  useMemo,
  useRef,
  useState
} from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MemberCard } from '@/components/member-card';
import { PlayCard } from '@/components/play-card';
import { slugify } from '@/lib/format';

type AdminState = {
  email: string;
  password: string;
  loggedIn: boolean;
  feedback?: string;
};

type CastEntry = { member_name: string; role: string };
type Participation = { piece: string; role: string };
type ValidationErrors = Record<string, string>;
type PerformanceForm = {
  id?: string;
  event_date: string;
  performance_time: string;
  admission_time: string;
  total_seats: number | '';
  online_seat_limit: number | '';
  venue: string;
  gallery: string[];
  is_past?: boolean;
};

type PlayForm = {
  id?: string;
  slug?: string;
  title: string;
  description: string;
  hero_image_url: string;
  cast_entries: CastEntry[];
  performances: PerformanceForm[];
};

type MemberForm = {
  id?: string;
  name: string;
  description: string;
  image_url: string;
  club_roles: string[];
  participations: Participation[];
};

type ReservationEntry = {
  id: string;
  name: string;
  email: string;
  tickets: number;
  play?: { id?: string; title?: string };
};

const DEFAULT_VENUE = 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)';
const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;

const initialPerformance: PerformanceForm = {
  event_date: '',
  performance_time: '',
  admission_time: '',
  total_seats: '',
  online_seat_limit: '',
  venue: DEFAULT_VENUE,
  gallery: []
};

const initialPlay: PlayForm = {
  title: '',
  description: '',
  hero_image_url: '',
  cast_entries: [{ member_name: '', role: '' }],
  performances: [{ ...initialPerformance }]
};

const initialMember: MemberForm = {
  name: '',
  description: '',
  image_url: '',
  club_roles: [''],
  participations: [{ piece: '', role: '' }]
};

function normalizeMemberForm(entry: Partial<MemberForm>): MemberForm {
  return {
    id: entry.id,
    name: entry.name ?? '',
    description: entry.description ?? '',
    image_url: entry.image_url ?? '',
    club_roles: Array.isArray(entry.club_roles) && entry.club_roles.length > 0 ? entry.club_roles : [''],
    participations: Array.isArray(entry.participations) && entry.participations.length > 0 ? entry.participations : [{ piece: '', role: '' }]
  };
}

function FieldInput(props: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const { label, id, hint, className = '', ...rest } = props;
  return (
    <label htmlFor={id} className="flex min-h-[84px] flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        id={id}
        {...rest}
        className={`w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-left outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 ${className}`}
      />
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const { label, id, hint, className = '', onInput, ...rest } = props;
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <textarea
        id={id}
        {...rest}
        onInput={(event) => {
          const target = event.currentTarget;
          target.style.height = 'auto';
          target.style.height = `${target.scrollHeight}px`;
          onInput?.(event);
        }}
        className={`w-full resize-none overflow-hidden rounded-xl border border-zinc-300 bg-white px-3 py-2 text-left outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 ${className}`}
      />
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Upload fehlgeschlagen'));
    reader.readAsDataURL(file);
  });
}

async function preprocessImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Bitte eine gültige Bilddatei auswählen.');
  }

  const originalDataUrl = await fileToDataUrl(file);

  if (file.size <= MAX_IMAGE_SIZE_BYTES && file.type === 'image/webp') {
    return originalDataUrl;
  }

  const imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Bild konnte nicht verarbeitet werden.'));
    image.src = originalDataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Bild konnte nicht verarbeitet werden.');
  }

  context.drawImage(imageElement, 0, 0);

  const webpBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.85);
  });

  if (!webpBlob) {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('Datei ist zu groß. Maximal erlaubt sind 1 MB.');
    }
    return originalDataUrl;
  }

  if (webpBlob.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Datei ist zu groß. Maximal erlaubt sind 1 MB.');
  }

  return await fileToDataUrl(new File([webpBlob], `${file.name.replace(/\.[^.]+$/, '') || 'upload'}.webp`, { type: 'image/webp' }));
}

export function AdminDashboard() {
  const [state, setState] = useState<AdminState>({ email: '', password: '', loggedIn: false });
  const [activeTab, setActiveTab] = useState<'events' | 'members' | 'reservations'>('events');
  const [playForm, setPlayForm] = useState<PlayForm>(initialPlay);
  const [memberForm, setMemberForm] = useState<MemberForm>(initialMember);
  const [plays, setPlays] = useState<PlayForm[]>([]);
  const [members, setMembers] = useState<MemberForm[]>([]);
  const [reservations, setReservations] = useState<ReservationEntry[]>([]);
  const [selectedReservationPlayId, setSelectedReservationPlayId] = useState<string>('');
  const [eventErrors, setEventErrors] = useState<ValidationErrors>({});
  const [memberErrors, setMemberErrors] = useState<ValidationErrors>({});
  const [clubRoleDraft, setClubRoleDraft] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const eventImageInputRef = useRef<HTMLInputElement | null>(null);
  const memberImageInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const supabase = useMemo(() => (hasSupabaseConfig ? createClientComponentClient() : null), [hasSupabaseConfig]);

  async function loadData() {
    const [eventResponse, memberResponse, reservationResponse] = await Promise.all([
      fetch('/api/admin/events'),
      fetch('/api/admin/members'),
      fetch('/api/admin/reservations')
    ]);

    const eventResult = eventResponse.ok ? await eventResponse.json() : { data: [] };
    if (eventResponse.ok) {
      setPlays(eventResult.data ?? []);
    }

    if (memberResponse.ok) {
      const result = await memberResponse.json();
      const rawMembers = (result.data ?? []).map((entry: MemberForm) => normalizeMemberForm(entry));
      const participationsByMember = new Map<string, Participation[]>();

      (eventResult.data ?? []).forEach((play: PlayForm) => {
        (play.cast_entries ?? []).forEach((castEntry) => {
          const list = participationsByMember.get(castEntry.member_name) ?? [];
          if (!list.some((item) => item.piece === play.title && item.role === castEntry.role)) {
            list.push({ piece: play.title, role: castEntry.role });
          }
          participationsByMember.set(castEntry.member_name, list);
        });
      });

      setMembers(rawMembers.map((entry: MemberForm) => ({ ...entry, participations: participationsByMember.get(entry.name) ?? [] })));
    }

    if (reservationResponse.ok) {
      const result = await reservationResponse.json();
      setReservations(result.data ?? []);
    }
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setState((prev) => ({ ...prev, feedback: 'Supabase ist nicht konfiguriert.' }));
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: state.email,
      password: state.password
    });

    if (error) {
      setState((prev) => ({ ...prev, feedback: error.message }));
      return;
    }

    await loadData();
    setState((prev) => ({ ...prev, loggedIn: true, feedback: undefined }));
  }


  async function onGalleryImageSelect(event: ChangeEvent<HTMLInputElement>, performanceIndex: number) {
    const files = Array.from(event.target.files ?? []);
    if (files.length < 1) return;

    const performance = playForm.performances[performanceIndex];
    if (!performance) return;

    const isPast = new Date(`${performance.event_date}T${performance.performance_time || '00:00'}:00`).getTime() < Date.now();
    if (!isPast) {
      setState((prev) => ({ ...prev, feedback: 'Galeriebilder können nur für vergangene Aufführungen hochgeladen werden.' }));
      event.target.value = '';
      return;
    }

    try {
      const converted = await Promise.all(files.map((file) => preprocessImageFile(file)));
      setPlayForm((prev) => ({
        ...prev,
        performances: prev.performances.map((row, rowIndex) => rowIndex === performanceIndex ? { ...row, gallery: [...(row.gallery ?? []), ...converted] } : row)
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Galeriebilder konnten nicht hochgeladen werden.';
      setState((prev) => ({ ...prev, feedback: message }));
    } finally {
      event.target.value = '';
    }
  }

  async function onImageSelect(event: ChangeEvent<HTMLInputElement>, type: 'event' | 'member') {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await preprocessImageFile(file);
      if (type === 'event') {
        setEventErrors((prev) => ({ ...prev, hero_image_url: '' }));
        setPlayForm((prev) => ({ ...prev, hero_image_url: url }));
      } else {
        setMemberErrors((prev) => ({ ...prev, image_url: '' }));
        setMemberForm((prev) => ({ ...prev, image_url: url }));
        const suggestedName = `${slugify(memberForm.name || file.name.replace(/\.[^.]+$/, ''))}.webp`;
        setState((prev) => ({ ...prev, feedback: `Upload bereit: ${suggestedName}` }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bild konnte nicht hochgeladen werden.';
      setState((prev) => ({ ...prev, feedback: message }));
    } finally {
      event.target.value = '';
    }
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEventErrors({});

    const payload = {
      ...playForm,
      cast_entries: playForm.cast_entries.filter((entry) => entry.member_name.trim() || entry.role.trim()),
      performances: playForm.performances
        .filter((entry) => entry.event_date || entry.performance_time || entry.admission_time || entry.total_seats || entry.online_seat_limit)
        .map((entry) => ({
          ...entry,
          total_seats: Number(entry.total_seats || 0),
          online_seat_limit: Number(entry.online_seat_limit || 0),
          gallery: Array.isArray(entry.gallery) ? entry.gallery : []
        }))
    };

    const localErrors: ValidationErrors = {};

    if (!payload.title.trim()) localErrors.title = 'Bitte einen Titel eingeben.';
    if (!payload.description.trim()) localErrors.description = 'Bitte eine Beschreibung eingeben.';
    if (payload.performances.length < 1) localErrors.performances = 'Bitte mindestens eine Aufführung anlegen.';

    payload.performances.forEach((entry, index) => {
      if (!entry.event_date) localErrors[`performances.${index}.event_date`] = 'Bitte ein Aufführungsdatum wählen.';
      if (!entry.performance_time) localErrors[`performances.${index}.performance_time`] = 'Bitte eine Aufführungszeit angeben.';
      if (!entry.admission_time) localErrors[`performances.${index}.admission_time`] = 'Bitte eine Einlasszeit angeben.';
      if (!entry.total_seats || entry.total_seats < 1) localErrors[`performances.${index}.total_seats`] = 'Bitte die Gesamtanzahl Plätze angeben.';
      if (!entry.online_seat_limit || entry.online_seat_limit < 1) localErrors[`performances.${index}.online_seat_limit`] = 'Bitte die Anzahl Online-Reservierungen angeben.';
      if (entry.total_seats && entry.online_seat_limit && entry.online_seat_limit > entry.total_seats) {
        localErrors[`performances.${index}.online_seat_limit`] = 'Online-Reservierungen dürfen nicht höher als die Gesamtplätze sein.';
      }
    });

    payload.cast_entries.forEach((entry, index) => {
      if (!entry.role.trim()) localErrors[`cast_entries.${index}.role`] = 'Bitte einen Rollennamen angeben.';
      if (!entry.member_name.trim()) localErrors[`cast_entries.${index}.member_name`] = 'Bitte ein Mitglied auswählen.';
    });

    if (Object.values(localErrors).some(Boolean)) {
      setEventErrors(localErrors);
      setState((prev) => ({ ...prev, feedback: 'Bitte korrigiere die markierten Felder im Stück-Formular.' }));
      return;
    }

    const response = await fetch('/api/admin/events', {
      method: playForm.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setEventErrors(result.fieldErrors ?? {});
      setState((prev) => ({ ...prev, feedback: result.error ?? 'Stück konnte nicht gespeichert werden.' }));
      return;
    }

    setState((prev) => ({ ...prev, feedback: 'Stück gespeichert.' }));
    setPlayForm(initialPlay);
    setShowEventForm(false);
    await loadData();
  }

  async function saveMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMemberErrors({});

    const payload = {
      ...memberForm,
      club_roles: memberForm.club_roles.filter((role) => role.trim()),
      participations: memberForm.participations.filter((entry) => entry.piece.trim() || entry.role.trim())
    };

    const localErrors: ValidationErrors = {};

    if (!payload.name.trim()) localErrors.name = 'Bitte einen Namen eingeben.';
    if (!payload.description.trim()) localErrors.description = 'Bitte eine Beschreibung eingeben.';

    payload.participations.forEach((entry, index) => {
      if (!entry.piece.trim()) localErrors[`participations.${index}.piece`] = 'Bitte ein Stück auswählen.';
      if (!entry.role.trim()) localErrors[`participations.${index}.role`] = 'Bitte eine Rolle eingeben.';
    });

    if (Object.values(localErrors).some(Boolean)) {
      setMemberErrors(localErrors);
      setState((prev) => ({ ...prev, feedback: 'Bitte korrigiere die markierten Felder im Mitgliederformular.' }));
      return;
    }

    const response = await fetch('/api/admin/members', {
      method: memberForm.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMemberErrors(result.fieldErrors ?? {});
      setState((prev) => ({ ...prev, feedback: result.error ?? 'Mitglied konnte nicht gespeichert werden.' }));
      return;
    }

    setState((prev) => ({ ...prev, feedback: '✓ Änderungen gespeichert.' }));
    setMemberForm(initialMember);
    setClubRoleDraft('');
    setShowMemberForm(false);
    await loadData();
  }

  async function deleteEvent(id?: string) {
    if (!id) return;
    const response = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
    setState((prev) => ({ ...prev, feedback: response.ok ? 'Stück gelöscht.' : 'Stück konnte nicht gelöscht werden.' }));
    if (response.ok) await loadData();
  }

  async function deleteMember(id?: string) {
    if (!id) return;
    const response = await fetch(`/api/admin/members?id=${id}`, { method: 'DELETE' });
    setState((prev) => ({ ...prev, feedback: response.ok ? 'Mitglied gelöscht.' : 'Mitglied konnte nicht gelöscht werden.' }));
    if (response.ok) await loadData();
  }

  async function deleteReservation(id: string) {
    const response = await fetch(`/api/admin/reservations?id=${id}`, { method: 'DELETE' });
    setState((prev) => ({ ...prev, feedback: response.ok ? 'Reservierung gelöscht.' : 'Reservierung konnte nicht gelöscht werden.' }));
    if (response.ok) await loadData();
  }

  if (!state.loggedIn) {
    return (
      <form onSubmit={signIn} className="max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-xl font-semibold">Admin Login</h2>
        <input type="email" placeholder="admin@kistegucker.de" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={state.email} onChange={(event) => setState((prev) => ({ ...prev, email: event.target.value }))} />
        <input type="password" placeholder="Passwort" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={state.password} onChange={(event) => setState((prev) => ({ ...prev, password: event.target.value }))} />
        <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-white">Einloggen</button>
        {state.feedback && <p className="text-sm text-zinc-600">{state.feedback}</p>}
      </form>
    );
  }

  const filteredReservations = selectedReservationPlayId
    ? reservations.filter((entry) => entry.play?.id === selectedReservationPlayId)
    : reservations;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveTab('events')} className={`rounded-xl border px-4 py-2 ${activeTab === 'events' ? 'border-accent bg-accent text-white' : ''}`}>Aufführungen</button>
        <button onClick={() => setActiveTab('members')} className={`rounded-xl border px-4 py-2 ${activeTab === 'members' ? 'border-accent bg-accent text-white' : ''}`}>Mitglieder</button>
        <button onClick={() => setActiveTab('reservations')} className={`rounded-xl border px-4 py-2 ${activeTab === 'reservations' ? 'border-accent bg-accent text-white' : ''}`}>Reservierungen</button>
      </div>

      {activeTab === 'events' && (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Aufführungen verwalten</h2>
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm font-medium"
              onClick={() => {
                setShowEventForm((prev) => !prev);
                if (showEventForm) setPlayForm(initialPlay);
              }}
            >
              {showEventForm ? 'Form schließen' : 'Neues Theaterstück erstellen'}
            </button>
          </div>

          {showEventForm && (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-card">
              <form onSubmit={saveEvent} className="space-y-3">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Titelbild hochladen</label>
                  <input ref={eventImageInputRef} type="file" accept="image/*" onChange={(event) => onImageSelect(event, 'event')} className="hidden" />
                  <button type="button" onClick={() => eventImageInputRef.current?.click()} className="w-full rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                    Bild auswählen
                  </button>
                  {eventErrors.hero_image_url && <p className="mt-1 text-xs text-red-600">{eventErrors.hero_image_url}</p>}
                  {playForm.hero_image_url && <img src={playForm.hero_image_url} alt="Titelbild Vorschau" className="mt-2 aspect-video w-full rounded-xl border border-zinc-200 object-cover" />}
                </div>

                <FieldInput id="event-title" label="Titel des Theaterstücks" value={playForm.title} onChange={(event) => setPlayForm((prev) => ({ ...prev, title: event.target.value }))} required />
                <AutoTextarea id="event-description" label="Beschreibung" value={playForm.description} onChange={(event) => setPlayForm((prev) => ({ ...prev, description: event.target.value }))} required className="min-h-[120px]" />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Besetzung</p>
                  {playForm.cast_entries.map((entry, index) => (
                    <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
                      <label className="flex min-h-[84px] flex-col gap-1"><span className="text-sm font-medium text-zinc-700">Mitglied</span><select className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" value={entry.member_name} onChange={(event) => setPlayForm((prev) => ({ ...prev, cast_entries: prev.cast_entries.map((row, rowIndex) => rowIndex === index ? { ...row, member_name: event.target.value } : row) }))}><option value="">Mitglied auswählen</option>{members.map((member) => (<option key={member.id} value={member.name}>{member.name}</option>))}</select></label>
                      <FieldInput label="Rolle" value={entry.role} onChange={(event) => setPlayForm((prev) => ({ ...prev, cast_entries: prev.cast_entries.map((row, rowIndex) => rowIndex === index ? { ...row, role: event.target.value } : row) }))} />
                      <button type="button" className="h-9 w-9 self-center rounded-full border text-sm text-red-700 md:self-end" onClick={() => setPlayForm((prev) => ({ ...prev, cast_entries: prev.cast_entries.filter((_, rowIndex) => rowIndex !== index) }))}>✕</button>
                    </div>
                  ))}
                  <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setPlayForm((prev) => ({ ...prev, cast_entries: [...prev.cast_entries, { member_name: '', role: '' }] }))}>Eintrag hinzufügen</button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Aufführungen</p>
                  {eventErrors.performances && <p className="text-xs text-red-600">{eventErrors.performances}</p>}
                  {playForm.performances.map((entry, index) => (
                    <div key={entry.id ?? index} className="rounded-xl border border-zinc-200 p-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        <FieldInput label="Ort" value={entry.venue} onChange={(event) => setPlayForm((prev) => ({ ...prev, performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, venue: event.target.value } : row) }))} required />
                        <FieldInput label="Aufführungsdatum" type="date" value={entry.event_date} onChange={(event) => setPlayForm((prev) => ({ ...prev, performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, event_date: event.target.value } : row) }))} required />
                        <FieldInput label="Aufführungszeit" type="time" value={entry.performance_time} onChange={(event) => setPlayForm((prev) => ({ ...prev, performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, performance_time: event.target.value } : row) }))} required />
                        <FieldInput label="Einlassbeginn" type="time" value={entry.admission_time} onChange={(event) => setPlayForm((prev) => ({ ...prev, performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, admission_time: event.target.value } : row) }))} required />
                        <FieldInput label="Gesamtanzahl Plätze" type="number" min={1} value={entry.total_seats} onChange={(event) => setPlayForm((prev) => ({ ...prev, performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, total_seats: event.target.value === '' ? '' : Number(event.target.value) } : row) }))} required />
                        <FieldInput label="Anzahl Online-Reservierungen" type="number" min={1} max={entry.total_seats || undefined} value={entry.online_seat_limit} onChange={(event) => setPlayForm((prev) => ({ ...prev, performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, online_seat_limit: event.target.value === '' ? '' : Number(event.target.value) } : row) }))} required />
                      </div>
                      <div className="mt-3 space-y-2">
                        {new Date(`${entry.event_date}T${entry.performance_time || '00:00'}:00`).getTime() < Date.now() && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Galerie (nur vergangene Aufführungen)</p>
                            <input ref={(node) => { galleryInputRefs.current[index] = node; }} type="file" accept="image/*" multiple onChange={(event) => onGalleryImageSelect(event, index)} className="hidden" />
                            <button type="button" onClick={() => galleryInputRefs.current[index]?.click()} className="rounded-lg border px-3 py-2 text-sm">Galeriebilder hinzufügen</button>
                            {(entry.gallery ?? []).length > 0 && (
                              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {(entry.gallery ?? []).map((imageUrl, galleryIndex) => (
                                  <div key={`${entry.id ?? index}-${galleryIndex}`} className="relative">
                                    <img src={imageUrl} alt={`Galeriebild ${galleryIndex + 1}`} className="aspect-video w-full rounded-lg border border-zinc-200 object-cover" />
                                    <button
                                      type="button"
                                      className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-xs text-red-700"
                                      onClick={() => setPlayForm((prev) => ({
                                        ...prev,
                                        performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, gallery: (row.gallery ?? []).filter((_, imageIndex) => imageIndex !== galleryIndex) } : row)
                                      }))}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button type="button" className="rounded-lg border px-3 py-1 text-sm text-red-700" onClick={() => setPlayForm((prev) => ({ ...prev, performances: prev.performances.filter((_, rowIndex) => rowIndex !== index) }))}>Aufführung entfernen</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setPlayForm((prev) => ({ ...prev, performances: [...prev.performances, { ...initialPerformance }] }))}>Aufführung hinzufügen</button>
                </div>

                <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-white">Speichern</button>
              </form>
            </div>
          )}

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {plays.map((entry) => {
              const hasUpcomingPerformance = entry.performances?.some((performance) => !performance.is_past);

              return (
                <PlayCard
                  key={entry.id}
                  title={entry.title}
                  description={entry.description}
                  posterImage={entry.hero_image_url}
                  slug={entry.slug}
                  mode={hasUpcomingPerformance ? 'upcoming' : 'past'}
                  performances={(entry.performances ?? []).map((performance) => ({
                    id: performance.id ?? `${entry.id}-${performance.event_date}-${performance.performance_time}`,
                    start_datetime: `${performance.event_date}T${performance.performance_time}:00`,
                    reserved_online_tickets: Number((performance as { reserved_online_tickets?: number }).reserved_online_tickets ?? 0),
                    online_quota: Number(performance.online_seat_limit ?? 0),
                    is_past: Boolean(performance.is_past)
                  }))}
                  showReservationLink={false}
                  actions={(
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPlayForm({
                            ...entry,
                            cast_entries: entry.cast_entries?.length ? entry.cast_entries : [{ member_name: '', role: '' }],
                            performances: entry.performances?.length
                              ? entry.performances.map((performance) => ({ ...performance, gallery: performance.gallery ?? [] }))
                              : [{ ...initialPerformance }]
                          });
                          setShowEventForm(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="rounded-lg border px-2 py-1 text-sm"
                        aria-label="Theaterstück bearbeiten"
                        title="Bearbeiten"
                      >
                        ✏️
                      </button>
                      <button type="button" onClick={() => deleteEvent(entry.id)} className="rounded-lg border px-2 py-1 text-sm text-red-700" aria-label="Theaterstück löschen" title="Löschen">🗑️</button>
                    </div>
                  )}
                />
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'members' && (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Mitglieder verwalten</h2>
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm font-medium"
              onClick={() => {
                setShowMemberForm((prev) => !prev);
                if (showMemberForm) {
                  setMemberForm(initialMember);
                  setClubRoleDraft('');
                }
              }}
            >
              {showMemberForm ? 'Form schließen' : 'Neues Mitglied erstellen'}
            </button>
          </div>

          {showMemberForm && (
            <form onSubmit={saveMember} className="mt-4 space-y-3">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Mitgliedsbild hochladen</label>
                <input ref={memberImageInputRef} type="file" accept="image/*" onChange={(event) => onImageSelect(event, 'member')} className="hidden" />
                <button type="button" onClick={() => memberImageInputRef.current?.click()} className="w-full rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">Bild auswählen</button>
                {memberErrors.image_url && <p className="mt-1 text-xs text-red-600">{memberErrors.image_url}</p>}
                {memberForm.image_url && <img src={memberForm.image_url} alt="Mitglied Vorschau" className="mt-2 aspect-[4/3] w-[320px] max-w-full rounded-xl border border-zinc-200 object-cover" />}
              </div>

              <FieldInput id="member-name" label="Name" value={memberForm.name} onChange={(event) => setMemberForm((prev) => ({ ...prev, name: event.target.value }))} required />
              <AutoTextarea id="member-description" label="Beschreibung" value={memberForm.description} onChange={(event) => setMemberForm((prev) => ({ ...prev, description: event.target.value }))} required className="min-h-[120px]" />

              <div className="space-y-2">
                <p className="text-sm font-medium">Vereinsrollen</p>
                <div className="flex gap-2">
                  <input className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" value={clubRoleDraft} onChange={(event) => setClubRoleDraft(event.target.value)} placeholder="z. B. Regie" />
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-2 text-sm"
                    onClick={() => {
                      if (!clubRoleDraft.trim()) {
                        setMemberErrors((prev) => ({ ...prev, club_roles: 'Bitte eine Rolle eingeben.' }));
                        return;
                      }
                      setMemberForm((prev) => ({ ...prev, club_roles: [...prev.club_roles.filter((role) => role.trim()), clubRoleDraft.trim()] }));
                      setClubRoleDraft('');
                      setMemberErrors((prev) => ({ ...prev, club_roles: '' }));
                    }}
                  >
                    Hinzufügen
                  </button>
                </div>
                {memberErrors.club_roles && <p className="text-xs text-red-600">{memberErrors.club_roles}</p>}
                <ul className="list-disc space-y-1 pl-6 text-sm text-zinc-700">
                  {memberForm.club_roles.filter((role) => role.trim()).map((role, index) => (
                    <li key={`${role}-${index}`} className="flex items-center justify-between gap-2">
                      <span>{role}</span>
                      <button type="button" className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs text-red-700" onClick={() => setMemberForm((prev) => ({ ...prev, club_roles: prev.club_roles.filter((entry) => entry.trim()).filter((_, entryIndex) => entryIndex !== index) }))}>✕</button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2 space-y-2">
                <p className="text-sm font-medium">Mitgespielte Stücke</p>
                {memberForm.participations.map((entry, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <label className="flex min-h-[84px] flex-col gap-1">
                      <span className="text-sm font-medium text-zinc-700">Stück</span>
                      <select className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" value={entry.piece} onChange={(event) => setMemberForm((prev) => ({ ...prev, participations: prev.participations.map((row, rowIndex) => rowIndex === index ? { ...row, piece: event.target.value } : row) }))}>
                        <option value="">Stück auswählen</option>
                        {plays.map((savedPlay) => (
                          <option key={savedPlay.id} value={savedPlay.title}>{savedPlay.title}</option>
                        ))}
                      </select>
                    </label>
                    <FieldInput label="Rolle im Stück" value={entry.role} onChange={(event) => setMemberForm((prev) => ({ ...prev, participations: prev.participations.map((row, rowIndex) => rowIndex === index ? { ...row, role: event.target.value } : row) }))} />
                    <button type="button" className="h-9 w-9 self-center rounded-full border text-sm text-red-700 md:self-end" onClick={() => setMemberForm((prev) => ({ ...prev, participations: prev.participations.filter((_, rowIndex) => rowIndex !== index) }))}>✕</button>
                  </div>
                ))}
                <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setMemberForm((prev) => ({ ...prev, participations: [...prev.participations, { piece: '', role: '' }] }))}>Eintrag hinzufügen</button>
              </div>

              <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-white">Speichern</button>
            </form>
          )}

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((entry) => (
              <MemberCard
                key={entry.id}
                name={entry.name}
                description={entry.description}
                imageUrl={entry.image_url}
                clubRoles={entry.club_roles ?? []}
                participations={entry.participations}
                actions={(
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setMemberForm(normalizeMemberForm(entry)); setShowMemberForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg border px-2 py-1 text-sm" aria-label="Mitglied bearbeiten" title="Bearbeiten">✏️</button>
                    <button type="button" onClick={() => deleteMember(entry.id)} className="rounded-lg border px-2 py-1 text-sm text-red-700" aria-label="Mitglied löschen" title="Löschen">🗑️</button>
                  </div>
                )}
              />
            ))}
          </div>
        </section>
      )}

      {activeTab === 'reservations' && (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="text-xl font-semibold">Reservierungen je Theaterstück</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <select className="rounded-lg border border-zinc-300 px-3 py-2" value={selectedReservationPlayId} onChange={(event) => setSelectedReservationPlayId(event.target.value)}>
              <option value="">Alle Theaterstücke</option>
              {plays.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.title}</option>
              ))}
            </select>
            <a href={`/api/admin/reservations?format=xlsx${selectedReservationPlayId ? `&play_id=${selectedReservationPlayId}` : ''}`} className="rounded-lg border px-3 py-2 text-sm">Export Excel</a>
          </div>

          <div className="mt-4 space-y-2">
            {filteredReservations.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                <div>
                  <p className="font-medium">{entry.name} ({entry.tickets} Tickets)</p>
                  <p className="text-xs text-zinc-500">{entry.play?.title ?? ''} · {entry.email}</p>
                </div>
                <button onClick={() => deleteReservation(entry.id)} className="rounded-lg border px-3 py-1 text-sm text-red-700">Löschen</button>
              </div>
            ))}
          </div>
        </section>
      )}
      {state.feedback && <p className="text-sm text-zinc-700">{state.feedback}</p>}
    </div>
  );
}
