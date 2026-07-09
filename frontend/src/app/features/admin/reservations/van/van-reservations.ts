import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { VanRescheduleCalendar, VanRescheduleEvent } from './van-reschedule-calendar';
import { VanApproveModal, VanApproveResult } from './van-approve-modal';
import { UiButton, UiIcon, UiInputSearch, UiSelect, UiSelectOption, UiToast, UiDateSelector } from '../../../../shared/ui';
import { getCurrentYearMonth } from '../../dashboard/dashboard-events.util';
import { reservationMatchesMonth } from '../reservation-filter.util';
import {
  ReservationStatus,
  ReservedDateSlot,
  VanReservationRow,
} from './van-reservations.models';
import { VanReservationsService } from './van-reservations.service';
import { ReservationRealtimeService, ReservationWsEvent } from '../reservation-realtime.service';
import { applyRevertedIds, applyReservationWsEvent } from '../reservation-ws.util';
import { ReservationExportModal } from '../reservation-export-modal';
import { exportVanReservationsCsv, ExportDateRange } from '../reservation-export.util';
import { adminAddReservationPath } from '../admin-reservation-path.util';
import { ApprovedReservationActionsMenu } from '../approved-reservation-actions-menu';
import { ReservationApproverTableSkeleton } from '../reservation-approver-table-skeleton';

const STATUS_FILTERS = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'CONFLICT'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

interface ConfirmState {
  id: number;
  action: ReservationStatus;
  tripTitle: string;
}

