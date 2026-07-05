import { ReservationStatus } from './flt/flt-reservations.models';
import { ReservationWsEvent } from './reservation-realtime.service';

/** Normalize STOMP JSON payload field types from the backend. */
export function parseReservationWsEvent(body: string): ReservationWsEvent {
  const raw = JSON.parse(body) as Record<string, unknown>;
  return {
    type: raw['type'] as ReservationWsEvent['type'],
    reservationId: Number(raw['reservationId']),
    status: String(raw['status'] ?? ''),
    conflictedIds: Array.isArray(raw['conflictedIds'])
      ? raw['conflictedIds'].map(id => Number(id))
      : [],
    timestamp: raw['timestamp'] != null ? String(raw['timestamp']) : undefined,
  };
}

interface ReservationRow {
  id: number;
  status: ReservationStatus;
}

/** Apply a realtime event to the in-memory admin list. */
export function applyReservationWsEvent<T extends ReservationRow>(
  list: T[],
  ev: ReservationWsEvent,
): { updated: T[]; needsReload: boolean } {
  if (ev.type === 'CREATED' || Number.isNaN(ev.reservationId)) {
    return { updated: list, needsReload: true };
  }

  const resId = ev.reservationId;
  const conflictIds = (ev.conflictedIds ?? []).filter(id => !Number.isNaN(id));
  const affected = new Set<number>([resId, ...conflictIds]);

  if (!list.some(r => affected.has(r.id))) {
    return { updated: list, needsReload: true };
  }

  const updated = list.map(row => {
    if (row.id === resId) {
      return { ...row, status: ev.status as ReservationStatus };
    }
    if (conflictIds.includes(row.id)) {
      return { ...row, status: 'CONFLICT' as ReservationStatus };
    }
    return row;
  });

  return { updated, needsReload: false };
}
