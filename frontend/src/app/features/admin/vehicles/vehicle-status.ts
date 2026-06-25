export const VEHICLE_STATUS_OPTIONS = [
  { label: 'AVAILABLE', value: 'available' },
  { label: 'UNAVAILABLE', value: 'unavailable' },
] as const;

export function normalizeVehicleStatus(status: string | null | undefined): string {
  const value = status?.trim() ?? '';
  const lower = value.toLowerCase();

  return lower === 'available' || lower === 'unavailable' ? lower : value;
}
