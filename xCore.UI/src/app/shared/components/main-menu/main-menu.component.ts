import { Component, OnInit, Input } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { SelectItemGroup, MenuItem, DialogService } from 'primeng/api';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Subscription } from 'rxjs';

import { GlobalService } from '../../services/global.service';
import { LogoutConfirmationComponent } from '../../../wallet/logout-confirmation/logout-confirmation.component';
import { FullNodeApiService } from '../../../shared/services/fullnode.api.service';
import { WalletInfo } from '../../../shared/models/wallet-info';

import { SendComponent } from '../../../wallet/send/send.component';
import { ReceiveComponent } from '../../../wallet/receive/receive.component';
import { CreateComponent } from '../../../setup/create/create.component';
import { RecoverComponent } from '../../../setup/recover/recover.component';
import { NodeStatus } from '../../../shared/models/node-status';

@Component({
  selector: 'main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent implements OnInit {

  @Input() public isUnLocked: boolean = false;

  public lastBlockSyncedHeight: number;
  public chainTip: number;
  public isChainSynced: boolean;
  public connectedNodes: number = 0;
  public percentSynced: string;
  public stakingEnabled: boolean;
  public isTestnet: boolean;
  public settingsMenu: boolean;

  toolTip = '';
  connectedNodesTooltip = '';

  constructor(private FullNodeApiService: FullNodeApiService, private themeService: ThemeService, private globalService: GlobalService, private router: Router, private modalService: NgbModal, public dialogService: DialogService) {

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
  }

  public logoFileName: string;

  groupedThemes: SelectItemGroup[];
  menuItems: MenuItem[];

  ngOnInit() {
    this.themeService.setTheme();
    this.themeService.logoFileName.subscribe(x => this.logoFileName = x);
    this.setLogoPath();
    if (this.isUnLocked) {
      this.setUnlockedMenuItems()
    } else {
      this.setDefaultMenuItems();
    }

    this.isTestnet = this.globalService.getTestnetEnabled();
  }

  setUnlockedMenuItems() {
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
            label: 'Cold Staking',
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
      }
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
    ]
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
  };

  public openColdStaking() {
    this.router.navigate(['/wallet/coldstaking']);
  };

  public openReceiveDialog() {
    this.dialogService.open(ReceiveComponent, {
      header: 'Receive',
      width: '540px'
    });
  };

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
