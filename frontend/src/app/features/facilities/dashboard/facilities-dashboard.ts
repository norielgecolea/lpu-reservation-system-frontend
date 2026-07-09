import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { forkJoin } from 'rxjs';

import { UiIcon, UiSegmented, UiDateSelector } from '../../../shared/ui';
import { MaintenanceBlock, MaintenanceService } from '../../admin/maintenance/maintenance.service';
import { FltReservationsService } from '../../admin/reservations/flt/flt-reservations.service';
import { FltReservationRecord } from '../../admin/reservations/flt/flt-reservations.models';
import { GymReservationsService } from '../../admin/reservations/gymnasium/gymnasium-reservations.service';
import { GymReservationRecord } from '../../admin/reservations/gymnasium/gymnasium-reservations.models';
import { VanReservationsService } from '../../admin/reservations/van/van-reservations.service';
import { VanReservationRow } from '../../admin/reservations/van/van-reservations.models';
import { DashboardEventSummaryModal } from '../../admin/dashboard/dashboard-event-summary-modal';
import {
  CalendarDay,
  COORD_EVENT_COLOR,
  DashboardEvent,
  DashboardService,
  MAINTENANCE_EVENT_COLOR,
  SERVICE_EVENT_COLORS,
  getVanVehicleLegends,
  buildServiceCalendarEvents,
  createCalendarDays,
  formatEventDay,
  formatEventMonth,
  getCurrentYearMonth,
  isServiceImplemented,
  reservationStats,
  vanRecordsToDashboardRecords,
} from '../../admin/dashboard/dashboard-events.util';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  cardBg: string;
  loading: boolean;
}

const DAYS_PER_WEEK = 7;

const FACILITY_STAT_BGS: Record<DashboardService, string[]> = {
  FLT: [
    'bg-linear-to-br from-sky-600 to-sky-900',
    'bg-linear-to-br from-amber-700 to-amber-950',
    'bg-linear-to-br from-emerald-700 to-emerald-950',
    'bg-linear-to-br from-red-700 to-red-950',
  ],
  Gymnasium: [
    'bg-linear-to-br from-emerald-600 to-emerald-900',
    'bg-linear-to-br from-amber-700 to-amber-950',
    'bg-linear-to-br from-teal-700 to-teal-950',
    'bg-linear-to-br from-red-700 to-red-950',
  ],
  VAN: [
    'bg-linear-to-br from-primary to-secondary',
    'bg-linear-to-br from-amber-700 to-amber-950',
    'bg-linear-to-br from-emerald-700 to-emerald-950',
    'bg-linear-to-br from-red-700 to-red-950',
  ],
  Boardroom: [
    'bg-linear-to-br from-amber-600 to-amber-900',
    'bg-linear-to-br from-amber-700 to-amber-950',
    'bg-linear-to-br from-orange-700 to-orange-950',
    'bg-linear-to-br from-red-700 to-red-950',
  ],
  Nexus: [
    'bg-linear-to-br from-violet-600 to-violet-900',
    'bg-linear-to-br from-violet-700 to-violet-950',
    'bg-linear-to-br from-purple-700 to-purple-950',
    'bg-linear-to-br from-red-700 to-red-950',
  ],
  Conference: [
    'bg-linear-to-br from-rose-600 to-rose-900',
    'bg-linear-to-br from-rose-700 to-rose-950',
    'bg-linear-to-br from-pink-700 to-pink-950',
    'bg-linear-to-br from-red-700 to-red-950',
  ],
};

