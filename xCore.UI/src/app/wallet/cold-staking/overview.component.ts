import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Message } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { GlobalService } from '../../shared/services/global.service';
import { Logger } from '../../shared/services/logger.service';
import { ThemeService } from '../../shared/services/theme.service';
import { ApiService } from '../../shared/services/api.service';
import { ColdStakingService } from '../../shared/services/coldstaking.service';
import { ColdStakingCreateAddressComponent } from './create-address/create-address.component';
import { ColdStakingWithdrawComponent } from './withdraw/withdraw.component';
import { ColdStakingCreateComponent } from './create/create.component';
import { ColdStakingCreateHotComponent } from './create-hot/create-hot.component';
import { TransactionDetailsComponent } from '../transaction-details/transaction-details.component';
import { TransactionInfo } from '../../shared/models/transaction-info';
import { WalletInfo } from '../../shared/models/wallet-info';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { TaskTimer } from 'tasktimer';

@Component({
  selector: 'app-staking-scene',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class ColdStakingOverviewComponent implements OnInit, OnDestroy {
  constructor(
    private apiService: ApiService,
    private globalService: GlobalService,
    private stakingService: ColdStakingService,
    public dialogService: DialogService,
    private fb: FormBuilder,
    public themeService: ThemeService,
    private log: Logger,
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

  public unconfirmedColdBalance: number;
  public unconfirmedHotBalance: number;

  public spendableColdBalance: number;
  public spendableHotBalance: number;

  public hasColdBalance = false;
  public hasHotBalance = false;

  private walletColdWalletExistsSubscription: Subscription;
  private walletColdBalanceWorker = new TaskTimer(5000);
  private walletHotBalanceWorker = new TaskTimer(5000);
  private walletColdHistoryWorker = new TaskTimer(5000);
  private walletHotHistoryWorker = new TaskTimer(5000);

  public setupForm: FormGroup;

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
      this.walletHotBalanceWorker.add(() => this.updateHotBalanceDetails()).start();
      this.walletHotHistoryWorker.add(() => this.updateHotHistory());
      this.updateHotBalanceDetails();
    } else {
      this.walletColdBalanceWorker.add(() => this.updateColdBalanceDetails()).start();
      this.walletColdHistoryWorker.add(() => this.updateColdHistory());
      this.updateColdBalanceDetails();
    }
  }

  ngOnDestroy() {
    this.walletColdBalanceWorker.stop();
    this.walletHotBalanceWorker.stop();
    this.walletColdHistoryWorker.stop();
    this.walletHotHistoryWorker.stop();

    this.cancelSubscriptions();
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

  private updateColdHistory() {
    this.walletColdHistoryWorker.pause();
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    walletInfo.accountName = this.coldStakingAccount;
    this.apiService.getWalletHistory(walletInfo, 0, 100, true)
      .pipe(finalize(() => {
        this.walletColdHistoryWorker.resume();
      }),
      ).subscribe(
        response => {
          if (!!response.history && response.history[0].transactionsHistory.length > 0) {
            const coldHistoryResponse = response.history[0].transactionsHistory;
            this.getTransactionInfo(coldHistoryResponse, true);
          }
          else {
            this.hasColdTransaction = false;
          }
        },
        error => {
          this.apiService.handleException(error);
        }
      );
  }

  private updateHotHistory() {
    this.walletHotHistoryWorker.pause();
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    walletInfo.accountName = this.hotStakingAccount;
    this.apiService.getWalletHistory(walletInfo, 0, 100, true)
      .pipe(finalize(() => {
        this.walletHotHistoryWorker.resume();
      }),
      ).subscribe(
        response => {
          if (!!response.history && response.history[0].transactionsHistory.length > 0) {
            const hotHistoryResponse = response.history[0].transactionsHistory;
            this.getTransactionInfo(hotHistoryResponse, false);
          }
          else {
            this.hasHotTransaction = false;
          }
        },
        error => {
          this.apiService.handleException(error);
        }
      );
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

  private updateColdBalanceDetails() {
    this.walletColdBalanceWorker.pause();
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    walletInfo.accountName = this.coldStakingAccount;
    this.apiService.getWalletBalanceOnce(walletInfo)
      .pipe(finalize(() => {
        this.walletColdBalanceWorker.resume();
      }),
      ).subscribe(
        response => {
          this.log.info('Get cold balance result:', response);
          const balanceResponse = response;
          this.confirmedColdBalance = balanceResponse.balances[0].amountConfirmed;
          this.unconfirmedColdBalance = balanceResponse.balances[0].amountUnconfirmed;
          this.spendableColdBalance = balanceResponse.balances[0].spendableAmount;
          if ((this.confirmedColdBalance + this.unconfirmedColdBalance) > 0) {
            this.hasColdBalance = true;
          } else {
            this.hasColdBalance = false;
          }
          this.balanceLoaded = true;
          this.startColdHistoryWorker();
        },
        error => {
          this.apiService.handleException(error);
        }
      );
  }

  startColdHistoryWorker() {
    if (this.walletColdHistoryWorker.state === TaskTimer.State.IDLE) {
      this.log.info('Cold history is not running, starting...');
      this.hasColdTransaction = true;
      this.updateColdHistory();
      this.walletColdHistoryWorker.start();
    }
  }

  private updateHotBalanceDetails() {
    this.walletHotBalanceWorker.pause();
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    walletInfo.accountName = this.hotStakingAccount;
    this.apiService.getWalletBalanceOnce(walletInfo)
      .pipe(finalize(() => {
        this.walletHotBalanceWorker.resume();
      }),
      ).subscribe(
        hotBalanceResponse => {
          this.log.info('Get hot balance result:', hotBalanceResponse);
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
          this.startHotHistoryWorker();
        },
        error => {
          this.apiService.handleException(error);
        }
      );
  }

  startHotHistoryWorker() {
    if (this.walletHotHistoryWorker.state === TaskTimer.State.IDLE) {
      this.log.info('Hot history is not running, starting...');
      this.hasHotTransaction = true;
      this.updateHotHistory();
      this.walletHotHistoryWorker.start();
    }
  }

  public openTransactionDetailDialog(transaction: TransactionInfo) {
    const modalData = { transaction };

    this.dialogService.open(TransactionDetailsComponent, {
      header: 'Transaction Details',
      data: modalData
    });
  }

  private cancelSubscriptions() {
    if (this.walletColdWalletExistsSubscription) {
      this.walletColdWalletExistsSubscription.unsubscribe();
    }
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
