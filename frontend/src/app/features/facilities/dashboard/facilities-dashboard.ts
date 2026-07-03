import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';

import { AdminShell } from '../../../shared/layout/admin-shell/admin-shell';
import { UiIcon, UiDateSelector } from '../../../shared/ui';
import { FltReservationsService } from '../../admin/reservations/flt/flt-reservations.service';
import { FltReservationRecord } from '../../admin/reservations/flt/flt-reservations.models';

// ── calendar helpers (mirrored from main dashboard) ───────────────────────

interface CalendarReservation { id: string; title: string; time: string; color: string; }
interface CalendarDay {
  id: string; day: number | null; isToday: boolean;
  rowTone: 'muted' | 'soft'; reservations: CalendarReservation[];
}

const DAYS_PER_WEEK   = 7;
const MIN_CAL_ROWS    = 5;

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseSlots(json: string): Array<{ date: string; startTime: string; endTime: string }> {
  try { return JSON.parse(json) ?? []; } catch { return []; }
}

function formatKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function buildCalendar(ym: string, events: Array<{ date: string; title: string; time: string; color: string }>): CalendarDay[] {
  const [year, month] = ym.split('-').map(Number);
  const m    = month - 1;
  const today = new Date();
  const fw    = new Date(year, m, 1).getDay();
  const dim   = new Date(year, m + 1, 0).getDate();
  const rows  = Math.max(MIN_CAL_ROWS, Math.ceil((fw + dim) / DAYS_PER_WEEK));

  return Array.from({ length: rows * DAYS_PER_WEEK }, (_, i) => {
    const row = Math.floor(i / DAYS_PER_WEEK);
    const off = i - fw;
    const day = off >= 0 && off < dim ? off + 1 : null;
    return {
      id: `${ym}-${i}`,
      day,
      isToday: day === today.getDate() && m === today.getMonth() && year === today.getFullYear(),
      rowTone: row % 2 === 0 ? 'muted' : 'soft',
      reservations: day === null ? [] : events
        .filter(e => e.date === formatKey(year, m, day))
        .map(({ id, title, time, color } : any) => ({ id, title, time, color })),
    };
  });
}

// ── stat card helper ───────────────────────────────────────────────────────

interface Stat { label: string; value: number; icon: string; bg: string; }

