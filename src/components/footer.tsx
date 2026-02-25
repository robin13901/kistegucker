import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-zinc-200 bg-white">
      <div className="container-default flex flex-col gap-3 py-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Die Kistegucker e.V. · Linsengericht</p>
        <div className="flex gap-4">
          <Link href="/impressum" className="hover:text-accent">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-accent">
            Datenschutz
          </Link>
        </div>
      </div>
    </footer>
  );
}
