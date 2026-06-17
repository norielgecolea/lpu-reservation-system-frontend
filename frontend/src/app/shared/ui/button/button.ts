import { Directive } from '@angular/core';

/** Button: primary by default, secondary on hover. */
@Directive({
  selector: 'button[uiButton], a[uiButton]',
  host: {
    class:
      'inline-flex items-center justify-center gap-2 rounded-lg ' +
      'bg-primary px-4 py-2.5 text-sm font-semibold text-white ' +
      'cursor-pointer select-none transition-all duration-200 ease-out ' +
      'hover:bg-secondary ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ' +
      'disabled:pointer-events-none disabled:opacity-50',
  },
})
export class UiButton {}
