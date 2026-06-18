import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { AdminShell } from '../../../shared/layout/admin-shell/admin-shell';
import { UiIcon, UiSegmented, UiDateSelector } from '../../../shared/ui';

interface StatCard {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  icon: string;
  cardBg: string; // colored glass gradient (the old accent color, now the card fill)
  badgeBg: string; // darkest shade of the accent for the trend pill
}

interface CalendarReservation {
  id: string;
  title: string;
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
  description?: string;
}

type Category = 'All' | 'Van' | 'FLT' | 'Gym';

const DAYS_PER_WEEK = 7;
const MIN_CALENDAR_ROWS = 5;
const DEFAULT_YEAR_MONTH = '2026-06';

function parseYearMonth(value: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  const year = match ? Number(match[1]) : 2026;
  const month = match ? Number(match[2]) - 1 : 5;

  if (!Number.isInteger(year) || month < 0 || month > 11) {
    return { year: 2026, month: 5 };
  }

  return { year, month };
}

function createCalendarDays(value: string): CalendarDay[] {
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
      reservations: [],
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
      badgeBg: 'bg-[#3f0f20]',
    },
    {
      label: 'Pending',
      value: '2,456',
      delta: '12.5%',
      trend: 'up',
      icon: 'pending_actions',
      cardBg: 'bg-linear-to-br from-orange-400 to-orange-600',
      badgeBg: 'bg-orange-800',
    },
    {
      label: 'Accepted',
      value: '159',
      delta: '12.5%',
      trend: 'down',
      icon: 'check_circle',
      cardBg: 'bg-linear-to-br from-green-400 to-green-600',
      badgeBg: 'bg-green-800',
    },
    {
      label: 'Rejected',
      value: '200',
      delta: '12.5%',
      trend: 'down',
      icon: 'cancel',
      cardBg: 'bg-linear-to-br from-red-400 to-red-600',
      badgeBg: 'bg-red-800',
    },
  ];

  protected readonly activeDate = signal(DEFAULT_YEAR_MONTH);

  protected readonly categories: Category[] = ['All', 'Van', 'FLT', 'Gym'];
  protected readonly activeCategory = signal<Category>('All');

  protected selectCategory(c: Category): void {
    this.activeCategory.set(c);
  }

  protected selectDate(value: string): void {
    this.activeDate.set(value);
  }

  protected readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  protected readonly calendarDays = computed(() => createCalendarDays(this.activeDate()));
  protected readonly calendarDateRows = computed(
    () => `repeat(${this.calendarDays().length / DAYS_PER_WEEK}, minmax(0, 1fr))`,
  );

  protected readonly upcomingEvents = signal<UpcomingEvent[]>([]);
}
