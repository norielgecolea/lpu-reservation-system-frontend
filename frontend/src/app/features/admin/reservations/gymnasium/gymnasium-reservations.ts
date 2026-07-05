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
import { GymnasiumRescheduleCalendar, GymRescheduleEvent } from './gymnasium-reschedule-calendar';
import { GymCoordinationSlot, GymnasiumCoordinationCalendar } from './gymnasium-coordination-calendar';
import { AdminShell } from '../../../../shared/layout/admin-shell/admin-shell';
import { UiIcon, UiInputSearch, UiSegmented, UiToast } from '../../../../shared/ui';
import { MaintenanceBlock, MaintenanceService } from '../../../admin/maintenance/maintenance.service';
import { MaintenanceCalendarPicker, MaintenanceSlot, ScheduledEvent } from '../../../admin/maintenance/maintenance-calendar-picker';
import {
  GymReservationRecord,
  RequestedEquipmentItem,
  ReservationStatus,
  ReservedDateSlot,
  SetCoordinationRequest,
} from './gymnasium-reservations.models';
import { GymReservationsService } from './gymnasium-reservations.service';
import { ReservationRealtimeService, ReservationWsEvent } from '../reservation-realtime.service';
import { applyReservationWsEvent } from '../reservation-ws.util';

const STATUS_FILTERS = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'CONFLICT'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

interface ConfirmState {
  id: number;
  action: ReservationStatus;
  eventTitle: string;
}

