import { MaintenanceBlock } from '../maintenance/maintenance.service';

export type DashboardService =
  | 'FLT'
  | 'VAN'
  | 'Gymnasium'
  | 'Boardroom'
  | 'Nexus'
  | 'Conference';

/** @deprecated Use DashboardService */
export type DashboardFacility = DashboardService;

export interface DashboardEquipmentItem {
  id: number;
  name: string;
}

export interface DashboardReservedSlot {
  date: string;
  startTime: string;
  endTime: string;
  time: string;
}

export type DashboardEventKind = 'reservation' | 'coordination' | 'maintenance';

export interface DashboardReservationRecord {
  id: number;
  eventTitle: string;
  department: string;
  organization: string;
  contactPerson: string;
  contactEmail: string;
  contactNumber?: string;
  status: string;
  reservedDates: string;
  requestedEquipment?: string | null;
  coordinationDate: string | null;
  coordinationStartTime: string | null;
  coordinationEndTime: string | null;
  additionalInstructions?: string | null;
  eventType?: string;
  roomType?: string | null;
  expectedAttendees?: string | null;
  numberOfAttendees?: string | null;
  vehicleLabel?: string | null;
  driverName?: string | null;
  vehicleId?: number | null;
  travelDestination?: string | null;
  passengerNames?: string | null;
  numberOfPassengers?: number | string | null;
  returnTime?: string | null;
}

export interface DashboardEvent {
  id: string;
  title: string;
  time: string;
  startTime: string;
  endTime: string;
  date: string;
  category: string;
  facility: DashboardService;
  colorClass: string;
  eventKind: DashboardEventKind;
  reservationId: number;
  eventTitle: string;
  department: string;
  organization: string;
  contactPerson: string;
  contactEmail: string;
  contactNumber?: string;
  status: string;
  description?: string;
  eventType?: string;
  roomType?: string | null;
  expectedAttendees?: string | null;
  numberOfAttendees?: string | null;
  reservedSlots: DashboardReservedSlot[];
  requestedEquipment: DashboardEquipmentItem[];
  coordinationDate?: string | null;
  coordinationStartTime?: string | null;
  coordinationEndTime?: string | null;
  coordinationTime?: string | null;
  additionalInstructions?: string | null;
  maintenanceReason?: string;
  travelDestination?: string | null;
  passengerNames?: string | null;
  numberOfPassengers?: number | string | null;
  returnTime?: string | null;
  vehicleLabel?: string | null;
  driverName?: string | null;
}

export interface CalendarReservation {
  id: string;
  title: string;
  time: string;
  category: string;
  colorClass: string;
  event: DashboardEvent;
}

export interface CalendarDay {
  id: string;
  day: number | null;
  isToday: boolean;
  rowTone: 'muted' | 'soft';
  reservations: CalendarReservation[];
}

const DAYS_PER_WEEK = 7;
const MIN_CALENDAR_ROWS = 5;

export const IMPLEMENTED_SERVICES = new Set<DashboardService>(['FLT', 'Gymnasium', 'VAN']);

export const MAINTENANCE_API_FACILITY: Partial<Record<DashboardService, string>> = {
  FLT: 'FLT',
  Gymnasium: 'GYMNASIUM',
};

export const FLT_EVENT_COLOR =
  'border-sky-500 bg-sky-50 text-sky-900';
export const GYM_EVENT_COLOR =
  'border-emerald-500 bg-emerald-50 text-emerald-900';
export const COORD_EVENT_COLOR =
  'border-amber-500 bg-amber-50 text-amber-950';
export const MAINTENANCE_EVENT_COLOR =
  'border-zinc-500 bg-zinc-100 text-zinc-800';
export const VAN_EVENT_COLOR =
  'border-sky-500 bg-sky-50 text-sky-900';
export const VAN_UNASSIGNED_COLOR =
  'border-zinc-400 bg-zinc-100 text-zinc-800';

/** Distinct calendar colors per assigned van (by vehicle id). */
export const VAN_VEHICLE_COLOR_PALETTE = [
  'border-sky-500 bg-sky-50 text-sky-900',
  'border-sky-500 bg-sky-50 text-sky-900',
  'border-emerald-500 bg-emerald-50 text-emerald-900',
  'border-amber-500 bg-amber-50 text-amber-950',
  'border-rose-500 bg-rose-50 text-rose-900',
  'border-teal-500 bg-teal-50 text-teal-900',
  'border-indigo-500 bg-indigo-50 text-indigo-900',
  'border-orange-500 bg-orange-50 text-orange-900',
] as const;

