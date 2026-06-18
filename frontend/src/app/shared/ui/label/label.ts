import { Directive } from '@angular/core';
import { BrnLabel } from '@spartan-ng/brain/label';

/** Form label. Built on spartan/brain label. */
@Directive({
  selector: 'label[uiLabel]',
  hostDirectives: [{ directive: BrnLabel, inputs: ['for', 'id'] }],
  host: {
    class: 'select-none text-sm text-gray-500 dark:text-zinc-400',
  },
})
export class UiLabel {}
