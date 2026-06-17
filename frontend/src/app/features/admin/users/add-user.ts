import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SideNav } from '../../../shared/layout/side-nav/side-nav';
import { UiButton, UiIcon, UiInput } from '../../../shared/ui';
import { UsersService } from './users.service';

const ROLES = [
  { label: 'Nexus Admin', value: 'Nexus Admin' },
  { label: 'Facilities Admin', value: 'Facilities Admin' },
  { label: 'EO Admin', value: 'EO Admin' },
  { label: 'Super Admin', value: 'SUPERADMIN' },
] as const;

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-add-user',
  imports: [ReactiveFormsModule, RouterLink, SideNav, UiButton, UiIcon, UiInput],
  templateUrl: './add-user.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddUser {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(UsersService);
  private readonly router = inject(Router);

  protected readonly roles = ROLES;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly showConfirm = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      fullname: ['', [Validators.required]],
      role: ['', [Validators.required]],
      employeeId: ['', [Validators.required]],
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.errors?.['mismatch']) {
        this.error.set('Passwords do not match');
      }
      return;
    }

    const v = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.api
      .create({
        username: v.username,
        fullname: v.fullname,
        role: v.role,
        email: v.email,
        employeeId: v.employeeId,
        passwordHash: v.password,
        status: 'ACTIVE',
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          if (res?.success) {
            this.router.navigateByUrl('/users');
          } else {
            this.error.set(res?.message ?? 'Failed to create account');
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.message ?? 'Unable to reach the server');
        },
      });
  }
  
}
