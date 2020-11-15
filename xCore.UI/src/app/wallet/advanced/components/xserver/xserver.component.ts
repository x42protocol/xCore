import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ElectronService } from 'ngx-electron';
import { DialogService } from 'primeng/dynamicdialog';
import { SelectItem } from 'primeng/api';
import { ClipboardService } from 'ngx-clipboard';
import { ApiService } from '../../../../shared/services/api.service';
import { WalletInfo } from '../../../../shared/models/wallet-info';
import { GlobalService } from '../../../../shared/services/global.service';
import { CoinNotationPipe } from '../../../../shared/pipes/coin-notation.pipe';
import { RegisterComponent } from './register/register.component';
import { ColdStakingService } from '../../../../shared/services/coldstaking.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ApplicationStateService } from '../../../../shared/services/application-state.service';

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

  constructor(
    private globalService: GlobalService,
    private apiService: ApiService,
    private electron: ElectronService,
    public dialogService: DialogService,
    private clipboardService: ClipboardService,
    private stakingService: ColdStakingService,
    public themeService: ThemeService,
    public appState: ApplicationStateService,
  ) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
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
  public feeAddress: string;
  public profileName = '';
  public networkAddress: string;
  public networkPort = '4242';
  public serverId: string;
  public selectedTier: string;
  public walletPassword: string;

  public mainAccount = 'account 0';
  public coldStakingAccount = 'coldStakingColdAddresses';
  public hotStakingAccount = 'coldStakingHotAddresses';

  ngOnInit() {
    this.tiers = [
      { label: 'Tier 1', value: '1000' },
      { label: 'Tier 2', value: '20000' },
      { label: 'Tier 3', value: '50000' }
    ];
    this.protocols = [
      { name: 'http', value: 1 },
      { name: 'https', value: 2 }
    ];
    this.copyType = [
      { label: 'Copy', value: 'Copy', icon: 'pi pi-copy' }
    ];
    if (this.appState.network !== 'x42main') {
      this.networkPort = '4243';
    }
    this.setKeyAddress();
    this.copied = false;
    this.selectedTier = '1000';
    this.selectedProtocol = this.protocols[0];
    this.applicationVersion = this.appState.version;
    this.isElectron = this.electron.isElectronApp;
    this.startSubscriptions();
    this.coinUnit = this.globalService.getCoinUnit();
    this.setFeeAddress();
    this.startWatchingForProfileName();
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }

  private startWatchingForProfileName() {
    this.setProfileName();
    const interval = setInterval(() => {
      this.setProfileName();
      if (this.profileName !== '') {
        clearInterval(interval);
      }
    }, 500);
  }

  private setProfileName() {
    const profile = this.globalService.getProfile();
    if (profile != null && profile.status === 2) {
      this.profileName = profile.name;
    }
  }

  private startSubscriptions() {
    const walletRequestInfo = {
      walletName: this.globalService.getWalletName(),
      feeType: 'medium'
    };

    this.walletBalanceSubscription = this.apiService.getMaximumBalance(walletRequestInfo)
      .subscribe(
        response => {
          const balanceResponse = response;
          this.confirmedBalance = new CoinNotationPipe(this.globalService).transform(balanceResponse.maxSpendableAmount);
        },
        error => {
          this.cancelSubscriptions();
          this.startSubscriptions();
        }
      );
  }

  public onUnlockClicked() {
    this.unlockError = '';
    this.isUnlocking = true;
    this.stakingService.createColdStakingAccount(this.globalService.getWalletName(), this.walletPassword, true)
      .subscribe(
        createColdStakingAccountResponse => {
          this.setKeyAddress();
          this.isUnlocking = false;
        },
        error => {
          this.isUnlocking = false;
          this.unlockError = error.error.errors[0].message;
        }
      );
  }

  private setFeeAddress() {
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.apiService.getUnusedReceiveAddress(walletInfo)
      .subscribe(
        response => {
          this.feeAddress = response;
        }
      );
  }

  private setKeyAddress() {
    this.keyAddress = this.globalService.getWalletKeyAddress();
  }

  copyToClipboardClicked() {
    if (this.clipboardService.copyFromContent(this.keyAddress)) {
      this.copied = true;
    }
  }

  public getTierCost(): number {
    if (this.selectedTier === '') {
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
    const modalData = {
      keyAddress: this.keyAddress,
      feeAddress: this.feeAddress,
      profileName: this.profileName,
      selectedProtocol: this.selectedProtocol.value,
      networkAddress: this.networkAddress,
      networkPort: this.networkPort,
      serverId: this.serverId,
      walletPassword: this.walletPassword,
      selectedTier: this.selectedTier
    };

    this.dialogService.open(RegisterComponent, {
      header: 'Setting up remote xServer',
      width: '540px',
      data: modalData
    });
  }
}
