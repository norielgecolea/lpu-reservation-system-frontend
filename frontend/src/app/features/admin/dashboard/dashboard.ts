import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { SideNav } from '../../../shared/layout/side-nav/side-nav';
import { UiIcon, UiSegmented, UiDateSelector } from '../../../shared/ui';

interface StatCard {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  icon: string;
  iconBg: string;
  iconFg: string;
  valueColor: string;
}

type Range = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
type Category = 'All' | 'Van' | 'FLT' | 'Gym';

@Component({
  selector: 'app-dashboard',
  imports: [SideNav, UiIcon, UiSegmented, UiDateSelector],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {

  protected readonly stats: StatCard[] = [
    {
      label: 'Total',
      value: '2,456',
      delta: '12.5%',
      trend: 'up',
      icon: 'monitoring',
      iconBg: 'bg-primary/10',
      iconFg: 'text-primary',
      valueColor: 'text-primary',
    },
    {
      label: 'Pending',
      value: '2,456',
      delta: '12.5%',
      trend: 'up',
      icon: 'pending_actions',
      iconBg: 'bg-orange-50',
      iconFg: 'text-orange-500',
      valueColor: 'text-orange-500',
    },
    {
      label: 'Accepted',
      value: '159',
      delta: '12.5%',
      trend: 'down',
      icon: 'check_circle',
      iconBg: 'bg-green-50',
      iconFg: 'text-green-500',
      valueColor: 'text-green-600',
    },
    {
      label: 'Rejected',
      value: '200',
      delta: '12.5%',
      trend: 'down',
      icon: 'cancel',
      iconBg: 'bg-red-50',
      iconFg: 'text-red-500',
      valueColor: 'text-red-600',
    },
  ];

  protected readonly ranges: Range[] = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  protected readonly activeRange = signal<Range>('Monthly');

  protected selectRange(r: Range): void {
    this.activeRange.set(r);
  }

  protected readonly activeYear = signal('2026');

  protected readonly categories: Category[] = ['All', 'Van', 'FLT', 'Gym'];
  protected readonly activeCategory = signal<Category>('All');

  protected selectCategory(c: Category): void {
    this.activeCategory.set(c);
  }
}