@Component({
  selector: 'app-facilities-dashboard',
  imports: [
    UiIcon,
    UiSegmented,
    UiDateSelector,
    SlicePipe,
    DashboardEventSummaryModal,
  ],
  templateUrl: './facilities-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacilitiesDashboard implements OnInit {
  private readonly fltSvc = inject(FltReservationsService);
  private readonly gymSvc = inject(GymReservationsService);
  private readonly vanSvc = inject(VanReservationsService);
  private readonly maintSvc = inject(MaintenanceService);

  protected readonly loading = signal(true);
  protected readonly fltReservations = signal<FltReservationRecord[]>([]);
  protected readonly gymReservations = signal<GymReservationRecord[]>([]);
  protected readonly vanReservations = signal<VanReservationRow[]>([]);
  protected readonly fltMaintenance = signal<MaintenanceBlock[]>([]);
  protected readonly gymMaintenance = signal<MaintenanceBlock[]>([]);
  protected readonly activeDate = signal(getCurrentYearMonth());
  protected readonly activeFacility = signal<DashboardService>('FLT');

  protected readonly facilityOptions: DashboardService[] = ['FLT', 'Gymnasium', 'VAN'];
  protected readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  protected readonly isComingSoon = computed(
    () => !isServiceImplemented(this.activeFacility()),
  );

  protected readonly eventLegends = computed(() => {
    const facility = this.activeFacility();
    if (this.isComingSoon()) {
      return [{ label: facility, className: SERVICE_EVENT_COLORS[facility] }];
    }
    if (facility === 'VAN') {
      return getVanVehicleLegends(this.vanReservations());
    }
    return [
      { label: String(facility), className: SERVICE_EVENT_COLORS[facility] },
      { label: 'Coordination', className: COORD_EVENT_COLOR },
      { label: 'Maintenance', className: MAINTENANCE_EVENT_COLOR },
    ];
  });

  protected readonly activeRecords = computed(() => {
    switch (this.activeFacility()) {
      case 'Gymnasium':
        return this.gymReservations();
      case 'FLT':
        return this.fltReservations();
      case 'VAN':
        return vanRecordsToDashboardRecords(this.vanReservations());
      default:
        return [];
    }
  });

  protected readonly activeMaintenance = computed(() => {
    switch (this.activeFacility()) {
      case 'Gymnasium':
        return this.gymMaintenance();
      case 'FLT':
        return this.fltMaintenance();
      default:
        return [];
    }
  });

  protected readonly statCards = computed<StatCard[]>(() => {
    const facility = this.activeFacility();
    const stats = reservationStats(this.activeRecords());
    const bgs = FACILITY_STAT_BGS[facility];

    return [
      { label: `${facility} – Total`, value: stats.total, icon: 'monitoring', cardBg: bgs[0], loading: this.loading() },
      { label: `${facility} – Pending`, value: stats.pending, icon: 'pending_actions', cardBg: bgs[1], loading: this.loading() },
      { label: `${facility} – Approved`, value: stats.approved, icon: 'check_circle', cardBg: bgs[2], loading: this.loading() },
      { label: `${facility} – Rejected/Cancelled`, value: stats.rejected, icon: 'cancel', cardBg: bgs[3], loading: this.loading() },
    ];
  });

  protected readonly facilityEvents = computed<DashboardEvent[]>(() =>
    buildServiceCalendarEvents(
      this.activeRecords(),
      this.activeMaintenance(),
      this.activeFacility(),
    ),
  );

  protected readonly calendarDays = computed(() =>
    createCalendarDays(this.activeDate(), this.facilityEvents()),
  );

  protected readonly calendarDateRows = computed(
    () => `repeat(${this.calendarDays().length / DAYS_PER_WEEK}, minmax(min-content, 1fr))`,
  );

  protected readonly upcomingEvents = computed(() =>
    this.facilityEvents()
      .filter(e => e.date.startsWith(this.activeDate()))
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)),
  );

  protected readonly formatEventMonth = formatEventMonth;
  protected readonly formatEventDay = formatEventDay;

  protected readonly selectedDayForModal = signal<CalendarDay | null>(null);
  protected readonly selectedEvent = signal<DashboardEvent | null>(null);

  protected selectDate(value: string): void {
    this.activeDate.set(value);
  }

  protected selectFacility(value: DashboardService): void {
    this.activeFacility.set(value);
  }

  protected openDayModal(day: CalendarDay): void {
    this.selectedDayForModal.set(day);
  }

  protected closeDayModal(): void {
    this.selectedDayForModal.set(null);
  }

  protected openEventSummary(event: DashboardEvent): void {
    this.selectedEvent.set(event);
    this.closeDayModal();
  }

  protected closeEventSummary(): void {
    this.selectedEvent.set(null);
  }

  ngOnInit(): void {
    forkJoin({
      flt: this.fltSvc.getAll(),
      gym: this.gymSvc.getAll(),
      van: this.vanSvc.getAll(),
      fltMaint: this.maintSvc.getBlocks('FLT'),
      gymMaint: this.maintSvc.getBlocks('GYMNASIUM'),
    }).subscribe({
      next: ({ flt, gym, van, fltMaint, gymMaint }) => {
        this.fltReservations.set(flt.reservations ?? []);
        this.gymReservations.set(gym.reservations ?? []);
        this.vanReservations.set(van.reservations ?? []);
        this.fltMaintenance.set(fltMaint.blocks ?? []);
        this.gymMaintenance.set(gymMaint.blocks ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
