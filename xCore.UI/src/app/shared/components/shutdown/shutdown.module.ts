import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShutdownComponent } from './shutdown.component';

@NgModule({
  imports: [CommonModule],
  exports: [ShutdownComponent],
  declarations: [ShutdownComponent],
})
export class ShutdownModule {
}
