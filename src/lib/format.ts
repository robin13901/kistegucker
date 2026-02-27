export function toHourMinute(time: string) {
  if (!time) return '';
  return time.slice(0, 5);
}

export function formatRoles(roles: string[]) {
  const cleanRoles = roles.map((role) => role.trim()).filter(Boolean);

  if (cleanRoles.length <= 1) return cleanRoles[0] ?? '';
  if (cleanRoles.length === 2) return `${cleanRoles[0]} und ${cleanRoles[1]}`;
  return `${cleanRoles.slice(0, -1).join(', ')} & ${cleanRoles.at(-1)}`;
}

export function slugify(value: string) {
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

export function formatDate(value: string): string {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}
