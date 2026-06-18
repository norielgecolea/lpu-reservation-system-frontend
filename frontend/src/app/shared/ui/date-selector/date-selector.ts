import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BrnButtonImports } from '@spartan-ng/brain/button';

import { UiIcon } from '../icon/icon';

/** Date/period selector trigger. Styled like the segmented control, built on spartan/brain button. */
@Component({
  selector: 'ui-date-selector',
  imports: [BrnButtonImports, UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      brnButton
      type="button"
      (click)="open.emit()"
      class="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-2.5 text-sm font-bold leading-none text-gray-600 shadow-sm ring-1 ring-inset ring-black/5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-secondary hover:text-white hover:ring-transparent active:scale-[0.97] sm:px-4"
    >
      <ui-icon name="calendar_today" class="text-sm" />
      <span>{{ value() }}</span>
      <ui-icon name="expand_more" class="text-sm" />
    </button>
  `,
})
export class UiDateSelector {
  readonly value = input<string>('');
  readonly open = output<void>();
}
