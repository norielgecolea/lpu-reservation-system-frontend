import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { ThemeService, type Theme } from '../../../../core/theme/theme.service';
import { UiButton, UiCheckbox, UiIcon, UiInput, UiLabel } from '../../../../shared/ui';
import { environment } from '../../../../../environments/environment';

type BackendStatus = 'checking' | 'online' | 'offline';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, UiButton, UiInput, UiCheckbox, UiLabel, UiIcon],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Login is always shown in light mode; restore the user's theme on leave.
  private readonly previousTheme: Theme = this.themeService.theme();
  private imageInterval: ReturnType<typeof setInterval> | null = null;
  private backendStatusInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly backendStatus = signal<BackendStatus>('checking');
  protected readonly activeImage = signal(0);
  protected readonly heroImages = [
    { src: '/lpu-building.webp', alt: 'LPU Laguna campus' },
    { src: '/background.webp', alt: 'LPU Laguna building' },
  ];

  constructor() {
    this.themeService.set('light');

    if (this.isBrowser) {
      this.imageInterval = setInterval(() => {
        this.activeImage.update((index) => (index + 1) % this.heroImages.length);
      }, 8000);
      this.checkBackendStatus();
      this.backendStatusInterval = setInterval(() => this.checkBackendStatus(), 15000);
    }
  }

  ngOnDestroy(): void {
    if (this.imageInterval) {
      clearInterval(this.imageInterval);
    }
    if (this.backendStatusInterval) {
      clearInterval(this.backendStatusInterval);
    }
    this.themeService.set(this.previousTheme);
  }

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    remember: [false],
  });

  protected backendStatusLabel(): string {
    switch (this.backendStatus()) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      default:
        return 'Checking';
    }
  }

  private checkBackendStatus(): void {
    this.http
      .get(environment.apiUrl, {
        observe: 'response',
        responseType: 'text',
      })
      .subscribe({
        next: () => this.backendStatus.set('online'),
        error: (err) => {
          const status = Number(err?.status ?? 0);
          this.backendStatus.set(status === 0 || status >= 500 ? 'offline' : 'online');
        },
      });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.auth.login({ username, password }).subscribe({
      next: (res) => {
        this.loading.set(false);

        if (!res?.success) {
          this.error.set(res?.message ?? 'Login failed');
          return;
        }

        switch (res.role?.toUpperCase()) {
          case 'SUPERADMIN':
            this.router.navigateByUrl('/dashboard');
            break;

          case 'NEXUSADMIN':
            this.router.navigateByUrl('/nexus/dashboard');
            break;

          case 'FACILITIESADMIN':
            this.router.navigateByUrl('/facilities/dashboard');
            break;

          case 'EOADMIN':
            this.router.navigateByUrl('/eo/dashboard');
            break;

          default:
            this.error.set(`Unknown role: ${res.role}`);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Unable to reach the server');
      },
    });
  }
}