@Component({
  selector: 'app-facilities-dashboard',
  imports: [AdminShell, UiIcon, UiDateSelector, RouterLink, DatePipe, SlicePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<app-admin-shell>

  <!-- Service overview cards -->
  <section class="animate-rise grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">

    <!-- FLT Theater card -->
    <a routerLink="/facilities/reservation/flt"
       class="group relative overflow-hidden rounded-xl bg-white/45 backdrop-blur-xl ring-1 ring-inset ring-white/60
              shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_-12px_rgba(24,24,27,0.18)]
              dark:bg-zinc-900/50 dark:ring-white/10 p-4 hover:ring-primary/40 transition-all cursor-pointer">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-white shadow">
          <ui-icon name="theaters" class="text-xl" />
        </div>
        <ui-icon name="open_in_new" class="text-gray-400 group-hover:text-primary transition-colors" />
      </div>
      <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">FLT Theater</p>
      @if (loading()) {
        <div class="mt-1 h-7 w-16 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"></div>
        <div class="mt-2 flex gap-2">
          <div class="h-4 w-14 animate-pulse rounded bg-gray-100 dark:bg-zinc-800"></div>
          <div class="h-4 w-14 animate-pulse rounded bg-gray-100 dark:bg-zinc-800"></div>
        </div>
      } @else {
        <p class="mt-1 text-2xl font-extrabold text-gray-900 dark:text-zinc-100">{{ fltTotal() }}</p>
        <div class="mt-2 flex flex-wrap gap-2 text-[11px] font-medium">
          <span class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            {{ fltPending() }} Pending
          </span>
          <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {{ fltApproved() }} Approved
          </span>
        </div>
      }
    </a>

    <!-- Gymnasium card -->
    <a routerLink="/facilities/reservation/gymnasium"
       class="group relative overflow-hidden rounded-xl bg-white/45 backdrop-blur-xl ring-1 ring-inset ring-white/60
              shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_-12px_rgba(24,24,27,0.18)]
              dark:bg-zinc-900/50 dark:ring-white/10 p-4 hover:ring-emerald-400/40 transition-all cursor-pointer">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white shadow">
          <ui-icon name="sports_gymnastics" class="text-xl" />
        </div>
        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500
                     dark:bg-zinc-800 dark:text-zinc-400">Coming Soon</span>
      </div>
      <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Gymnasium</p>
      <p class="mt-1 text-2xl font-extrabold text-gray-300 dark:text-zinc-600">–</p>
      <p class="mt-2 text-[11px] text-gray-400 dark:text-zinc-500">Scheduling module in development</p>
    </a>

    <!-- University Van card -->
    <a routerLink="/facilities/reservation/van"
       class="group relative overflow-hidden rounded-xl bg-white/45 backdrop-blur-xl ring-1 ring-inset ring-white/60
              shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_-12px_rgba(24,24,27,0.18)]
              dark:bg-zinc-900/50 dark:ring-white/10 p-4 hover:ring-violet-400/40 transition-all cursor-pointer">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500 text-white shadow">
          <ui-icon name="airport_shuttle" class="text-xl" />
        </div>
        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500
                     dark:bg-zinc-800 dark:text-zinc-400">Coming Soon</span>
      </div>
      <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">University Van</p>
      <p class="mt-1 text-2xl font-extrabold text-gray-300 dark:text-zinc-600">–</p>
      <p class="mt-2 text-[11px] text-gray-400 dark:text-zinc-500">Scheduling module in development</p>
    </a>

  </section>

  <!-- FLT stat details row -->
  <section class="animate-rise grid shrink-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
    @for (s of fltStats(); track s.label) {
      <div class="relative overflow-hidden rounded-xl p-3 text-white ring-1 ring-inset ring-white/10
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_40px_-16px_rgba(0,0,0,0.5)] sm:p-4"
           [class]="s.bg">
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-xs font-medium text-white/80 sm:text-sm">{{ s.label }}</span>
            <ui-icon [name]="s.icon" class="shrink-0 text-xl text-white/70 sm:text-2xl" />
          </div>
          @if (loading()) {
            <div class="h-9 w-16 animate-pulse rounded-md bg-white/20"></div>
          } @else {
            <span class="text-2xl font-extrabold sm:text-3xl">{{ s.value }}</span>
          }
        </div>
      </div>
    }
  </section>

  <!-- Calendar + quick links -->
  <section class="animate-rise flex min-h-0 flex-none flex-col gap-5 lg:flex-row">

    <!-- Calendar card -->
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white/45 backdrop-blur-xl
                ring-1 ring-inset ring-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_-12px_rgba(24,24,27,0.18)]
                dark:bg-zinc-900/50 dark:ring-white/10 p-4 sm:p-6">

      <div class="mb-4 flex shrink-0 items-center justify-between gap-3">
        <h2 class="text-sm font-bold text-gray-800 dark:text-zinc-100">FLT Approved Schedule</h2>
        <ui-date-selector [value]="activeDate()" (valueChange)="activeDate.set($event)" />
      </div>

      <div class="min-h-0 flex-1 overflow-auto rounded-lg ring-1 ring-inset ring-black/5 dark:ring-white/10">
        <div class="grid h-full min-w-full grid-rows-[auto_minmax(0,1fr)] md:min-w-176">
          <!-- Weekday header -->
          <div class="grid grid-cols-7 bg-primary text-center text-sm font-bold text-white">
            @for (w of weekdays; track w) {
              <div class="border-r border-white/35 px-1 py-2 last:border-r-0">{{ w }}</div>
            }
          </div>
          <!-- Day cells -->
          <div class="grid grid-cols-7 text-center text-[11px] text-gray-900 dark:text-zinc-100 sm:text-xs"
               [style.grid-template-rows]="'repeat(' + (calendarDays().length / 7) + ', minmax(min-content, 1fr))'">
            @for (day of calendarDays(); track day.id) {
              <div class="flex min-h-0 flex-col border-r border-b border-white p-1.5 last:border-r-0 dark:border-zinc-700/60 sm:p-2"
                   [class.bg-gray-100]="day.rowTone === 'muted'"
                   [class.dark:bg-zinc-800]="day.rowTone === 'muted'"
                   [class.bg-gray-50]="day.rowTone === 'soft'"
                   [class.dark:bg-zinc-800/50]="day.rowTone === 'soft'">
                @if (day.day !== null) {
                  <span class="mx-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 font-semibold sm:h-6 sm:min-w-6"
                        [class.bg-primary]="day.isToday" [class.text-white]="day.isToday">
                    {{ day.day }}
                  </span>
                  @if (day.reservations.length) {
                    <ul class="mt-1 space-y-0.5 overflow-hidden text-left">
                      @for (r of day.reservations | slice:0:2; track r.id) {
                        <li class="truncate rounded border-l-4 px-1 py-0.5 text-[10px] font-medium leading-tight"
                            [class]="r.color"
                            [title]="r.time + ' – ' + r.title">
                          {{ r.title }}
                        </li>
                      }
                      @if (day.reservations.length > 2) {
                        <li class="text-[10px] font-bold text-primary">+{{ day.reservations.length - 2 }} more</li>
                      }
                    </ul>
                  }
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- Quick links + upcoming -->
    <div class="flex w-full flex-col gap-4 lg:w-72">

      <!-- Quick links -->
      <div class="rounded-xl bg-white/45 backdrop-blur-xl ring-1 ring-inset ring-white/60
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_-12px_rgba(24,24,27,0.18)]
                  dark:bg-zinc-900/50 dark:ring-white/10 p-4">
        <h2 class="mb-3 text-sm font-bold text-gray-800 dark:text-zinc-100">Quick Access</h2>
        <div class="flex flex-col gap-2">
          @for (link of quickLinks; track link.label) {
            <a [routerLink]="link.route"
               class="flex items-center gap-3 rounded-lg border border-gray-100 p-3 text-sm font-medium
                      text-gray-700 hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800/60 transition-colors">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    [class]="link.iconBg">
                <ui-icon [name]="link.icon" class="text-white text-base" />
              </span>
              <span>{{ link.label }}</span>
              <ui-icon name="chevron_right" class="ml-auto text-gray-400 text-lg" />
            </a>
          }
        </div>
      </div>

      <!-- Upcoming approved FLT events -->
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white/45 backdrop-blur-xl
                  ring-1 ring-inset ring-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_-12px_rgba(24,24,27,0.18)]
                  dark:bg-zinc-900/50 dark:ring-white/10">
        <div class="shrink-0 bg-primary px-4 py-2 text-center text-sm font-bold text-white rounded-t-xl">
          Upcoming FLT Events
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-3">
          @if (loading()) {
            @for (i of [1,2,3]; track i) {
              <div class="mb-3 h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-zinc-800"></div>
            }
          } @else if (upcomingFlt().length === 0) {
            <p class="py-6 text-center text-xs text-gray-500 dark:text-zinc-400">No upcoming events this month</p>
          } @else {
            @for (ev of upcomingFlt(); track ev.id) {
              <article class="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 dark:border-zinc-800">
                <div class="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-full bg-primary text-white shadow-sm">
                  <span class="text-[9px] font-medium leading-tight">{{ ev.date | date:'MMM' }}</span>
                  <span class="text-base font-bold leading-none">{{ ev.date | date:'d' }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-xs font-semibold text-gray-900 dark:text-zinc-100">{{ ev.title }}</p>
                  <p class="text-[11px] text-gray-500 dark:text-zinc-400">{{ ev.time }} · {{ ev.description }}</p>
                </div>
              </article>
            }
          }
        </div>
      </div>
    </div>

  </section>

</app-admin-shell>
  `,
})
export class FacilitiesDashboard implements OnInit {
  private readonly fltSvc = inject(FltReservationsService);

  protected readonly loading      = signal(true);
  protected readonly reservations = signal<FltReservationRecord[]>([]);
  protected readonly activeDate   = signal(currentYearMonth());
  protected readonly weekdays     = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  protected readonly quickLinks = [
    { label: 'FLT Theater',    route: '/facilities/reservation/flt',        icon: 'theaters',          iconBg: 'bg-sky-500' },
    { label: 'Gymnasium',      route: '/facilities/reservation/gymnasium',  icon: 'sports_gymnastics', iconBg: 'bg-emerald-500' },
    { label: 'University Van', route: '/facilities/reservation/van',        icon: 'airport_shuttle',   iconBg: 'bg-violet-500' },
  ];

  // ── derived stats ────────────────────────────────────────────────────────
  protected readonly fltTotal    = computed(() => this.reservations().length);
  protected readonly fltPending  = computed(() => this.reservations().filter(r => r.status === 'PENDING').length);
  protected readonly fltApproved = computed(() => this.reservations().filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').length);
  protected readonly fltRejected = computed(() => this.reservations().filter(r => r.status === 'REJECTED' || r.status === 'CANCELLED').length);

  protected readonly fltStats = computed<Stat[]>(() => [
    { label: 'FLT – Total',             value: this.fltTotal(),
      icon: 'monitoring',      bg: 'bg-linear-to-br from-sky-600 to-sky-900' },
    { label: 'FLT – Pending',           value: this.fltPending(),
      icon: 'pending_actions', bg: 'bg-linear-to-br from-amber-700 to-amber-950' },
    { label: 'FLT – Approved',          value: this.fltApproved(),
      icon: 'check_circle',    bg: 'bg-linear-to-br from-emerald-700 to-emerald-950' },
    { label: 'FLT – Rejected/Cancelled', value: this.fltRejected(),
      icon: 'cancel',          bg: 'bg-linear-to-br from-red-700 to-red-950' },
  ]);

  // ── calendar events from approved FLT reservations ───────────────────────
  private readonly fltEvents = computed(() => {
    const events: Array<{ id: string; date: string; title: string; time: string; color: string }> = [];
    for (const rec of this.reservations()) {
      if (rec.status !== 'APPROVED' && rec.status !== 'COMPLETED') continue;
      const slots = parseSlots(rec.reservedDates);
      slots.forEach((s, i) => events.push({
        id:    `flt-${rec.id}-${i}`,
        date:  s.date,
        title: rec.organization || rec.eventTitle,
        time:  s.startTime,
        color: 'border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/60 dark:text-sky-100',
      }));
      if (rec.coordinationDate && rec.coordinationStartTime) {
        events.push({
          id:    `coord-${rec.id}`,
          date:  rec.coordinationDate,
          title: `[Coord] ${rec.organization || rec.eventTitle}`,
          time:  rec.coordinationStartTime,
          color: 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100',
        });
      }
    }
    return events;
  });

  protected readonly calendarDays = computed(() =>
    buildCalendar(this.activeDate(), this.fltEvents())
  );

  protected readonly upcomingFlt = computed(() =>
    this.fltEvents()
      .filter(e => e.date.startsWith(this.activeDate()))
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .map(e => ({ id: e.id, date: e.date, title: e.title, time: e.time, description: '' }))
  );

  // ── lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.fltSvc.getAll().subscribe({
      next:  (res) => { this.reservations.set(res.reservations ?? []); this.loading.set(false); },
      error: ()    => this.loading.set(false),
    });
  }
}
