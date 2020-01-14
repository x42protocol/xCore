import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FullNodeApiService } from '../../../../shared/services/fullnode.api.service';
import { NodeStatus } from '../../../../shared/models/node-status';
import { GlobalService } from '../../../../shared/services/global.service';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit, OnDestroy {

  constructor(private globalService: GlobalService, private FullNodeApiService: FullNodeApiService, private electron: ElectronService) { }

  private nodeStatusSubscription: Subscription;
  public clientName: string;
  public applicationVersion: string;
  public fullNodeVersion: string;
  public network: string;
  public protocolVersion: number;
  public blockHeight: number;
  public dataDirectory: string;
  public isElectron: boolean;

  ngOnInit() {
    this.applicationVersion = this.globalService.getApplicationVersion();
    this.isElectron = this.electron.isElectronApp;
    this.startSubscriptions();
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }

  private startSubscriptions() {
    this.nodeStatusSubscription = this.FullNodeApiService.getNodeStatusInterval()
      .subscribe(
        (data: NodeStatus) =>  {
          let statusResponse = data
          this.clientName = statusResponse.agent;
          this.fullNodeVersion = statusResponse.version;
          this.network = statusResponse.network;
          this.protocolVersion = statusResponse.protocolVersion;
          this.blockHeight = statusResponse.blockStoreHeight;
          this.dataDirectory = statusResponse.dataDirectoryPath;
        }
      );
  }

  private cancelSubscriptions() {
    if(this.nodeStatusSubscription) {
      this.nodeStatusSubscription.unsubscribe();
    }
  }

  openWalletDirectory(directory: string): void {
    if (!this.isElectron) return;
    this.electron.shell.showItemInFolder(directory);
  }
}
