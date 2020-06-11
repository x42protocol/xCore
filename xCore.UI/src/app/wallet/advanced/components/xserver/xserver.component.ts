import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FullNodeApiService } from '../../../../shared/services/fullnode.api.service';
import { WalletInfo } from '../../../../shared/models/wallet-info';
import { GlobalService } from '../../../../shared/services/global.service';
import { ElectronService } from 'ngx-electron';
import { CoinNotationPipe } from '../../../../shared/pipes/coin-notation.pipe';
import { RegisterComponent } from './register/register.component';

import { DialogService } from 'primeng/dynamicdialog';
import { SelectItem } from 'primeng/api';
import { ClipboardService } from 'ngx-clipboard';
import { ColdStakingService } from '../../../../shared/services/coldstaking.service';
import { ThemeService } from '../../../../shared/services/theme.service';

interface NetworkProtocol {
  name: string;
  value: number;
}

@Component({
  selector: 'app-xserver',
  templateUrl: './xserver.component.html',
  styleUrls: ['./xserver.component.css']
})
export class XServerComponent implements OnInit, OnDestroy {

  constructor(private globalService: GlobalService, private apiService: FullNodeApiService, private electron: ElectronService, public dialogService: DialogService, private clipboardService: ClipboardService, private stakingService: ColdStakingService, private themeService: ThemeService) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType == 'dark';
  }

  public isDarkTheme = false;
  private walletBalanceSubscription: Subscription;
  public clientName: string;
  public applicationVersion: string;
  public fullNodeVersion: string;
  public network: string;
  public protocolVersion: number;
  public blockHeight: number;
  public dataDirectory: string;
  public isElectron: boolean;
  public tiers: SelectItem[];
  public coinUnit: string;
  public confirmedBalance: number;
  public protocols: NetworkProtocol[];
  public selectedProtocol: NetworkProtocol;
  public copyType: SelectItem[];
  public copied: boolean;
  public allAddresses: SelectItem[];
  public isUnlocking: boolean;
  public unlockError: string;

  public keyAddress: string;
  public xserverName: string;
  public networkAddress: string;
  public networkPort: string = "4242";
  public serverId: string;
  public selectedTier: string;
  public walletPassword: string;

  public mainAccount: string = "account 0";
  public coldStakingAccount: string = "coldStakingColdAddresses";
  public hotStakingAccount: string = "coldStakingHotAddresses";

  ngOnInit() {
    this.tiers = [
      { label: 'Tier 1', value: "1000" },
      { label: 'Tier 2', value: "20000" },
      { label: 'Tier 3', value: "100000" },
    ];
    this.protocols = [
      { name: 'http', value: 1 },
      { name: 'https', value: 2 }
    ];
    this.copyType = [
      { label: 'Copy', value: 'Copy', icon: 'pi pi-copy' }
    ];
    this.getKeyAddress();
    this.copied = false;
    this.selectedTier = "1000";
    this.selectedProtocol = this.protocols[0];
    this.applicationVersion = this.globalService.getApplicationVersion();
    this.isElectron = this.electron.isElectronApp;
    this.startSubscriptions();
    this.coinUnit = this.globalService.getCoinUnit();
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }

  private startSubscriptions() {
    let walletRequestInfo = {
      walletName: this.globalService.getWalletName(),
      feeType: "medium"
    }

    this.walletBalanceSubscription = this.apiService.getMaximumBalance(walletRequestInfo)
      .subscribe(
        response => {
          let balanceResponse = response;
          this.confirmedBalance = new CoinNotationPipe().transform(balanceResponse.maxSpendableAmount);
        },
        error => {
          this.cancelSubscriptions();
          this.startSubscriptions();
        }
      );
  }

  private getAddresses() {
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    walletInfo.accountName = this.coldStakingAccount;
    this.apiService.getNonSegwitAddresses(walletInfo)
      .subscribe(
        response => {
          this.allAddresses = [];

          for (let address of response.addresses) {
            let type = "New";
            if (address.isUsed) {
              type = "Used";
            } else if (address.isChange) {
              type = "Change";
            }
            this.allAddresses.push({ title: type, label: address.address, value: address.address });

            //if (((!address.isUsed && this.showUnusedAddresses) || address.isUsed) && (!address.isChange)) {
          }
        }
      );
  }

  public onUnlockClicked() {
    this.unlockError = "";
    this.isUnlocking = true;
    this.stakingService.createColdStakingAccount(this.globalService.getWalletName(), this.walletPassword, true)
      .subscribe(
        createColdStakingAccountResponse => {
          this.getKeyAddress();
          this.isUnlocking = false;
        },
        error => {
          this.isUnlocking = false;
          this.unlockError = error.error.errors[0].message;
        }
      );
  }

  private getKeyAddress() {
    this.stakingService.getAddress(this.globalService.getWalletName(), true, false.toString().toLowerCase(), true).subscribe(
      getAddressResponse => {
        this.keyAddress = getAddressResponse.address;
        this.getAddresses();
      });
  }

  copyToClipboardClicked() {
    if (this.clipboardService.copyFromContent(this.keyAddress)) {
      this.copied = true;
    }
  }

  public getTierCost(): number {
    if (this.selectedTier == "") {
      return 0;
    }

    return Number(this.selectedTier);
  }

  private cancelSubscriptions() {
    if (this.walletBalanceSubscription) {
      this.walletBalanceSubscription.unsubscribe();
    }
  }

  onRegisterClick(): void {
    let modalData = {
      "keyAddress": this.keyAddress,
      "xserverName": this.xserverName,
      "selectedProtocol": this.selectedProtocol.value,
      "networkAddress": this.networkAddress,
      "networkPort": this.networkPort,
      "serverId": this.serverId,
      "walletPassword": this.walletPassword,
      "selectedTier": this.selectedTier
    };

    this.dialogService.open(RegisterComponent, {
      header: 'Setting up remote xServer',
      width: '540px',
      data: modalData,
      dismissableMask: true
    });
  }
}
