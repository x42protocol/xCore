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

@Component({
  selector: 'app-xserver',
  templateUrl: './xserver.component.html',
  styleUrls: ['./xserver.component.css']
})
export class XServerComponent implements OnInit, OnDestroy {

  constructor(private globalService: GlobalService, private apiService: FullNodeApiService, private electron: ElectronService, public dialogService: DialogService) { }

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

  public xserverName: string;
  public networkAddress: string;
  public networkPort: string = "4242";
  public serverId: string;
  public selectedTier: string;
  public walletPassword: string;

  ngOnInit() {
    this.tiers = [
      { label: 'Tier 1', value: "1000" },
      { label: 'Tier 2', value: "20000" },
      { label: 'Tier 3', value: "100000" },
    ];
    this.selectedTier = "1000";
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

  private cancelSubscriptions() {
    if (this.walletBalanceSubscription) {
      this.walletBalanceSubscription.unsubscribe();
    }
  }

  onRegisterClick(): void {
    let modalData = {
      "xserverName": this.xserverName,
      "networkAddress": this.networkAddress,
      "networkPort": this.networkPort,
      "serverId": this.serverId,
      "walletPassword": this.walletPassword,
      "selectedTier": this.selectedTier
    };

    this.dialogService.open(RegisterComponent, {
      header: 'Setting up remote xServer',
      width: '540px',
      data: modalData
    });
  }
}
