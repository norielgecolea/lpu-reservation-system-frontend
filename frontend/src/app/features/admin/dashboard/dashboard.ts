import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

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

const CATEGORIES = ['All', 'FLT', 'Gym', 'Boardroom', 'Nexus', 'Conference'] as const;
type Category = (typeof CATEGORIES)[number];
type EventCategory = Exclude<Category, 'All'>;

const DAYS_PER_WEEK = 7;
const MIN_CALENDAR_ROWS = 5;
const DEFAULT_YEAR_MONTH = '2026-06';

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
  imports: [AdminShell, UiIcon, UiSegmented, UiDateSelector],
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
    () => `repeat(${this.calendarDays().length / DAYS_PER_WEEK}, minmax(7.5rem, auto))`,
  );

  protected readonly upcomingEvents = computed(() =>
    this.filteredEvents().filter((event) => event.date.startsWith(this.activeDate())),
  );
}
