import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoinNotationPipe } from './pipes/coin-notation.pipe';
import { AutoFocusDirective } from './directives/auto-focus.directive';
import { PasswordValidationDirective } from './directives/password-validation.directive';
import { NgxElectronModule } from 'ngx-electron';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { ClipboardModule } from 'ngx-clipboard';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GenericModalComponent } from './components/generic-modal/generic-modal.component';
import { RouterLinkBack } from './directives/router-link-back.directive';
import { SizeUnitPipe } from './pipes/size-unit.pipe';
import { PriceUnitPipe } from './pipes/price-unit.pipe';
import { YesNoPipe } from './pipes/yesno.pipe';
import { SortByPipe } from './pipes/sort-by.pipe';

// PrimeNG Components.
import { ButtonModule } from 'primeng/button';
import { DynamicDialogModule, DialogService } from 'primeng/dynamicdialog';

const SHARED_DIRECTIVES = [RouterLinkBack, PasswordValidationDirective, CoinNotationPipe, SizeUnitPipe, PriceUnitPipe, YesNoPipe, SortByPipe];

@NgModule({
  imports: [CommonModule, ButtonModule, DynamicDialogModule],
  declarations: [CoinNotationPipe, AutoFocusDirective, PasswordValidationDirective, GenericModalComponent, SHARED_DIRECTIVES],
  exports: [CommonModule, ReactiveFormsModule, FormsModule, NgxElectronModule, NgxQRCodeModule, ClipboardModule, GenericModalComponent, CoinNotationPipe, AutoFocusDirective, PasswordValidationDirective, SHARED_DIRECTIVES],
  entryComponents: [GenericModalComponent],
  providers: [DialogService]
})

export class SharedModule { }
