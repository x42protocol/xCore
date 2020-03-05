import { NgModule } from '@angular/core';
import { SetupComponent } from './setup.component';
import { CreateComponent } from './create/create.component';
import { SharedModule } from '../shared/shared.module';
import { SetupRoutingModule } from './setup-routing.module';
import { RecoverComponent } from './recover/recover.component';
import { ShowMnemonicComponent } from './create/show-mnemonic/show-mnemonic.component';
import { ConfirmMnemonicComponent } from './create/confirm-mnemonic/confirm-mnemonic.component';
import { MainMenuModule } from '../shared/components/main-menu/main-menu.module';

// PrimeNG Components.
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { SidebarModule } from 'primeng/sidebar';
import { DropdownModule } from 'primeng/dropdown';
import { FieldsetModule } from 'primeng/fieldset';
import { DialogModule } from 'primeng/dialog';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { BlockUIModule } from 'primeng/blockui';
import { PanelModule } from 'primeng/panel';
import { DynamicDialogModule, DialogService } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MenuModule } from 'primeng/menu';
import { CalendarModule } from 'primeng/calendar';

@NgModule({
  imports: [
    SetupRoutingModule,
    SharedModule,
    MainMenuModule,
    ButtonModule,
    InputTextModule,
    MenubarModule,
    SidebarModule,
    DropdownModule,
    FieldsetModule,
    DialogModule,
    MessagesModule,
    MessageModule,
    BlockUIModule,
    PanelModule,
    DynamicDialogModule,
    TableModule,
    SelectButtonModule,
    MenuModule,
    CalendarModule
  ],
  declarations: [
    CreateComponent,
    SetupComponent,
    RecoverComponent,
    ShowMnemonicComponent,
    ConfirmMnemonicComponent
  ],
  providers: [
    MessageService,
    DialogService
  ],
})

export class SetupModule { }
