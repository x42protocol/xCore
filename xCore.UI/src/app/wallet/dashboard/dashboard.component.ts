import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { ApiService } from '../../shared/services/api.service';
import { GlobalService } from '../../shared/services/global.service';
import { WorkerService } from '../../shared/services/worker.service';
import { Logger } from '../../shared/services/logger.service';
import { WalletInfo } from '../../shared/models/wallet-info';
import { TransactionInfo } from '../../shared/models/transaction-info';
import { ThemeService } from '../../shared/services/theme.service';
import { SendComponent } from '../send/send.component';
import { ReceiveComponent } from '../receive/receive.component';
import { TransactionDetailsComponent } from '../transaction-details/transaction-details.component';
import { CreateProfileComponent } from '../profile/create/create-profile.component';
import { finalize } from 'rxjs/operators';
import { WorkerType } from '../../shared/models/worker';

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
    private worker: WorkerService,
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

  private isColdWalletHot = false;

  ngOnInit() {
    this.walletName = this.globalService.getWalletName();
    this.coinUnit = this.globalService.getCoinUnit();
    this.getProfileOnConnection();

    this.apps = [
      { name: 'Search For Apps', image: 'https://cdn1.iconfinder.com/data/icons/hawcons/32/698628-icon-112-search-plus-512.png' }
    ];

    this.checkWalletHotColdState();
    this.startMethods();
  }

  startMethods() {
    this.worker.timerStatusChanged.subscribe((status) => {
      if (status.running) {
        if (status.worker === WorkerType.STAKING_INFO) { this.updateStakingInfoDetails(); }
        if (status.worker === WorkerType.ACCOUNT_BALANCE) { this.updateAccountBalanceDetails(); }
        if (status.worker === WorkerType.HOT_BALANCE) { this.updateHotBalanceDetails(); }
        if (status.worker === WorkerType.HISTORY) { this.updateWalletHistory(); }
      }
    });

    this.updateAccountBalanceDetails();
    this.updateHotBalanceDetails();
    this.updateStakingInfoDetails();
    this.updateWalletHistory();
  }

  ngOnDestroy() {
    this.worker.Stop(WorkerType.STAKING_INFO);
    this.worker.Stop(WorkerType.ACCOUNT_BALANCE);
    this.worker.Stop(WorkerType.HOT_BALANCE);
    this.worker.Stop(WorkerType.HISTORY);
  }

  private buildStakingForm(): void {
    this.stakingForm = this.fb.group({
      walletPassword: ['', Validators.required]
    });
  }

  private checkWalletHotColdState() {
    this.apiService
      .getColdHotState(this.globalService.getWalletName())
      .subscribe(
        isHot => {
          this.isColdWalletHot = isHot;
        }
      );
  }

  public goToHistory() {
    this.router.navigate(['/wallet/history']);
  }

  public openSendDialog() {
    this.dialogService.open(SendComponent, {
      header: 'Send',
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

  private updateAccountBalanceDetails() {
    this.worker.Stop(WorkerType.ACCOUNT_BALANCE);
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.apiService.getWalletBalanceOnce(walletInfo)
      .pipe(finalize(() => {
        this.worker.Start(WorkerType.ACCOUNT_BALANCE);
      }))
      .subscribe(
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
          this.worker.Start(WorkerType.HISTORY);
        },
        error => {
          this.apiService.handleException(error);
        }
      );
  }

  private updateHotBalanceDetails() {
    if (this.isColdWalletHot) {
      this.worker.Stop(WorkerType.HOT_BALANCE);
      const walletInfo = new WalletInfo(this.globalService.getWalletName());
      walletInfo.accountName = this.hotStakingAccount;
      this.apiService.getWalletBalanceOnce(walletInfo)
        .pipe(finalize(() => {
          this.worker.Start(WorkerType.HOT_BALANCE);
        }))
        .subscribe(
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
  }

  // TODO: add history in seperate service to make it reusable
  private updateWalletHistory() {
    this.worker.Stop(WorkerType.HISTORY);
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    let historyResponse;
    this.apiService.getWalletHistory(walletInfo, 0, 10)
      .pipe(finalize(() => {
        this.worker.Start(WorkerType.HISTORY, 10);
      }))
      .subscribe(
        response => {
          // TODO - add account feature instead of using first entry in array
          if (!!response.history && response.history[0].transactionsHistory.length > 0) {
            historyResponse = response.history[0].transactionsHistory;
            this.getTransactionInfo(historyResponse);
          } else {
            this.hasTX = false;
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
        },
        error => {
          this.isStarting = false;
          this.stakingEnabled = false;
          this.stakingForm.patchValue({ walletPassword: '' });
        }
      );
  }

  public stopStaking() {
    this.isStopping = true;
    this.isStarting = false;
    this.apiService.stopStaking()
      .subscribe(
        response => {
          this.stakingEnabled = false;
        }
      );
  }

  private updateStakingInfoDetails() {
    this.worker.Stop(WorkerType.STAKING_INFO);
    this.apiService.getStakingInfo()
      .pipe(finalize(() => {
        this.worker.Start(WorkerType.STAKING_INFO);
      }))
      .subscribe(
        response => {
          this.log.info('Get staking info result:', response);
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
        }, error => {
          this.apiService.handleException(error);
        }
      );
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

}