export function vanColorForVehicleId(vehicleId: number | null | undefined): string {
  if (vehicleId == null) return VAN_UNASSIGNED_COLOR;
  return VAN_VEHICLE_COLOR_PALETTE[vehicleId % VAN_VEHICLE_COLOR_PALETTE.length];
}

export function getVanVehicleLegends(
  records: Array<{ vehicleId?: number | null; vehicleLabel?: string | null; status: string }>,
): Array<{ label: string; className: string }> {
  const seen = new Map<string, { label: string; vehicleId: number | null }>();
  for (const r of records) {
    if (r.status !== 'APPROVED' && r.status !== 'COMPLETED') continue;
    const key = r.vehicleId != null ? String(r.vehicleId) : 'unassigned';
    if (!seen.has(key)) {
      seen.set(key, {
        label: r.vehicleLabel?.trim() || 'Unassigned',
        vehicleId: r.vehicleId ?? null,
      });
    }
  }
  return Array.from(seen.values())
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(v => ({
      label: v.label,
      className: vanColorForVehicleId(v.vehicleId),
    }));
}
export const BOARDROOM_EVENT_COLOR =
  'border-amber-500 bg-amber-50 text-amber-950';
export const NEXUS_EVENT_COLOR =
  'border-violet-500 bg-violet-50 text-violet-900';
export const CONFERENCE_EVENT_COLOR =
  'border-rose-500 bg-rose-50 text-rose-900';

export const SERVICE_EVENT_COLORS: Record<DashboardService, string> = {
  FLT: FLT_EVENT_COLOR,
  VAN: VAN_EVENT_COLOR,
  Gymnasium: GYM_EVENT_COLOR,
  Boardroom: BOARDROOM_EVENT_COLOR,
  Nexus: NEXUS_EVENT_COLOR,
  Conference: CONFERENCE_EVENT_COLOR,
};

export function isServiceImplemented(service: DashboardService): boolean {
  return IMPLEMENTED_SERVICES.has(service);
}

export function getCurrentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseIsoDateKey(dateStr: string): Date | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!iso) return null;
  const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** e.g. "2026-07-08" → "Jul" */
export function formatEventMonth(dateStr: string): string {
  const d = parseIsoDateKey(dateStr);
  return d ? d.toLocaleDateString('en-US', { month: 'short' }) : dateStr;
}

/** e.g. "2026-07-08" → "8" */
export function formatEventDay(dateStr: string): string {
  const d = parseIsoDateKey(dateStr);
  return d ? String(d.getDate()) : dateStr;
}

export function parseReservedDates(
  json: string,
): Array<{ date: string; startTime: string; endTime: string }> {
  try {
    return JSON.parse(json) ?? [];
  } catch {
    return [];
  }
}

