import { toHourMinute } from '@/lib/format';

export function formatDateTime(date: string, time?: string) {
  const [year, month, day] = date.split('-');

  if (!year || !month || !day) {
    return time ? `${date} ${toHourMinute(time)} Uhr` : date;
  }

  if (!time) {
    return `${day}.${month}.${year}`;
  }

  return `${day}.${month}.${year} ${toHourMinute(time)} Uhr`;
}

export function isPastEvent(date: string, time?: string) {
  const dateTimeValue = time ? `${date}T${time}` : `${date}T23:59:59`;
  const eventDate = new Date(dateTimeValue);

  if (Number.isNaN(eventDate.getTime())) {
    return false;
  }

  return eventDate.getTime() < Date.now();
}
