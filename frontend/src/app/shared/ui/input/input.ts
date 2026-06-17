import { Directive } from '@angular/core';

@Directive({
  selector: 'input[uiInput]',
  host: {
    class:
      'w-full rounded-lg border bg-white/90 px-3.5 py-2.5 text-sm ' +
      'border-gray-400 text-gray-900 placeholder:text-gray-400 ' +
      'transition-all duration-200 ease-out ' +
      'hover:border-secondary/70 focus:border-primary focus:bg-white focus:outline-none',
  },
})
export class UiInput {}
