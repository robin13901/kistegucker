import { AdminDashboard } from '@/components/admin-dashboard';

export default function AdminPage() {
  return (
    <div className="container-default space-y-6 py-12">
      <h1 className="text-3xl font-bold">Adminbereich</h1>
      <p className="max-w-2xl text-zinc-700">
        Geschützter Bereich für den Vorstand. Nur verifizierte Admin-Accounts mit passender
        Metadaten-Rolle dürfen Daten ändern.
      </p>
      <AdminDashboard />
    </div>
  );
}
