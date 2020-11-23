import { Component, OnInit, OnDestroy } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ApiEvents } from '../../shared/services/api.events';
import { GlobalService } from '../../shared/services/global.service';
import { WorkerType } from '../../shared/models/worker';
import { TransactionInfo } from '../../shared/models/transaction-info';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.css']
})
export class TransactionDetailsComponent implements OnInit, OnDestroy {
  constructor(
    private globalService: GlobalService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private apiEvents: ApiEvents,
  ) { }

  public transaction: TransactionInfo;
  public copied = false;
  public coinUnit: string;
  public confirmations: number;
  public copyType: SelectItem[];

  private lastBlockSyncedHeight: number;
  private generalInfoSubscription: Subscription;

  ngOnInit() {
    this.copyType = [
      { label: 'Copy', value: 'Copy', icon: 'pi pi-copy' }
    ];

    this.transaction = this.config.data.transaction;
    this.startMethods();
    this.coinUnit = this.globalService.getCoinUnit();
  }

  startMethods() {
    this.generalInfoSubscription = this.apiEvents.GeneralInfo.subscribe((result) => {
      if (result !== null) {
        this.updateGeneralWalletInfo(result);
      }
    });
    this.apiEvents.ManualTick(WorkerType.GENERAL_INFO);
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }

  private cancelSubscriptions() {
    if (this.generalInfoSubscription) {
      this.generalInfoSubscription.unsubscribe();
    }
  }

  public onCopiedClick() {
    this.copied = true;
  }

  private updateGeneralWalletInfo(generalWalletInfoResponse) {
    this.lastBlockSyncedHeight = generalWalletInfoResponse.lastBlockSyncedHeight;
    this.getConfirmations(this.transaction);
  }

  private getConfirmations(transaction: TransactionInfo) {
    if (transaction.transactionConfirmedInBlock) {
      this.confirmations = this.lastBlockSyncedHeight - Number(transaction.transactionConfirmedInBlock) + 1;
    } else {
      this.confirmations = 0;
    }
  }

}
