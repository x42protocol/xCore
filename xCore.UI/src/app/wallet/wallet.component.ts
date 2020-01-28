import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../shared/services/global.service';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'wallet-component',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css'],
})
export class WalletComponent implements OnInit {
  constructor(private globalService: GlobalService) { }
  public contextMenuItems: MenuItem[];

  ngOnInit() {
    this.contextMenuItems = [
      {
        label: 'x42 xCore ' + this.globalService.getApplicationVersion(),
        icon: 'pi goat-icon'
      }
    ];
  }
}
