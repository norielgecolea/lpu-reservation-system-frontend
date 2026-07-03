import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdminShell } from '../../../shared/layout/admin-shell/admin-shell';
import { UiIcon } from '../../../shared/ui';

@Component({
  selector: 'app-facilities-van',
  imports: [AdminShell, UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<app-admin-shell>
  <div class="animate-rise flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl
              bg-white/45 backdrop-blur-xl ring-1 ring-inset ring-white/60 p-10 text-center
              shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_-12px_rgba(24,24,27,0.18)]
              dark:bg-zinc-900/50 dark:ring-white/10 min-h-96">

    <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/50">
      <ui-icon name="airport_shuttle" class="text-5xl text-violet-600 dark:text-violet-400" />
    </div>

    <div>
      <h1 class="text-2xl font-extrabold text-gray-900 dark:text-zinc-100">University Van Scheduling</h1>
      <p class="mt-2 max-w-md text-sm text-gray-500 dark:text-zinc-400">
        University Van reservation management is being set up. Once the reservation system
        is connected, you will be able to view, approve, and manage van bookings here.
      </p>
    </div>

    <span class="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5
                 text-xs font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
      <ui-icon name="construction" class="text-sm" />
      Coming Soon
    </span>

  </div>
</app-admin-shell>
  `,
})
export class FacilitiesVan {}
