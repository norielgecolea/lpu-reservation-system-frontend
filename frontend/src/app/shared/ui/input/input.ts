import { Directive } from '@angular/core';
import { BrnInput } from '@spartan-ng/brain/input';

/** Text input. Built on spartan/brain input (field + validation state). */
@Directive({
  selector: 'input[uiInput]',
  hostDirectives: [BrnInput],
  host: {
    class:
      'w-full rounded-lg border bg-white/90 px-3 py-2 text-[13px] sm:px-3.5 sm:py-2.5 sm:text-sm ' +
      'border-gray-400 text-gray-900 placeholder:text-gray-400 ' +
      'transition-all duration-200 ease-out ' +
      'hover:border-secondary/70 focus:border-primary focus:bg-white focus:outline-none',
  },
})
export class UiInput {}
