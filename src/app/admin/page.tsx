import { AdminDashboard } from '@/components/admin-dashboard';

export default function AdminPage() {
  return (
    <div className="container-default space-y-6 py-12">
      <h1 className="text-3xl font-bold">Adminbereich</h1>
      <p className="max-w-2xl text-zinc-700">
        Bereich zur Verwaltung von Mitgliedern, Aufführungen und Reservierungen.
      </p>
      <AdminDashboard />
    </div>
  );
}
