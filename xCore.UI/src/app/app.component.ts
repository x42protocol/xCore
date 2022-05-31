import { Component, HostBinding, NgZone, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationStateService } from '../app/shared/services/application-state.service';
import { ApiService } from '../app/shared/services/api.service';
import { Logger } from '../app/shared/services/logger.service';
import { ElectronService } from 'ngx-electron';
import { ThemeService } from './shared/services/theme.service';
import { TitleService } from './shared/services/title.service';
import { ApiEvents } from './shared/services/api.events';
import { NodeStatus } from './shared/models/node-status';
import { MenuItem } from 'primeng/api';
import { Observable, Subscription } from 'rxjs';
import { delay, retryWhen, tap, finalize } from 'rxjs/operators';
import { environment } from '../environments/environment';
import * as signalR from '@aspnet/signalr';
import * as coininfo from 'x42-coininfo';

export interface ListItem {
  name: string;
  id: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  @HostBinding('class.load') hostClass = true;

  selectedMode: ListItem;
  selectedNetwork: ListItem;
  loading: boolean;
  hasWallet = false;
  modes: ListItem[] = [];
  networks: ListItem[] = [];
  remember: boolean;
  connection: signalR.HubConnection;
  delayed = false;
  nodeStarted = false;
  nodeFailed = false;

  private readonly TryDelayMilliseconds = 1000;
  private readonly MaxRetryCount = 50;
  private failedAttempts = 0;

  public loadingFailed = false;
  public apiConnected = false;
  public contextMenuItems: MenuItem[];
  public nodeStatusSubscription: Subscription;

  constructor(
    private themeService: ThemeService,
    private electronService: ElectronService,
    private router: Router,
    private log: Logger,
    private zone: NgZone,
    private apiService: ApiService,
    public appState: ApplicationStateService,
    private readonly titleService: TitleService,
    private apiEvents: ApiEvents,
  ) {

    this.modes = [
      { id: 'full', name: 'Full' },
    ];

    if (!environment.production) {
      this.modes.push({ id: 'demo', name: 'Demo' }, // Auto-wallet creation, etc.
        { id: 'local', name: 'Local' }, // Launches the daemon by specifying path to .dll file.
        { id: 'manual', name: 'Manual' }, // Manual startup of daemon, does not send shutdown messages.
        { id: 'simple', name: 'Mobile' }, // API Wallet mode.
        { id: 'light', name: 'Light' }, // Full Node in Purge mode and other features disabled.
        { id: 'pos', name: 'Point-of-Sale (POS)' },
        { id: 'readonly', name: 'Read-only' });
    }

    this.networks = appState.networks;

    this.selectedMode = this.modes.find(mode => mode.id === this.appState.mode);
    this.selectedNetwork = this.networks.find(network => network.id === this.appState.network);
    this.remember = true;

    this.log.info('Mode:', this.selectedMode);
    this.log.info('Network:', this.selectedNetwork);
    this.log.info('Node App State:', JSON.stringify(this.appState.daemon));
  }

  ngOnInit() {
    this.themeService.setTheme();
    this.initialize();

    this.contextMenuItems = [
      {
        label: 'x42 xCore ' + this.appState.version,
        icon: 'pi goat-icon'
      }
    ];
  }

  private startNodeStatus() {
    this.nodeStatusSubscription = this.apiEvents.NodeStatus.subscribe((status) => {
      this.updateNodeStatus(status);
    });
  }

  private cancelSubscriptions() {
    if (this.nodeStatusSubscription) {
      this.nodeStatusSubscription.unsubscribe();
    }
  }

  get appTitle$(): Observable<string> {
    return this.titleService.$title;
  }

  initialize() {
    this.apiService.initialize();
    const network = coininfo('x42').toBitcoinJS();
    this.appState.networkDefinition = network;

    this.appState.networkParams = {
      private: network.wif,
      public: network.pubKeyHash
    };

    if (this.appState.mode === 'full' || this.appState.mode === 'local' || this.appState.mode === 'light') {
      this.loading = true;
      this.appState.connected = false;
      this.fullNodeConnect();
    } else if (this.appState.mode === 'manual') {
      this.loading = false;
      this.appState.connected = true;
      this.fullNodeConnect();
    } else if (this.appState.mode === 'simple') {
      // TODO: Should send the correct network, hard-coded to x42 main for now.
      // const network = coininfo('x42').toBitcoinJS();
      // this.appState.networkDefinition = network;

      // this.appState.networkParams = {
      //     private: network.wif,
      //     public: network.pubKeyHash
      // };

      this.appState.connected = true;
      this.startx42();
    }
  }

