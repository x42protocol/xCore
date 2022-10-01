import { Component, OnDestroy, OnInit } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { Subscription } from 'rxjs';
import { WorkerType } from '../../shared/models/worker';
import { XServerPeer, XServerStatus } from '../../shared/models/xserver-status';
import { ApiEvents } from '../../shared/services/api.events';
import { XServerDetailsComponent } from './x-server-details/x-server-details.component';

@Component({
  selector: 'app-xserver-network',
  templateUrl: './xserver-network.component.html',
  styleUrls: ['./xserver-network.component.css']
})
export class XserverNetworkComponent implements OnInit, OnDestroy {
  private xServerInfoSubscription: Subscription;

  peers: XServerPeer[] = [];
  constructor(private apiEvents: ApiEvents, public dialogService: DialogService,
) { }

  cols = [
    { field: 'name', header: 'name' },
    { field: 'tier', header: 'tier' },
    { field: 'networkProtocol', header: 'networkProtocol' },
    { field: 'networkAddress', header: 'networkAddress' },
    { field: 'networkPort', header: 'networkPort' },
    { field: 'version', header: 'version' },
    { field: 'responseTime', header: 'responseTime' },
  ];

  ngOnInit(): void {
    this.startSubscriptions();
  }

  public openDetailDialog(details: any) {
    const modalData = { details };

    this.dialogService.open(XServerDetailsComponent, {
      header: 'xServer Details',
      data: modalData,
      width: '750px'
    });
  }


  ngOnDestroy() {
    this.cancelSubscriptions();
  }
  startSubscriptions() {

    this.xServerInfoSubscription = this.apiEvents.XServerInfo.subscribe((result: XServerStatus) => {
      if (result !== null) {
        this.peers = result.nodes.sort(l => l.responseTime);
      }
    });
    this.apiEvents.ManualTick(WorkerType.XSERVER_INFO);
  }


  private cancelSubscriptions() {
    if (this.xServerInfoSubscription) {
      this.xServerInfoSubscription.unsubscribe();
    }
  }
}
