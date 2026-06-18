import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { BrnToggleGroupImports } from '@spartan-ng/brain/toggle-group';

/** Segmented control built on spartan/brain toggle-group. Single-select, active = primary, hover = secondary. */
@Component({
  selector: 'ui-segmented',
  imports: [BrnToggleGroupImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block max-w-full overflow-x-auto sm:inline-block',
  },
  template: `
    <brn-toggle-group
      class="glass-field flex min-w-full items-center gap-1 rounded-lg p-0.5 sm:min-w-0"
      [value]="value()"
      (valueChange)="value.set($any($event))"
    >
      @for (o of options(); track o) {
        <button
          brnToggleGroupItem
          [value]="o"
          class="flex h-8 cursor-pointer items-center rounded-md px-2.5 text-sm font-bold leading-none text-gray-600 dark:text-zinc-400 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] data-[state=off]:hover:bg-secondary data-[state=off]:hover:text-white data-[state=on]:bg-primary data-[state=on]:text-white sm:px-4"
        >
          {{ o }}
        </button>
      }
    </brn-toggle-group>
  `,
})
export class UiSegmented {
  readonly options = input<string[]>([]);
  readonly value = model<string>('');
}
