import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Admin add-reservation shell: viewport-height booking embed without a separate page header. */
@Component({
  selector: 'app-admin-add-reservation-page',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
        class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl ring-1 ring-black/5 lg:h-full"
        style="scrollbar-width: thin"
      >
        <ng-content />
      </div>
    `,
})
export class AdminAddReservationPage {}
