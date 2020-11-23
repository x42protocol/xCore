import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { GlobalService } from '../../shared/services/global.service';
import { ApiEvents } from '../../shared/services/api.events';
import { NodeStatus } from '../../shared/models/node-status';
import { XServerStatus } from '../../shared/models/xserver-status';
import { Subscription } from 'rxjs';
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
  private nodeStatusSubscription: Subscription;
  private generalStatusSubscription: Subscription;
  private stakingInfoSubscription: Subscription;
  private xServerInfoSubscription: Subscription;

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
    private globalService: GlobalService,
    private apiEvents: ApiEvents,
  ) { }

  ngOnInit() {
    this.setDefaultConnectionToolTip();
    this.setGeneralWalletInfo();
    this.startSubscriptions();
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }

  startSubscriptions() {
    this.stakingInfoSubscription = this.apiEvents.StakingInfo.subscribe((result) => {
      if (result !== null) {
        this.updateStakingInfoDetails(result);
      }
    });
    this.apiEvents.ManualTick(WorkerType.STAKING_INFO);

    this.xServerInfoSubscription = this.apiEvents.XServerInfo.subscribe((result) => {
      if (result !== null) {
        this.getGeneralxServerInfo(result);
      }
    });
    this.apiEvents.ManualTick(WorkerType.XSERVER_INFO);
  }

  startNodeStatus() {
    this.nodeStatusSubscription = this.apiEvents.NodeStatus.subscribe((result) => {
      if (result !== null) {
        this.updateNodeStatus(result);
      }
    });
    this.apiEvents.ManualTick(WorkerType.NODE_STATUS);
  }

  startGeneralInfo() {
    this.generalStatusSubscription = this.apiEvents.GeneralInfo.subscribe((result) => {
      if (result !== null) {
        this.updateGeneralWalletInfo(result);
      }
    });
    this.apiEvents.ManualTick(WorkerType.GENERAL_INFO);
  }

  private cancelSubscriptions() {
    if (this.stakingInfoSubscription) {
      this.stakingInfoSubscription.unsubscribe();
    }

    if (this.xServerInfoSubscription) {
      this.xServerInfoSubscription.unsubscribe();
    }

    if (this.nodeStatusSubscription) {
      this.nodeStatusSubscription.unsubscribe();
    }

    if (this.generalStatusSubscription) {
      this.generalStatusSubscription.unsubscribe();
    }
  }

  private updateConnectionToolTip() {
    this.connectionsTooltip = `Connections:\n${this.connectedNodesTooltip}\n${this.connectedXServerTooltip}`;
  }

  private setDefaultConnectionToolTip() {
    this.connectedXServerTooltip = '0 xServers';
    this.connectedNodesTooltip = '0 nodes';
    this.updateConnectionToolTip();
  }

  private getGeneralxServerInfo(xServerInfoResponse: XServerStatus) {
    this.connectedXServers = xServerInfoResponse.connected;
    this.globalService.setxServerStatus(xServerInfoResponse);
    if (xServerInfoResponse.connected === 1) {
      this.connectedXServerTooltip = '1 xServer';
    } else if (xServerInfoResponse.connected >= 0) {
      this.connectedXServerTooltip = `${xServerInfoResponse.connected} xServers`;
    }
    this.updateConnectionToolTip();
  }

  private setGeneralWalletInfo() {
    if (this.globalService.getWalletName() === '') {
      this.startNodeStatus();
    } else {
      this.startGeneralInfo();
    }
  }

  private updateNodeStatus(nodeSatus: NodeStatus) {
    this.connectedNodes = nodeSatus.inboundPeers.length + nodeSatus.outboundPeers.length;
    this.lastBlockSyncedHeight = nodeSatus.blockStoreHeight;
    this.chainTip = nodeSatus.bestPeerHeight;

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

  private updateGeneralWalletInfo(generalWalletInfoResponse: any) {
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

  private updateStakingInfoDetails(stakingResponse) {
    this.stakingEnabled = stakingResponse.enabled;
  }
}
