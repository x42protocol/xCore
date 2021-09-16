import { Component, OnInit, OnDestroy } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { Router } from '@angular/router';
import { GlobalService } from '../../shared/services/global.service';
import { ThemeService } from '../../shared/services/theme.service';
import { ApiEvents } from '../../shared/services/api.events';
import { WorkerType } from '../../shared/models/worker';
import { TransactionInfo } from '../../shared/models/transaction-info';
import { TransactionDetailsComponent } from '../transaction-details/transaction-details.component';
import { Subscription } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { WalletInfo } from '../../shared/models/wallet-info';
import { LazyLoadEvent } from 'primeng/api';
import { setInterval } from 'timers';

@Component({
  selector: 'app-history-component',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
})
export class HistoryComponent implements OnInit, OnDestroy {
  transactionType: string;

  constructor(
    private globalService: GlobalService,
    private router: Router,
    public dialogService: DialogService,
    public themeService: ThemeService,
    private apiEvents: ApiEvents,
    private apiService: ApiService
  ) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
  }

  private historySubscription: Subscription;

  public transactions: TransactionInfo[];
  public coinUnit: string;
  public pageNumber = 1;
  public hasTransaction = true;
  public isDarkTheme = false;
  public totalRecords: number;
  public loading: boolean;
  public pageSize = 10;
  public skip = 0;
  public take = 10;

  public transactionTypes = [{ label: 'All Transactions', value: null },
  { label: 'Sent', value: 'Send' },
  { label: 'Received', value: 'Received' },
  { label: 'Staked', value: 'Staked' }];

  ngOnInit() {
    this.loading = true;
    this.getWalletHistory();
    this.coinUnit = this.globalService.getCoinUnit();

    setInterval(() => {

      this.getWalletHistory();

    }, 15000);
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }

  public transactionTypeChanged(transactionType: string) {
    this.transactionType = transactionType;
    this.skip = 0;
    this.getWalletHistory();

  }

  public loadTransactions(event: LazyLoadEvent) {
    this.skip = event.first;
    this.take = event.rows;
    this.getWalletHistory();

    }

  public getWalletHistory() {
    this.loading = true;

    this.apiService.getX42WalletHistory(new WalletInfo(this.globalService.getWalletName()), this.transactionType, this.skip, this.take).subscribe((result) => {

      if (result !== null) {
        this.updateWalletHistory(result);
      }

      this.loading = false;

    });
  }

  private cancelSubscriptions() {
    if (this.historySubscription) {
      this.historySubscription.unsubscribe();
    }
  }

  onDashboardClicked() {
    this.router.navigate(['/wallet']);
  }

  public openTransactionDetailDialog(transaction: any) {
    const modalData = { transaction };

    this.dialogService.open(TransactionDetailsComponent, {
      header: 'Receive',
      data: modalData
    });
  }

  private updateWalletHistory(response) {
    let historyResponse;
    // TODO - add account feature instead of using first entry in array
    if (!!response.data && response.data.length > 0) {
      this.totalRecords = response.totalCount;
      historyResponse = response.data;
      this.getTransactionInfo(historyResponse);
    } else {
      this.hasTransaction = false;
    }
  }

  private getTransactionInfo(transactions: any) {
    this.transactions = [];

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

      this.transactions.push(new TransactionInfo(transactionType, transactionId, transactionAmount, transactionFee, transactionConfirmedInBlock, transactionTimestamp));
    }
    if (this.transactions === undefined || this.transactions.length === 0) {
      this.hasTransaction = false;
    }

    this.loading = false;
  }

}
