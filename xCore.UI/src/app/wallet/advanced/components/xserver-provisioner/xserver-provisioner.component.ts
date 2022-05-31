import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as signalR from '@aspnet/signalr';
import { TestSshConnection } from '@models/test-ssh-credential-model';
import { ElectronService } from 'ngx-electron';
import { ApiService } from 'src/app/shared/services/api.service';
import { XserverProvisioningRequest } from '../../../../shared/models/xserver-provisioning-request';
import { GlobalService } from '../../../../shared/services/global.service';

@Component({
  selector: 'app-xserver-provisioner',
  templateUrl: './xserver-provisioner.component.html',
  styleUrls: ['./xserver-provisioner.component.css']
})
export class XserverProvisionerComponent implements OnInit {

  constructor(private apiService: ApiService, private globalService: GlobalService, private electronService: ElectronService

    ) { }
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;

  connected = false;
  provisioning = false;
  provisioned = false;
  serverIP = '';
  sshUser = '';
  sshPassword = '';
  confirmSshPassword = '';
  email = '';
  certificatePassword = '';
  confirmCertificatePassword = '';
  databasePassword = '';
  confirmDatabasePassword = '';
  connection: signalR.HubConnection;
  multiLineText = '';
  testingCredentials = false;
  errorMessage = '';
  profile = '';

  onTestCredentialsClick(){
    this.testingCredentials = true;
    this.apiService.testSshConnection(new TestSshConnection(this.serverIP, this.sshUser, this.sshPassword))
    .subscribe(
      response => {
        this.connected = true;
        this.testingCredentials = false;
      },
      error => {
        this.errorMessage = 'Could not connect with the specified Credentials';
        this.testingCredentials = false;
      }
    );
  }

  ngOnInit(): void {

    this.signalRConnect();
    const profileData = this.globalService.getProfile();
    this.profile = profileData.name;
  }

  ProvisionxServer(){

    this.provisioning = true;
    this.apiService.provisionXserver(new XserverProvisioningRequest(this.serverIP, this.sshUser, this.sshPassword, this.email, this.certificatePassword, this.databasePassword, this.profile))
      .subscribe(
        response => {
        },
        error => {
          this.errorMessage = 'Could not connect with the specified Credentials';
        }
      );
  }
  scrollToBottom(): void {
    try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {
    }
}
  installCertificate() {
    const certPath = this.electronService.remote.app.getPath('userData').replace('xCore', 'Blockcore') + '\\x42\\x42Main\\certificates';
    this.electronService.shell.openPath(certPath + '\\' + this.profile + '.p12');
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
        this.provisioning = false;
        this.provisioned = true;

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

}
