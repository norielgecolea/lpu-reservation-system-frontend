import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { UiIcon } from '../../ui';

interface NavChild {
  label: string;
  icon: string;
  link: string;
}

interface NavItem {
  label: string;
  icon: string;
  link?: string;
  children?: NavChild[];
}

@Component({
  selector: 'app-side-nav',
  imports: [RouterLink, RouterLinkActive, UiIcon],
  templateUrl: './side-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class SideNav implements OnInit {
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
    {
      label: 'Reservation', icon: 'event_note', children: [
        { label: 'FLT Theater', icon: 'theaters', link: '/reservation/flt' },
      ],
    },
  ];

  protected readonly openGroups = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.syncOpenGroups();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.syncOpenGroups());
  }

  private syncOpenGroups(): void {
    this.openGroups.update(set => {
      const next = new Set(set);
      for (const item of this.nav) {
        if (item.children && this.isChildActive(item.children)) {
          next.add(item.label);
        }
      }
      return next;
    });
  }

  protected isGroupOpen(label: string): boolean {
    return this.openGroups().has(label);
  }

  protected toggleGroup(label: string): void {
    this.openGroups.update(set => {
      const next = new Set(set);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  protected isChildActive(children: NavChild[]): boolean {
    return children.some(c =>
      this.router.isActive(c.link, {
        paths: 'subset',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      })
    );
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
