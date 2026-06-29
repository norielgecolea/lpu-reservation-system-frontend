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
        <div class="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
          <button 
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer"
            [class.bg-white]="viewMode() === 'month'"
            [class.text-primary]="viewMode() === 'month'"
            [class.shadow-sm]="viewMode() === 'month'"
            [class.text-white]="viewMode() !== 'month'"
            [class.hover:bg-white/10]="viewMode() !== 'month'"
            (click)="viewMode.set('month')"
          >
            Monthly
          </button>
          <button 
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer"
            [class.bg-white]="viewMode() === 'week'"
            [class.text-primary]="viewMode() === 'week'"
            [class.shadow-sm]="viewMode() === 'week'"
            [class.text-white]="viewMode() !== 'week'"
            [class.hover:bg-white/10]="viewMode() !== 'week'"
            (click)="viewMode.set('week')"
          >
            Weekly
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold tracking-tight">{{ headerLabel() }}</h3>
        <div class="flex gap-1.5">
          <button
            brnButton
            type="button"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-white/90 hover:bg-white/15 hover:text-white transition-colors"
            (click)="previous()"
          >
            <ui-icon name="chevron_left" class="text-lg" />
          </button>
          <button
            brnButton
            type="button"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-white/90 hover:bg-white/15 hover:text-white transition-colors"
            (click)="next()"
          >
            <ui-icon name="chevron_right" class="text-lg" />
          </button>
        </div>
      </div>

      @if (viewMode() === 'month') {
        <div class="grid grid-cols-7 gap-1 text-center">
          @for (day of weekDays; track day) {
            <div class="text-xs font-semibold text-white/50 pb-2">{{ day }}</div>
          }
          @for (blank of blankDays(); track $index) {
            <div></div>
          }
          @for (day of daysInMonth(); track day) {
            <div
              class="flex h-9 w-9 mx-auto items-center justify-center rounded-full text-sm transition-all duration-200"
              [class.bg-white]="isOccupied(day)"
              [class.text-primary]="isOccupied(day)"
              [class.font-bold]="isOccupied(day)"
              [class.shadow-md]="isOccupied(day)"
              [class.hover:bg-white/20]="!isOccupied(day)"
              [class.cursor-pointer]="!isOccupied(day)"
              [class.opacity-50]="!isOccupied(day) && isPastDate(day)"
              [attr.title]="isOccupied(day) ? 'Occupied' : 'Available'"
            >
              {{ day }}
            </div>
          }
        </div>
      } @else {
        <div class="flex flex-col -mx-2 px-2 flex-1">
          <div class="grid grid-cols-[40px_repeat(6,1fr)] gap-x-1 mb-2">
            <div></div>
            @for (day of weekDaysList(); track day.date.getTime()) {
              <div class="flex flex-col items-center justify-center bg-white/5 rounded-t-lg py-1.5 border-b-2" [class.border-white]="isToday(day.date)" [class.border-transparent]="!isToday(day.date)">
                <span class="text-[10px] font-medium text-white/60 uppercase tracking-wider">{{ day.dayName }}</span>
                <span class="text-sm font-bold" [class.text-white]="!isToday(day.date)" [class.text-white]="isToday(day.date)">{{ day.dayNumber }}</span>
              </div>
            }
          </div>
          
          <div class="flex-1 grid grid-cols-[40px_repeat(6,1fr)] gap-x-1 gap-y-[3px]">
            @for (hour of hours; track hour.val) {
              <div class="text-[10px] font-medium text-white/50 text-right pr-2 self-center relative top-[-2px]">{{ hour.label }}</div>
              @for (day of weekDaysList(); track day.date.getTime()) {
                <div 
                  class="h-7 rounded-[4px] border transition-all duration-200 cursor-pointer"
                  [class.bg-white]="isAllocated(day.date, hour.val)"
                  [class.border-transparent]="isAllocated(day.date, hour.val)"
                  [class.shadow-[0_0_10px_rgba(255,255,255,0.15)]]="isAllocated(day.date, hour.val)"
                  [class.bg-white/5]="!isAllocated(day.date, hour.val)"
                  [class.border-white/10]="!isAllocated(day.date, hour.val)"
                  [class.hover:border-white/30]="!isAllocated(day.date, hour.val)"
                  [class.opacity-40]="!isAllocated(day.date, hour.val) && isPastDateTime(day.date, hour.val)"
                  [attr.title]="isAllocated(day.date, hour.val) ? 'Allocated: ' + hour.label : 'Available: ' + hour.label"
                ></div>
              }
            }
          </div>
        </div>
      }
      
      <div class="flex items-center gap-4 mt-1 text-sm text-white/80 border-t border-white/10 pt-4">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
          <span class="text-xs font-medium">Occupied</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full border border-white/30 bg-white/5"></div>
          <span class="text-xs font-medium">Available</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hidden-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .hidden-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .hidden-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
    }
    .hidden-scrollbar:hover::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.4);
    }
  `]
})
export class UiCalendar {
  readonly occupiedDates = input<string[]>([]); // Array of ISO date strings (e.g. '2026-06-25')

  protected viewMode = signal<'month' | 'week'>('month');
  protected currentDate = signal(new Date());

  protected weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  protected hours = Array.from({ length: 15 }, (_, i) => {
    const val = i + 7; // 7 to 21 (7am to 9pm)
    const label = val > 12 ? `${val - 12} PM` : val === 12 ? '12 PM' : `${val} AM`;
    return { val, label };
  });

  protected headerLabel = computed(() => {
    const date = this.currentDate();
    if (this.viewMode() === 'month') {
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else {
      const days = this.weekDaysList();
      if (days.length === 0) return '';
      const start = days[0].date;
      const end = days[days.length - 1].date;
      
      const startMonth = start.toLocaleString('default', { month: 'short' });
      const endMonth = end.toLocaleString('default', { month: 'short' });
      
      if (startMonth === endMonth) {
        return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      } else if (start.getFullYear() === end.getFullYear()) {
        return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
      }
    }
  });

  protected weekDaysList = computed(() => {
    const curr = new Date(this.currentDate());
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(curr.setDate(diff));
    
    // Monday to Saturday (6 days)
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        date: d,
        dayName: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][i],
        dayNumber: d.getDate()
      };
    });
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

  protected previous() {
    this.currentDate.update((date) => {
      if (this.viewMode() === 'month') {
        return new Date(date.getFullYear(), date.getMonth() - 1, 1);
      } else {
        const d = new Date(date);
        d.setDate(d.getDate() - 7);
        return d;
      }
    });
  }

  protected next() {
    this.currentDate.update((date) => {
      if (this.viewMode() === 'month') {
        return new Date(date.getFullYear(), date.getMonth() + 1, 1);
      } else {
        const d = new Date(date);
        d.setDate(d.getDate() + 7);
        return d;
      }
    });
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  protected isOccupied(day: number): boolean {
    const date = this.currentDate();
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return this.occupiedDates().includes(dateString);
  }
  
  protected isPastDate(day: number): boolean {
    const date = this.currentDate();
    const checkDate = new Date(date.getFullYear(), date.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
  }
  
  protected isPastDateTime(date: Date, hour: number): boolean {
    const checkDate = new Date(date);
    checkDate.setHours(hour, 0, 0, 0);
    return checkDate < new Date();
  }

  protected isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }

  protected isAllocated(date: Date, hour: number): boolean {
    const dateString = this.formatDate(date);
    
    // Explicit occupied dates
    if (this.occupiedDates().includes(dateString)) {
       return (hour >= 9 && hour <= 11) || (hour >= 13 && hour <= 15);
    }
    
    // Pseudo-random allocations based on date hash
    const hash = date.getDate() * 17 + date.getMonth() * 31 + date.getFullYear();
    
    if (hash % 5 === 0) return hour >= 10 && hour <= 12;
    if (hash % 7 === 0) return hour >= 14 && hour <= 16;
    if (hash % 11 === 0) return hour >= 8 && hour <= 9;
    
    return false;
  }
}
