import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SlicePipe, DatePipe } from '@angular/common';

import { AdminShell } from '../../../shared/layout/admin-shell/admin-shell';
import { UiIcon, UiSegmented, UiDateSelector } from '../../../shared/ui';
import { FltReservationsService } from '../reservations/flt/flt-reservations.service';
import { FltReservationRecord } from '../reservations/flt/flt-reservations.models';

interface CalendarReservation {
  id: string;
  title: string;
  time: string;
  category: EventCategory;
}

interface CalendarDay {
  id: string;
  day: number | null;
  isToday: boolean;
  rowTone: 'muted' | 'soft';
  reservations: CalendarReservation[];
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: EventCategory;
  description?: string;
}

interface EventLegend {
  label: EventCategory;
  className: string;
}

interface StatCard {
  label: string;
  value: number;
  icon: string;
  cardBg: string;
  loading: boolean;
}

const CATEGORIES = ['All', 'FLT', 'Gym', 'Boardroom', 'Nexus', 'Conference'] as const;
type Category = (typeof CATEGORIES)[number];
type EventCategory = Exclude<Category, 'All'>;

const DAYS_PER_WEEK = 7;
const MIN_CALENDAR_ROWS = 5;

const EVENT_COLOR_CLASSES: Record<EventCategory, string> = {
  FLT: 'border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-400 dark:bg-sky-950/70 dark:text-sky-100',
  Gym: 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/70 dark:text-emerald-100',
  Boardroom:
    'border-amber-500 bg-amber-50 text-amber-950 dark:border-amber-400 dark:bg-amber-950/70 dark:text-amber-100',
  Nexus:
    'border-violet-500 bg-violet-50 text-violet-900 dark:border-violet-400 dark:bg-violet-950/70 dark:text-violet-100',
  Conference:
    'border-rose-500 bg-rose-50 text-rose-900 dark:border-rose-400 dark:bg-rose-950/70 dark:text-rose-100',
};

const EVENT_BADGE_CLASSES: Record<EventCategory, string> = {
  FLT: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200',
  Gym: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  Boardroom: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  Nexus: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200',
  Conference: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
};

function getCurrentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseReservedDates(json: string): Array<{ date: string; startTime: string; endTime: string }> {
  try { return JSON.parse(json) ?? []; } catch { return []; }
}

function fltRecordsToEvents(records: FltReservationRecord[]): UpcomingEvent[] {
  const events: UpcomingEvent[] = [];
  for (const rec of records) {
    if (rec.status !== 'APPROVED' && rec.status !== 'COMPLETED') continue;
    const slots = parseReservedDates(rec.reservedDates);
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      events.push({
        id:          `flt-${rec.id}-${i}`,
        title:       rec.organization || rec.eventTitle,
        date:        s.date,
        time:        s.startTime,
        category:    'FLT',
        description: `${rec.eventTitle} — ${rec.eventType}`,
      });
    }
    // Also show coordination meeting as a separate FLT event
    if (rec.coordinationDate && rec.coordinationStartTime) {
      events.push({
        id:          `flt-coord-${rec.id}`,
        title:       `[Coord] ${rec.organization || rec.eventTitle}`,
        date:        rec.coordinationDate,
        time:        rec.coordinationStartTime,
        category:    'FLT',
        description: `Coordination meeting — ${rec.eventTitle}`,
      });
    }
  }
  return events;
}

function parseYearMonth(value: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  const year  = match ? Number(match[1]) : new Date().getFullYear();
  const month = match ? Number(match[2]) - 1 : new Date().getMonth();
  if (!Number.isInteger(year) || month < 0 || month > 11) {
    return { year: new Date().getFullYear(), month: new Date().getMonth() };
  }
  return { year, month };
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function createCalendarDays(value: string, events: UpcomingEvent[]): CalendarDay[] {
  const { year, month } = parseYearMonth(value);
  const today       = new Date();
  const todayYear   = today.getFullYear();
  const todayMonth  = today.getMonth();
  const todayDay    = today.getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const rowCount     = Math.max(
    MIN_CALENDAR_ROWS,
    Math.ceil((firstWeekday + daysInMonth) / DAYS_PER_WEEK),
  );
  const cellCount = rowCount * DAYS_PER_WEEK;

  return Array.from({ length: cellCount }, (_, index) => {
    const row      = Math.floor(index / DAYS_PER_WEEK);
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
              .filter((event) => event.date === formatDateKey(year, month, day))
              .map(({ id, title, time, category }) => ({ id, title, time, category })),
    };
  });
}

