import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ApiService } from '../../../../shared/services/api.service';
import { GlobalService } from '../../../../shared/services/global.service';
import * as signalR from '@aspnet/signalr';
import { TestSshConnection } from '../../../../shared/models/test-ssh-credential-model';
import { Subscription } from 'rxjs';
import { XServerPeer, XServerStatus } from '../../../../shared/models/xserver-status';
import { ApiEvents } from '../../../../shared/services/api.events';
import { WorkerType } from '../../../../shared/models/worker';
import { XserverProvisioningRequest } from '../../../../shared/models/xserver-provisioning-request';
import { XserverUpdateRequest } from '../../../../shared/models/xserver-update-request';

@Component({
  selector: 'app-x-server-updater',
  templateUrl: './x-server-updater.component.html',
  styleUrls: ['./x-server-updater.component.css']
})
export class XServerUpdaterComponent implements OnInit, OnDestroy {
  updating: boolean;
  updated: boolean;
  testingCredentials: boolean;
  serverIP: string;
  sshUser: string;
  sshPassword: string;
  connected: boolean;
  errorMessage: string;
  updateAvailable: boolean;
  xServerInfoSubscription: Subscription;
  peers: XServerPeer[];
  currentxServerVersion: string;
  latestxServerVersion: any;
  email: string;
  certificatePassword: string;
  confirmSshPassword: string;

  constructor(private apiService: ApiService, private globalService: GlobalService, private apiEvents: ApiEvents) { }

  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  profile = '';
  connection: signalR.HubConnection;
  multiLineText = '';


  ngOnInit(): void {

    this.signalRConnect();
    const profileData = this.globalService.getProfile();
    this.profile = profileData.name;
    this.startSubscriptions();

  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }
  startSubscriptions() {

    this.xServerInfoSubscription = this.apiEvents.XServerInfo.subscribe((result: XServerStatus) => {
      if (result !== null) {
        this.peers = result.nodes.sort(l => l.responseTime);
        const myXserver = this.peers.find(l => l.name === this.profile);

        if (myXserver) {
          this.currentxServerVersion = myXserver.version;
        }
      }
    });
    this.apiEvents.ManualTick(WorkerType.XSERVER_INFO);
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {
    }
  }

  signalRConnect() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:42220/ws')
      .build();

    this.connection.on('BlockConnected', (block) => {
      console.log('BlockConnected:' + block);
    });

    this.connection.on('xServerProvisioning', (trx) => {
      this.multiLineText += (trx + '\n');
      if (trx === 'xServer installation Complete!') {
        this.updating = false;
        this.updated = true;

      }
      setTimeout(() => {
        this.scrollToBottom();
      }, 50);
    });

    const self = this;
    // Transport fallback functionality is now built into start.
    this.connection.start()
      .then(() => {
        console.log('connection started');
        self.connection.send('Subscribe', { events: ['TransactionReceived', 'BlockConnected'] });
      })
      .catch(error => {
        console.error(error.message);
      });
  }


  onTestCredentialsClick() {
    this.testingCredentials = true;
    this.apiService.testSshConnection(new TestSshConnection(this.serverIP, this.sshUser, this.sshPassword))
      .subscribe(
        response => {
          this.connected = true;
          this.testingCredentials = false;
          this.updating = true;
          this.UpdatexServer();
        },
        error => {
          this.errorMessage = 'Could not connect with the specified Credentials';
          this.testingCredentials = false;
        }
      );
  }

  UpdatexServer() {

    this.updating = true;
    this.apiService.updateXserver(new XserverUpdateRequest(this.serverIP, this.sshUser, this.sshPassword, this.profile))
      .subscribe(
        response => {
        },
        error => {
          this.errorMessage = 'Could not connect with the specified Credentials';
        }
      );
  }


  private cancelSubscriptions() {
    if (this.xServerInfoSubscription) {
      this.xServerInfoSubscription.unsubscribe();
    }
  }

}

