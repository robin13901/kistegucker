import Link from 'next/link';

const links = [
  { href: '/', label: 'Start' },
  { href: '/mitglieder', label: 'Mitglieder' },
  { href: '/events', label: 'Events' },
  { href: '/tickets', label: 'Tickets' },
  { href: '/admin', label: 'Admin' }
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="container-default flex h-16 items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-accent">
          Die Kistegucker e.V.
        </Link>
        <nav className="flex gap-4 text-sm font-medium text-zinc-700">
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
