import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { SlicePipe, DatePipe } from '@angular/common';

import { AdminShell } from '../../../shared/layout/admin-shell/admin-shell';
import { UiIcon, UiSegmented, UiDateSelector } from '../../../shared/ui';

interface StatCard {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  icon: string;
  cardBg: string;
}

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

const CATEGORIES = ['All', 'FLT', 'Gym', 'Boardroom', 'Nexus', 'Conference'] as const;
type Category = (typeof CATEGORIES)[number];
type EventCategory = Exclude<Category, 'All'>;

const DAYS_PER_WEEK = 7;
const MIN_CALENDAR_ROWS = 5;
const DEFAULT_YEAR_MONTH = '2026-06';

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

const HARDCODED_EVENTS: UpcomingEvent[] = [
  {
    id: 'e1',
    title: 'Board Meeting',
    date: '2026-06-20',
    time: '10:00 AM',
    category: 'Boardroom',
    description: 'Monthly executive board discussion',
  },
  {
    id: 'e2',
    title: 'Gym Reservation',
    date: '2026-06-21',
    time: '3:00 PM',
    category: 'Gym',
    description: 'Team fitness session',
  },
  {
    id: 'e3',
    title: 'FLT Equipment Check',
    date: '2026-06-22',
    time: '9:30 AM',
    category: 'FLT',
    description: 'Maintenance and inspection',
  },
  {
    id: 'e4',
    title: 'Conference Setup',
    date: '2026-06-25',
    time: '1:00 PM',
    category: 'Conference',
    description: 'Prepare room for client meeting',
  },
  {
    id: 'e5',
    title: 'Client Visit Prep',
    date: '2026-06-25',
    time: '2:30 PM',
    category: 'Boardroom',
    description: 'Prepare materials and room layout',
  },
  {
    id: 'e6',
    title: 'AV Equipment Setup',
    date: '2026-06-25',
    time: '4:00 PM',
    category: 'Conference',
    description: 'Projector, microphones, and display check',
  },
  {
    id: 'e6-b',
    title: 'Team Debrief',
    date: '2026-06-25',
    time: '5:30 PM',
    category: 'Boardroom',
    description: 'Post-visit meeting',
  },
  {
    id: 'e7',
    title: 'Nexus Lab Booking',
    date: '2026-07-02',
    time: '2:00 PM',
    category: 'Nexus',
    description: 'Workshop preparation',
  },
];

function parseYearMonth(value: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  const year = match ? Number(match[1]) : 2026;
  const month = match ? Number(match[2]) - 1 : 5;

  if (!Number.isInteger(year) || month < 0 || month > 11) {
    return { year: 2026, month: 5 };
  }

  return { year, month };
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function createCalendarDays(value: string, events: UpcomingEvent[]): CalendarDay[] {
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
export class Dashboard {
  protected readonly stats: StatCard[] = [
    {
      label: 'Total',
      value: '2,456',
      delta: '12.5%',
      trend: 'up',
      icon: 'monitoring',
      cardBg: 'bg-linear-to-br from-primary to-secondary',
    },
    {
      label: 'Pending',
      value: '2,456',
      delta: '12.5%',
      trend: 'up',
      icon: 'pending_actions',
      cardBg: 'bg-linear-to-br from-amber-800 to-amber-950',
    },
    {
      label: 'Accepted',
      value: '159',
      delta: '12.5%',
      trend: 'down',
      icon: 'check_circle',
      cardBg: 'bg-linear-to-br from-emerald-800 to-emerald-950',
    },
    {
      label: 'Rejected',
      value: '200',
      delta: '12.5%',
      trend: 'down',
      icon: 'cancel',
      cardBg: 'bg-linear-to-br from-red-800 to-red-950',
    },
  ];

  protected readonly activeDate = signal(DEFAULT_YEAR_MONTH);

  protected readonly categories: Category[] = [...CATEGORIES];
  protected readonly activeCategory = signal<Category>('All');
  protected readonly events = signal<UpcomingEvent[]>(HARDCODED_EVENTS);

  protected selectCategory(c: Category): void {
    this.activeCategory.set(c);
  }

  protected selectDate(value: string): void {
    this.activeDate.set(value);
  }

  protected eventColorClass(category: EventCategory): string {
    return EVENT_COLOR_CLASSES[category];
  }

  protected eventBadgeClass(category: EventCategory): string {
    return EVENT_BADGE_CLASSES[category];
  }

  protected readonly eventLegends: EventLegend[] = CATEGORIES.filter(
    (category): category is EventCategory => category !== 'All',
  ).map((category) => ({
    label: category,
    className: EVENT_COLOR_CLASSES[category],
  }));

  protected readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  protected readonly filteredEvents = computed(() => {
    const category = this.activeCategory();

    return this.events()
      .filter((event) => category === 'All' || event.category === category)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  });

  protected readonly calendarDays = computed(() =>
    createCalendarDays(this.activeDate(), this.filteredEvents()),
  );
  protected readonly calendarDateRows = computed(
    () => `repeat(${this.calendarDays().length / DAYS_PER_WEEK}, minmax(min-content, 1fr))`,
  );

  protected readonly upcomingEvents = computed(() =>
    this.filteredEvents().filter((event) => event.date.startsWith(this.activeDate())),
  );

  protected readonly selectedDayForModal = signal<CalendarDay | null>(null);

  protected openDayModal(day: CalendarDay): void {
    this.selectedDayForModal.set(day);
  }

  protected closeDayModal(): void {
    this.selectedDayForModal.set(null);
  }
}
