import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { UiIcon } from '../../ui';

interface NavItem {
  label: string;
  icon: string;
  link: string;
}

@Component({
  selector: 'app-side-nav',
  imports: [RouterLink, RouterLinkActive, UiIcon],
  templateUrl: './side-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class SideNav {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  protected readonly user = this.auth.user;
  protected readonly isDark = this.themeService.isDark;

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected readonly nav: NavItem[] = [
    { label: 'Dashboard', icon: 'grid_view', link: '/dashboard' },
    { label: 'Users', icon: 'group', link: '/users' },
    { label: 'Equipments', icon: 'inventory_2', link: '/equipments' },
    { label: 'Vehicles', icon: 'directions_car', link: '/vehicles' },
    { label: 'Reservation', icon: 'event_note', link: '/reservation' },
  ];

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
