import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WalletComponent } from './wallet.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HistoryComponent } from './history/history.component';
import { ColdStakingOverviewComponent } from './cold-staking/overview.component';
import { AdvancedComponent } from './advanced/advanced.component';
import { AboutComponent } from './advanced/components/about/about.component';
import { SettingsComponent } from './advanced/components/settings/settings.component';
import { SignVerifyComponent } from './advanced/components/sign-verify/sign-verify.component';
import { ExtPubkeyComponent } from './advanced/components/ext-pubkey/ext-pubkey.component';
import { GenerateAddressesComponent } from './advanced/components/generate-addresses/generate-addresses.component';
import { ResyncComponent } from './advanced/components/resync/resync.component';
import { XServerComponent } from './advanced/components/xserver/xserver.component';
import { AddressBookComponent } from './address-book/address-book.component';
import { XserverProvisionerComponent } from './advanced/components/xserver-provisioner/xserver-provisioner.component';
import { DappStoreComponent } from './dapp-store/dapp-store.component';
import { XserverNetworkComponent } from './xserver-network/xserver-network.component';
import { DnsManagementComponent } from './dns-management/dns-management.component';
import { StorageManagementComponent } from './storage-management/storage-management.component';
import { XServerUpdaterComponent } from './advanced/components/x-server-updater/x-server-updater.component';

const routes: Routes = [
  {
    path: 'wallet', component: WalletComponent, children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'history', component: HistoryComponent },
      { path: 'coldstaking', component: ColdStakingOverviewComponent },
      { path: 'dapp-store', component: DappStoreComponent },
      { path: 'xserver-network', component: XserverNetworkComponent },
      { path: 'dns-management', component: DnsManagementComponent },
      { path: 'storage-management', component: StorageManagementComponent},
      {
        path: 'advanced', component: AdvancedComponent,
        children: [
          { path: '', redirectTo: 'about', pathMatch: 'full' },
          { path: 'about', component: AboutComponent },
          { path: 'settings', component: SettingsComponent },
          { path: 'sign', component: SignVerifyComponent },
          { path: 'extpubkey', component: ExtPubkeyComponent },
          { path: 'generate-addresses', component: GenerateAddressesComponent },
          { path: 'resync', component: ResyncComponent },
          { path: 'xserver', component: XServerComponent },
          { path: 'xserverProvisioner', component: XserverProvisionerComponent },
          { path: 'xserverUpdater', component: XServerUpdaterComponent },

        ]
      },
      { path: 'address-book', component: AddressBookComponent }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class WalletRoutingModule { }
