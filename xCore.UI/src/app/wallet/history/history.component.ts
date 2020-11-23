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

@Component({
  selector: 'app-history-component',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
})
export class HistoryComponent implements OnInit, OnDestroy {
  constructor(
    private globalService: GlobalService,
    private router: Router,
    public dialogService: DialogService,
    public themeService: ThemeService,
    private apiEvents: ApiEvents,
  ) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
  }

  private historySubscription: Subscription;

  public transactions: TransactionInfo[];
  public coinUnit: string;
  public pageNumber = 1;
  public hasTransaction = true;
  public isDarkTheme = false;

  ngOnInit() {
    this.historySubscription = this.apiEvents.History.subscribe((result) => {
      if (result !== null) {
        this.updateWalletHistory(result);
      }
    });
    this.apiEvents.ManualTick(WorkerType.HISTORY);
    this.coinUnit = this.globalService.getCoinUnit();
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
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
    if (!!response.history && response.history[0].transactionsHistory.length > 0) {
      historyResponse = response.history[0].transactionsHistory;
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
  }

}
