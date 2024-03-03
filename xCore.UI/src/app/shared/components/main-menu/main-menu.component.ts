import { Component, OnInit, OnDestroy, Input, NgZone } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { SelectItemGroup, MenuItem, SelectItem } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Router } from '@angular/router';
import { ElectronService } from 'ngx-electron';
import { GlobalService } from '../../services/global.service';
import { LogoutConfirmationComponent } from '../../../wallet/logout-confirmation/logout-confirmation.component';
import { SendComponent } from '../../../wallet/send/send.component';
import { ReceiveComponent } from '../../../wallet/receive/receive.component';
import { CreateComponent } from '../../../setup/create/create.component';
import { RecoverComponent } from '../../../setup/recover/recover.component';
import { ApplicationStateService } from '../../../shared/services/application-state.service';
import { ModalService } from '../../../shared/services/modal.service';
import { UpdateService } from '../../../shared/services/update.service';
import { Logger } from '../../../shared/services/logger.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent implements OnInit, OnDestroy {
  private ipc: Electron.IpcRenderer;
  private updateTimerId: any;
  private coldTypeTimerId: any;

  @Input() public isUnLocked = false;

  public lastBlockSyncedHeight: number;
  public chainTip: number;
  public isChainSynced: boolean;
  public connectedNodes = 0;
  public percentSynced: string;
  public stakingEnabled: boolean;
  public settingsMenu: boolean;
  public networks: SelectItem[] = [];
  public logoFileName: string;
  public groupedThemes: SelectItemGroup[];
  public menuItems: MenuItem[];
  public networkForm: UntypedFormGroup;
  public changeNetwork: boolean;

  toolTip = '';
  connectedNodesTooltip = '';

  private isDelegated = false;

  constructor(
    private log: Logger,
    private themeService: ThemeService,
    private globalService: GlobalService,
    private router: Router,
    public dialogService: DialogService,
    public appState: ApplicationStateService,
    public updateService: UpdateService,
    private electronService: ElectronService,
    public apiService: ApiService,
    private zone: NgZone,
    private fb: UntypedFormBuilder,
    public modalService: ModalService,
  ) {

    this.groupedThemes = [
      {
        label: 'Light', value: 'fa fa-lightbulb-o',
        items: [
          { label: 'Green (Default)', value: 'Rhea' },
          { label: 'Blue', value: 'Nova-Dark' },
          { label: 'Mixed Colors', value: 'Nova-Colored' }
        ]
      },
      {
        label: 'Dark', value: 'fa fa-moon-o',
        items: [
          { label: 'Amber', value: 'Luna-amber' },
          { label: 'Blue', value: 'Luna-blue' },
          { label: 'Green', value: 'Luna-green' },
          { label: 'Pink', value: 'Luna-pink' }
        ]
      }
    ];

    for (const network of appState.networks) {
      this.networks.push({ label: network.name, value: network.id });
    }

    this.networkForm = this.fb.group({
      selectNetwork: [{ value: appState.network, }],
    });

    if (this.electronService.ipcRenderer) {
      if (this.electronService.remote) {
        const applicationVersion = this.electronService.remote.app.getVersion();

        this.appState.setVersion(applicationVersion);
        this.log.info('Version: ' + applicationVersion);
      }

      this.ipc = electronService.ipcRenderer;

      this.ipc.on('daemon-exiting', (event, error) => {
        if (!this.appState.shutdownInProgress) {
          this.zone.run(() => this.router.navigate(['shutdown']));

          this.log.info('x42.Node is currently being stopped... please wait...');
          this.appState.shutdownInProgress = true;

          // If the exit takes a very long time, we want to allow users to forcefully exit xCore.
          setTimeout(() => {
            this.appState.shutdownDelayed = true;
          }, 60000);
        }
      });

      this.ipc.on('daemon-exited', (event, error) => {
        this.log.info('x42.Node is stopped.');
        this.appState.shutdownInProgress = false;
        this.appState.shutdownDelayed = false;

        // Perform a new close event on the window, this time it will close itself.
        window.close();
      });

      this.ipc.on('daemon-error', (event, error) => {
        this.log.error(error);
        // this.modalService.openModal('Failed to start x42.Node process', error);
        // TODO: Add to a log for the user: this.log.lastEntries()
      });

      this.ipc.on('log-debug', (event, msg: any) => {
        this.log.verbose(msg);
      });

      this.ipc.on('log-info', (event, msg: any) => {
        this.log.info(msg);
      });

      this.ipc.on('log-error', (event, msg: any) => {
        this.log.error(msg);
      });
    }
  }

  ngOnInit() {
    this.themeService.setTheme();
    this.themeService.logoFileName.subscribe(x => this.logoFileName = x);
    this.setLogoPath();
    if (this.isUnLocked) {
      this.setUnlockedMenuItems();
    } else {
      this.setDefaultMenuItems();
    }

    this.checkForUpdates();

    const walletName = this.globalService.getWalletName();
    if (walletName !== '') {
      this.apiService
        .getColdHotState(walletName)
        .subscribe(
          isHot => {
            this.appState.delegated = isHot;
            this.checkForColdTypeChange();
          }
        );
    }

    this.updateTimerId = setInterval(() => this.checkForUpdates(), 43200000);
    this.coldTypeTimerId = setInterval(() => this.checkForColdTypeChange(), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.updateTimerId);
    clearInterval(this.coldTypeTimerId);
  }

  checkForColdTypeChange() {
    if (this.isDelegated !== this.appState.delegated) {
      this.isDelegated = this.appState.delegated;
      this.setUnlockedMenuItems();
    }
  }

  releaseDateFormatted() {
    const updatedTime = new Date(this.updateService.info.releaseDate);
    return updatedTime.toLocaleDateString();
  }

  lastCheckDateFormatted() {
    const lastCheckedTime = new Date(this.updateService.LastUpdateCheck);
    return lastCheckedTime.toLocaleString();
  }

  changeMode() {
    this.appState.changingMode = true;
    this.electronService.ipcRenderer.send('daemon-change');

    // Make sure we shut down the existing node when user choose the change mode action.
    this.apiService.shutdownNode().subscribe(response => { });

    this.globalService.setWalletName('');

    this.router.navigateByUrl('');
  }

  applyNetworkChange() {
    this.changeNetwork = false;
    const selectedNetwork = this.networkForm.get('selectNetwork').value.value;
    console.log(this.appState.network);
    console.log(selectedNetwork);
    if (selectedNetwork !== undefined && this.appState.network !== selectedNetwork) {
      this.appState.updateNetworkSelection(true, 'full', selectedNetwork, this.appState.daemon.path, this.appState.daemon.datafolder);
      console.log('Network Chnaged: ' + selectedNetwork);
      this.changeMode();
    }
  }

  checkForUpdates() {
    this.updateService.checkForUpdate();
  }

  setUnlockedMenuItems() {
    let coldStakeType = 'Cold';
    if (this.isDelegated) {
      coldStakeType = 'Delegated';
    }
    this.menuItems = [
      {
        label: 'Client',
        items: [
          {
            label: 'Dashboard',
            icon: 'pi pi-fw pi-home',
            command: (event: Event) => {
              this.openDashBoard();
            }
          },
          { separator: true },
          {
            label: 'Lock',
            icon: 'pi pi-fw pi-sign-out',
            command: (event: Event) => { this.lockClicked(); }
          },
          { separator: true },
          {
            label: 'Quit',
            icon: 'pi pi-fw pi-times',
            command: (event: Event) => { this.quit(); }
          }
        ]
      },
      {
        label: this.globalService.getWalletName() + ' Wallet',
        items: [
          {
            label: 'Receive',
            icon: 'pi pi-fw pi-arrow-circle-down',
            command: (event: Event) => {
              this.openReceiveDialog();
            }
          },
          {
            label: 'Send',
            icon: 'pi pi-fw pi-arrow-circle-up',
            command: (event: Event) => {
              this.openSendDialog();
            }
          },
          { separator: true },
          {
            label: `${coldStakeType} Staking`,
            icon: 'pi pi-fw pi-ticket',
            command: (event: Event) => {
              this.openColdStaking();
            }
          },
          { separator: true },
          {
            label: 'Address Book',
            icon: 'pi pi-fw pi-list',
            command: (event: Event) => {
              this.openAddressBook();
            }
          },
          {
            label: 'History',
            icon: 'pi pi-fw pi-clock',
            command: (event: Event) => { this.openHistory(); }
          }
        ]
      },
      {
        label: 'DApp Store',
        icon: 'pi pi-fw pi-list',
        command: (event: Event) => {
          this.openDappStore();
        },
      },
      {
        label: 'xServer Network',
        icon: 'pi pi-fw pi-sitemap',
        command: (event: Event) => {
          this.openxServerNetwork();
        }
      },
      {
        label: 'DNS',
        icon: 'pi pi-fw pi-table',
        command: (event: Event) => {
          this.openDnsManagement();
        },
      },
      {
        label: 'Storage',
        icon: 'pi pi-fw pi-file',
        command: (event: Event) => {
          this.openStorageManagement();
        },
      },
    ];
  }

  setDefaultMenuItems() {
    this.menuItems = [
      {
        label: 'Client',
        items: [
          {
            label: 'Quit',
            icon: 'pi pi-fw pi-times',
            command: (event: Event) => { this.quit(); }
          }
        ]
      },
      { separator: true },
      {
        label: 'Create New Wallet',
        icon: 'pi pi-fw pi-plus',
        command: (event: Event) => { this.onCreateClicked(); }
      },
      {
        label: 'Restore Wallet',
        icon: 'fa fa-refresh',
        command: (event: Event) => { this.onRestoreClicked(); }
      }
    ];
  }

  onThemeChange(event) {
    this.themeService.setTheme(event.value);
    this.setLogoPath();
  }

  setLogoPath() {
    this.logoFileName = this.themeService.getLogo();
  }

  quit() {
    this.globalService.quitApplication();
  }

  openDashBoard() {
    this.router.navigate(['/wallet/dashboard']);
  }

  openAddressBook() {
    this.router.navigate(['/wallet/address-book']);
  }

  openHistory() {
    this.router.navigate(['/wallet/history']);
  }

  openDappStore() {
    this.router.navigate(['/wallet/dapp-store']);
  }

  openxServerNetwork() {
    this.router.navigate(['/wallet/xserver-network']);
  }

  openDnsManagement() {
    this.router.navigate(['/wallet/dns-management']);
  }

  openStorageManagement() {
    this.router.navigate(['/wallet/storage-management']);
  }


  public onCreateClicked() {
    this.dialogService.open(CreateComponent, {
      header: 'Create Wallet',
      width: '540px'
    });
  }

  public onRestoreClicked() {
    this.dialogService.open(RecoverComponent, {
      header: 'Recover Wallet',
      width: '540px'
    });
  }

  public openSendDialog() {
    this.dialogService.open(SendComponent, {
      header: 'Send to',
      width: '700px'
    });
  }

  public openColdStaking() {
    this.router.navigate(['/wallet/coldstaking']);
  }

  public openReceiveDialog() {
    this.dialogService.open(ReceiveComponent, {
      header: 'Receive',
      width: '540px'
    });
  }

  openAdvanced() {
    this.router.navigate(['/wallet/advanced']);
    this.settingsMenu = false;
  }

  lockClicked() {
    this.dialogService.open(LogoutConfirmationComponent, {
      header: 'Logout'
    });
  }
}
