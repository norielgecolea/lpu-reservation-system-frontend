import { ChangeDetectionStrategy, Component, model, input } from '@angular/core';

import { UiInput } from '../input/input';
import { UiIcon } from '../icon/icon';

/** Search field: leading search icon + text input. Built on the uiInput directive. */
@Component({
  selector: 'ui-input-search',
  imports: [UiInput, UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block w-full' },
  template: `
    <ui-icon
      name="search"
      class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 dark:text-zinc-500"
    />
    <input
      uiInput
      type="search"
      [placeholder]="placeholder()"
      [value]="value()"
      (input)="value.set($any($event.target).value)"
      class="pl-10! [&::-webkit-search-cancel-button]:appearance-none"
    />
  `,
})
export class UiInputSearch {
  readonly value = model<string>('');
  readonly placeholder = input<string>('Search...');
}
