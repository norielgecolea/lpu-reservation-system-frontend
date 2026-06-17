import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SideNav } from '../../../shared/layout/side-nav/side-nav';
import { UiButton, UiIcon, UiInput } from '../../../shared/ui';
import { UsersService } from './users.service';
import { UserRow } from './users.models';

@Component({
  selector: 'app-users',
  imports: [RouterLink, SideNav, UiButton, UiIcon, UiInput],
  templateUrl: './users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users {
  private readonly api = inject(UsersService);

  protected readonly users = signal<UserRow[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const rows = this.users();
    if (!q) return rows;
    return rows.filter((u) =>
      [u.username, u.fullname, u.role, u.email, u.status].some((f) =>
        f?.toLowerCase().includes(q),
      ),
    );
  });

  constructor() {
    this.load();
  }
  

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res?.success) {
          this.users.set(res.users ?? []);
        } else {
          this.error.set(res?.message ?? 'Failed to load users');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Unable to reach the server');
      },
    });
  }

  protected onSearch(value: string): void {
    this.search.set(value);
  }

 protected remove(u: UserRow): void {
  if (!confirm(`Delete account "${u.username}"? This cannot be undone.`)) {
    return;
  }

  this.api.remove(u.employeeId).subscribe({
    next: (res) => {
      this.showResponse(
        res?.success ?? false,
        res?.message ?? 'Unknown response'
      );

      if (res?.success) {
        this.users.update((rows) =>
          rows.filter((r) => r.employeeId !== u.employeeId)
        );
      }
    },
    error: (err) => {
      this.showResponse(
        false,
        err?.error?.message ?? 'Unable to reach the server'
      );
    },
  });
}

  protected isActive(status: string): boolean {
    return status?.toUpperCase() === 'ACTIVE';
  }

protected toggleStatus(u: UserRow): void {
  const action = this.isActive(u.status) ? 'deactivate' : 'activate';

  if (!confirm(`Are you sure you want to ${action} "${u.username}"?`)) {
    return;
  }

  this.api.toggleStatus(u.employeeId).subscribe({
    next: (res) => {
      this.showResponse(
        res?.success ?? false,
        res?.message ?? 'Unknown response'
      );

      if (res?.success) {
        this.users.update((rows) =>
          rows.map((row) =>
            row.employeeId === u.employeeId
              ? {
                  ...row,
                  status: this.isActive(row.status)
                    ? 'INACTIVE'
                    : 'ACTIVE',
                }
              : row,
          ),
        );
      }
    },
    error: (err) => {
      this.showResponse(
        false,
        err?.error?.message ?? 'Unable to reach the server'
      );
    },
  });
}




protected readonly showToast = signal(false);
protected readonly toastMessage = signal('');
protected readonly toastSuccess = signal(false);

protected showResponse(success: boolean, message: string) {
  this.toastSuccess.set(success);
  this.toastMessage.set(message);
  this.showToast.set(true);

  setTimeout(() => this.showToast.set(false), 3000);
} 
}
