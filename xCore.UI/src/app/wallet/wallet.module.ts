import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { WalletRoutingModule } from './wallet-routing.module';
import { MainMenuModule } from '../shared/components/main-menu/main-menu.module';
import { AddressType } from '../shared/models/address-type';

import { WalletComponent } from './wallet.component';
import { MenuComponent } from './menu/menu.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HistoryComponent } from './history/history.component';
import { AdvancedComponent } from './advanced/advanced.component';
import { AddressBookComponent } from './address-book/address-book.component';
import { AddNewAddressComponent } from './address-book/modals/add-new-address/add-new-address.component';
import { ExtPubkeyComponent } from './advanced/components/ext-pubkey/ext-pubkey.component';
import { AboutComponent } from './advanced/components/about/about.component';
import { SettingsComponent } from './advanced/components/settings/settings.component';
import { SignVerifyComponent } from './advanced/components/sign-verify/sign-verify.component';
import { SignatureComponent } from './advanced/components/sign-verify/signature/signature.component';
import { VerifyComponent } from './advanced/components/sign-verify/verify/verify.component';
import { GenerateAddressesComponent } from './advanced/components/generate-addresses/generate-addresses.component';
import { XServerComponent } from './advanced/components/xserver/xserver.component';
import { RegisterComponent } from './advanced/components/xserver/register/register.component';
import { ResyncComponent } from './advanced/components/resync/resync.component';
import { SendComponent } from './send/send.component';
import { ReceiveComponent } from './receive/receive.component';
import { TransactionDetailsComponent } from './transaction-details/transaction-details.component';
import { LogoutConfirmationComponent } from './logout-confirmation/logout-confirmation.component';
import { CreateProfileComponent } from './profile/create/create-profile.component';

// Cold Staking
import { ColdStakingOverviewComponent } from './cold-staking/overview.component';
import { ColdStakingCreateComponent } from './cold-staking/create/create.component';
import { ColdStakingCreateAddressComponent } from './cold-staking/create-address/create-address.component';
import { ColdStakingWithdrawComponent } from './cold-staking/withdraw/withdraw.component';
import { ColdStakingCreateHotComponent } from './cold-staking/create-hot/create-hot.component';

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
import { SplitButtonModule } from 'primeng/splitbutton';
import { SlideMenuModule } from 'primeng/slidemenu';
import { TabViewModule } from 'primeng/tabview';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ContextMenuModule } from 'primeng/contextmenu';
import { CarouselModule } from 'primeng/carousel';
import { ProgressBarModule } from 'primeng/progressbar';
import { AccordionModule } from 'primeng/accordion';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { SliderModule } from 'primeng/slider';
import { RadioButtonModule } from 'primeng/radiobutton';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { ExchangeDetailsComponent } from './exchange-details/exchange-details.component';
import { XserverProvisionerComponent } from './advanced/components/xserver-provisioner/xserver-provisioner.component';
import { DappStoreComponent } from './dapp-store/dapp-store.component';
import { DeployWordpressComponent } from './dapp-store/deploy-wordpress/deploy-wordpress.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { XserverNetworkComponent } from './xserver-network/xserver-network.component';
import { DnsManagementComponent } from './dns-management/dns-management.component';
import { AddZoneDialogComponent } from './dns-management/add-zone-dialog/add-zone-dialog.component';
import { AddEditDnsRecordDialogComponent } from './dns-management/add-edit-dns-record-dialog/add-edit-dns-record-dialog.component';
import { DeleteDnsRecordDialogComponent } from './dns-management/delete-dns-record-dialog/delete-dns-record-dialog.component';
import { StorageManagementComponent } from './storage-management/storage-management.component';
import { XServerDetailsComponent } from './xserver-network/x-server-details/x-server-details.component';
import { XServerUpdaterComponent } from './advanced/components/x-server-updater/x-server-updater.component';

@NgModule({
  imports: [
    SharedModule,
    WalletRoutingModule,
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
    CalendarModule,
    SplitButtonModule,
    SlideMenuModule,
    TabViewModule,
    CheckboxModule,
    InputTextareaModule,
    ContextMenuModule,
    CarouselModule,
    ProgressBarModule,
    AccordionModule,
    ToolbarModule,
    RatingModule,
    SliderModule,
    RadioButtonModule,
    ProgressSpinnerModule,
    NgCircleProgressModule.forRoot({})
  ],
  declarations: [
    WalletComponent,
    MenuComponent,
    DashboardComponent,
    SendComponent,
    ReceiveComponent,
    TransactionDetailsComponent,
    LogoutConfirmationComponent,
    HistoryComponent,
    AdvancedComponent,
    AddressBookComponent,
    AddNewAddressComponent,
    ExtPubkeyComponent,
    AboutComponent,
    SettingsComponent,
    SignVerifyComponent,
    SignatureComponent,
    VerifyComponent,
    GenerateAddressesComponent,
    XServerComponent,
    RegisterComponent,
    ResyncComponent,
    ColdStakingOverviewComponent,
    ColdStakingCreateComponent,
    ColdStakingCreateAddressComponent,
    ColdStakingWithdrawComponent,
    ColdStakingCreateHotComponent,
    CreateProfileComponent,
    ExchangeDetailsComponent,
    XserverProvisionerComponent,
    DappStoreComponent,
    DeployWordpressComponent,
    XserverNetworkComponent,
    DnsManagementComponent,
    AddZoneDialogComponent,
    AddEditDnsRecordDialogComponent,
    DeleteDnsRecordDialogComponent,
    StorageManagementComponent,
    XServerDetailsComponent,
    XServerUpdaterComponent,
  ],
  providers: [
    MessageService,
    DialogService,
    AddressType
  ],
  entryComponents: [
    SendComponent,
    ReceiveComponent,
    TransactionDetailsComponent,
    LogoutConfirmationComponent,
    SignatureComponent,
    VerifyComponent,
    ColdStakingCreateComponent,
    ColdStakingCreateAddressComponent,
    ColdStakingWithdrawComponent,
    ColdStakingCreateHotComponent,
    RegisterComponent,
    CreateProfileComponent,
    AddNewAddressComponent,
    ExchangeDetailsComponent,
    DeployWordpressComponent,
    AddEditDnsRecordDialogComponent,
    AddZoneDialogComponent,
    XServerDetailsComponent
  ]
})

export class WalletModule { }
