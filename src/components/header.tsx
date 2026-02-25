import Link from 'next/link';

const links = [
  { href: '/', label: 'Start' },
  { href: '/mitglieder', label: 'Mitglieder' },
  { href: '/events', label: 'Aufführungen' },
  { href: '/admin', label: 'Admin' }
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="container-default flex flex-col gap-2 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <Link href="/" className="text-2xl font-semibold tracking-tight text-accent sm:text-base">
          Die Kistegucker e.V.
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-zinc-700">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
