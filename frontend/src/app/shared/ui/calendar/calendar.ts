import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { UiIcon } from '../icon/icon';
import { BrnButtonImports } from '@spartan-ng/brain/button';

@Component({
  selector: 'ui-calendar',
  imports: [UiIcon, BrnButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full text-white',
  },
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold">{{ monthYearLabel() }}</h3>
        <div class="flex gap-2">
          <button
            brnButton
            type="button"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
            (click)="previousMonth()"
          >
            <ui-icon name="chevron_left" class="text-lg" />
          </button>
          <button
            brnButton
            type="button"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
            (click)="nextMonth()"
          >
            <ui-icon name="chevron_right" class="text-lg" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center">
        @for (day of weekDays; track day) {
          <div class="text-xs font-medium text-white/60 pb-2">{{ day }}</div>
        }
        @for (blank of blankDays(); track $index) {
          <div></div>
        }
        @for (day of daysInMonth(); track day) {
          <div
            class="flex h-10 w-10 mx-auto items-center justify-center rounded-full text-sm transition-colors"
            [class.bg-white]="isOccupied(day)"
            [class.text-primary]="isOccupied(day)"
            [class.font-bold]="isOccupied(day)"
            [class.hover:bg-white/20]="!isOccupied(day)"
            [class.cursor-pointer]="!isOccupied(day)"
            [class.opacity-50]="!isOccupied(day)"
            [attr.title]="isOccupied(day) ? 'Occupied' : 'Available'"
          >
            {{ day }}
          </div>
        }
      </div>
      
      <div class="flex items-center gap-4 mt-2 text-sm text-white/80">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-white"></div>
          <span>Occupied</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full border border-white/40"></div>
          <span>Available</span>
        </div>
      </div>
    </div>
  `,
})
export class UiCalendar {
  readonly occupiedDates = input<string[]>([]); // Array of ISO date strings (e.g. '2026-06-25')

  protected weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  protected currentDate = signal(new Date());

  protected monthYearLabel = computed(() => {
    const date = this.currentDate();
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  });

  protected blankDays = computed(() => {
    const date = this.currentDate();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Array.from({ length: firstDay });
  });

  protected daysInMonth = computed(() => {
    const date = this.currentDate();
    const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  });

  protected previousMonth() {
    this.currentDate.update((date) => {
      return new Date(date.getFullYear(), date.getMonth() - 1, 1);
    });
  }

  protected nextMonth() {
    this.currentDate.update((date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    });
  }

  protected isOccupied(day: number): boolean {
    const date = this.currentDate();
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return this.occupiedDates().includes(dateString);
  }
}