@Component({
  selector: 'app-van-reservations',
  imports: [ RouterLink, UiButton, UiIcon, UiInputSearch, UiSelect, UiToast, UiDateSelector, VanRescheduleCalendar, VanApproveModal, ReservationExportModal, ApprovedReservationActionsMenu, ReservationApproverTableSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="animate-rise flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-black text-gray-900">University Van Reservations</h1>
          <p class="text-sm text-gray-500 mt-0.5">Review, assign vehicles/drivers, and manage van trip requests</p>
        </div>
        <div class="flex items-center gap-3">
          <a uiButton [routerLink]="addReservationPath">
            <ui-icon name="add" class="text-base" />
            Add Reservation
          </a>
          <button type="button" (click)="exportOpen.set(true)"
            class="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            <ui-icon name="download" class="text-base" />
            Export
          </button>
          <div class="flex items-center gap-2 text-sm text-gray-500">
          <ui-icon name="airport_shuttle" class="text-primary text-base" />
          <span>{{ filtered().length }} of {{ reservations().length }} shown</span>
        </div>
        </div>
      </section>

      <section class="animate-rise flex flex-nowrap items-center gap-3 overflow-x-auto pb-0.5">
        <ui-select
          class="w-44 shrink-0"
          [value]="statusFilter()"
          (valueChange)="statusFilter.set($any($event))"
          placeholder="Filter by status"
          [options]="statusFilterOptions"
        />
        @if (!allMonths()) {
          <ui-date-selector [value]="activeMonth()" (valueChange)="activeMonth.set($event)" />
        }
        <button
          type="button"
          (click)="allMonths.set(!allMonths())"
          class="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-colors cursor-pointer"
          [class.border-primary]="allMonths()"
          [class.bg-primary]="allMonths()"
          [class.text-white]="allMonths()"
          [class.border-gray-200]="!allMonths()"
          [class.text-gray-600]="!allMonths()"
        >
          <ui-icon name="calendar_month" class="text-sm" />
          {{ allMonths() ? 'Filter by month' : 'All months' }}
        </button>
        <ui-input-search
          placeholder="Search by destination, department, contact, passengers..."
          (valueChange)="search.set($event)"
          class="min-w-48 flex-1"
        />
      </section>

      <section class="bg-white/45 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-inset ring-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_-12px_rgba(24,24,27,0.18)] animate-rise flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl">
        @if (apiError()) {
          <div class="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <ui-icon name="cloud_off" class="text-5xl text-red-300" />
            <p class="text-sm font-semibold text-red-500">Failed to load reservations</p>
            <button type="button" (click)="load()"
              class="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer mt-1">
              <ui-icon name="refresh" class="text-base" />
              Retry
            </button>
          </div>
        } @else if (!loading() && filtered().length === 0) {
          <div class="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <ui-icon name="event_busy" class="text-5xl text-gray-300" />
            <p class="text-sm font-semibold text-gray-500">No reservations found</p>
            <p class="text-xs text-gray-400">Try adjusting your search or filter</p>
          </div>
        } @else {
          <div class="min-h-0 flex-1 overflow-x-auto">
            <table class="w-full text-sm border-collapse bg-white">
              <thead class="sticky top-0 z-10">
                <tr class="border-b border-gray-100 bg-gray-50">
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 w-10">#</th>
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Destination</th>
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden md:table-cell">Dept / Org</th>
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Contact</th>
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden xl:table-cell">Dates / Return</th>
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden lg:table-cell">Passengers</th>
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 hidden xl:table-cell">Vehicle / Driver</th>
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Status</th>
                  <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  <app-reservation-approver-table-skeleton />
                } @else {
                  @for (row of filtered(); track row.id) {
                <tr class="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td class="px-4 py-3 text-xs text-gray-400 font-mono">{{ row.id }}</td>

                  <td class="px-4 py-3 max-w-[200px] cursor-pointer hover:bg-gray-50/80 transition-colors" (click)="openDetails(row)">
                    <p class="font-semibold text-gray-900 truncate">{{ row.travelDestination }}</p>
                    <p class="text-[11px] text-gray-400 mt-0.5">{{ formatDate(row.createdAt) }}</p>
                    <p class="mt-1 text-[10px] font-semibold text-primary">Click to view full summary</p>
                  </td>

                  <td class="px-4 py-3 hidden md:table-cell max-w-[160px]">
                    <p class="text-xs font-medium text-gray-700 truncate">{{ row.department }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ row.organization }}</p>
                  </td>

                  <td class="px-4 py-3 hidden lg:table-cell max-w-[160px]">
                    <p class="text-xs font-medium text-gray-700 truncate">{{ row.contactPerson }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ row.contactEmail }}</p>
                    <p class="text-xs text-gray-400">{{ row.contactNumber }}</p>
                  </td>

                  <td class="px-4 py-3 hidden xl:table-cell max-w-[180px]">
                    @for (slot of parseDates(row.reservedDates); track slot.date) {
                      <div class="text-[11px] leading-tight text-gray-600 flex items-center gap-1 mb-0.5">
                        <ui-icon name="calendar_today" class="text-[10px] text-primary shrink-0" />
                        <span>{{ slot.date }}</span>
                        <span class="text-gray-400">{{ slot.startTime }}–{{ slot.endTime }}</span>
                      </div>
                    }
                    @if (row.returnTime) {
                      <p class="text-[10px] text-primary mt-0.5">Return: {{ row.returnTime }}</p>
                    }
                  </td>

                  <td class="px-4 py-3 hidden lg:table-cell max-w-[120px]">
                    @if (row.numberOfPassengers) {
                      <p class="text-xs font-medium text-gray-700">{{ row.numberOfPassengers }} passenger{{ row.numberOfPassengers === 1 ? '' : 's' }}</p>
                    }
                    @if (row.passengerNames) {
                      <p class="text-xs text-gray-500 truncate" [title]="row.passengerNames">{{ row.passengerNames }}</p>
                    } @else {
                      <span class="text-xs text-gray-400">—</span>
                    }
                  </td>

                  <td class="px-4 py-3 hidden xl:table-cell max-w-[140px]">
                    @if (row.vehicleLabel) {
                      <p class="text-xs font-medium text-gray-700 truncate">{{ row.vehicleLabel }}</p>
                    } @else {
                      <p class="text-xs text-gray-400 italic">No vehicle</p>
                    }
                    @if (row.driverName) {
                      <p class="text-xs text-gray-500 truncate">{{ row.driverName }}</p>
                    } @else {
                      <p class="text-xs text-gray-400 italic">No driver</p>
                    }
                  </td>

                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                      [class.bg-amber-100]="row.status === 'PENDING'"
                      [class.text-amber-700]="row.status === 'PENDING'"
                      [class.bg-emerald-100]="row.status === 'APPROVED'"
                      [class.text-emerald-700]="row.status === 'APPROVED'"
                      [class.bg-red-100]="row.status === 'REJECTED'"
                      [class.text-red-700]="row.status === 'REJECTED'"
                      [class.bg-gray-100]="row.status === 'CANCELLED'"
                      [class.text-gray-500]="row.status === 'CANCELLED'"
                      [class.bg-teal-100]="row.status === 'COMPLETED'"
                      [class.text-teal-700]="row.status === 'COMPLETED'"
                      [class.bg-orange-100]="row.status === 'CONFLICT'"
                      [class.text-orange-700]="row.status === 'CONFLICT'"
                    >{{ row.status }}</span>
                    @if (row.status === 'COMPLETED' && row.satisfactionRating) {
                      <div class="flex items-center gap-0.5 mt-1.5" [title]="row.satisfactionRating + ' / 5'">
                        @for (star of [1,2,3,4,5]; track star) {
                          <span class="text-sm" [class.text-yellow-400]="star <= row.satisfactionRating!" [class.text-gray-300]="star > row.satisfactionRating!">★</span>
                        }
                      </div>
                    }
                  </td>

                  <td class="px-4 py-3 text-right">
                    @if (row.status === 'PENDING') {
                      <div class="flex items-center justify-end gap-1.5">
                        <button type="button" (click)="openApprove(row)" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="check_circle" class="text-sm" />
                          Approve
                        </button>
                        <button type="button" (click)="requestConfirm(row, 'REJECTED')" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="cancel" class="text-sm" />
                          Reject
                        </button>
                      </div>
                    } @else if (row.status === 'CONFLICT') {
                      <div class="flex items-center justify-end gap-1.5">
                        <button type="button" (click)="requestConfirm(row, 'REJECTED')" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="cancel" class="text-sm" />
                          Reject
                        </button>
                      </div>
                    } @else if (row.status === 'APPROVED') {
                      <app-approved-reservation-actions-menu
                        [rowId]="row.id"
                        [expanded]="isApprovedActionsExpanded(row.id)"
                        (expandedChange)="setApprovedActionsExpanded(row.id, $event)"
                        [disabled]="acting() === row.id"
                      >
                        <button type="button" (click)="openReassign(row)" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-violet-50 border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="swap_horiz" class="text-sm" />
                          Change Vehicle/Driver
                        </button>
                        <button type="button" (click)="openReschedule(row)" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-sky-50 border border-sky-200 px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="edit_calendar" class="text-sm" />
                          Reschedule
                        </button>
                        <button type="button" (click)="requestConfirm(row, 'COMPLETED')" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="task_alt" class="text-sm" />
                          Complete
                        </button>
                        <button type="button" (click)="requestConfirm(row, 'CANCELLED')" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-gray-100 border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="block" class="text-sm" />
                          Cancel
                        </button>
                      </app-approved-reservation-actions-menu>
                    } @else {
                      <span class="text-xs text-gray-300 italic">—</span>
                    }
                  </td>
                </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      @if (detailsTarget()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" (click)="closeDetails()">
          <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl p-6 flex flex-col gap-5" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-black text-gray-900">Trip Summary</h2>
                <p class="text-xs text-gray-500 mt-0.5">Reservation #{{ detailsTarget()!.id }} · {{ detailsTarget()!.status }}</p>
              </div>
              <button type="button" (click)="closeDetails()"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                <ui-icon name="close" class="text-lg" />
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div class="rounded-xl border border-gray-200 p-3">
                <p class="text-xs uppercase tracking-wide font-bold text-gray-400">Destination</p>
                <p class="font-semibold text-gray-900 mt-1">{{ detailsTarget()!.travelDestination }}</p>
              </div>
              <div class="rounded-xl border border-gray-200 p-3">
                <p class="text-xs uppercase tracking-wide font-bold text-gray-400">Organization</p>
                <p class="font-semibold text-gray-900 mt-1">{{ detailsTarget()!.organization }}</p>
                <p class="text-xs text-gray-500">{{ detailsTarget()!.department }}</p>
              </div>
              <div class="rounded-xl border border-gray-200 p-3">
                <p class="text-xs uppercase tracking-wide font-bold text-gray-400">Contact</p>
                <p class="font-semibold text-gray-900 mt-1">{{ detailsTarget()!.contactPerson }}</p>
                <p class="text-xs text-gray-500">{{ detailsTarget()!.contactEmail }}</p>
                <p class="text-xs text-gray-500">{{ detailsTarget()!.contactNumber }}</p>
              </div>
              <div class="rounded-xl border border-gray-200 p-3">
                <p class="text-xs uppercase tracking-wide font-bold text-gray-400">Passengers</p>
                @if (detailsTarget()!.numberOfPassengers) {
                  <p class="text-xs text-gray-500 mt-1">{{ detailsTarget()!.numberOfPassengers }} passenger{{ detailsTarget()!.numberOfPassengers === 1 ? '' : 's' }}</p>
                }
                <p class="font-semibold text-gray-900 mt-1">{{ detailsTarget()!.passengerNames || '—' }}</p>
                @if (detailsTarget()!.returnTime) {
                  <p class="text-xs text-primary mt-1">Return by: {{ detailsTarget()!.returnTime }}</p>
                }
              </div>
            </div>

            <div class="rounded-xl border border-gray-200 p-4">
              <p class="text-xs uppercase tracking-wide font-bold text-gray-400 mb-2">Trip Dates</p>
              <div class="flex flex-col gap-1.5">
                @for (slot of parseDates(detailsTarget()!.reservedDates); track slot.date + '-' + slot.startTime) {
                  <p class="text-sm text-gray-700">• {{ slot.date }} · {{ slot.startTime }} – {{ slot.endTime }}</p>
                }
              </div>
            </div>

            @if (detailsTarget()!.vehicleLabel || detailsTarget()!.driverName) {
              <div class="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p class="text-xs uppercase tracking-wide font-bold text-primary mb-1">Assignment</p>
                <p class="text-sm text-gray-900">Vehicle: {{ detailsTarget()!.vehicleLabel || '—' }}</p>
                <p class="text-sm text-gray-900">Driver: {{ detailsTarget()!.driverName || '—' }}</p>
              </div>
            }

            <div class="flex justify-end">
              <button type="button" (click)="closeDetails()"
                class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      }

      @if (confirm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" (click)="confirm.set(null)">
          <div class="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 flex flex-col gap-4" (click)="$event.stopPropagation()">
            <div class="flex items-start gap-3">
              @if (confirm()!.action === 'REJECTED') {
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <ui-icon name="cancel" class="text-red-600 text-xl" />
                </div>
              } @else if (confirm()!.action === 'COMPLETED') {
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100">
                  <ui-icon name="task_alt" class="text-teal-600 text-xl" />
                </div>
              } @else {
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <ui-icon name="block" class="text-gray-600 text-xl" />
                </div>
              }
              <div class="flex-1 min-w-0">
                <h2 class="text-sm font-bold text-gray-900">
                  {{ actionLabel(confirm()!.action) }} Reservation
                </h2>
                <p class="text-xs text-gray-500 mt-1">
                  Are you sure you want to mark the trip to
                  <strong>"{{ confirm()!.tripTitle }}"</strong> as <strong class="lowercase">{{ confirm()!.action.toLowerCase() }}</strong>?
                </p>
              </div>
            </div>
            <div class="flex gap-2 justify-end">
              <button type="button" (click)="confirm.set(null)"
                class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                Cancel
              </button>
              <button type="button" (click)="executeAction()" [disabled]="acting() !== null"
                class="rounded-lg px-4 py-2 text-sm font-bold text-white cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                [class.bg-red-600]="confirm()!.action === 'REJECTED'"
                [class.hover:bg-red-700]="confirm()!.action === 'REJECTED'"
                [class.bg-teal-600]="confirm()!.action === 'COMPLETED'"
                [class.hover:bg-teal-700]="confirm()!.action === 'COMPLETED'"
                [class.bg-gray-600]="confirm()!.action === 'CANCELLED'"
                [class.hover:bg-gray-700]="confirm()!.action === 'CANCELLED'"
              >
                @if (acting() !== null) { <ui-icon name="autorenew" class="text-base animate-spin" /> }
                @else { Confirm }
              </button>
            </div>
          </div>
        </div>
      }

      <ui-toast [message]="toast()" (dismissed)="toast.set('')" />

    @if (exportOpen()) {
      <app-reservation-export-modal
        serviceName="Van"
        (closed)="exportOpen.set(false)"
        (exported)="runExport($event)"
      />
    }
    @if (approveTarget()) {
      <app-van-approve-modal
        [reservation]="approveTarget()!"
        [mode]="assignMode()"
        (approved)="onAssigned($event)"
        (cancelled)="closeApprove()"
      />
    }

    @if (rescheduleTarget()) {
      <app-van-reschedule-calendar
        [events]="rescheduleApprovedEvents()"
        [initialSlots]="rescheduleInitialSlots()"
        [tripTitle]="rescheduleTarget()!.tripTitle"
        [saving]="rescheduleSaving"
        (saved)="saveReschedule($event)"
        (cancelled)="closeReschedule()"
      />
    }
  `,
})
export class VanReservations implements OnInit, OnDestroy {
  private readonly svc = inject(VanReservationsService);
  private readonly router = inject(Router);
  private readonly realtime = inject(ReservationRealtimeService);
  private wsSub?: Subscription;

  protected readonly addReservationPath = adminAddReservationPath('van', this.router.url);

  readonly loading = signal(true);
  readonly apiError = signal(false);
  readonly reservations = signal<VanReservationRow[]>([]);
  readonly search = signal('');
  readonly statusFilter = signal<StatusFilter>('PENDING');
  readonly activeMonth = signal(getCurrentYearMonth());
  readonly allMonths = signal(false);
  readonly acting = signal<number | null>(null);
  readonly confirm = signal<ConfirmState | null>(null);
  readonly detailsTarget = signal<VanReservationRow | null>(null);
  readonly approveTarget = signal<VanReservationRow | null>(null);
  readonly assignMode = signal<'approve' | 'reassign'>('approve');
  readonly toast = signal('');
  readonly exportOpen = signal(false);
  readonly expandedApprovedActions = signal<Set<number>>(new Set());

  protected isApprovedActionsExpanded(id: number): boolean {
    return this.expandedApprovedActions().has(id);
  }

  protected setApprovedActionsExpanded(id: number, expanded: boolean): void {
    this.expandedApprovedActions.update(set => {
      const next = new Set(set);
      if (expanded) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  readonly rescheduleTarget = signal<{ id: number; tripTitle: string } | null>(null);
  readonly rescheduleSaving = signal(false);

  readonly rescheduleApprovedEvents = computed<VanRescheduleEvent[]>(() => {
    const target = this.rescheduleTarget();
    const events: VanRescheduleEvent[] = [];
    for (const r of this.reservations()) {
      if (r.status !== 'APPROVED' && r.status !== 'COMPLETED') continue;
      if (r.id === target?.id) continue;
      try {
        const slots: ReservedDateSlot[] = JSON.parse(r.reservedDates);
        for (const s of slots) {
          events.push({
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            department: r.department,
            organization: r.organization,
            travelDestination: r.travelDestination,
            eventKind: 'RESERVATION',
          });
        }
      } catch { /* skip */ }
    }
    return events;
  });

  readonly rescheduleInitialSlots = computed<ReservedDateSlot[]>(() => {
    const target = this.rescheduleTarget();
    if (!target) return [];
    const row = this.reservations().find(r => r.id === target.id);
    if (!row) return [];
    try { return JSON.parse(row.reservedDates); } catch { return []; }
  });

  readonly statusFilterOptions: UiSelectOption[] = STATUS_FILTERS.map((s) => ({ value: s, label: s }));

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase();
    const status = this.statusFilter();
    const month = this.allMonths() ? '' : this.activeMonth();
    const rows = this.reservations().filter(r => {
      const matchStatus = status === 'All' || r.status === status;
      const matchSearch = !q
        || r.travelDestination.toLowerCase().includes(q)
        || r.department.toLowerCase().includes(q)
        || r.organization.toLowerCase().includes(q)
        || r.contactPerson.toLowerCase().includes(q)
        || r.contactEmail.toLowerCase().includes(q)
        || (r.passengerNames?.toLowerCase().includes(q) ?? false);
      const matchMonth = reservationMatchesMonth(r.reservedDates, null, r.createdAt, month);
      return matchStatus && matchSearch && matchMonth;
    });
    return [...rows].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  });

  ngOnInit(): void {
    this.load();
    this.realtime.ensureConnected();
    this.wsSub = this.realtime.vanUpdates$.subscribe(ev => this.handleWsEvent(ev));
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.apiError.set(false);
    this.svc.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.reservations.set(res.reservations ?? []);
        } else {
          this.apiError.set(true);
        }
        this.loading.set(false);
      },
      error: () => {
        this.apiError.set(true);
        this.loading.set(false);
      },
    });
  }

  runExport(range: ExportDateRange): void {
    exportVanReservationsCsv(this.reservations(), range);
    this.exportOpen.set(false);
    this.toast.set('Van reservations exported to CSV');
  }

  openApprove(row: VanReservationRow): void {
    this.assignMode.set('approve');
    this.approveTarget.set(row);
  }

  openReassign(row: VanReservationRow): void {
    this.assignMode.set('reassign');
    this.approveTarget.set(row);
  }

  closeApprove(): void {
    this.approveTarget.set(null);
  }

  onAssigned(result: VanApproveResult): void {
    const target = this.approveTarget();
    if (!target) return;
    this.reservations.update(list => list.map(r => r.id === target.id
      ? {
        ...r,
        status: 'APPROVED' as ReservationStatus,
        vehicleId: result.vehicleId,
        driverId: result.driverId,
        vehicleLabel: result.vehicleLabel,
        driverName: result.driverName,
      }
      : r));
    this.toast.set(
      this.assignMode() === 'reassign'
        ? 'Vehicle and driver updated successfully.'
        : 'Reservation approved with vehicle and driver assigned.',
    );
    this.closeApprove();
  }

  requestConfirm(row: VanReservationRow, action: ReservationStatus): void {
    this.confirm.set({ id: row.id, action, tripTitle: row.travelDestination });
  }

  openDetails(row: VanReservationRow): void { this.detailsTarget.set(row); }
  closeDetails(): void { this.detailsTarget.set(null); }

  executeAction(): void {
    const state = this.confirm();
    if (!state) return;
    this.acting.set(state.id);
    this.svc.updateStatus(state.id, state.action).subscribe({
      next: (res) => {
        this.acting.set(null);
        this.confirm.set(null);
        if (res.success) {
          this.reservations.update(list => {
            let updated = list.map(r => r.id === state.id ? { ...r, status: state.action } : r);
            for (const cid of res.conflictedIds ?? []) {
              updated = updated.map(r => r.id === cid ? { ...r, status: 'CONFLICT' as ReservationStatus } : r);
            }
            updated = applyRevertedIds(updated, res.revertedIds);
            return updated;
          });
          const conflictNote = res.conflictedIds?.length
            ? ` ${res.conflictedIds.length} conflicting request(s) marked as CONFLICT.`
            : '';
          const revertNote = res.revertedIds?.length
            ? ` ${res.revertedIds.length} conflict(s) reverted to PENDING.`
            : '';
          this.toast.set(`Reservation ${state.action.toLowerCase()} successfully.${conflictNote}${revertNote}`);
        } else {
          this.toast.set(res.blockedReason ?? res.message ?? 'Action failed. Please try again.');
        }
      },
      error: (err) => {
        this.acting.set(null);
        this.confirm.set(null);
        const body = err?.error;
        this.toast.set(body?.blockedReason ?? body?.message ?? 'An error occurred. Please try again.');
      },
    });
  }

  openReschedule(row: VanReservationRow): void {
    this.rescheduleTarget.set({ id: row.id, tripTitle: row.travelDestination });
  }

  closeReschedule(): void { this.rescheduleTarget.set(null); }

  saveReschedule(slots: ReservedDateSlot[]): void {
    const target = this.rescheduleTarget();
    if (!target || slots.length === 0) return;
    this.rescheduleSaving.set(true);
    this.svc.reschedule(target.id, slots).subscribe({
      next: (res) => {
        this.rescheduleSaving.set(false);
        if (res.success) {
          const newDates = JSON.stringify(slots);
          this.reservations.update(list => {
            let updated = list.map(r => r.id === target.id ? { ...r, reservedDates: newDates } : r);
            updated = applyRevertedIds(updated, res.revertedIds);
            return updated;
          });
          const revertNote = res.revertedIds?.length
            ? ` ${res.revertedIds.length} conflict(s) reverted to PENDING.`
            : '';
          this.toast.set(`Reservation rescheduled successfully.${revertNote}`);
          this.closeReschedule();
        } else {
          this.toast.set(res.blockedReason ?? res.message ?? 'Failed to reschedule reservation.');
        }
      },
      error: (err) => {
        this.rescheduleSaving.set(false);
        const body = err?.error;
        this.toast.set(body?.blockedReason ?? body?.message ?? 'An error occurred.');
      },
    });
  }

  actionLabel(action: ReservationStatus | string): string {
    const map: Record<string, string> = {
      REJECTED: 'Reject', CANCELLED: 'Cancel', COMPLETED: 'Mark as Complete',
    };
    return map[action] ?? action;
  }

  handleWsEvent(ev: ReservationWsEvent): void {
    const { updated, needsReload } = applyReservationWsEvent(this.reservations(), ev);
    if (needsReload) {
      this.load();
      return;
    }
    this.reservations.set(updated);
  }

  parseDates(json: string): ReservedDateSlot[] {
    try { return JSON.parse(json) ?? []; } catch { return []; }
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return iso; }
  }
}