  startx42() {
    this.nodeStarted = true;
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['login']);
    }, 2000);
  }

  onDaemonFolderChange(event) {
    this.log.info('Daemon folder changed:', event);

    if (event.target.files.length > 0) {
      this.appState.daemon.path = event.target.files[0].path;
    } else {
      this.appState.daemon.path = '';
    }
  }

  onDataFolderChange(event) {
    this.log.info('Data folder changed:', event);

    if (event.target.files.length > 0) {
      this.appState.daemon.datafolder = event.target.files[0].path;
    } else {
      this.appState.daemon.datafolder = '';
    }
  }

  launch() {
    this.appState.updateNetworkSelection(this.remember, this.selectedMode.id, this.selectedNetwork.id, this.appState.daemon.path, this.appState.daemon.datafolder);

    // If the selected mode is not 'local', we'll reset the path and data folder.
    if (this.appState.mode !== 'local') {
      localStorage.removeItem('Network:Path');
      localStorage.removeItem('Network:DataFolder');
    }

    this.initialize();
  }

  fullNodeConnect() {
    // Do we need to keep a pointer to this timeout and remove it, or does the zone handle that?
    this.zone.run(() => {
      setTimeout(() => {
        this.delayed = true;
      }, 30000); // 60000 Make sure it is fairly high, we don't want users to immediatly perform advanced reset options when they don't need to.
    });

    this.tryStart();
  }

  // Attempts to initialise the wallet by contacting the daemon.  Will try to do this MaxRetryCount times.
  private tryStart() {
    let retry = 0;
    this.apiService.getNodeStatus()
      .pipe(
        retryWhen(errors =>
          errors.pipe(delay(this.TryDelayMilliseconds)).pipe(
            tap(errorStatus => {
              this.failedAttempts++;
              if (retry++ === this.MaxRetryCount) {
                this.nodeFailedToLoad();
                throw errorStatus;
              }
              this.log.info(`Retrying ${retry}...`);
            })
          )
        )
      ).subscribe(() => {
        this.apiConnected = true;
        this.startNodeStatus();
      });
  }

  private updateNodeStatus(nodeSatus: NodeStatus) {
    if (nodeSatus !== null) {
      if (this.nodeStarted) {
        console.log('STOPPED');
        this.cancelSubscriptions();
      } else {
        this.failedAttempts = 0;
        this.log.info('Node Status Update: ', nodeSatus);
        const statusResponse = nodeSatus.featuresData.filter(x => x.namespace === 'Blockcore.Base.BaseFeature');
        if (statusResponse.length > 0 && statusResponse[0].state === 'Initialized') {
          this.cancelSubscriptions();
          this.start();
        }
      }
    } else {
      this.log.info('Failed to start wallet');
      this.nodeFailedToLoad();
      this.failedAttempts++;
    }
  }

  start() {
    // this.simpleWalletConnect();

    // We have successful connection with daemon, make sure we inform the main process of |.
    this.electronService.ipcRenderer.send('daemon-started');

    this.appState.connected = true;
    this.startx42();
  }

  nodeFailedToLoad() {
    if (this.failedAttempts >= this.MaxRetryCount) {
      this.nodeFailed = true;
      this.loading = false;
      this.loadingFailed = true;
    }
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }

  cancel() {
    this.appState.connected = false;
    this.loading = false;
    this.delayed = false;
    this.appState.mode = null;
  }

  simpleWalletConnect() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:42220/ws')
      .build();

    this.connection.on('BlockConnected', (block) => {
      console.log('BlockConnected:' + block);
    });

    this.connection.on('xServerProvisioning', (trx) => {
      console.log('xServerProvisioning:' + trx);
    });

    this.connection.on('txs', (transactions) => {
      console.log(transactions);
      // TODO: Update a bitcore-lib fork to add support for x42.
      // var tx1 = transactions[0];
      // var tx = bitcoin.Transaction.fromHex(tx1.value.hex);
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

  public openSupport() {
    this.electronService.shell.openExternal('https://github.com/x42protocol/x42/blob/master/README.md');
  }
}
