'use client';

import {
  ChangeEvent,
  FormEvent,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MemberCard } from '@/components/member-card';
import { PlayCard } from '@/components/play-card';
import { slugify } from '@/lib/format';
import { formatDate } from '@/lib/format';

type AdminState = {
  email: string;
  password: string;
  loggedIn: boolean;
  loading: boolean;
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
  performance?: { id?: string; start_datetime?: string };
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
  const router = useRouter();
  const [state, setState] = useState<AdminState>({ email: '', password: '', loggedIn: false, loading: true });
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
  const [dataLoading, setDataLoading] = useState(false);
  const eventImageInputRef = useRef<HTMLInputElement | null>(null);
  const memberImageInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const supabase = useMemo(() => (hasSupabaseConfig ? createClientComponentClient() : null), [hasSupabaseConfig]);

  // Check for existing session on mount (handles router.refresh() state loss)
  useEffect(() => {
    async function checkSession() {
      if (!supabase) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setState((prev) => ({ ...prev, loggedIn: true, loading: false }));
        await loadData();
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    }
    checkSession();
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    setDataLoading(true);
    try {
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
    } finally {
      setDataLoading(false);
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

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setState({ email: '', password: '', loggedIn: false, loading: false });
  }


  async function onGalleryImageSelect(event: ChangeEvent<HTMLInputElement>, performanceIndex: number) {
    const files = Array.from(event.target.files ?? []);
    if (files.length < 1) return;

    const performance = playForm.performances[performanceIndex];
    if (!performance) return;

    // Use is_past from database if available, otherwise calculate
    const isPast = performance.is_past ?? (
      performance.event_date &&
      new Date(`${performance.event_date}T${performance.performance_time || '23:59'}:00`).getTime() < Date.now()
    );

    if (!isPast) {
      setState((prev) => ({ ...prev, feedback: 'Galeriebilder können nur für vergangene Aufführungen hochgeladen werden.' }));
      event.target.value = '';
      return;
    }

    try {
      setState((prev) => ({ ...prev, feedback: 'Bilder werden verarbeitet...' }));
      const converted = await Promise.all(files.map((file) => preprocessImageFile(file)));
      setPlayForm((prev) => ({
        ...prev,
        performances: prev.performances.map((row, rowIndex) => rowIndex === performanceIndex ? { ...row, gallery: [...(row.gallery ?? []), ...converted] } : row)
      }));
      setState((prev) => ({ ...prev, feedback: `${converted.length} Bild(er) hinzugefügt.` }));
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
    router.refresh(); // Invalidate client-side Router Cache
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
    router.refresh(); // Invalidate client-side Router Cache
    await loadData();
  }

  async function deleteEvent(id?: string) {
    if (!id) return;
    const response = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
    setState((prev) => ({ ...prev, feedback: response.ok ? 'Stück gelöscht.' : 'Stück konnte nicht gelöscht werden.' }));
    if (response.ok) {
      router.refresh(); // Invalidate client-side Router Cache
      await loadData();
    }
  }

  async function deleteMember(id?: string) {
    if (!id) return;
    const response = await fetch(`/api/admin/members?id=${id}`, { method: 'DELETE' });
    setState((prev) => ({ ...prev, feedback: response.ok ? 'Mitglied gelöscht.' : 'Mitglied konnte nicht gelöscht werden.' }));
    if (response.ok) {
      router.refresh(); // Invalidate client-side Router Cache
      await loadData();
    }
  }

  async function deleteReservation(id: string) {
    const response = await fetch(`/api/admin/reservations?id=${id}`, { method: 'DELETE' });
    setState((prev) => ({ ...prev, feedback: response.ok ? 'Reservierung gelöscht.' : 'Reservierung konnte nicht gelöscht werden.' }));
    if (response.ok) {
      router.refresh(); // Invalidate client-side Router Cache
      await loadData();
    }
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500">Lade...</p>
      </div>
    );
  }

  if (!state.loggedIn) {
    return (
      <form onSubmit={signIn} className="max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-xl font-semibold">Admin Login</h2>
        <input type="email" placeholder="E-Mail-Adresse" className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" value={state.email} onChange={(event) => setState((prev) => ({ ...prev, email: event.target.value }))} />
        <input type="password" placeholder="Passwort" className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" value={state.password} onChange={(event) => setState((prev) => ({ ...prev, password: event.target.value }))} />
        <button className="w-full rounded-xl bg-accent px-4 py-2.5 font-semibold text-white transition hover:bg-accent/90">Einloggen</button>
        {state.feedback && <p className="text-sm text-red-600">{state.feedback}</p>}
      </form>
    );
  }

  const filteredReservations = selectedReservationPlayId
    ? reservations.filter((entry) => entry.play?.id === selectedReservationPlayId)
    : reservations;

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-accent" />
      <p className="mt-4 text-sm text-zinc-500">Daten werden geladen...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('events')} className={`rounded-xl border px-4 py-2 ${activeTab === 'events' ? 'border-accent bg-accent text-white' : ''}`}>Aufführungen</button>
          <button onClick={() => setActiveTab('members')} className={`rounded-xl border px-4 py-2 ${activeTab === 'members' ? 'border-accent bg-accent text-white' : ''}`}>Mitglieder</button>
          <button onClick={() => setActiveTab('reservations')} className={`rounded-xl border px-4 py-2 ${activeTab === 'reservations' ? 'border-accent bg-accent text-white' : ''}`}>Reservierungen</button>
        </div>
        <button onClick={signOut} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100">Abmelden</button>
      </div>

      {dataLoading && <LoadingSpinner />}

      {!dataLoading && activeTab === 'events' && (
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
            <form onSubmit={saveEvent} className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 md:p-6">
              {/* Section 1: Basic Info */}
              <fieldset className="space-y-4">
                <legend className="mb-3 flex items-center gap-2 text-base font-semibold text-zinc-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white">1</span>
                  Allgemeine Informationen
                </legend>

                <div className="grid gap-4 md:grid-cols-[280px_1fr]">
                  <div className="flex flex-col items-center gap-3">
                    <input ref={eventImageInputRef} type="file" accept="image/*" onChange={(event) => onImageSelect(event, 'event')} className="hidden" />
                    {playForm.hero_image_url ? (
                      <div className="relative w-full">
                        <img src={playForm.hero_image_url} alt="Titelbild Vorschau" className="aspect-video w-full rounded-xl border border-zinc-200 object-cover" />
                        <button
                          type="button"
                          onClick={() => eventImageInputRef.current?.click()}
                          className="absolute bottom-2 right-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium shadow-sm transition hover:bg-white"
                        >
                          Ändern
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => eventImageInputRef.current?.click()}
                        className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-white text-sm text-zinc-500 transition hover:border-accent hover:bg-zinc-50"
                      >
                        <span className="text-2xl">+</span>
                        <span className="mt-1">Titelbild hochladen</span>
                      </button>
                    )}
                    {eventErrors.hero_image_url && <p className="text-xs text-red-600">{eventErrors.hero_image_url}</p>}
                  </div>

                  <div className="space-y-3">
                    <FieldInput id="event-title" label="Titel des Theaterstücks" value={playForm.title} onChange={(event) => setPlayForm((prev) => ({ ...prev, title: event.target.value }))} required />
                    <AutoTextarea id="event-description" label="Beschreibung" value={playForm.description} onChange={(event) => setPlayForm((prev) => ({ ...prev, description: event.target.value }))} required className="min-h-[100px]" />
                  </div>
                </div>
              </fieldset>

              <hr className="my-6 border-zinc-200" />

              {/* Section 2: Cast */}
              <fieldset className="space-y-3">
                <legend className="mb-3 flex items-center gap-2 text-base font-semibold text-zinc-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white">2</span>
                  Besetzung
                </legend>

                <div className="space-y-3">
                  {playForm.cast_entries.map((entry, index) => (
                    <div key={index} className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 md:flex-row md:items-center">
                      <select
                        className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                        value={entry.member_name}
                        onChange={(event) => setPlayForm((prev) => ({ ...prev, cast_entries: prev.cast_entries.map((row, rowIndex) => rowIndex === index ? { ...row, member_name: event.target.value } : row) }))}
                      >
                        <option value="">Mitglied auswählen...</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.name}>{member.name}</option>
                        ))}
                      </select>
                      <span className="hidden text-zinc-400 md:block">spielt</span>
                      <input
                        className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                        value={entry.role}
                        onChange={(event) => setPlayForm((prev) => ({ ...prev, cast_entries: prev.cast_entries.map((row, rowIndex) => rowIndex === index ? { ...row, role: event.target.value } : row) }))}
                        placeholder="Rolle"
                      />
                      <button
                        type="button"
                        className="self-end rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-100 md:self-center"
                        onClick={() => setPlayForm((prev) => ({ ...prev, cast_entries: prev.cast_entries.filter((_, rowIndex) => rowIndex !== index) }))}
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="rounded-xl border border-dashed border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:border-accent hover:bg-accent/5 hover:text-accent"
                  onClick={() => setPlayForm((prev) => ({ ...prev, cast_entries: [...prev.cast_entries, { member_name: '', role: '' }] }))}
                >
                  + Besetzung hinzufügen
                </button>
              </fieldset>

              <hr className="my-6 border-zinc-200" />

              {/* Section 3: Performances */}
              <fieldset className="space-y-3">
                <legend className="mb-3 flex items-center gap-2 text-base font-semibold text-zinc-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white">3</span>
                  Aufführungstermine
                </legend>
                {eventErrors.performances && <p className="text-xs text-red-600">{eventErrors.performances}</p>}

                <div className="space-y-4">
                  {playForm.performances.map((entry, index) => {
                    // Use is_past from database if available, otherwise calculate
                    const isPast = entry.is_past ?? (
                      entry.event_date &&
                      new Date(`${entry.event_date}T${entry.performance_time || '23:59'}:00`).getTime() < Date.now()
                    );

                    return (
                      <div key={entry.id ?? index} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                        <div className="flex items-center justify-between bg-zinc-100 px-4 py-2">
                          <span className="text-sm font-medium text-zinc-700">
                            {entry.event_date ? new Date(entry.event_date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : `Aufführung ${index + 1}`}
                            {entry.performance_time && ` um ${entry.performance_time} Uhr`}
                          </span>
                          <button
                            type="button"
                            className="rounded-lg px-2 py-1 text-sm text-red-700 transition hover:bg-red-100"
                            onClick={() => setPlayForm((prev) => ({ ...prev, performances: prev.performances.filter((_, rowIndex) => rowIndex !== index) }))}
                          >
                            Entfernen
                          </button>
                        </div>

                        <div className="p-4 space-y-4">
                          {/* Date & Time Row */}
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="min-w-0">
                              <label className="mb-1 block text-xs font-medium text-zinc-600">Datum</label>
                              <input
                                type="date"
                                className="w-full min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                                value={entry.event_date}
                                onChange={(event) => setPlayForm((prev) => ({ ...prev, performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, event_date: event.target.value } : row) }))}
                                required
                              />
                            </div>
                            <div className="min-w-0">
                              <label className="mb-1 block text-xs font-medium text-zinc-600">Beginn</label>
                              <input
                                type="time"
                                className="w-full min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                                value={entry.performance_time}
                                onChange={(event) => setPlayForm((prev) => ({ ...prev, performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, performance_time: event.target.value } : row) }))}
                                required
                              />
                            </div>
                            <div className="min-w-0">
                              <label className="mb-1 block text-xs font-medium text-zinc-600">Einlass</label>
                              <input
                                type="time"
                                className="w-full min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                                value={entry.admission_time}
                                onChange={(event) => setPlayForm((prev) => ({ ...prev, performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, admission_time: event.target.value } : row) }))}
                                required
                              />
                            </div>
                          </div>

                          {/* Venue */}
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600">Veranstaltungsort</label>
                            <input
                              type="text"
                              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                              value={entry.venue}
                              onChange={(event) => setPlayForm((prev) => ({ ...prev, performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, venue: event.target.value } : row) }))}
                              required
                            />
                          </div>

                          {/* Seats Row */}
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-zinc-600">Gesamtplätze</label>
                              <input
                                type="number"
                                min={1}
                                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                                value={entry.total_seats}
                                onChange={(event) => setPlayForm((prev) => ({ ...prev, performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, total_seats: event.target.value === '' ? '' : Number(event.target.value) } : row) }))}
                                required
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-zinc-600">Online-Reservierungen max.</label>
                              <input
                                type="number"
                                min={1}
                                max={entry.total_seats || undefined}
                                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                                value={entry.online_seat_limit}
                                onChange={(event) => setPlayForm((prev) => ({ ...prev, performances: prev.performances.map((row, rowIndex) => rowIndex === index ? { ...row, online_seat_limit: event.target.value === '' ? '' : Number(event.target.value) } : row) }))}
                                required
                              />
                            </div>
                          </div>

                          {/* Gallery for past performances */}
                          {isPast && (
                            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3">
                              <p className="mb-2 text-xs font-medium text-zinc-600">Galerie (vergangene Aufführung)</p>
                              <input ref={(node) => { galleryInputRefs.current[index] = node; }} type="file" accept="image/*" multiple onChange={(event) => onGalleryImageSelect(event, index)} className="hidden" />
                              <button type="button" onClick={() => galleryInputRefs.current[index]?.click()} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm transition hover:bg-zinc-50">+ Bilder hinzufügen</button>
                              {(entry.gallery ?? []).length > 0 && (
                                <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-4">
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
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="rounded-xl border border-dashed border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:border-accent hover:bg-accent/5 hover:text-accent"
                  onClick={() => setPlayForm((prev) => ({ ...prev, performances: [...prev.performances, { ...initialPerformance }] }))}
                >
                  + Aufführungstermin hinzufügen
                </button>
              </fieldset>

              <hr className="my-6 border-zinc-200" />

              {/* Submit */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-300 px-6 py-2.5 text-sm font-medium transition hover:bg-zinc-100"
                  onClick={() => { setShowEventForm(false); setPlayForm(initialPlay); }}
                >
                  Abbrechen
                </button>
                <button className="rounded-xl bg-accent px-6 py-2.5 font-semibold text-white transition hover:bg-accent/90">
                  {playForm.id ? 'Änderungen speichern' : 'Theaterstück erstellen'}
                </button>
              </div>
            </form>
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
                  showDetailsLink={false}
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

      {!dataLoading && activeTab === 'members' && (
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
            <form onSubmit={saveMember} className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 md:p-6">
              {/* Section 1: Basic Info */}
              <fieldset className="space-y-4">
                <legend className="mb-3 flex items-center gap-2 text-base font-semibold text-zinc-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white">1</span>
                  Allgemeine Informationen
                </legend>

                <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                  <div className="flex flex-col items-center gap-3">
                    <input ref={memberImageInputRef} type="file" accept="image/*" onChange={(event) => onImageSelect(event, 'member')} className="hidden" />
                    {memberForm.image_url ? (
                      <div className="relative">
                        <img src={memberForm.image_url} alt="Mitglied Vorschau" className="aspect-square w-32 rounded-xl border border-zinc-200 object-cover md:w-40" />
                        <button
                          type="button"
                          onClick={() => memberImageInputRef.current?.click()}
                          className="absolute bottom-2 right-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium shadow-sm transition hover:bg-white"
                        >
                          Ändern
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => memberImageInputRef.current?.click()}
                        className="flex aspect-square w-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-white text-sm text-zinc-500 transition hover:border-accent hover:bg-zinc-50 md:w-40"
                      >
                        <span className="text-2xl">+</span>
                        <span className="mt-1">Foto</span>
                      </button>
                    )}
                    {memberErrors.image_url && <p className="text-xs text-red-600">{memberErrors.image_url}</p>}
                  </div>

                  <div className="space-y-3">
                    <FieldInput id="member-name" label="Name" value={memberForm.name} onChange={(event) => setMemberForm((prev) => ({ ...prev, name: event.target.value }))} required />
                    <AutoTextarea id="member-description" label="Beschreibung" value={memberForm.description} onChange={(event) => setMemberForm((prev) => ({ ...prev, description: event.target.value }))} required className="min-h-[100px]" />
                  </div>
                </div>
              </fieldset>

              <hr className="my-6 border-zinc-200" />

              {/* Section 2: Club Roles */}
              <fieldset className="space-y-3">
                <legend className="mb-3 flex items-center gap-2 text-base font-semibold text-zinc-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white">2</span>
                  Vereinsrollen
                </legend>

                <div className="flex flex-wrap gap-2">
                  {memberForm.club_roles.filter((role) => role.trim()).map((role, index) => (
                    <span key={`${role}-${index}`} className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
                      {role}
                      <button
                        type="button"
                        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-accent/70 transition hover:bg-accent/20 hover:text-accent"
                        onClick={() => setMemberForm((prev) => ({ ...prev, club_roles: prev.club_roles.filter((entry) => entry.trim()).filter((_, entryIndex) => entryIndex !== index) }))}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    value={clubRoleDraft}
                    onChange={(event) => setClubRoleDraft(event.target.value)}
                    placeholder="z. B. Regie, Technik, Vorstand..."
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        if (clubRoleDraft.trim()) {
                          setMemberForm((prev) => ({ ...prev, club_roles: [...prev.club_roles.filter((role) => role.trim()), clubRoleDraft.trim()] }));
                          setClubRoleDraft('');
                          setMemberErrors((prev) => ({ ...prev, club_roles: '' }));
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-zinc-50"
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
                    +
                  </button>
                </div>
                {memberErrors.club_roles && <p className="text-xs text-red-600">{memberErrors.club_roles}</p>}
              </fieldset>

              <hr className="my-6 border-zinc-200" />

              {/* Section 3: Participations */}
              <fieldset className="space-y-3">
                <legend className="mb-3 flex items-center gap-2 text-base font-semibold text-zinc-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white">3</span>
                  Mitgespielte Stücke
                </legend>

                <div className="space-y-3">
                  {memberForm.participations.map((entry, index) => (
                    <div key={index} className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 md:flex-row md:items-center">
                      <select
                        className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                        value={entry.piece}
                        onChange={(event) => setMemberForm((prev) => ({ ...prev, participations: prev.participations.map((row, rowIndex) => rowIndex === index ? { ...row, piece: event.target.value } : row) }))}
                      >
                        <option value="">Stück auswählen...</option>
                        {plays.map((savedPlay) => (
                          <option key={savedPlay.id} value={savedPlay.title}>{savedPlay.title}</option>
                        ))}
                      </select>
                      <span className="hidden text-zinc-400 md:block">als</span>
                      <input
                        className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                        value={entry.role}
                        onChange={(event) => setMemberForm((prev) => ({ ...prev, participations: prev.participations.map((row, rowIndex) => rowIndex === index ? { ...row, role: event.target.value } : row) }))}
                        placeholder="Rolle im Stück"
                      />
                      <button
                        type="button"
                        className="self-end rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-100 md:self-center"
                        onClick={() => setMemberForm((prev) => ({ ...prev, participations: prev.participations.filter((_, rowIndex) => rowIndex !== index) }))}
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="rounded-xl border border-dashed border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:border-accent hover:bg-accent/5 hover:text-accent"
                  onClick={() => setMemberForm((prev) => ({ ...prev, participations: [...prev.participations, { piece: '', role: '' }] }))}
                >
                  + Stück hinzufügen
                </button>
              </fieldset>

              <hr className="my-6 border-zinc-200" />

              {/* Submit */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-300 px-6 py-2.5 text-sm font-medium transition hover:bg-zinc-100"
                  onClick={() => { setShowMemberForm(false); setMemberForm(initialMember); setClubRoleDraft(''); }}
                >
                  Abbrechen
                </button>
                <button className="rounded-xl bg-accent px-6 py-2.5 font-semibold text-white transition hover:bg-accent/90">
                  {memberForm.id ? 'Änderungen speichern' : 'Mitglied erstellen'}
                </button>
              </div>
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
                    <button type="button" onClick={() => { if (window.confirm(`"${entry.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) deleteMember(entry.id); }} className="rounded-lg border px-2 py-1 text-sm text-red-700" aria-label="Mitglied löschen" title="Löschen">🗑️</button>
                  </div>
                )}
              />
            ))}
          </div>
        </section>
      )}

      {!dataLoading && activeTab === 'reservations' && (
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
            {filteredReservations.length === 0 && (
              <p className="text-sm text-zinc-500">Keine Reservierungen vorhanden.</p>
            )}
            {filteredReservations.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{entry.name}</p>
                  <p className="text-sm text-zinc-600">{entry.tickets} {entry.tickets === 1 ? 'Ticket' : 'Tickets'} · {entry.email}</p>
                  <p className="text-xs text-zinc-500">{entry.play?.title ?? 'Unbekanntes Stück'}{entry.performance?.start_datetime ? ` · ${formatDate(entry.performance.start_datetime)}` : ''}</p>
                </div>
                <button onClick={() => { if (window.confirm(`Reservierung von ${entry.name} wirklich löschen?`)) deleteReservation(entry.id); }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-100">Löschen</button>
              </div>
            ))}
          </div>
        </section>
      )}
      {state.feedback && <p className="text-sm text-zinc-700">{state.feedback}</p>}
    </div>
  );
}
