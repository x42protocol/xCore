import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { GlobalService } from '../../shared/services/global.service';
import { WorkerService } from '../../shared/services/worker.service';
import { NodeStatus } from '../../shared/models/node-status';
import { XServerStatus } from '../../shared/models/xserver-status';
import { WalletInfo } from '../../shared/models/wallet-info';
import { finalize } from 'rxjs/operators';
import { WorkerType } from '../../shared/models/worker';

@Component({
  selector: 'app-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.css']
})
export class StatusBarComponent implements OnInit, OnDestroy {
  private connectedNodesTooltip = '';
  private connectedXServerTooltip = '';
  private isChainSynced: boolean;
  private percentSyncedNumber = 0;

  public lastBlockSyncedHeight: number;
  public chainTip: number;
  public connectedNodes = 0;
  public connectedXServers = 0;
  public percentSynced: string;
  public stakingEnabled: boolean;
  public connectionsTooltip = '';
  public connectedTooltip = '';
  public toolTip = '';

  @Input() public isUnLocked = false;

  constructor(
    private apiService: ApiService,
    private globalService: GlobalService,
    private worker: WorkerService,
  ) { }

  ngOnInit() {
    this.startMethods();
    this.setDefaultConnectionToolTip();
    this.setGeneralWalletInfo();
  }

  startMethods() {
    this.worker.timerStatusChanged.subscribe((status) => {
      if (status.running) {
        if (status.worker === WorkerType.STAKING_INFO) { this.updateStakingInfoDetails(); }
        if (status.worker === WorkerType.XSERVER_INFO) { this.getGeneralxServerInfo(); }
        if (status.worker === WorkerType.NODE_STATUS) { this.updateNodeStatus(); }
        if (status.worker === WorkerType.GENERAL_INFO) { this.updateGeneralWalletInfo(); }
      }
    });

    this.worker.Start(WorkerType.STAKING_INFO);
    this.worker.Start(WorkerType.XSERVER_INFO);
  }

  ngOnDestroy() {
    this.worker.Stop(WorkerType.STAKING_INFO);
    this.worker.Stop(WorkerType.XSERVER_INFO);
    this.worker.Stop(WorkerType.NODE_STATUS);
    this.worker.Stop(WorkerType.GENERAL_INFO);
  }

  private updateConnectionToolTip() {
    this.connectionsTooltip = `Connections:\n${this.connectedNodesTooltip}\n${this.connectedXServerTooltip}`;
  }

  private setDefaultConnectionToolTip() {
    this.connectedXServerTooltip = '0 xServers';
    this.connectedNodesTooltip = '0 nodes';
    this.updateConnectionToolTip();
  }

  private getGeneralxServerInfo() {
    this.worker.Stop(WorkerType.XSERVER_INFO);
    this.apiService.getxServerStatus()
      .pipe(finalize(() => {
        this.worker.Start(WorkerType.XSERVER_INFO);
      }))
      .subscribe(
        (xServerInfoResponse: XServerStatus) => {
          this.connectedXServers = xServerInfoResponse.connected;
          this.globalService.setxServerStatus(xServerInfoResponse);

          if (xServerInfoResponse.connected === 1) {
            this.connectedXServerTooltip = '1 xServer';
          } else if (xServerInfoResponse.connected >= 0) {
            this.connectedXServerTooltip = `${xServerInfoResponse.connected} xServers`;
          }
          this.updateConnectionToolTip();
        }, error => {
          this.apiService.handleException(error);
        }
      );
  }

  private setGeneralWalletInfo() {
    if (this.globalService.getWalletName() === '') {
      this.updateNodeStatus();
    } else {
      this.updateGeneralWalletInfo();
    }
  }

  private updateNodeStatus() {
    this.worker.Stop(WorkerType.NODE_STATUS);
    this.apiService.getNodeStatus()
      .pipe(finalize(() => {
        this.worker.Start(WorkerType.NODE_STATUS);
      }))
      .subscribe(
        (statusResponse: NodeStatus) => {
          this.connectedNodes = statusResponse.inboundPeers.length + statusResponse.outboundPeers.length;
          this.lastBlockSyncedHeight = statusResponse.blockStoreHeight;
          this.chainTip = statusResponse.bestPeerHeight;

          let processedText = `Processed ${this.lastBlockSyncedHeight} out of ${this.chainTip} blocks.`;
          if (this.chainTip == null) {
            processedText = `Waiting for peer connections to start.`;
          }

          this.toolTip = `Synchronizing.  ${processedText}`;

          if (this.connectedNodes === 1) {
            this.connectedNodesTooltip = '1 node';
          } else if (this.connectedNodes >= 0) {
            this.connectedNodesTooltip = `${this.connectedNodes} nodes`;
          }
          this.updateConnectionToolTip();

          if (this.chainTip == null || this.lastBlockSyncedHeight > this.chainTip) {
            this.percentSynced = 'syncing...';
          } else {
            this.percentSyncedNumber = ((this.lastBlockSyncedHeight / this.chainTip) * 100);
            if (this.percentSyncedNumber.toFixed(0) === '100' && this.lastBlockSyncedHeight !== this.chainTip) {
              this.percentSyncedNumber = 99;
            }

            this.percentSynced = this.percentSyncedNumber.toFixed(0) + '%';

            if (this.percentSynced === '100%') {
              this.toolTip = `Up to date.  ${processedText}`;
            }
          }
        },
        error => {
          this.apiService.handleException(error);
        }
      );
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
          this.chainTip = generalWalletInfoResponse.chainTip;
          this.isChainSynced = generalWalletInfoResponse.isChainSynced;
          this.connectedNodes = generalWalletInfoResponse.connectedNodes;
          this.globalService.setBlockHeight(this.chainTip);

          const processedText = `Processed ${this.lastBlockSyncedHeight} out of ${this.chainTip} blocks.`;
          this.toolTip = `Synchronizing.  ${processedText}`;

          if (this.connectedNodes === 1) {
            this.connectedNodesTooltip = '1 node';
          } else if (this.connectedNodes >= 0) {
            this.connectedNodesTooltip = `${this.connectedNodes} nodes`;
          }
          this.updateConnectionToolTip();

          if (this.chainTip == null || this.lastBlockSyncedHeight > this.chainTip) {
            this.percentSynced = 'syncing...';
          }
          else {
            this.percentSyncedNumber = ((this.lastBlockSyncedHeight / this.chainTip) * 100);
            if (this.percentSyncedNumber.toFixed(0) === '100' && this.lastBlockSyncedHeight !== this.chainTip && !this.isChainSynced) {
              this.percentSyncedNumber = 99;
            }

            this.percentSynced = this.percentSyncedNumber.toFixed(0) + '%';

            if (this.percentSynced === '100%') {
              this.toolTip = `Up to date.  ${processedText}`;
            }
          }
        },
        error => {
          this.apiService.handleException(error);
        }
      );
  }

  private updateStakingInfoDetails() {
    this.worker.Stop(WorkerType.STAKING_INFO);
    this.apiService.getStakingInfo()
      .pipe(finalize(() => {
        this.worker.Start(WorkerType.STAKING_INFO);
      })
      ).subscribe(
        stakingResponse => {
          this.stakingEnabled = stakingResponse.enabled;
        }, error => {
          this.apiService.handleException(error);
        }
      );
  }
}
