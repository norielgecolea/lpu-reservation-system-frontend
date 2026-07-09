/** Check if a reservation row belongs to the given YYYY-MM month filter. */
export function reservationMatchesMonth(
  reservedDatesJson: string,
  coordinationDate: string | null,
  createdAt: string,
  monthPrefix: string,
): boolean {
  if (!monthPrefix) return true;

  try {
    const slots: Array<{ date?: string }> = JSON.parse(reservedDatesJson) ?? [];
    if (slots.some(s => s.date?.startsWith(monthPrefix))) return true;
  } catch {
    // ignore parse errors
  }

  if (coordinationDate?.startsWith(monthPrefix)) return true;

  if (createdAt?.startsWith(monthPrefix)) return true;

  return false;
}
