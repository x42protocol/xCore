import { Directive, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

// tslint:disable-next-line:directive-selector
@Directive({ selector: '[disableControl]' })
export class DisableControlDirective {
  @Input() set disableControl(condition: boolean) {
    const action = condition ? 'disable' : 'enable';
    this.ngControl.control[action]();
  }

  constructor(private ngControl: NgControl) {
  }

}
