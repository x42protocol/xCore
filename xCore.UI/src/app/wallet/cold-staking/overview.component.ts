import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Message } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { GlobalService } from '../../shared/services/global.service';
import { ThemeService } from '../../shared/services/theme.service';
import { ApiService } from '../../shared/services/api.service';
import { ApiEvents } from '../../shared/services/api.events';
import { ColdStakingService } from '../../shared/services/coldstaking.service';
import { WorkerType } from '../../shared/models/worker';
import { ColdStakingCreateAddressComponent } from './create-address/create-address.component';
import { ColdStakingWithdrawComponent } from './withdraw/withdraw.component';
import { ColdStakingCreateComponent } from './create/create.component';
import { ColdStakingCreateHotComponent } from './create-hot/create-hot.component';
import { TransactionDetailsComponent } from '../transaction-details/transaction-details.component';
import { TransactionInfo } from '../../shared/models/transaction-info';
import { Subscription } from 'rxjs';
import { SettingsService } from '../../shared/services/settings.service';

@Component({
  selector: 'app-staking-scene',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class ColdStakingOverviewComponent implements OnInit, OnDestroy {
  preferedExchangeCoinColdBalance: string;
    preferedExchangeCoinUnconfirmedColdBalance: string;
    preferedCryptoExchangeCoinColdBalance: string;
    preferedCryptoExchangeCoinUnconfirmedColdBalance: string;
  constructor(
    private apiService: ApiService,
    private globalService: GlobalService,
    private stakingService: ColdStakingService,
    public dialogService: DialogService,
    private fb: UntypedFormBuilder,
    public themeService: ThemeService,
    private apiEvents: ApiEvents,
    private settingsService: SettingsService,
  ) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
  }

  public isLoading = true;
  public coldWalletAccountExists = true;
  public hotWalletAccountExists = true;
  public coldTransactions: TransactionInfo[];
  public hotTransactions: TransactionInfo[];
  public pageNumber = 1;
  public coldStakingAccount = 'coldStakingColdAddresses';
  public hotStakingAccount = 'coldStakingHotAddresses';
  public isDarkTheme = false;
  public hasColdTransaction = true;
  public hasHotTransaction = true;
  public loadingMessage: Message[] = [];
  public setupColdMessage: Message[] = [];
  public hotMessage: Message[] = [];
  public isColdWalletHot: boolean;
  public coinUnit: string;
  public balanceLoaded: boolean;
  public confirmedColdBalance = 0;
  public confirmedHotBalance = 0;
  public setupForm: UntypedFormGroup;

  public unconfirmedColdBalance: number;
  public unconfirmedHotBalance: number;

  public spendableColdBalance: number;
  public spendableHotBalance: number;

  public hasColdBalance = false;
  public hasHotBalance = false;

  private walletColdWalletExistsSubscription: Subscription;
  private hotBalanceSubscription: Subscription;
  private hotHistorySubscription: Subscription;
  private coldBalanceSubscription: Subscription;
  private coldHistorySubscription: Subscription;

  ngOnInit() {
    this.buildSetupForm();
    this.coinUnit = this.globalService.getCoinUnit();
    this.startSubscriptions();

    this.loadingMessage = [{ severity: 'info', summary: '', detail: 'Loading, Please wait...' }];
    this.setupColdMessage = [{ severity: 'info', summary: '', detail: 'The Delegated Wallet has no access to your coins and you can withdraw to your spendable addresses balance at any time.' }];
    this.hotMessage = [{ severity: 'info', summary: '', detail: 'The hot balance reflects what has been delegated, this wallet does not have access to these funds.' }];

    this.apiService
      .getColdHotState(this.globalService.getWalletName())
      .subscribe(
        isHot => {
          this.isColdWalletHot = isHot;
          this.startMethods();
          this.isLoading = false;
        }
      );
  }

  startMethods() {
    if (this.isColdWalletHot) {
      this.startHotSubscriptions();
    } else {
      this.startColdSubscriptions();
    }
  }

  startHotSubscriptions() {
    this.hotBalanceSubscription = this.apiEvents.HotBalance.subscribe((result) => {
      if (result !== null) {
        this.updateHotBalanceDetails(result);
      }
    });
    this.apiEvents.ManualTick(WorkerType.HOT_BALANCE);

    this.hotHistorySubscription = this.apiEvents.HotHistory.subscribe((result) => {
      if (result !== null) {
        this.updateHotHistory(result);
      }
    });
    this.apiEvents.ManualTick(WorkerType.HOT_HISTORY);
  }

  startColdSubscriptions() {
    this.coldBalanceSubscription = this.apiEvents.ColdBalance.subscribe((result) => {
      if (result !== null) {
        this.updateColdBalanceDetails(result);
      }
    });
    this.apiEvents.ManualTick(WorkerType.COLD_BALANCE);

    this.coldHistorySubscription = this.apiEvents.ColdHistory.subscribe((result) => {
      if (result !== null) {
        this.updateColdHistory(result);
      }
    });
    this.apiEvents.ManualTick(WorkerType.COLD_HISTORY);
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }

  private cancelSubscriptions() {
    if (this.walletColdWalletExistsSubscription) {
      this.walletColdWalletExistsSubscription.unsubscribe();
    }

    if (this.hotBalanceSubscription) {
      this.hotBalanceSubscription.unsubscribe();
    }
    if (this.hotHistorySubscription) {
      this.hotHistorySubscription.unsubscribe();
    }
    if (this.coldBalanceSubscription) {
      this.coldBalanceSubscription.unsubscribe();
    }
    if (this.coldHistorySubscription) {
      this.coldHistorySubscription.unsubscribe();
    }
  }

  private buildSetupForm(): void {
    this.setupForm = this.fb.group({
      setupType: ['', Validators.compose([Validators.required])]
    });
  }

  onWalletGetFirstUnusedAddress(isColdStaking: boolean) {
    const modalData = { isColdStaking };

    this.dialogService.open(ColdStakingCreateAddressComponent, {
      header: 'Hot Address',
      data: modalData
    });
  }

  onWalletWithdraw(isColdStaking: boolean) {
    const modalData = { isColdStaking };

    this.dialogService.open(ColdStakingWithdrawComponent, {
      header: 'Withdraw',
      data: modalData
    });
  }

  onColdSetup() {
    this.dialogService.open(ColdStakingCreateComponent, {
      header: 'Delegated Cold Staking',
      width: '540px'
    });
  }

  onHotSetup() {
    this.dialogService.open(ColdStakingCreateHotComponent, {
      header: 'Hot Cold Staking Setup',
      width: '540px'
    });
  }

  private getWalletsExists() {
    this.walletColdWalletExistsSubscription = this.stakingService.getInfo(this.globalService.getWalletName()).subscribe(x => {
      this.coldWalletAccountExists = x.coldWalletAccountExists;
      this.hotWalletAccountExists = x.hotWalletAccountExists;

      const aWalletExists: boolean = this.coldWalletAccountExists || this.hotWalletAccountExists;

      if (!aWalletExists) {
        this.cancelSubscriptions();
      }

      if (!aWalletExists) {
        setTimeout(() => {
          this.startSubscriptions();
        }, 2000);
      }
    });
  }

  private updateColdHistory(response) {
    if (!!response.history && response.history[0].transactionsHistory.length > 0) {
      const coldHistoryResponse = response.history[0].transactionsHistory;
      this.getTransactionInfo(coldHistoryResponse, true);
    }
    else {
      this.hasColdTransaction = false;
    }
  }

  private updateHotHistory(response) {
    if (!!response.history && response.history[0].transactionsHistory.length > 0) {
      const hotHistoryResponse = response.history[0].transactionsHistory;
      this.getTransactionInfo(hotHistoryResponse, false);
    }
    else {
      this.hasHotTransaction = false;
    }
  }

  private getTransactionInfo(transactions: any, isCold: boolean) {
    if (isCold) {
      this.coldTransactions = [];
    } else {
      this.hotTransactions = [];
    }

    for (const transaction of transactions) {
      let transactionType;
      if (transaction.type === 'send') {
        transactionType = 'sent';
      } else if (transaction.type === 'received') {
        transactionType = 'received';
      } else if (transaction.type === 'staked') {
        transactionType = 'staked';
      } else {
        transactionType = 'unknown';
      }
      const transactionId = transaction.id;
      const transactionAmount = transaction.amount;
      let transactionFee;
      if (transaction.fee) {
        transactionFee = transaction.fee;
      } else {
        transactionFee = 0;
      }
      const transactionConfirmedInBlock = transaction.confirmedInBlock;
      const transactionTimestamp = transaction.timestamp;

      if (isCold) {
        this.coldTransactions.push(new TransactionInfo(transactionType, transactionId, transactionAmount, transactionFee, transactionConfirmedInBlock, transactionTimestamp));
      } else {
        this.hotTransactions.push(new TransactionInfo(transactionType, transactionId, transactionAmount, transactionFee, transactionConfirmedInBlock, transactionTimestamp));
      }

      if (this.coldTransactions !== undefined && this.coldTransactions.length > 0) {
        this.hasColdTransaction = true;
      }
      if (this.hotTransactions !== undefined && this.hotTransactions.length > 0) {
        this.hasHotTransaction = true;
      }
    }
  }

  private updateColdBalanceDetails(balanceResponse) {
    this.confirmedColdBalance = balanceResponse.balances[0].amountConfirmed;
    this.unconfirmedColdBalance = balanceResponse.balances[0].amountUnconfirmed;

    const currencies = this.globalService.getCurrencies();
    const fiatCurrencyEntry = currencies.find(l => l.abbreviation === this.settingsService.preferredFiatExchangeCurrency);
    const cryptoCurrencyEntry = currencies.find(l => l.abbreviation === this.settingsService.preferredCryptoExchangeCurrency);

    this.preferedExchangeCoinColdBalance = fiatCurrencyEntry.symbol + '' +
      Number.parseFloat(this.globalService.transform((+this.settingsService.preferedFiatCurrencyExchangeRate * this.confirmedColdBalance)).toString()).toFixed(fiatCurrencyEntry.decimals);

    this.preferedExchangeCoinUnconfirmedColdBalance = fiatCurrencyEntry.symbol + '' +
      Number.parseFloat(this.globalService.transform(+this.settingsService.preferedFiatCurrencyExchangeRate * this.unconfirmedColdBalance).toString()).toFixed(fiatCurrencyEntry.decimals);


    this.preferedCryptoExchangeCoinColdBalance = cryptoCurrencyEntry.symbol + '' +
      Number.parseFloat(this.globalService.transform((+this.settingsService.preferedCryptoCurrencyExchangeRate * this.confirmedColdBalance)).toString()).toFixed(cryptoCurrencyEntry.decimals);

    this.preferedCryptoExchangeCoinUnconfirmedColdBalance = cryptoCurrencyEntry.symbol + '' +
      Number.parseFloat(this.globalService.transform(+this.settingsService.preferedCryptoCurrencyExchangeRate * this.unconfirmedColdBalance).toString()).toFixed(cryptoCurrencyEntry.decimals);

    this.spendableColdBalance = balanceResponse.balances[0].spendableAmount;
    if ((this.confirmedColdBalance + this.unconfirmedColdBalance) > 0) {
      this.hasColdBalance = true;
    } else {
      this.hasColdBalance = false;
    }
    this.balanceLoaded = true;
    this.hasColdTransaction = true;
  }

  private updateHotBalanceDetails(hotBalanceResponse) {
    if (hotBalanceResponse.balances[0].amountConfirmed > 0 || hotBalanceResponse.balances[0].amountUnconfirmed > 0) {
      this.hasHotBalance = true;
    }
    this.confirmedHotBalance = hotBalanceResponse.balances[0].amountConfirmed;
    this.unconfirmedHotBalance = hotBalanceResponse.balances[0].amountUnconfirmed;
    this.spendableHotBalance = hotBalanceResponse.balances[0].spendableAmount;
    if ((this.confirmedHotBalance + this.unconfirmedHotBalance) > 0) {
      this.hasHotBalance = true;
    } else {
      this.hasHotBalance = false;
    }
    this.balanceLoaded = true;
    this.hasHotTransaction = true;
  }

  public openTransactionDetailDialog(transaction: TransactionInfo) {
    const modalData = { transaction };

    this.dialogService.open(TransactionDetailsComponent, {
      header: 'Transaction Details',
      data: modalData
    });
  }

  private startSubscriptions() {
    this.getWalletsExists();

    const aWalletExists: boolean = this.coldWalletAccountExists && this.hotWalletAccountExists;

    if (!aWalletExists) {
      this.hasColdBalance = false;
      this.hasHotBalance = false;
      return;
    }
  }
}
