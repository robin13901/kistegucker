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
import { slugify, toHourMinute } from '@/lib/format';

type AdminState = {
  email: string;
  password: string;
  loggedIn: boolean;
  feedback?: string;
};

type CastEntry = { member_name: string; role: string };
type Participation = { piece: string; role: string };
type ValidationErrors = Record<string, string>;

type EventForm = {
  id?: string;
  slug?: string;
  title: string;
  description: string;
  event_date: string;
  performance_time: string;
  admission_time: string;
  total_seats: number | '';
  online_seat_limit: number | '';
  venue: string;
  hero_image_url: string;
  cast_entries: CastEntry[];
};

type MemberForm = {
  id?: string;
  name: string;
  description: string;
  image_url: string;
  club_roles: string[];
  participations: Participation[];
};

const DEFAULT_VENUE = 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)';
const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;

const initialEvent: EventForm = {
  title: '',
  description: '',
  event_date: '',
  performance_time: '',
  admission_time: '',
  total_seats: '',
  online_seat_limit: '',
  venue: DEFAULT_VENUE,
  hero_image_url: '',
  cast_entries: [{ member_name: '', role: '' }],
};

const initialMember: MemberForm = {
  name: '',
  description: '',
  image_url: '',
  club_roles: [''],
  participations: [{ piece: '', role: '' }]
};

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
  const [eventForm, setEventForm] = useState<EventForm>(initialEvent);
  const [memberForm, setMemberForm] = useState<MemberForm>(initialMember);
  const [events, setEvents] = useState<EventForm[]>([]);
  const [members, setMembers] = useState<MemberForm[]>([]);
  const [reservations, setReservations] = useState<Array<Record<string, unknown>>>([]);
  const [selectedReservationEventId, setSelectedReservationEventId] = useState<string>('');
  const [eventErrors, setEventErrors] = useState<ValidationErrors>({});
  const [memberErrors, setMemberErrors] = useState<ValidationErrors>({});
  const [clubRoleDraft, setClubRoleDraft] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const eventImageInputRef = useRef<HTMLInputElement | null>(null);
  const memberImageInputRef = useRef<HTMLInputElement | null>(null);
  const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const supabase = useMemo(() => (hasSupabaseConfig ? createClientComponentClient() : null), [hasSupabaseConfig]);

  async function loadData() {
    const [eventResponse, memberResponse, reservationResponse] = await Promise.all([
      fetch('/api/admin/events'),
      fetch('/api/admin/members'),
      fetch('/api/admin/reservations')
    ]);

    if (eventResponse.ok) {
      const result = await eventResponse.json();
      setEvents(result.data ?? []);
    }

    if (memberResponse.ok) {
      const result = await memberResponse.json();
      setMembers(result.data ?? []);
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

  async function onImageSelect(event: ChangeEvent<HTMLInputElement>, type: 'event' | 'member') {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const url = await preprocessImageFile(file);
      if (type === 'event') {
        setEventErrors((prev) => ({ ...prev, hero_image_url: '' }));
        setEventForm((prev) => ({ ...prev, hero_image_url: url }));
      } else {
        setMemberErrors((prev) => ({ ...prev, image_url: '' }));
        setMemberForm((prev) => ({ ...prev, image_url: url }));
        const suggestedName = `${slugify(memberForm.name || file.name.replace(/\.[^.]+$/, ''))}.webp`;
        setState((prev) => ({ ...prev, feedback: `Bild erfolgreich verarbeitet (WebP/Max 1MB). Dateiname: ${suggestedName}` }));
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
      ...eventForm,
      cast_entries: eventForm.cast_entries.filter((entry) => entry.member_name.trim() || entry.role.trim())
    };

    const localErrors: ValidationErrors = {};

    if (!payload.title.trim()) localErrors.title = 'Bitte einen Titel eingeben.';
    if (!payload.event_date) localErrors.event_date = 'Bitte ein Aufführungsdatum wählen.';
    if (!payload.performance_time) localErrors.performance_time = 'Bitte eine Aufführungszeit angeben.';
    if (!payload.admission_time) localErrors.admission_time = 'Bitte eine Einlasszeit angeben.';
    if (!payload.description.trim()) localErrors.description = 'Bitte eine Beschreibung eingeben.';
    if (!payload.total_seats || payload.total_seats < 1) localErrors.total_seats = 'Bitte die Gesamtanzahl Plätze angeben.';
    if (!payload.online_seat_limit || payload.online_seat_limit < 1) localErrors.online_seat_limit = 'Bitte die Anzahl Online-Reservierungen angeben.';
    if (payload.total_seats && payload.online_seat_limit && payload.online_seat_limit > payload.total_seats) {
      localErrors.online_seat_limit = 'Online-Reservierungen dürfen nicht höher als die Gesamtplätze sein.';
    }

    payload.cast_entries.forEach((entry, index) => {
      if (!entry.role.trim()) localErrors[`cast_entries.${index}.role`] = 'Bitte einen Rollennamen angeben.';
      if (!entry.member_name.trim()) localErrors[`cast_entries.${index}.member_name`] = 'Bitte ein Mitglied auswählen.';
    });

    if (Object.values(localErrors).some(Boolean)) {
      setEventErrors(localErrors);
      setState((prev) => ({ ...prev, feedback: 'Bitte korrigiere die markierten Felder im Aufführungsformular.' }));
      return;
    }

    const response = await fetch('/api/admin/events', {
      method: eventForm.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setEventErrors(result.fieldErrors ?? {});
      setState((prev) => ({ ...prev, feedback: result.error ?? 'Aufführung konnte nicht gespeichert werden.' }));
      return;
    }

    setState((prev) => ({ ...prev, feedback: 'Aufführung gespeichert.' }));
    setEventForm(initialEvent);
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

    setState((prev) => ({ ...prev, feedback: 'Mitglied gespeichert.' }));
    setMemberForm(initialMember);
    setClubRoleDraft('');
    setShowMemberForm(false);
    await loadData();
  }

  async function deleteEvent(id?: string) {
    if (!id) return;
    const response = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
    setState((prev) => ({ ...prev, feedback: response.ok ? 'Aufführung gelöscht.' : 'Aufführung konnte nicht gelöscht werden.' }));
    if (response.ok) {
      await loadData();
    }
  }

  async function deleteMember(id?: string) {
    if (!id) return;
    const response = await fetch(`/api/admin/members?id=${id}`, { method: 'DELETE' });
    setState((prev) => ({ ...prev, feedback: response.ok ? 'Mitglied gelöscht.' : 'Mitglied konnte nicht gelöscht werden.' }));
    if (response.ok) {
      await loadData();
    }
  }

  async function deleteReservation(id: string) {
    const response = await fetch(`/api/admin/reservations?id=${id}`, { method: 'DELETE' });
    setState((prev) => ({ ...prev, feedback: response.ok ? 'Reservierung gelöscht.' : 'Reservierung konnte nicht gelöscht werden.' }));
    if (response.ok) {
      await loadData();
    }
  }

  if (!state.loggedIn) {
    return (
      <form onSubmit={signIn} className="max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-xl font-semibold">Admin Login</h2>
        <input
          type="email"
          placeholder="admin@kistegucker.de"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={state.email}
          onChange={(event) => setState((prev) => ({ ...prev, email: event.target.value }))}
        />
        <input
          type="password"
          placeholder="Passwort"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={state.password}
          onChange={(event) => setState((prev) => ({ ...prev, password: event.target.value }))}
        />
        <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-white">Einloggen</button>
        {state.feedback && <p className="text-sm text-zinc-600">{state.feedback}</p>}
      </form>
    );
  }

  const filteredReservations = selectedReservationEventId
    ? reservations.filter((entry) => (entry.event as { id?: string })?.id === selectedReservationEventId)
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
                if (showEventForm) setEventForm(initialEvent);
              }}
            >
              {showEventForm ? 'Form schließen' : 'Neue Aufführung erstellen'}
            </button>
          </div>

          {showEventForm && (
            <form onSubmit={saveEvent} className="mt-4 space-y-3">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Titelbild hochladen</label>
                <input ref={eventImageInputRef} type="file" accept="image/*" onChange={(event) => onImageSelect(event, 'event')} className="hidden" />
                <button type="button" onClick={() => eventImageInputRef.current?.click()} className="w-full rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                  Bild auswählen
                </button>
                {eventErrors.hero_image_url && <p className="mt-1 text-xs text-red-600">{eventErrors.hero_image_url}</p>}
                {eventForm.hero_image_url && <img src={eventForm.hero_image_url} alt="Titelbild Vorschau" className="mt-2 aspect-video w-full rounded-xl border border-zinc-200 object-cover" />}
              </div>

              <FieldInput id="event-title" label="Titel des Theaterstücks" value={eventForm.title} onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <FieldInput id="event-venue" label="Ort" value={eventForm.venue} onChange={(event) => setEventForm((prev) => ({ ...prev, venue: event.target.value }))} required />
              <FieldInput id="event-date" type="date" label="Aufführungsdatum" value={eventForm.event_date} onChange={(event) => setEventForm((prev) => ({ ...prev, event_date: event.target.value }))} required />
              <FieldInput id="event-performance-time" type="time" label="Aufführungszeit" value={eventForm.performance_time} onChange={(event) => setEventForm((prev) => ({ ...prev, performance_time: event.target.value }))} required />
              <FieldInput id="event-admission-time" type="time" label="Einlassbeginn" value={eventForm.admission_time} onChange={(event) => setEventForm((prev) => ({ ...prev, admission_time: event.target.value }))} required />
              <FieldInput id="event-total-seats" type="number" min={1} label="Gesamtanzahl Plätze" value={eventForm.total_seats} onChange={(event) => setEventForm((prev) => ({ ...prev, total_seats: event.target.value === '' ? '' : Number(event.target.value) }))} required />
              <FieldInput id="event-online-seats" type="number" min={1} max={eventForm.total_seats || undefined} label="Anzahl Online-Reservierungen" value={eventForm.online_seat_limit} onChange={(event) => setEventForm((prev) => ({ ...prev, online_seat_limit: event.target.value === '' ? '' : Number(event.target.value) }))} required />
              <AutoTextarea id="event-description" label="Beschreibung" value={eventForm.description} onChange={(event) => setEventForm((prev) => ({ ...prev, description: event.target.value }))} required className="min-h-[120px]" />

              <div className="space-y-2">
                <p className="text-sm font-medium">Besetzung</p>
                {eventForm.cast_entries.map((entry, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <label className="flex min-h-[84px] flex-col gap-1"><span className="text-sm font-medium text-zinc-700">Mitglied</span><select className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" value={entry.member_name} onChange={(event) => setEventForm((prev) => ({ ...prev, cast_entries: prev.cast_entries.map((row, rowIndex) => rowIndex === index ? { ...row, member_name: event.target.value } : row) }))}><option value="">Mitglied auswählen</option>{members.map((member) => (<option key={member.id} value={member.name}>{member.name}</option>))}</select></label>
                    <FieldInput label="Rolle" value={entry.role} onChange={(event) => setEventForm((prev) => ({ ...prev, cast_entries: prev.cast_entries.map((row, rowIndex) => rowIndex === index ? { ...row, role: event.target.value } : row) }))} />
                    <button type="button" className="h-9 w-9 self-center rounded-full border text-sm text-red-700 md:self-end" onClick={() => setEventForm((prev) => ({ ...prev, cast_entries: prev.cast_entries.filter((_, rowIndex) => rowIndex !== index) }))}>✕</button>
                  </div>
                ))}
                <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setEventForm((prev) => ({ ...prev, cast_entries: [...prev.cast_entries, { member_name: '', role: '' }] }))}>Eintrag hinzufügen</button>
              </div>

              <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-white">Speichern</button>
            </form>
          )}

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {events.map((entry) => (
              <article key={entry.id} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-zinc-200">
                {entry.hero_image_url && <img src={entry.hero_image_url} alt={entry.title} className="h-44 w-full rounded-xl object-cover" />}
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{entry.title}</h3>
                    <p className="text-sm text-zinc-500">{entry.event_date} · {toHourMinute(entry.performance_time)} Uhr</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEventForm(entry);
                        setShowEventForm(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="rounded-lg border px-2 py-1 text-sm"
                      aria-label="Aufführung bearbeiten"
                      title="Bearbeiten"
                    >
                      ✏️
                    </button>
                    <button type="button" onClick={() => deleteEvent(entry.id)} className="rounded-lg border px-2 py-1 text-sm text-red-700" aria-label="Aufführung löschen" title="Löschen">🗑️</button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-zinc-700">{entry.description}</p>
              </article>
            ))}
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
                        {events.map((savedEvent) => (
                          <option key={savedEvent.id} value={savedEvent.title}>{savedEvent.title}</option>
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
                    <button type="button" onClick={() => { setMemberForm(entry); setShowMemberForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg border px-2 py-1 text-sm" aria-label="Mitglied bearbeiten" title="Bearbeiten">✏️</button>
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
          <h2 className="text-xl font-semibold">Reservierungen je Aufführung</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <select className="rounded-lg border border-zinc-300 px-3 py-2" value={selectedReservationEventId} onChange={(event) => setSelectedReservationEventId(event.target.value)}>
              <option value="">Alle Aufführungen</option>
              {events.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.title}</option>
              ))}
            </select>
            <a href={`/api/admin/reservations?format=csv${selectedReservationEventId ? `&event_id=${selectedReservationEventId}` : ''}`} className="rounded-lg border px-3 py-2 text-sm">Export CSV</a>
            <a href={`/api/admin/reservations?format=xlsx${selectedReservationEventId ? `&event_id=${selectedReservationEventId}` : ''}`} className="rounded-lg border px-3 py-2 text-sm">Export Excel</a>
          </div>

          <div className="mt-4 space-y-2">
            {filteredReservations.map((entry) => (
              <div key={String(entry.id)} className="flex flex-wrap items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                <div>
                  <p className="font-medium">{String(entry.name)} ({String(entry.ticket_count)} Tickets)</p>
                  <p className="text-xs text-zinc-500">{String((entry.event as { title?: string })?.title ?? '')} · {String(entry.email)}</p>
                </div>
                <button onClick={() => deleteReservation(String(entry.id))} className="rounded-lg border px-3 py-1 text-sm text-red-700">Löschen</button>
              </div>
            ))}
          </div>
        </section>
      )}
      {state.feedback && <p className="text-sm text-zinc-700">{state.feedback}</p>}
    </div>
  );
}
