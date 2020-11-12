import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { ApiService } from '../../shared/services/api.service';
import { GlobalService } from '../../shared/services/global.service';
import { Logger } from '../../shared/services/logger.service';
import { WalletInfo } from '../../shared/models/wallet-info';
import { TransactionInfo } from '../../shared/models/transaction-info';
import { ThemeService } from '../../shared/services/theme.service';
import { SendComponent } from '../send/send.component';
import { ReceiveComponent } from '../receive/receive.component';
import { TransactionDetailsComponent } from '../transaction-details/transaction-details.component';
import { CreateProfileComponent } from '../profile/create/create-profile.component';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { TaskTimer } from 'tasktimer';

@Component({
  selector: 'app-dashboard-component',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  constructor(
    private apiService: ApiService,
    private globalService: GlobalService,
    public dialogService: DialogService,
    private router: Router,
    private fb: FormBuilder,
    public themeService: ThemeService,
    private log: Logger,
  ) {
    this.buildStakingForm();
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
  }

  public balanceLoaded: boolean;
  public walletName: string;
  public coinUnit: string;
  public confirmedBalance: number;
  public unconfirmedBalance: number;
  public spendableBalance: number;
  public latestTransactions: TransactionInfo[];
  public stakingEnabled: boolean;
  public stakingActive: boolean;
  public stakingWeight: number;
  public awaitingMaturity = 0;
  public netStakingWeight: number;
  public expectedTime: number;
  public dateTime: string;
  public isStarting: boolean;
  public isStopping: boolean;
  public isDarkTheme = false;
  public hasBalance = false;
  public hasTX = false;
  public hasHotBalance = false;
  public confirmedHotBalance = 0;
  public unconfirmedHotBalance: number;
  public spendableHotBalance: number;
  public hotStakingAccount = 'coldStakingHotAddresses';
  public stakingForm: FormGroup;
  public apps: any[];
  public profileStatus = 0;
  public profileAddress: string;
  public profile: any;

  private walletAccountBalanceWorker = new TaskTimer(5000);
  private walletHotBalanceWorker = new TaskTimer(5000);
  private historyWorker = new TaskTimer(5000);

  ngOnInit() {
    this.walletName = this.globalService.getWalletName();
    this.coinUnit = this.globalService.getCoinUnit();
    this.getProfileOnConnection();

    this.apps = [
      { name: 'Search For Apps', image: 'https://cdn1.iconfinder.com/data/icons/hawcons/32/698628-icon-112-search-plus-512.png' }
    ];

    this.walletAccountBalanceWorker.add(() => this.updateAccountWalletDetails()).start();
    this.walletHotBalanceWorker.add(() => this.updateHotWalletDetails()).start();
    this.historyWorker.add(() => this.updateWalletHistory());
  }

  ngOnDestroy() {
    this.walletAccountBalanceWorker.stop();
    this.walletHotBalanceWorker.stop();
    this.historyWorker.stop();
  }

  private buildStakingForm(): void {
    this.stakingForm = this.fb.group({
      walletPassword: ['', Validators.required]
    });
  }

  public goToHistory() {
    this.router.navigate(['/wallet/history']);
  }

  public openSendDialog() {
    this.dialogService.open(SendComponent, {
      header: 'Send to',
      width: '700px'
    });
  }

  public openReceiveDialog() {
    this.dialogService.open(ReceiveComponent, {
      header: 'Receive',
      width: '540px'
    });
  }

  public openCreateProfileDialog(isReserved: boolean) {
    let priceLockId = '';
    if (isReserved) {
      priceLockId = this.profile.priceLockId;
    }
    const modalData = { priceLockId };

    this.dialogService.open(CreateProfileComponent, {
      header: 'Create Profile',
      width: '540px',
      data: modalData
    });
  }

  public openTransactionDetailDialog(transaction: TransactionInfo) {
    const modalData = { transaction };

    this.dialogService.open(TransactionDetailsComponent, {
      header: 'Transaction Details',
      data: modalData
    });
  }

  private getProfileOnConnection() {
    this.setProfileInfo();
    const interval = setInterval(() => {
      const xServerStatus = this.globalService.getxServerStatus();
      if (xServerStatus.nodes.length > 0) {
        const tierTwo = xServerStatus.nodes.find(n => n.tier === 2);
        if (tierTwo) {
          const cachedProfile = this.globalService.getProfile();
          if (cachedProfile != null) {
            this.profile = cachedProfile;
            this.profileStatus = cachedProfile.status;
            if (this.profileStatus === 1) {
              this.globalService.setProfile(null);
            }
          } else {
            this.setProfileInfo();
          }
          if (this.profileStatus === 2) {
            clearInterval(interval);
          }
        }
      }
    }, 10000);
  }

  private setProfileInfo() {
    this.apiService.getProfile('', this.globalService.getWalletKeyAddress())
      .subscribe(
        response => {
          if (response.success) {
            this.profileStatus = response.status;
            this.globalService.setProfile(response);
            this.profile = response;
          } else {
            this.profileStatus = -1;
            const profile = { status: this.profileStatus };
            this.globalService.setProfile(profile);
          }
        }
      );
  }

  private updateAccountWalletDetails() {
    this.walletAccountBalanceWorker.pause();
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.apiService.getWalletBalanceOnce(walletInfo)
      .pipe(finalize(() => {
        this.walletAccountBalanceWorker.resume();
      }),
      ).subscribe(
        response => {
          this.log.info('Get account balance result:', response);
          const balanceResponse = response;
          // TODO - add account feature instead of using first entry in array
          this.confirmedBalance = balanceResponse.balances[0].amountConfirmed;
          this.unconfirmedBalance = balanceResponse.balances[0].amountUnconfirmed;
          this.spendableBalance = balanceResponse.balances[0].spendableAmount;
          if ((this.confirmedBalance + this.unconfirmedBalance) > 0) {
            this.hasBalance = true;
          } else {
            this.hasBalance = false;
          }
          this.balanceLoaded = true;
          this.startHistoryWorker();
        },
        error => {
          this.apiService.handleException(error);
        }
      );
  }

  private updateHotWalletDetails() {
    this.walletAccountBalanceWorker.pause();
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
        },
        error => {
          this.apiService.handleException(error);
        }
      );
  }

  startHistoryWorker() {
    if (this.historyWorker.state === TaskTimer.State.IDLE) {
      this.log.info('History is not running, starting...');
      this.hasTX = true;
      this.historyWorker.start();
    }
  }

  // TODO: add history in seperate service to make it reusable
  private updateWalletHistory() {
    this.historyWorker.pause();
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    let historyResponse;
    this.apiService.getWalletHistoryOnce(walletInfo, 0, 10)
      .pipe(finalize(() => {
        this.historyWorker.resume();
      }),
      ).subscribe(
        response => {
          // TODO - add account feature instead of using first entry in array
          if (!!response.history && response.history[0].transactionsHistory.length > 0) {
            historyResponse = response.history[0].transactionsHistory;
            this.getTransactionInfo(historyResponse);
          }
        },
        error => {
          this.apiService.handleException(error);
        }
      );
  }

  private getTransactionInfo(transactions: any) {
    this.latestTransactions = [];

    for (const transaction of transactions) {
      let transactionType;
      if (transaction.type === 'send') {
        transactionType = 'sent';
      } else if (transaction.type === 'received') {
        transactionType = 'received';
      } else if (transaction.type === 'staked') {
        transactionType = 'staked';
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

      this.latestTransactions.push(new TransactionInfo(transactionType, transactionId, transactionAmount, transactionFee, transactionConfirmedInBlock, transactionTimestamp));
    }

    if (this.latestTransactions !== undefined && this.latestTransactions.length > 0) {
      this.hasTX = true;
      if (this.stakingEnabled) {
        this.makeLatestTxListSmall();
      } else {
        this.latestTransactions = this.latestTransactions.slice(0, 5);
      }
    }
  }

  private makeLatestTxListSmall() {
    if (this.latestTransactions !== undefined && this.latestTransactions.length > 0) {
      this.latestTransactions = this.latestTransactions.slice(0, 3);
    }
  }

  public startStaking() {
    this.isStarting = true;
    this.isStopping = false;
    const walletData = {
      name: this.globalService.getWalletName(),
      password: this.stakingForm.get('walletPassword').value
    };
    this.apiService.startStaking(walletData)
      .subscribe(
        response => {
          this.makeLatestTxListSmall();
          this.stakingEnabled = true;
          this.stakingForm.patchValue({ walletPassword: '' });
          this.getStakingInfo();
        },
        error => {
          this.isStarting = false;
          this.stakingEnabled = false;
          this.stakingForm.patchValue({ walletPassword: '' });
        }
      )
      ;
  }

  public stopStaking() {
    this.isStopping = true;
    this.isStarting = false;
    this.apiService.stopStaking()
      .subscribe(
        response => {
          this.stakingEnabled = false;
        }
      )
      ;
  }

  private getStakingInfo() {
    this.stakingInfoSubscription = this.apiService.getStakingInfo()
      .subscribe(
        response => {
          if (response != null) {
            const stakingResponse = response;
            this.stakingEnabled = stakingResponse.enabled;
            this.stakingActive = stakingResponse.staking;
            this.stakingWeight = stakingResponse.weight;
            this.netStakingWeight = stakingResponse.netStakeWeight;
            this.awaitingMaturity = (this.unconfirmedBalance + this.confirmedBalance) - this.spendableBalance;
            this.expectedTime = stakingResponse.expectedTime;
            this.dateTime = this.secondsToString(this.expectedTime);
            if (this.stakingActive) {
              this.makeLatestTxListSmall();
              this.isStarting = false;
            } else {
              this.isStopping = false;
            }
          }
        }, error => {
          this.cancelSubscriptions();
          this.startSubscriptions();
        }
      )
      ;
  }

  private secondsToString(seconds: number) {
    const numDays = Math.floor(seconds / 86400);
    const numHours = Math.floor((seconds % 86400) / 3600);
    const numMinutes = Math.floor(((seconds % 86400) % 3600) / 60);
    const numSeconds = ((seconds % 86400) % 3600) % 60;
    let dateString = '';

    if (numDays > 0) {
      if (numDays > 1) {
        dateString += numDays + ' days ';
      } else {
        dateString += numDays + ' day ';
      }
    }

    if (numHours > 0) {
      if (numHours > 1) {
        dateString += numHours + ' hours ';
      } else {
        dateString += numHours + ' hour ';
      }
    }

    if (numMinutes > 0) {
      if (numMinutes > 1) {
        dateString += numMinutes + ' minutes ';
      } else {
        dateString += numMinutes + ' minute ';
      }
    }

    if (dateString === '') {
      dateString = 'Unknown';
    }

    return dateString;
  }

  private cancelSubscriptions() {
    if (this.walletBalanceSubscription) {
      this.walletBalanceSubscription.unsubscribe();
    }

    if (this.walletHistorySubscription) {
      this.walletHistorySubscription.unsubscribe();
    }

    if (this.stakingInfoSubscription) {
      this.stakingInfoSubscription.unsubscribe();
    }

    if (this.walletHotBalanceSubscription) {
      this.walletHotBalanceSubscription.unsubscribe();
    }
  }

  private startSubscriptions() {
    this.getStakingInfo();
  }
}
