import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminShell } from '../../../shared/layout/admin-shell/admin-shell';
import { UiButton, UiIcon, UiInputSearch, UiStatusBadge, UiToast } from '../../../shared/ui';
import { FacilitiesUsersService } from './facilities-users.service';
import { UserRow } from '../../admin/users/users.models';

@Component({
  selector: 'app-facilities-users',
  imports: [RouterLink, AdminShell, UiButton, UiIcon, UiInputSearch, UiStatusBadge, UiToast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<app-admin-shell>
  <section class="animate-rise flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
    <ui-input-search class="flex-1" [value]="search()" (valueChange)="search.set($event)" />
    <a uiButton routerLink="/facilities/users/new" class="w-full sm:w-auto">
      <ui-icon name="add" [size]="20" />
      <span>ADD FACILITIES ADMIN</span>
    </a>
  </section>

  <section class="animate-rise flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl
                  bg-white/45 backdrop-blur-xl ring-1 ring-inset ring-white/60
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_-12px_rgba(24,24,27,0.18)]
                  dark:bg-zinc-900/50 dark:ring-white/10">
    <div class="min-h-0 flex-1 overflow-auto">
      <table class="w-full min-w-[52rem] border-collapse text-left text-sm">
        <thead class="sticky top-0 z-10">
          <tr class="bg-primary text-xs font-bold uppercase tracking-wide text-white">
            <th class="px-5 py-4">Employee ID</th>
            <th class="px-4 py-3">Username</th>
            <th class="px-4 py-3">Full Name</th>
            <th class="px-4 py-3">Email</th>
            <th class="px-4 py-3 text-center">Status</th>
            <th class="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          @if (loading()) {
            @for (r of [1,2,3,4,5]; track r) {
              <tr class="border-b border-gray-100 dark:border-zinc-800">
                <td class="px-5 py-4"><div class="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"></div></td>
                <td class="px-4 py-3"><div class="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"></div></td>
                <td class="px-4 py-3"><div class="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"></div></td>
                <td class="px-4 py-3"><div class="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"></div></td>
                <td class="px-4 py-3"><div class="mx-auto h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-700"></div></td>
                <td class="px-4 py-3"><div class="flex justify-center gap-2">
                  <div class="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700"></div>
                  <div class="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700"></div>
                  <div class="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700"></div>
                </div></td>
              </tr>
            }
          } @else if (error()) {
            <tr><td colspan="6" class="px-4 py-8 text-center text-red-600">{{ error() }}</td></tr>
          } @else if (filtered().length === 0) {
            <tr><td colspan="6" class="px-4 py-10 text-center text-gray-500 dark:text-zinc-400">
              No Facilities Admin accounts found.
            </td></tr>
          } @else {
            @for (u of filtered(); track u.employeeId) {
              <tr class="border-b border-gray-100 odd:bg-white even:bg-gray-50/70
                         hover:bg-secondary/5 dark:border-zinc-800 dark:odd:bg-zinc-900
                         dark:even:bg-zinc-800/60 dark:hover:bg-secondary/15">
                <td class="px-5 py-4 text-black dark:text-zinc-100">{{ u.employeeId }}</td>
                <td class="px-4 py-3 text-black dark:text-zinc-100">{{ u.username }}</td>
                <td class="px-4 py-3 font-medium text-black dark:text-zinc-100">{{ u.fullname }}</td>
                <td class="px-4 py-3 text-black dark:text-zinc-100">{{ u.email }}</td>
                <td class="px-4 py-3 text-center"><ui-status-badge [status]="u.status" /></td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-2 text-gray-500 dark:text-zinc-400">
                    <a title="Edit" [routerLink]="['/facilities/users', u.employeeId, 'edit']"
                       class="cursor-pointer rounded-lg p-1.5 hover:text-primary">
                      <ui-icon name="edit_square" class="text-xl" />
                    </a>
                    <button type="button" (click)="toggleStatus(u)"
                            class="cursor-pointer rounded-lg p-1.5 hover:text-primary"
                            [title]="isActive(u.status) ? 'Deactivate' : 'Activate'">
                      <ui-icon [name]="isActive(u.status) ? 'pause_circle' : 'play_circle'" class="text-xl" />
                    </button>
                    <button type="button" title="Delete" (click)="remove(u)"
                            class="cursor-pointer rounded-lg p-1.5 hover:text-red-600">
                      <ui-icon name="delete" class="text-xl" />
                    </button>
                  </div>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  </section>

  <ui-toast class="contents" [show]="showToast()" [success]="toastSuccess()" [message]="toastMsg()" />
</app-admin-shell>
  `,
})
export class FacilitiesUsers {
  private readonly api = inject(FacilitiesUsersService);

  protected readonly users   = signal<UserRow[]>([]);
  protected readonly loading = signal(false);
  protected readonly error   = signal<string | null>(null);
  protected readonly search  = signal('');

  protected readonly showToast  = signal(false);
  protected readonly toastSuccess = signal(false);
  protected readonly toastMsg   = signal('');

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return q
      ? this.users().filter(u => [u.username, u.fullname, u.email, u.status].some(f => f?.toLowerCase().includes(q)))
      : this.users();
  });

  constructor() { this.load(); }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res?.success) this.users.set(res.users ?? []);
        else this.error.set(res?.message ?? 'Failed to load users');
      },
      error: (err) => { this.loading.set(false); this.error.set(err?.error?.message ?? 'Server error'); },
    });
  }

  protected isActive(status: string): boolean { return status?.toUpperCase() === 'ACTIVE'; }

  protected toggleStatus(u: UserRow): void {
    const action = this.isActive(u.status) ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} "${u.username}"?`)) return;
    this.api.toggleStatus(u.employeeId).subscribe({
      next: (res) => {
        this.toast(res?.success ?? false, res?.message ?? 'Unknown response');
        if (res?.success) {
          this.users.update(rows => rows.map(r =>
            r.employeeId === u.employeeId ? { ...r, status: this.isActive(r.status) ? 'INACTIVE' : 'ACTIVE' } : r
          ));
        }
      },
      error: (err) => this.toast(false, err?.error?.message ?? 'Server error'),
    });
  }

  protected remove(u: UserRow): void {
    if (!confirm(`Delete account "${u.username}"? This cannot be undone.`)) return;
    this.api.remove(u.employeeId).subscribe({
      next: (res) => {
        this.toast(res?.success ?? false, res?.message ?? 'Unknown response');
        if (res?.success) this.users.update(rows => rows.filter(r => r.employeeId !== u.employeeId));
      },
      error: (err) => this.toast(false, err?.error?.message ?? 'Server error'),
    });
  }

  private toast(success: boolean, message: string): void {
    this.toastSuccess.set(success);
    this.toastMsg.set(message);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}
