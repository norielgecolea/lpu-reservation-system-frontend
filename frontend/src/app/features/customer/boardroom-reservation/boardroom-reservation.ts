import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UiButton, UiInput, UiLabel, UiCalendar } from '../../../shared/ui';

@Component({
  selector: 'app-boardroom-reservation',
  imports: [ReactiveFormsModule, RouterLink, UiButton, UiInput, UiLabel, UiCalendar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col min-h-screen bg-gray-100 dark:bg-zinc-900 p-4 sm:p-8',
  },
  template: `
    <div class="flex-1 w-full max-w-6xl mx-auto surface rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
      
      <!-- Left Panel: Branding & Calendar -->
      <div class="w-full md:w-1/3 glass-brand p-8 text-white flex flex-col relative shrink-0">
        <div class="flex items-center gap-3 mb-8 opacity-90">
          <div class="w-10 h-10 border-2 border-white/80 rounded-full flex items-center justify-center">
            <span class="material-symbols-outlined text-xl">school</span>
          </div>
          <span class="font-semibold tracking-wide text-sm">LPU LAGUNA RESERVATION SYSTEM</span>
        </div>

        <h1 class="text-4xl md:text-5xl font-black mb-10 drop-shadow-sm tracking-tight">Boardroom</h1>

        <!-- Calendar Component replacing the text description -->
        <div class="mt-4 mb-10 flex-grow">
          <ui-calendar [occupiedDates]="['2026-06-25', '2026-06-28']" />
        </div>

        <div class="space-y-4 text-sm font-medium opacity-90 mt-auto">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined">groups</span>
            <span>Scalable Capacity (Up to 20)</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined">language</span>
            <span>Campus Wi-Fi & Fiber Ready</span>
          </div>
        </div>
      </div>

      <!-- Right Panel: Form -->
      <div class="w-full md:w-2/3 p-8 sm:p-10 bg-white/40 dark:bg-zinc-900/40">
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label uiLabel for="eventName">Event / Seminar Name</label>
              <input uiInput id="eventName" formControlName="eventName" placeholder="Placeholder Text" />
            </div>
            <div class="space-y-2">
              <label uiLabel for="headcount">Expected Headcount</label>
              <input uiInput id="headcount" type="number" formControlName="headcount" placeholder="Placeholder Text" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label uiLabel for="contactPerson">Contact Person</label>
              <input uiInput id="contactPerson" formControlName="contactPerson" placeholder="Placeholder Text" />
            </div>
            <div class="space-y-2">
              <label uiLabel for="contactEmail">Contact Email</label>
              <input uiInput id="contactEmail" type="email" formControlName="contactEmail" placeholder="Placeholder Text" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label uiLabel for="date">Date</label>
              <input uiInput id="date" type="date" formControlName="date" />
            </div>
            <div class="space-y-2">
              <label uiLabel for="time">Time</label>
              <input uiInput id="time" type="time" formControlName="time" />
            </div>
          </div>

          <div class="space-y-2">
            <label uiLabel>Equipment</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              @for (eq of equipmentOptions; track eq) {
                <button
                  type="button"
                  (click)="toggleEquipment(eq)"
                  class="h-10 rounded-lg border text-sm font-medium transition-all duration-200"
                  [class.border-primary]="hasEquipment(eq)"
                  [class.bg-primary]="hasEquipment(eq)"
                  [class.text-white]="hasEquipment(eq)"
                  [class.border-gray-300]="!hasEquipment(eq)"
                  [class.bg-white]="!hasEquipment(eq)"
                  [class.text-gray-600]="!hasEquipment(eq)"
                  [class.hover:border-primary/50]="!hasEquipment(eq)"
                >
                  {{ eq }}
                </button>
              }
            </div>
          </div>

          <div class="space-y-2">
            <label uiLabel for="remarks">Remarks</label>
            <textarea
              id="remarks"
              formControlName="remarks"
              rows="4"
              class="w-full rounded-lg glass-field px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 transition-all duration-200 hover:border-secondary/45 hover:ring-secondary/25 focus:border-primary/55 focus:ring-2 focus:ring-primary/35 focus:outline-none resize-none"
              placeholder="Placeholder Text"
            ></textarea>
          </div>

          <div class="flex gap-4 pt-4">
            <button uiButton variant="secondary" type="button" class="flex-1" routerLink="/">CANCEL</button>
            <button uiButton type="submit" class="flex-1" [disabled]="form.invalid">SUBMIT</button>
          </div>
        </form>
      </div>

    </div>
  `,
})
export class BoardroomReservation {
  readonly equipmentOptions = [
    'Projector',
    'Microphone',
    'Speaker System',
    'Whiteboard',
    'Laptop',
    'Video Conf.',
  ];

  readonly selectedEquipment = signal<string[]>([]);

  readonly form = new FormGroup({
    eventName: new FormControl('', Validators.required),
    headcount: new FormControl('', Validators.required),
    contactPerson: new FormControl('', Validators.required),
    contactEmail: new FormControl('', [Validators.required, Validators.email]),
    date: new FormControl('', Validators.required),
    time: new FormControl('', Validators.required),
    remarks: new FormControl(''),
  });

  hasEquipment(eq: string): boolean {
    return this.selectedEquipment().includes(eq);
  }

  toggleEquipment(eq: string): void {
    this.selectedEquipment.update((curr) =>
      curr.includes(eq) ? curr.filter((e) => e !== eq) : [...curr, eq]
    );
  }

  submit(): void {
    if (this.form.invalid) return;
    
    const payload = {
      ...this.form.value,
      equipment: this.selectedEquipment(),
    };
    
    console.log('Submitted Reservation:', payload);
    // TODO: implement API call
    alert('Reservation submitted successfully!');
  }
}