export function parseEquipment(json: string | null | undefined): DashboardEquipmentItem[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** e.g. "09:00" → "9:00 am" */
export function formatTime24(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const period = hour >= 12 ? 'pm' : 'am';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
}

/** e.g. "9:00 am - 5:00 pm" */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime24(start)} - ${formatTime24(end)}`;
}

/** e.g. "2026-07-08" → "Wed, Jul 8, 2026" */
export function formatReadableDate(dateStr: string | null | undefined): string {
  if (!dateStr?.trim()) return '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return dateStr;
}

/** e.g. ISO timestamps → "Wed, Jul 8, 2026, 3:45 PM" */
export function formatReadableDateTime(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return formatReadableDate(trimmed);
  }
  const parsed = new Date(trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T'));
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  return trimmed;
}

/** Hour ("17") or 24h time ("17:00") → "5:00 pm" */
export function formatReadableTime(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  const trimmed = value.trim();
  if (/^\d{1,2}$/.test(trimmed)) {
    return formatTime24(`${trimmed.padStart(2, '0')}:00`);
  }
  return formatTime24(trimmed);
}

function toReservedSlots(json: string): DashboardReservedSlot[] {
  return parseReservedDates(json).map(s => ({
    ...s,
    time: formatTimeRange(s.startTime, s.endTime),
  }));
}

function eventDescription(rec: DashboardReservationRecord, _facility: DashboardService): string {
  if (rec.additionalInstructions?.trim()) {
    return rec.additionalInstructions.trim();
  }
  if (rec.eventType) {
    return `${rec.eventTitle} — ${rec.eventType}`;
  }
  return rec.eventTitle;
}

function truncateText(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function recordContext(rec: DashboardReservationRecord, facility: DashboardService, category: string) {
  const reservedSlots = toReservedSlots(rec.reservedDates);
  const coordinationTime =
    rec.coordinationDate && rec.coordinationStartTime && rec.coordinationEndTime
      ? formatTimeRange(rec.coordinationStartTime, rec.coordinationEndTime)
      : null;

  return {
    category,
    facility,
    reservationId: rec.id,
    eventTitle: rec.eventTitle,
    department: rec.department,
    organization: rec.organization,
    contactPerson: rec.contactPerson,
    contactEmail: rec.contactEmail,
    contactNumber: rec.contactNumber,
    status: rec.status,
    eventType: rec.eventType,
    roomType: rec.roomType,
    expectedAttendees: rec.expectedAttendees,
    numberOfAttendees: rec.numberOfAttendees,
    reservedSlots,
    requestedEquipment: parseEquipment(rec.requestedEquipment),
    coordinationDate: rec.coordinationDate,
    coordinationStartTime: rec.coordinationStartTime,
    coordinationEndTime: rec.coordinationEndTime,
    coordinationTime,
    additionalInstructions: rec.additionalInstructions,
  };
}

export function recordsToDashboardEvents(
  records: DashboardReservationRecord[],
  facility: DashboardService,
  colorClass: string,
  category: string,
): DashboardEvent[] {
  const events: DashboardEvent[] = [];
  for (const rec of records) {
    if (rec.status !== 'APPROVED' && rec.status !== 'COMPLETED') continue;
    const ctx = recordContext(rec, facility, category);
    const slots = parseReservedDates(rec.reservedDates);
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      events.push({
        id: `${facility.toLowerCase()}-${rec.id}-slot-${i}`,
        title: rec.organization || rec.eventTitle,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        time: formatTimeRange(s.startTime, s.endTime),
        colorClass,
        eventKind: 'reservation',
        description: truncateText(eventDescription(rec, facility)),
        ...ctx,
      });
    }
    if (rec.coordinationDate && rec.coordinationStartTime && rec.coordinationEndTime) {
      events.push({
        id: `${facility.toLowerCase()}-coord-${rec.id}`,
        title: `[Coord] ${rec.organization || rec.eventTitle}`,
        date: rec.coordinationDate,
        startTime: rec.coordinationStartTime,
        endTime: rec.coordinationEndTime,
        time: formatTimeRange(rec.coordinationStartTime, rec.coordinationEndTime),
        colorClass: COORD_EVENT_COLOR,
        eventKind: 'coordination',
        description: truncateText(eventDescription(rec, facility)),
        ...ctx,
      });
    }
  }
  return events;
}

export function maintenanceBlocksToDashboardEvents(
  blocks: MaintenanceBlock[],
  facility: DashboardService,
): DashboardEvent[] {
  return blocks.map(block => ({
    id: `maint-${block.id}`,
    title: `[Maint] ${block.reason || 'Maintenance'}`,
    date: block.blockDate,
    startTime: block.startTime,
    endTime: block.endTime,
    time: formatTimeRange(block.startTime, block.endTime),
    category: facility,
    facility,
    colorClass: MAINTENANCE_EVENT_COLOR,
    eventKind: 'maintenance' as const,
    reservationId: block.id,
    eventTitle: block.reason || 'Maintenance Block',
    department: '—',
    organization: 'Facilities Maintenance',
    contactPerson: '—',
    contactEmail: '—',
    status: 'SCHEDULED',
    description: block.reason || 'Scheduled maintenance',
    reservedSlots: [],
    requestedEquipment: [],
    maintenanceReason: block.reason,
  }));
}

export function buildServiceCalendarEvents(
  records: DashboardReservationRecord[],
  maintenanceBlocks: MaintenanceBlock[],
  service: DashboardService,
): DashboardEvent[] {
  if (!isServiceImplemented(service)) return [];
  if (service === 'VAN') {
    return buildVanCalendarEvents(records);
  }
  const reservationEvents = recordsToDashboardEvents(
    records,
    service,
    SERVICE_EVENT_COLORS[service],
    service,
  );
  return [...reservationEvents, ...maintenanceBlocksToDashboardEvents(maintenanceBlocks, service)];
}

/** Van dashboard: one calendar chip per trip slot, color-coded by assigned van. */
export function buildVanCalendarEvents(records: DashboardReservationRecord[]): DashboardEvent[] {
  const events: DashboardEvent[] = [];
  for (const rec of records) {
    if (rec.status !== 'APPROVED' && rec.status !== 'COMPLETED') continue;
    const slots = parseReservedDates(rec.reservedDates);
    const vehicle = rec.vehicleLabel?.trim() || 'Unassigned';
    const driver = rec.driverName?.trim() || 'No driver';
    const colorClass = vanColorForVehicleId(rec.vehicleId);
    const ctx = {
      category: 'VAN',
      facility: 'VAN' as DashboardService,
      reservationId: rec.id,
      eventTitle: rec.eventTitle,
      department: rec.department,
      organization: rec.organization,
      contactPerson: rec.contactPerson,
      contactEmail: rec.contactEmail,
      contactNumber: rec.contactNumber,
      status: rec.status,
      travelDestination: rec.travelDestination ?? rec.eventTitle,
      passengerNames: rec.passengerNames ?? null,
      numberOfPassengers: rec.numberOfPassengers ?? null,
      returnTime: rec.returnTime ?? null,
      vehicleLabel: rec.vehicleLabel ?? null,
      driverName: rec.driverName ?? null,
      reservedSlots: parseReservedDates(rec.reservedDates).map(s => ({
        ...s,
        time: formatTimeRange(s.startTime, s.endTime),
      })),
      requestedEquipment: [] as DashboardEquipmentItem[],
      coordinationDate: null,
      coordinationStartTime: null,
      coordinationEndTime: null,
      coordinationTime: null,
      additionalInstructions: rec.additionalInstructions,
    };

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const time = formatTimeRange(s.startTime, s.endTime);
      events.push({
        id: `van-${rec.id}-slot-${i}`,
        title: rec.department || '—',
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        time,
        colorClass,
        eventKind: 'reservation',
        description: `${vehicle} · ${driver}`,
        ...ctx,
      });
    }
  }
  return events;
}

export function reservationStats(records: DashboardReservationRecord[]) {
  return {
    total: records.length,
    pending: records.filter(r => r.status === 'PENDING').length,
    approved: records.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').length,
    rejected: records.filter(r => r.status === 'REJECTED' || r.status === 'CANCELLED').length,
  };
}

function parseYearMonth(value: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  const year = match ? Number(match[1]) : new Date().getFullYear();
  const month = match ? Number(match[2]) - 1 : new Date().getMonth();
  if (!Number.isInteger(year) || month < 0 || month > 11) {
    return { year: new Date().getFullYear(), month: new Date().getMonth() };
  }
  return { year, month };
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function createCalendarDays(value: string, events: DashboardEvent[]): CalendarDay[] {
  const { year, month } = parseYearMonth(value);
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rowCount = Math.max(
    MIN_CALENDAR_ROWS,
    Math.ceil((firstWeekday + daysInMonth) / DAYS_PER_WEEK),
  );
  const cellCount = rowCount * DAYS_PER_WEEK;

  return Array.from({ length: cellCount }, (_, index) => {
    const row = Math.floor(index / DAYS_PER_WEEK);
    const dayOffset = index - firstWeekday;
    const day = dayOffset >= 0 && dayOffset < daysInMonth ? dayOffset + 1 : null;
    const rowTone: CalendarDay['rowTone'] = row % 2 === 0 ? 'muted' : 'soft';

    return {
      id: `${value}-${index}-${day ?? 'empty'}`,
      day,
      isToday: day === todayDay && month === todayMonth && year === todayYear,
      rowTone,
      reservations:
        day === null
          ? []
          : events
              .filter(event => event.date === formatDateKey(year, month, day))
              .map(event => ({
                id: event.id,
                title: event.title,
                time: event.time,
                category: event.category,
                colorClass: event.colorClass,
                event,
              })),
    };
  });
}

export const ROOM_TYPE_LABELS: Record<string, string> = {
  amphitheater: 'Amphitheater',
  banquet_hall: 'Banquet Hall',
};

export function getRoomTypeLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return ROOM_TYPE_LABELS[value] ?? value;
}

/** Map van admin reservation rows to dashboard calendar records. */
export function vanRecordsToDashboardRecords(
  records: Array<{
    id: number;
    travelDestination: string;
    department: string;
    organization: string;
    contactPerson: string;
    contactEmail: string;
    contactNumber: string;
    passengerNames: string;
    numberOfPassengers?: number | null;
    returnTime: string | null;
    reservedDates: string;
    status: string;
    vehicleLabel?: string | null;
    driverName?: string | null;
    vehicleId?: number | null;
  }>,
): DashboardReservationRecord[] {
  return records.map(r => ({
    id: r.id,
    eventTitle: r.travelDestination,
    department: r.department,
    organization: r.organization,
    contactPerson: r.contactPerson,
    contactEmail: r.contactEmail,
    contactNumber: r.contactNumber,
    status: r.status,
    reservedDates: r.reservedDates,
    coordinationDate: null,
    coordinationStartTime: null,
    coordinationEndTime: null,
    travelDestination: r.travelDestination,
    passengerNames: r.passengerNames,
    numberOfPassengers: r.numberOfPassengers ?? null,
    returnTime: r.returnTime,
    vehicleLabel: r.vehicleLabel,
    driverName: r.driverName,
    vehicleId: r.vehicleId ?? null,
    additionalInstructions: null,
  }));
}
