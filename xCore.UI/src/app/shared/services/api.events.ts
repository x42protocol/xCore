import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscriber } from 'rxjs';
import { SimpleTimer } from 'ng2-simple-timer';
import { WorkerType } from '../models/worker';
import { ApiService } from '../../shared/services/api.service';
import { GlobalService } from '../../shared/services/global.service';
import { WalletInfo } from '../../shared/models/wallet-info';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiEvents {
  private nodeStatusSubject = new BehaviorSubject(null);
  public NodeStatus = this.nodeStatusSubject.asObservable();
  private generalStatusSubject = new BehaviorSubject(null);
  public GeneralInfo = this.generalStatusSubject.asObservable();
  private stakingStatusSubject = new BehaviorSubject(null);
  public StakingInfo = this.stakingStatusSubject.asObservable();
  private xServerStatusSubject = new BehaviorSubject(null);
  public XServerInfo = this.xServerStatusSubject.asObservable();
  private accountBalanceSubject = new BehaviorSubject(null);
  public AccountBalance = this.accountBalanceSubject.asObservable();
  private accountMaxBalanceSubject = new BehaviorSubject(null);
  public AccountMaxBalance = this.accountMaxBalanceSubject.asObservable();
  private hotBalanceSubject = new BehaviorSubject(null);
  public HotBalance = this.hotBalanceSubject.asObservable();
  private coldBalanceSubject = new BehaviorSubject(null);
  public ColdBalance = this.coldBalanceSubject.asObservable();
  private historySubject = new BehaviorSubject(null);
  public History = this.historySubject.asObservable();
  private hotHistorySubject = new BehaviorSubject(null);
  public HotHistory = this.hotHistorySubject.asObservable();
  private coldHistorySubject = new BehaviorSubject(null);
  public ColdHistory = this.coldHistorySubject.asObservable();
  private addressBookSubject = new BehaviorSubject(null);
  public AddressBook = this.addressBookSubject.asObservable();

  private coldStakingAccount = 'coldStakingColdAddresses';
  private hotStakingAccount = 'coldStakingHotAddresses';
  private transactionId: string;

  private txConfirmationSubject = new BehaviorSubject(null);
  public TransactionConfirmation(transactionId): Observable<any> {
    this.transactionId = transactionId;
    return this.txConfirmationSubject.asObservable();
  }

  constructor(
    private simpleTimer: SimpleTimer,
    private apiService: ApiService,
    private globalService: GlobalService,
  ) {
    this.Start(WorkerType.NODE_STATUS);
    this.Start(WorkerType.GENERAL_INFO);
    this.Start(WorkerType.STAKING_INFO);
    this.Start(WorkerType.XSERVER_INFO);
    this.Start(WorkerType.ACCOUNT_BALANCE);
    this.Start(WorkerType.ACCOUNT_MAX_BALANCE);
    this.Start(WorkerType.HOT_BALANCE);
    this.Start(WorkerType.COLD_BALANCE);
    this.Start(WorkerType.HISTORY);
    this.Start(WorkerType.HOT_HISTORY);
    this.Start(WorkerType.COLD_HISTORY);
    this.Start(WorkerType.TX_CONFIRMATION);
    this.Start(WorkerType.ADDRESS_BOOK);
  }

  public ManualTick(name: WorkerType): void {
    this.tick(name);
  }

  private Stop(name: WorkerType): void {
    this.simpleTimer.unsubscribe(name.toString());
  }

  private Start(name: WorkerType, seconds: number = 0): void {
    let tickSeconds = seconds;
    if (tickSeconds === undefined || tickSeconds === 0) {
      tickSeconds = 5;
    }

    const workers: string[] = this.simpleTimer.getTimer();
    const thisWorkerName = workers.find(i => i === name.toString());
    if (thisWorkerName === undefined) {
      this.simpleTimer.newTimer(name.toString(), tickSeconds, true);
    }

    const subscriptions: string[] = this.simpleTimer.getSubscription();
    const thisSubscription = subscriptions.find(i => i.startsWith(thisWorkerName + '-'));
    if (thisSubscription === undefined) {
      this.simpleTimer.subscribe(name.toString(), () => this.tick(name));
    }
  }

  private tick(name: WorkerType): void {
    switch (name) {
      case WorkerType.NODE_STATUS: {
        this.sendNodeStatus();
        break;
      }
      case WorkerType.GENERAL_INFO: {
        this.sendWalletStatus();
        break;
      }
      case WorkerType.STAKING_INFO: {
        this.sendStakingStatus();
        break;
      }
      case WorkerType.XSERVER_INFO: {
        this.xServerStatus();
        break;
      }
      case WorkerType.ACCOUNT_BALANCE: {
        this.accountBalance();
        break;
      }
      case WorkerType.ACCOUNT_MAX_BALANCE: {
        this.accountMaxBalance();
        break;
      }
      case WorkerType.HOT_BALANCE: {
        this.hotBalance();
        break;
      }
      case WorkerType.COLD_BALANCE: {
        this.coldBalance();
        break;
      }
      case WorkerType.HISTORY: {
        this.history();
        break;
      }
      case WorkerType.HOT_HISTORY: {
        this.hotHistory();
        break;
      }
      case WorkerType.COLD_HISTORY: {
        this.coldHistory();
        break;
      }
      case WorkerType.TX_CONFIRMATION: {
        this.transactionConfirmations();
        break;
      }
      case WorkerType.ADDRESS_BOOK: {
        this.addressBook();
        break;
      }
      default: {
        console.log('Worker Type Not Set: ' + name);
        break;
      }
    }
  }

  private sendNodeStatus() {
    if (this.nodeStatusSubject.observers.length > 0) {
      this.Stop(WorkerType.NODE_STATUS);
      this.apiService.getNodeStatus()
        .pipe(finalize(() => {
          this.Start(WorkerType.NODE_STATUS);
        }))
        .subscribe(
          response => {
            this.nodeStatusSubject.next(response);
          },
          error => {
            this.nodeStatusSubject.error(error);
            this.apiService.handleException(error);
          }
        );
    }
  }

  private sendWalletStatus() {
    if (this.generalStatusSubject.observers.length > 0) {
      this.Stop(WorkerType.GENERAL_INFO);
      const walletInfo = new WalletInfo(this.globalService.getWalletName());
      this.apiService.getGeneralInfo(walletInfo)
        .pipe(finalize(() => {
          this.Start(WorkerType.GENERAL_INFO);
        }))
        .subscribe(
          response => {
            this.generalStatusSubject.next(response);
          },
          error => {
            this.generalStatusSubject.error(error);
            this.apiService.handleException(error);
          }
        );
    }
  }

  private sendStakingStatus() {
    if (this.stakingStatusSubject.observers.length > 0) {
      this.Stop(WorkerType.STAKING_INFO);
      this.apiService.getStakingInfo()
        .pipe(finalize(() => {
          this.Start(WorkerType.STAKING_INFO);
        })
        ).subscribe(
          response => {
            this.stakingStatusSubject.next(response);
          }, error => {
            this.stakingStatusSubject.error(error);
            this.apiService.handleException(error);
          }
        );
    }
  }

  private xServerStatus() {
    if (this.xServerStatusSubject.observers.length > 0) {
      this.Stop(WorkerType.XSERVER_INFO);
      this.apiService.getxServerInfo()
        .pipe(finalize(() => {
          this.Start(WorkerType.XSERVER_INFO);
        })
        ).subscribe(
          response => {
            this.xServerStatusSubject.next(response);
          }, error => {
            this.xServerStatusSubject.error(error);
            this.apiService.handleException(error);
          }
        );
    }
  }

  private accountBalance() {
    if (this.accountBalanceSubject.observers.length > 0) {
      this.Stop(WorkerType.ACCOUNT_BALANCE);
      const walletInfo = new WalletInfo(this.globalService.getWalletName());
      this.apiService.getWalletBalance(walletInfo)
        .pipe(finalize(() => {
          this.Start(WorkerType.ACCOUNT_BALANCE);
        })
        ).subscribe(
          response => {
            this.accountBalanceSubject.next(response);
          }, error => {
            this.accountBalanceSubject.error(error);
            this.apiService.handleException(error);
          }
        );
    }
  }

  private accountMaxBalance() {
    if (this.accountMaxBalanceSubject.observers.length > 0) {
      this.Stop(WorkerType.ACCOUNT_MAX_BALANCE);
      const maxBalanceRequest = {
        walletName: this.globalService.getWalletName(),
        feeType: 'medium'
      };
      this.apiService.getMaximumBalance(maxBalanceRequest)
        .pipe(finalize(() => {
          this.Start(WorkerType.ACCOUNT_MAX_BALANCE);
        })
        ).subscribe(
          response => {
            this.accountMaxBalanceSubject.next(response);
          }, error => {
            this.accountMaxBalanceSubject.error(error);
            this.apiService.handleException(error);
          }
        );
    }
  }

  private hotBalance() {
    if (this.hotBalanceSubject.observers.length > 0) {
      this.Stop(WorkerType.HOT_BALANCE);
      const walletInfo = new WalletInfo(this.globalService.getWalletName());
      walletInfo.accountName = this.hotStakingAccount;
      this.apiService.getWalletBalance(walletInfo)
        .pipe(finalize(() => {
          this.Start(WorkerType.HOT_BALANCE);
        })
        ).subscribe(
          response => {
            this.hotBalanceSubject.next(response);
          }, error => {
            this.hotBalanceSubject.error(error);
            this.apiService.handleException(error);
          }
        );
    }
  }

  private coldBalance() {
    if (this.coldBalanceSubject.observers.length > 0) {
      this.Stop(WorkerType.COLD_BALANCE);
      const walletInfo = new WalletInfo(this.globalService.getWalletName());
      walletInfo.accountName = this.coldStakingAccount;
      this.apiService.getWalletBalance(walletInfo)
        .pipe(finalize(() => {
          this.Start(WorkerType.COLD_BALANCE);
        })
        ).subscribe(
          response => {
            this.coldBalanceSubject.next(response);
          }, error => {
            this.coldBalanceSubject.error(error);
            this.apiService.handleException(error);
          }
        );
    }
  }

  private history() {
    if (this.historySubject.observers.length > 0) {
      this.Stop(WorkerType.HISTORY);
      const walletInfo = new WalletInfo(this.globalService.getWalletName());
      this.apiService.getWalletHistory(walletInfo, 0, 100)
        .pipe(finalize(() => {
          this.Start(WorkerType.HISTORY);
        })
        ).subscribe(
          response => {
            this.historySubject.next(response);
          }, error => {
            this.historySubject.error(error);
            this.apiService.handleException(error);
          }
        );
    }
  }

  private hotHistory() {
    if (this.hotHistorySubject.observers.length > 0) {
      this.Stop(WorkerType.HOT_HISTORY);
      const walletInfo = new WalletInfo(this.globalService.getWalletName());
      walletInfo.accountName = this.hotStakingAccount;
      this.apiService.getWalletHistory(walletInfo, 0, 100)
        .pipe(finalize(() => {
          this.Start(WorkerType.HOT_HISTORY);
        })
        ).subscribe(
          response => {
            this.hotHistorySubject.next(response);
          }, error => {
            this.hotHistorySubject.error(error);
            this.apiService.handleException(error);
          }
        );
    }
  }

  private coldHistory() {
    if (this.coldHistorySubject.observers.length > 0) {
      this.Stop(WorkerType.COLD_HISTORY);
      const walletInfo = new WalletInfo(this.globalService.getWalletName());
      walletInfo.accountName = this.coldStakingAccount;
      this.apiService.getWalletHistory(walletInfo, 0, 100)
        .pipe(finalize(() => {
          this.Start(WorkerType.COLD_HISTORY);
        })
        ).subscribe(
          response => {
            this.coldHistorySubject.next(response);
          }, error => {
            this.coldHistorySubject.error(error);
            this.apiService.handleException(error);
          }
        );
    }
  }

  private transactionConfirmations() {
    if (this.txConfirmationSubject.observers.length > 0) {
      this.Stop(WorkerType.TX_CONFIRMATION);
      this.apiService.getTxOut(this.transactionId, false)
        .pipe(finalize(() => {
          this.Start(WorkerType.TX_CONFIRMATION);
        }))
        .subscribe(
          response => {
            this.txConfirmationSubject.next(response);
          }, error => {
            this.txConfirmationSubject.error(error);
            this.apiService.handleException(error);
          }
        );
    } else {
      this.transactionId = '';
    }
  }

  private addressBook() {
    if (this.addressBookSubject.observers.length > 0) {
      this.Stop(WorkerType.ADDRESS_BOOK);
      this.apiService.getAddressBookAddresses()
        .pipe(finalize(() => {
          this.Start(WorkerType.ADDRESS_BOOK);
        }))
        .subscribe(
          response => {
            this.addressBookSubject.next(response);
          }, error => {
            this.addressBookSubject.error(error);
            this.apiService.handleException(error);
          }
        );
    }
  }

}
