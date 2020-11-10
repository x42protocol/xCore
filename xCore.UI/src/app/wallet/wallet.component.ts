import { Component, OnInit } from '@angular/core';
import { ApplicationStateService } from '../shared/services/application-state.service';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-wallet-component',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css'],
})
export class WalletComponent implements OnInit {
  constructor(public appState: ApplicationStateService) { }
  public contextMenuItems: MenuItem[];

  ngOnInit() {
    this.contextMenuItems = [
      {
        label: 'x42 xCore ' + this.appState.version,
        icon: 'pi goat-icon'
      }
    ];
  }
}
