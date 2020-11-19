import { Component, OnInit, OnDestroy } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ApiService } from '../../shared/services/api.service';
import { GlobalService } from '../../shared/services/global.service';
import { WorkerService } from '../../shared/services/worker.service';
import { WorkerType } from '../../shared/models/worker';
import { WalletInfo } from '../../shared/models/wallet-info';
import { TransactionInfo } from '../../shared/models/transaction-info';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.css']
})
export class TransactionDetailsComponent implements OnInit, OnDestroy {
  constructor(
    private apiService: ApiService,
    private globalService: GlobalService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private worker: WorkerService,
  ) { }

  public transaction: TransactionInfo;
  public copied = false;
  public coinUnit: string;
  public confirmations: number;
  public copyType: SelectItem[];

  private lastBlockSyncedHeight: number;

  ngOnInit() {
    this.copyType = [
      { label: 'Copy', value: 'Copy', icon: 'pi pi-copy' }
    ];

    this.transaction = this.config.data.transaction;
    this.startMethods();
    this.coinUnit = this.globalService.getCoinUnit();
  }

  startMethods() {
    this.worker.timerStatusChanged.subscribe((status) => {
      if (status.running) {
        if (status.worker === WorkerType.GENERAL_INFO) { this.updateGeneralWalletInfo(); }
      }
    });
    this.worker.Start(WorkerType.GENERAL_INFO);
  }

  ngOnDestroy() {
    this.worker.Stop(WorkerType.GENERAL_INFO);
  }

  public onCopiedClick() {
    this.copied = true;
  }

  private updateGeneralWalletInfo() {
    this.worker.Stop(WorkerType.GENERAL_INFO);
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.apiService.getGeneralInfo(walletInfo)
      .pipe(finalize(() => {
        this.worker.Start(WorkerType.GENERAL_INFO);
      }))
      .subscribe(
        response => {
          const generalWalletInfoResponse = response;
          this.lastBlockSyncedHeight = generalWalletInfoResponse.lastBlockSyncedHeight;
          this.getConfirmations(this.transaction);
        },
        error => {
          this.apiService.handleException(error);
        }
      );
  }

  private getConfirmations(transaction: TransactionInfo) {
    if (transaction.transactionConfirmedInBlock) {
      this.confirmations = this.lastBlockSyncedHeight - Number(transaction.transactionConfirmedInBlock) + 1;
    } else {
      this.confirmations = 0;
    }
  }

}