@Component({
  selector: 'app-dashboard',
  imports: [AdminShell, UiIcon, UiSegmented, UiDateSelector, SlicePipe, DatePipe],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly fltSvc = inject(FltReservationsService);

  // ── loading state ──────────────────────────────────────────────────────────
  protected readonly loading = signal(true);

  // ── raw FLT data ───────────────────────────────────────────────────────────
  protected readonly fltReservations = signal<FltReservationRecord[]>([]);

  // ── stat cards ─────────────────────────────────────────────────────────────
  protected readonly fltTotal     = computed(() => this.fltReservations().length);
  protected readonly fltPending   = computed(() => this.fltReservations().filter(r => r.status === 'PENDING').length);
  protected readonly fltApproved  = computed(() => this.fltReservations().filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').length);
  protected readonly fltRejected  = computed(() => this.fltReservations().filter(r => r.status === 'REJECTED' || r.status === 'CANCELLED').length);

  protected readonly statCards = computed<StatCard[]>(() => [
    {
      label:   'Total FLT',
      value:   this.fltTotal(),
      icon:    'monitoring',
      cardBg:  'bg-linear-to-br from-primary to-secondary',
      loading: this.loading(),
    },
    {
      label:   'Pending',
      value:   this.fltPending(),
      icon:    'pending_actions',
      cardBg:  'bg-linear-to-br from-amber-800 to-amber-950',
      loading: this.loading(),
    },
    {
      label:   'Approved',
      value:   this.fltApproved(),
      icon:    'check_circle',
      cardBg:  'bg-linear-to-br from-emerald-800 to-emerald-950',
      loading: this.loading(),
    },
    {
      label:   'Rejected / Cancelled',
      value:   this.fltRejected(),
      icon:    'cancel',
      cardBg:  'bg-linear-to-br from-red-800 to-red-950',
      loading: this.loading(),
    },
  ]);

  // ── calendar & events ──────────────────────────────────────────────────────
  protected readonly activeDate     = signal(getCurrentYearMonth());
  protected readonly categories: Category[] = [...CATEGORIES];
  protected readonly activeCategory = signal<Category>('All');

  /** Live FLT events derived from approved reservations */
  protected readonly fltEvents = computed(() => fltRecordsToEvents(this.fltReservations()));

  protected readonly allEvents = computed<UpcomingEvent[]>(() => this.fltEvents());

  protected selectCategory(c: Category): void  { this.activeCategory.set(c); }
  protected selectDate(value: string): void     { this.activeDate.set(value); }

  protected eventColorClass(category: EventCategory): string { return EVENT_COLOR_CLASSES[category]; }
  protected eventBadgeClass(category: EventCategory): string { return EVENT_BADGE_CLASSES[category]; }

  protected readonly eventLegends: EventLegend[] = CATEGORIES.filter(
    (c): c is EventCategory => c !== 'All',
  ).map((c) => ({ label: c, className: EVENT_COLOR_CLASSES[c] }));

  protected readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  protected readonly filteredEvents = computed(() => {
    const cat = this.activeCategory();
    return this.allEvents()
      .filter((e) => cat === 'All' || e.category === cat)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  });

  protected readonly calendarDays = computed(() =>
    createCalendarDays(this.activeDate(), this.filteredEvents()),
  );
  protected readonly calendarDateRows = computed(
    () => `repeat(${this.calendarDays().length / DAYS_PER_WEEK}, minmax(min-content, 1fr))`,
  );

  protected readonly upcomingEvents = computed(() =>
    this.filteredEvents().filter((e) => e.date.startsWith(this.activeDate())),
  );

  protected readonly selectedDayForModal = signal<CalendarDay | null>(null);

  protected openDayModal(day: CalendarDay): void  { this.selectedDayForModal.set(day); }
  protected closeDayModal(): void                 { this.selectedDayForModal.set(null); }

  // ── lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.fltSvc.getAll().subscribe({
      next: (res) => {
        this.fltReservations.set(res.reservations ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
