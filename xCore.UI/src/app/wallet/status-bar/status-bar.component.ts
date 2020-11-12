import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { GlobalService } from '../../shared/services/global.service';
import { NodeStatus } from '../../shared/models/node-status';
import { XServerStatus } from '../../shared/models/xserver-status';
import { WalletInfo } from '../../shared/models/wallet-info';
import { finalize } from 'rxjs/operators';
import { TaskTimer } from 'tasktimer';

@Component({
  selector: 'app-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.css']
})
export class StatusBarComponent implements OnInit, OnDestroy {
  private stakingInfoWorker = new TaskTimer(5000);
  private generalWalletInfoSubscription: Subscription;
  private nodeStatusSubscription: Subscription;
  private xServerStatusSubscription: Subscription;
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
  ) { }

  ngOnInit() {
    this.setDefaultConnectionToolTip();
    this.startSubscriptions();
    this.stakingInfoWorker.add(() => this.updateStakingInfoDetails()).start();
  }

  ngOnDestroy() {
    this.stakingInfoWorker.stop();
    this.cancelSubscriptions();
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
    this.xServerStatusSubscription = this.apiService.getxServerStatusInterval()
      .subscribe(
        (data: XServerStatus) => {
          if (data != null) {
            const statusResponse = data;
            this.connectedXServers = statusResponse.connected;
            this.globalService.setxServerStatus(statusResponse);

            if (statusResponse.connected === 1) {
              this.connectedXServerTooltip = '1 xServer';
            } else if (statusResponse.connected >= 0) {
              this.connectedXServerTooltip = `${statusResponse.connected} xServers`;
            }
            this.updateConnectionToolTip();
          }
        },
        error => {
          this.cancelSubscriptions();
          this.startSubscriptions();
        }
      );
  }

  private getGeneralWalletInfo() {
    if (this.globalService.getWalletName() === '') {
      this.nodeStatusSubscription = this.apiService.getNodeStatusInterval()
        .subscribe(
          (data: NodeStatus) => {
            if (data != null) {
              const statusResponse = data;
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
            }
          },
          error => {
            this.cancelSubscriptions();
            this.startSubscriptions();
          }
        );
    } else {
      const walletInfo = new WalletInfo(this.globalService.getWalletName());
      this.generalWalletInfoSubscription = this.apiService.getGeneralInfo(walletInfo)
        .subscribe(
          response => {
            if (response != null) {
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
            }
          },
          error => {
            if (error.status === 0) {
              this.cancelSubscriptions();
            } else if (error.status >= 400) {
              if (!error.error.errors[0].message) {
                this.cancelSubscriptions();
                this.startSubscriptions();
              }
            }
          }
        );
    }
  }

  private updateStakingInfoDetails() {
    this.stakingInfoWorker.pause();
    this.apiService.getStakingInfo()
      .pipe(finalize(() => {
        this.stakingInfoWorker.resume();
      }),
      ).subscribe(
        stakingResponse => {
          this.stakingEnabled = stakingResponse.enabled;
        }, error => {
          this.apiService.handleException(error);
        }
      );
  }

  private cancelSubscriptions() {
    if (this.generalWalletInfoSubscription) {
      this.generalWalletInfoSubscription.unsubscribe();
    }

    if (this.nodeStatusSubscription) {
      this.nodeStatusSubscription.unsubscribe();
    }

    if (this.xServerStatusSubscription) {
      this.xServerStatusSubscription.unsubscribe();
    }
  }

  private startSubscriptions() {
    this.getGeneralWalletInfo();
    this.getGeneralxServerInfo();
  }
}