@Component({
  selector: 'app-gymnasium-reservations',
  imports: [AdminShell, UiIcon, UiInputSearch, UiSegmented, UiToast, GymnasiumRescheduleCalendar, GymnasiumCoordinationCalendar, MaintenanceCalendarPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-admin-shell>
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-black text-gray-900 dark:text-zinc-100">Gymnasium Reservations</h1>
          <p class="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Review and manage all Gymnasium reservation requests</p>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" (click)="openMaintenance()"
            class="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer">
            <ui-icon name="construction" class="text-base" />
            Maintenance
            @if (maintenanceBlocks().length > 0) {
              <span class="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500 text-white w-4 h-4 text-[9px] font-black">{{ maintenanceBlocks().length }}</span>
            }
          </button>
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
            <ui-icon name="sports_gymnastics" class="text-primary text-base" />
            <span>{{ filtered().length }} of {{ reservations().length }} shown</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3">
        <ui-input-search placeholder="Search by event, department, contact..." (valueChange)="search.set($event)" class="flex-1" />
        <ui-segmented [options]="statusFilters" [value]="statusFilter()" (valueChange)="statusFilter.set($any($event))" />
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="flex items-center justify-center gap-3 py-20 text-gray-400">
          <ui-icon name="autorenew" class="text-3xl animate-spin" />
          <span class="text-sm">Loading reservations...</span>
        </div>
      } @else if (apiError()) {
        <div class="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <ui-icon name="cloud_off" class="text-5xl text-red-300 dark:text-red-700" />
          <p class="text-sm font-semibold text-red-500 dark:text-red-400">Failed to load reservations</p>
          <button type="button" (click)="load()"
            class="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer mt-1">
            <ui-icon name="refresh" class="text-base" />
            Retry
          </button>
        </div>
      } @else if (filtered().length === 0) {
        <div class="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <ui-icon name="event_busy" class="text-5xl text-gray-300 dark:text-zinc-600" />
          <p class="text-sm font-semibold text-gray-500 dark:text-zinc-400">No reservations found</p>
          <p class="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filter</p>
        </div>
      } @else {
        <div class="overflow-x-auto rounded-xl ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
          <table class="w-full text-sm border-collapse bg-white dark:bg-zinc-900">
            <thead>
              <tr class="border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/60">
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 w-10">#</th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Event</th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 hidden md:table-cell">Dept / Org</th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 hidden lg:table-cell">Contact</th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 hidden xl:table-cell">Dates</th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 hidden lg:table-cell">Attendees</th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 hidden xl:table-cell">Equipment</th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Status</th>
                <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (row of filtered(); track row.id) {
                <tr class="border-b border-gray-50 dark:border-zinc-800/60 hover:bg-gray-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                  <td class="px-4 py-3 text-xs text-gray-400 dark:text-zinc-500 font-mono">{{ row.id }}</td>

                  <!-- Event -->
                  <td class="px-4 py-3 max-w-[200px] cursor-pointer hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors" (click)="openDetails(row)">
                    <p class="font-semibold text-gray-900 dark:text-zinc-100 truncate">{{ row.eventTitle }}</p>
                    @if (row.additionalInstructions) {
                      <p class="mt-1 text-[10px] italic text-amber-600 dark:text-amber-400 truncate max-w-[180px]" [title]="row.additionalInstructions">
                        📝 {{ row.additionalInstructions }}
                      </p>
                    }
                    <p class="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">{{ formatDate(row.createdAt) }}</p>
                    <p class="mt-1 text-[10px] font-semibold text-primary">Click to view full summary</p>
                  </td>

                  <!-- Dept / Org -->
                  <td class="px-4 py-3 hidden md:table-cell max-w-[160px]">
                    <p class="text-xs font-medium text-gray-700 dark:text-zinc-300 truncate">{{ row.department }}</p>
                    <p class="text-xs text-gray-400 dark:text-zinc-500 truncate">{{ row.organization }}</p>
                  </td>

                  <!-- Contact -->
                  <td class="px-4 py-3 hidden lg:table-cell max-w-[160px]">
                    <p class="text-xs font-medium text-gray-700 dark:text-zinc-300 truncate">{{ row.contactPerson }}</p>
                    <p class="text-xs text-gray-400 dark:text-zinc-500 truncate">{{ row.contactEmail }}</p>
                    <p class="text-xs text-gray-400 dark:text-zinc-500">{{ row.contactNumber }}</p>
                  </td>

                  <!-- Dates -->
                  <td class="px-4 py-3 hidden xl:table-cell max-w-[180px]">
                    @for (slot of parseDates(row.reservedDates); track slot.date) {
                      <div class="text-[11px] leading-tight text-gray-600 dark:text-zinc-400 flex items-center gap-1 mb-0.5">
                        <ui-icon name="calendar_today" class="text-[10px] text-primary shrink-0" />
                        <span>{{ slot.date }}</span>
                        <span class="text-gray-400">{{ slot.startTime }}–{{ slot.endTime }}</span>
                      </div>
                    }
                  </td>

                  <!-- Attendees -->
                  <td class="px-4 py-3 hidden lg:table-cell max-w-[100px]">
                    @if (row.numberOfAttendees) {
                      <p class="text-xs font-medium text-gray-700 dark:text-zinc-300">{{ row.numberOfAttendees }} pax</p>
                    } @else {
                      <span class="text-xs text-gray-400 dark:text-zinc-500">—</span>
                    }
                  </td>

                  <!-- Equipment -->
                  <td class="px-4 py-3 hidden xl:table-cell max-w-[140px]">
                    @if (parseEquipment(row.requestedEquipment).length > 0) {
                      @for (eq of parseEquipment(row.requestedEquipment); track eq.id) {
                        <div class="text-[11px] text-gray-600 dark:text-zinc-400 flex items-center gap-1 mb-0.5">
                          <ui-icon name="devices" class="text-[10px] shrink-0" />
                          {{ eq.name }}
                        </div>
                      }
                    } @else {
                      <span class="text-xs text-gray-400 dark:text-zinc-500 italic">None</span>
                    }
                  </td>

                  <!-- Status -->
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                      [class.bg-amber-100]="row.status === 'PENDING'"
                      [class.text-amber-700]="row.status === 'PENDING'"
                      [class.dark:bg-amber-950]="row.status === 'PENDING'"
                      [class.dark:text-amber-400]="row.status === 'PENDING'"
                      [class.bg-emerald-100]="row.status === 'APPROVED'"
                      [class.text-emerald-700]="row.status === 'APPROVED'"
                      [class.dark:bg-emerald-950]="row.status === 'APPROVED'"
                      [class.dark:text-emerald-400]="row.status === 'APPROVED'"
                      [class.bg-red-100]="row.status === 'REJECTED'"
                      [class.text-red-700]="row.status === 'REJECTED'"
                      [class.dark:bg-red-950]="row.status === 'REJECTED'"
                      [class.dark:text-red-400]="row.status === 'REJECTED'"
                      [class.bg-gray-100]="row.status === 'CANCELLED'"
                      [class.text-gray-500]="row.status === 'CANCELLED'"
                      [class.dark:bg-zinc-800]="row.status === 'CANCELLED'"
                      [class.dark:text-zinc-400]="row.status === 'CANCELLED'"
                      [class.bg-teal-100]="row.status === 'COMPLETED'"
                      [class.text-teal-700]="row.status === 'COMPLETED'"
                      [class.dark:bg-teal-950]="row.status === 'COMPLETED'"
                      [class.dark:text-teal-400]="row.status === 'COMPLETED'"
                      [class.bg-orange-100]="row.status === 'CONFLICT'"
                      [class.text-orange-700]="row.status === 'CONFLICT'"
                      [class.dark:bg-orange-950]="row.status === 'CONFLICT'"
                      [class.dark:text-orange-400]="row.status === 'CONFLICT'"
                    >{{ row.status }}</span>
                    @if (row.status === 'PENDING' && hasApprovedOverlap(row)) {
                      <p class="mt-1 text-[10px] font-semibold text-orange-600 dark:text-orange-400">⚠ Overlaps approved schedule</p>
                    }
                    @if (row.status === 'COMPLETED' && row.satisfactionRating) {
                      <div class="flex items-center gap-0.5 mt-1.5" [title]="row.satisfactionRating + ' / 5'">
                        @for (star of [1,2,3,4,5]; track star) {
                          <span class="text-sm" [class.text-yellow-400]="star <= row.satisfactionRating!" [class.text-gray-300]="star > row.satisfactionRating!">★</span>
                        }
                      </div>
                    }
                  </td>

                  <!-- Actions -->
                  <td class="px-4 py-3 text-right">
                    @if (row.status === 'PENDING') {
                      <div class="flex items-center justify-end gap-1.5">
                        <button type="button" (click)="requestConfirm(row, 'APPROVED')" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="check_circle" class="text-sm" />
                          Approve
                        </button>
                        <button type="button" (click)="requestConfirm(row, 'REJECTED')" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-2.5 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="cancel" class="text-sm" />
                          Reject
                        </button>
                      </div>
                    } @else if (row.status === 'CONFLICT') {
                      <div class="flex items-center justify-end gap-1.5">
                        <button type="button" (click)="requestConfirm(row, 'REJECTED')" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-2.5 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="cancel" class="text-sm" />
                          Reject
                        </button>
                      </div>
                    } @else if (row.status === 'APPROVED') {
                      <div class="flex items-center justify-end gap-1.5 flex-wrap">
                        <button type="button" (click)="openCoordination(row)" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          [title]="row.coordinationDate ? 'Update coordination: ' + row.coordinationDate : 'Set coordination meeting'">
                          <ui-icon name="handshake" class="text-sm" />
                          {{ row.coordinationDate ? 'Coordination ✓' : 'Coordination' }}
                        </button>
                        <button type="button" (click)="openReschedule(row)" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-2.5 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="edit_calendar" class="text-sm" />
                          Reschedule
                        </button>
                        <button type="button" (click)="requestConfirm(row, 'COMPLETED')" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="task_alt" class="text-sm" />
                          Complete
                        </button>
                        <button type="button" (click)="requestConfirm(row, 'CANCELLED')" [disabled]="acting() === row.id"
                          class="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <ui-icon name="block" class="text-sm" />
                          Cancel
                        </button>
                      </div>
                    } @else {
                      <span class="text-xs text-gray-300 dark:text-zinc-600 italic">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Event Details Summary Dialog -->
      @if (detailsTarget()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" (click)="closeDetails()">
          <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-6 flex flex-col gap-5" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-black text-gray-900 dark:text-zinc-100">Event Summary</h2>
                <p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Reservation #{{ detailsTarget()!.id }} · {{ detailsTarget()!.status }}</p>
              </div>
              <button type="button" (click)="closeDetails()"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <ui-icon name="close" class="text-lg" />
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div class="rounded-xl border border-gray-200 dark:border-zinc-700 p-3">
                <p class="text-xs uppercase tracking-wide font-bold text-gray-400">Event</p>
                <p class="font-semibold text-gray-900 dark:text-zinc-100 mt-1">{{ detailsTarget()!.eventTitle }}</p>
              </div>
              <div class="rounded-xl border border-gray-200 dark:border-zinc-700 p-3">
                <p class="text-xs uppercase tracking-wide font-bold text-gray-400">Organization</p>
                <p class="font-semibold text-gray-900 dark:text-zinc-100 mt-1">{{ detailsTarget()!.organization }}</p>
                <p class="text-xs text-gray-500 dark:text-zinc-400">{{ detailsTarget()!.department }}</p>
              </div>
              <div class="rounded-xl border border-gray-200 dark:border-zinc-700 p-3">
                <p class="text-xs uppercase tracking-wide font-bold text-gray-400">Contact</p>
                <p class="font-semibold text-gray-900 dark:text-zinc-100 mt-1">{{ detailsTarget()!.contactPerson }}</p>
                <p class="text-xs text-gray-500 dark:text-zinc-400">{{ detailsTarget()!.contactEmail }}</p>
                <p class="text-xs text-gray-500 dark:text-zinc-400">{{ detailsTarget()!.contactNumber }}</p>
              </div>
              <div class="rounded-xl border border-gray-200 dark:border-zinc-700 p-3">
                <p class="text-xs uppercase tracking-wide font-bold text-gray-400">Attendees</p>
                <p class="font-semibold text-gray-900 dark:text-zinc-100 mt-1">{{ detailsTarget()!.numberOfAttendees || '—' }} pax</p>
              </div>
            </div>

            <div class="rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
              <p class="text-xs uppercase tracking-wide font-bold text-gray-400 mb-2">Reserved Dates</p>
              <div class="flex flex-col gap-1.5">
                @for (slot of parseDates(detailsTarget()!.reservedDates); track slot.date + '-' + slot.startTime) {
                  <p class="text-sm text-gray-700 dark:text-zinc-300">• {{ slot.date }} · {{ slot.startTime }} – {{ slot.endTime }}</p>
                }
              </div>
            </div>

            <div class="rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
              <p class="text-xs uppercase tracking-wide font-bold text-gray-400 mb-2">Requested Equipment</p>
              @if (parseEquipment(detailsTarget()!.requestedEquipment).length > 0) {
                <div class="flex flex-wrap gap-2">
                  @for (eq of parseEquipment(detailsTarget()!.requestedEquipment); track eq.id) {
                    <span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 text-xs text-gray-700 dark:text-zinc-300">{{ eq.name }}</span>
                  }
                </div>
              } @else {
                <p class="text-sm italic text-gray-400 dark:text-zinc-500">No equipment requested.</p>
              }
            </div>

            @if (detailsTarget()!.coordinationDate) {
              <div class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 p-4">
                <p class="text-xs uppercase tracking-wide font-bold text-amber-600 dark:text-amber-400 mb-1">Coordination Meeting</p>
                <p class="text-sm text-amber-900 dark:text-amber-200">{{ detailsTarget()!.coordinationDate }} · {{ detailsTarget()!.coordinationStartTime }} – {{ detailsTarget()!.coordinationEndTime }}</p>
              </div>
            }

            @if (detailsTarget()!.additionalInstructions) {
              <div class="rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
                <p class="text-xs uppercase tracking-wide font-bold text-gray-400 mb-1">Additional Instructions</p>
                <p class="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">{{ detailsTarget()!.additionalInstructions }}</p>
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

      <!-- Confirmation Dialog -->
      @if (confirm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" (click)="confirm.set(null)">
          <div class="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-6 flex flex-col gap-4" (click)="$event.stopPropagation()">
            <div class="flex items-start gap-3">
              @if (confirm()!.action === 'APPROVED') {
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
                  <ui-icon name="check_circle" class="text-emerald-600 dark:text-emerald-400 text-xl" />
                </div>
              } @else if (confirm()!.action === 'REJECTED') {
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
                  <ui-icon name="cancel" class="text-red-600 dark:text-red-400 text-xl" />
                </div>
              } @else if (confirm()!.action === 'COMPLETED') {
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950/60">
                  <ui-icon name="task_alt" class="text-teal-600 dark:text-teal-400 text-xl" />
                </div>
              } @else {
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
                  <ui-icon name="block" class="text-gray-600 dark:text-zinc-400 text-xl" />
                </div>
              }
              <div class="flex-1 min-w-0">
                <h2 class="text-sm font-bold text-gray-900 dark:text-zinc-100">
                  {{ actionLabel(confirm()!.action) }} Reservation
                </h2>
                <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  Are you sure you want to mark the reservation for
                  <strong>"{{ confirm()!.eventTitle }}"</strong> as <strong class="lowercase">{{ confirm()!.action.toLowerCase() }}</strong>?
                </p>
              </div>
            </div>
            <div class="flex gap-2 justify-end">
              <button type="button" (click)="confirm.set(null)"
                class="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors">
                Cancel
              </button>
              <button type="button" (click)="executeAction()" [disabled]="acting() !== null"
                class="rounded-lg px-4 py-2 text-sm font-bold text-white cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                [class.bg-emerald-600]="confirm()!.action === 'APPROVED'"
                [class.hover:bg-emerald-700]="confirm()!.action === 'APPROVED'"
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
    </app-admin-shell>

    <!-- Coordination Calendar Overlay -->
    @if (coordinationTarget()) {
      <app-gymnasium-coordination-calendar
        [events]="coordinationCalendarEvents()"
        [eventTitle]="coordinationTarget()!.eventTitle"
        [saving]="coordSaving"
        [initial]="coordinationInitialSlot()"
        (saved)="saveCoordination($event)"
        (cancelled)="closeCoordination()"
      />
    }

    <!-- Reschedule Calendar Overlay -->
    @if (rescheduleTarget()) {
      <app-gymnasium-reschedule-calendar
        [events]="rescheduleApprovedEvents()"
        [initialSlots]="rescheduleInitialSlots()"
        [eventTitle]="rescheduleTarget()!.eventTitle"
        [saving]="rescheduleSaving"
        (saved)="saveReschedule($event)"
        (cancelled)="closeReschedule()"
      />
    }

    <!-- ─── Maintenance Calendar Overlay ─── -->
    @if (showMaintenance()) {
      <app-maintenance-calendar-picker
        facilityLabel="Gymnasium"
        [existingBlocks]="maintenanceBlocks()"
        [events]="maintenanceEvents()"
        [saving]="maintSaving"
        (addSlot)="addMaintenanceBlock($event)"
        (removeSlot)="removeMaintenanceBlock($event)"
        (cancelled)="closeMaintenance()"
      />
    }
  `,
})
export class GymnasiumReservations implements OnInit, OnDestroy {
  private readonly svc = inject(GymReservationsService);
  private readonly maintSvc = inject(MaintenanceService);
  private readonly realtime = inject(ReservationRealtimeService);
  private wsSub?: Subscription;

  readonly loading = signal(true);
  readonly apiError = signal(false);
  readonly reservations = signal<GymReservationRecord[]>([]);
  readonly search = signal('');
  readonly statusFilter = signal<StatusFilter>('All');
  readonly acting = signal<number | null>(null);
  readonly confirm = signal<ConfirmState | null>(null);
  readonly detailsTarget = signal<GymReservationRecord | null>(null);
  readonly toast = signal('');

  // Maintenance
  readonly showMaintenance = signal(false);
  readonly maintenanceBlocks = signal<MaintenanceBlock[]>([]);
  readonly maintSaving = signal(false);

  /** Approved events to show in the maintenance calendar (read-only context) */
  readonly maintenanceEvents = computed<ScheduledEvent[]>(() =>
    this.reservations()
      .filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED')
      .flatMap((r): ScheduledEvent[] => {
        const events: ScheduledEvent[] = [];
        try {
          const slots: ReservedDateSlot[] = JSON.parse(r.reservedDates);
          for (const s of slots) {
            events.push({ date: s.date, startTime: s.startTime, endTime: s.endTime, department: r.department, organization: r.organization, eventKind: 'RESERVATION' });
          }
        } catch { /* skip */ }
        if (r.coordinationDate && r.coordinationStartTime && r.coordinationEndTime) {
          events.push({ date: r.coordinationDate, startTime: r.coordinationStartTime, endTime: r.coordinationEndTime, department: r.department, organization: r.organization, eventKind: 'COORDINATION' });
        }
        return events;
      })
  );

  readonly coordinationTarget = signal<{ id: number; eventTitle: string } | null>(null);
  readonly coordSaving = signal(false);

  readonly rescheduleTarget = signal<{ id: number; eventTitle: string } | null>(null);
  readonly rescheduleSaving = signal(false);

  readonly rescheduleApprovedEvents = computed<GymRescheduleEvent[]>(() => {
    const target = this.rescheduleTarget();
    const events: GymRescheduleEvent[] = [];
    for (const r of this.reservations()) {
      if (r.status !== 'APPROVED' && r.status !== 'COMPLETED') continue;
      if (r.id === target?.id) continue;
      try {
        const slots: ReservedDateSlot[] = JSON.parse(r.reservedDates);
        for (const s of slots) {
          events.push({ date: s.date, startTime: s.startTime, endTime: s.endTime, department: r.department, organization: r.organization, eventKind: 'RESERVATION' });
        }
      } catch { /* skip */ }
      if (r.coordinationDate && r.coordinationStartTime && r.coordinationEndTime) {
        events.push({ date: r.coordinationDate, startTime: r.coordinationStartTime, endTime: r.coordinationEndTime, department: r.department, organization: r.organization, eventKind: 'COORDINATION' });
      }
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

  readonly coordinationCalendarEvents = computed<GymRescheduleEvent[]>(() => {
    const target = this.coordinationTarget();
    return this.reservations()
      .filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED')
      .flatMap((r): GymRescheduleEvent[] => {
        const events: GymRescheduleEvent[] = [];
        try {
          const slots: Array<{ date: string; startTime: string; endTime: string }> = JSON.parse(r.reservedDates);
          for (const s of slots) {
            events.push({ date: s.date, startTime: s.startTime, endTime: s.endTime, department: r.department, organization: r.organization, eventKind: 'RESERVATION' });
          }
        } catch { /* skip */ }
        if (r.coordinationDate && r.coordinationStartTime && r.coordinationEndTime && (!target || r.id !== target.id)) {
          events.push({ date: r.coordinationDate, startTime: r.coordinationStartTime, endTime: r.coordinationEndTime, department: r.department, organization: r.organization, eventKind: 'COORDINATION' });
        }
        return events;
      });
  });

  readonly coordinationInitialSlot = computed<GymCoordinationSlot | null>(() => {
    const target = this.coordinationTarget();
    if (!target) return null;
    const row = this.reservations().find(r => r.id === target.id);
    if (!row?.coordinationDate || !row.coordinationStartTime || !row.coordinationEndTime) return null;
    return { date: row.coordinationDate, startTime: row.coordinationStartTime, endTime: row.coordinationEndTime };
  });

  readonly statusFilters = [...STATUS_FILTERS];

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase();
    const status = this.statusFilter();
    const rows = this.reservations().filter(r => {
      const matchStatus = status === 'All' || r.status === status;
      const matchSearch = !q
        || r.eventTitle.toLowerCase().includes(q)
        || r.department.toLowerCase().includes(q)
        || r.organization.toLowerCase().includes(q)
        || r.contactPerson.toLowerCase().includes(q)
        || r.contactEmail.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
    return [...rows].sort((a, b) => {
      const aPending = a.status === 'PENDING';
      const bPending = b.status === 'PENDING';
      if (aPending && bPending) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (aPending !== bPending) return aPending ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  ngOnInit(): void {
    this.load();
    this.loadMaintenance();
    this.realtime.ensureConnected();
    this.wsSub = this.realtime.gymUpdates$.subscribe(ev => this.handleWsEvent(ev));
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

  requestConfirm(row: GymReservationRecord, action: ReservationStatus): void {
    this.confirm.set({ id: row.id, action, eventTitle: row.eventTitle });
  }

  openDetails(row: GymReservationRecord): void { this.detailsTarget.set(row); }
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
            return updated;
          });
          const conflictNote = res.conflictedIds?.length
            ? ` ${res.conflictedIds.length} conflicting request(s) marked as CONFLICT.`
            : '';
          this.toast.set(`Reservation ${state.action.toLowerCase()} successfully.${conflictNote}`);
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

  openCoordination(row: GymReservationRecord): void {
    this.coordinationTarget.set({ id: row.id, eventTitle: row.eventTitle });
  }
  closeCoordination(): void { this.coordinationTarget.set(null); }

  saveCoordination(slot: GymCoordinationSlot): void {
    const target = this.coordinationTarget();
    if (!target) return;
    this.coordSaving.set(true);
    const body: SetCoordinationRequest = { date: slot.date, startTime: slot.startTime, endTime: slot.endTime };
    this.svc.setCoordination(target.id, body).subscribe({
      next: (res) => {
        this.coordSaving.set(false);
        if (res.success) {
          this.reservations.update(list => list.map(r => r.id === target.id
            ? { ...r, coordinationDate: body.date, coordinationStartTime: body.startTime, coordinationEndTime: body.endTime }
            : r));
          this.toast.set('Coordination meeting saved.');
          this.closeCoordination();
        } else {
          this.toast.set('Failed to save coordination meeting.');
        }
      },
      error: () => { this.coordSaving.set(false); this.toast.set('An error occurred.'); },
    });
  }

  openReschedule(row: GymReservationRecord): void {
    this.rescheduleTarget.set({ id: row.id, eventTitle: row.eventTitle });
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
          this.reservations.update(list => list.map(r => r.id === target.id ? { ...r, reservedDates: newDates } : r));
          this.toast.set('Reservation rescheduled successfully.');
          this.closeReschedule();
        } else {
          this.toast.set('Failed to reschedule reservation.');
        }
      },
      error: () => { this.rescheduleSaving.set(false); this.toast.set('An error occurred.'); },
    });
  }

  // ─── Maintenance ────────────────────────────────────────────────
  loadMaintenance(): void {
    this.maintSvc.getBlocks('GYMNASIUM').subscribe({
      next: (res) => { if (res.success) this.maintenanceBlocks.set(res.blocks ?? []); },
      error: () => {},
    });
  }

  openMaintenance(): void { this.showMaintenance.set(true); }
  closeMaintenance(): void { this.showMaintenance.set(false); }

  addMaintenanceBlock(slot: MaintenanceSlot): void {
    this.maintSaving.set(true);
    this.maintSvc.createBlock({ facility: 'GYMNASIUM', blockDate: slot.date, startTime: slot.startTime, endTime: slot.endTime, reason: slot.reason }).subscribe({
      next: (res) => {
        this.maintSaving.set(false);
        if (res.success && res.block) {
          this.maintenanceBlocks.update(list => [...list, res.block!]);
          this.toast.set('Maintenance block added.');
        } else {
          this.toast.set('Failed to add maintenance block.');
        }
      },
      error: () => { this.maintSaving.set(false); this.toast.set('Error adding maintenance block.'); },
    });
  }

  removeMaintenanceBlock(id: number): void {
    this.maintSvc.deleteBlock(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.maintenanceBlocks.update(list => list.filter(b => b.id !== id));
          this.toast.set('Maintenance block removed.');
        }
      },
      error: () => { this.toast.set('Error removing maintenance block.'); },
    });
  }

  actionLabel(action: ReservationStatus | string): string {
    const map: Record<string, string> = {
      APPROVED: 'Approve', REJECTED: 'Reject', CANCELLED: 'Cancel', COMPLETED: 'Mark as Complete',
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

  hasApprovedOverlap(row: GymReservationRecord): boolean {
    const targetSlots = this.parseDates(row.reservedDates);
    if (!targetSlots.length) return false;
    for (const other of this.reservations()) {
      if (other.id === row.id) continue;
      if (other.status !== 'APPROVED' && other.status !== 'COMPLETED') continue;
      const otherSlots = [
        ...this.parseDates(other.reservedDates),
        ...(other.coordinationDate && other.coordinationStartTime && other.coordinationEndTime
          ? [{ date: other.coordinationDate, startTime: other.coordinationStartTime, endTime: other.coordinationEndTime }]
          : []),
      ];
      if (this.slotsOverlap(targetSlots, otherSlots)) return true;
    }
    return false;
  }

  private slotsOverlap(a: ReservedDateSlot[], b: ReservedDateSlot[]): boolean {
    for (const sa of a) {
      for (const sb of b) {
        if (sa.date !== sb.date) continue;
        const aStart = parseInt(sa.startTime, 10);
        const aEnd = parseInt(sa.endTime, 10);
        const bStart = parseInt(sb.startTime, 10);
        const bEnd = parseInt(sb.endTime, 10);
        if (aStart < bEnd && aEnd > bStart) return true;
      }
    }
    return false;
  }

  parseDates(json: string): ReservedDateSlot[] {
    try { return JSON.parse(json) ?? []; } catch { return []; }
  }

  parseEquipment(json: string | null): RequestedEquipmentItem[] {
    if (!json) return [];
    try { return JSON.parse(json) ?? []; } catch { return []; }
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return iso; }
  }
}
