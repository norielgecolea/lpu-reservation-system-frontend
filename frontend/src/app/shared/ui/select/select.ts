import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BrnPopoverImports } from '@spartan-ng/brain/popover';
import { BrnSelectImports } from '@spartan-ng/brain/select';

import { UiIcon } from '../icon/icon';

export interface UiSelectOption {
  value: string;
  label: string;
}

/**
 * Dropdown styled to match uiInput. Built on spartan/brain select + popover.
 * Works with reactive forms via formControlName / ngModel.
 * Usage: <ui-select formControlName="role" placeholder="Select a role" [options]="roles" />
 */
@Component({
  selector: 'ui-select',
  imports: [BrnPopoverImports, BrnSelectImports, UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiSelect), multi: true }],
  template: `
    <brn-popover sideOffset="6" align="start">
      <div brnSelect [value]="value()" (valueChange)="select($event)" [disabled]="disabled()">
        <button
          brnSelectTrigger
          type="button"
          class="relative w-full cursor-pointer rounded-lg glass-field px-3 py-2 pr-9 text-left text-[13px] text-gray-900 dark:text-zinc-100 hover:ring-secondary focus:ring-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-gray-400 dark:data-placeholder:text-zinc-500 aria-expanded:ring-primary sm:px-3.5 sm:py-2.5 sm:pr-9 sm:text-sm"
        >
          <span brnSelectValue [placeholder]="placeholder()" class="block truncate"></span>
          <ui-icon
            name="expand_more"
            class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none text-gray-400"
          />
        </button>

        <ng-template brnPopoverContent>
          <div
            brnSelectContent
            class="z-50 max-h-60 w-(--brn-select-width) overflow-y-auto rounded-lg border border-white/60 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl backdrop-saturate-150 p-1 shadow-lg"
          >
            @for (opt of options(); track opt.value) {
              <button
                brnSelectItem
                type="button"
                [value]="opt.value"
                class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[13px] text-gray-700 dark:text-zinc-300 data-highlighted:bg-secondary/10 aria-selected:font-semibold aria-selected:text-primary dark:aria-selected:text-secondary sm:text-sm"
              >
                <span class="truncate">{{ opt.label }}</span>
                @if (value() === opt.value) {
                  <ui-icon name="check" class="shrink-0 text-base text-primary" />
                }
              </button>
            }
          </div>
        </ng-template>
      </div>
    </brn-popover>
  `,
})
export class UiSelect implements ControlValueAccessor {
  readonly options = input<readonly UiSelectOption[]>([]);
  readonly placeholder = input('Select an option');

  protected readonly value = signal<string | null>(null);
  protected readonly disabled = signal(false);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value || null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected select(value: string | null | undefined): void {
    const next = value ?? null;
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }
}
