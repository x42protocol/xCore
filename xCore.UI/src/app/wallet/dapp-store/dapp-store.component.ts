import { Component, OnInit } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { DeployWordpressComponent } from './deploy-wordpress/deploy-wordpress.component';

@Component({
  selector: 'app-dapp-store',
  templateUrl: './dapp-store.component.html',
  styleUrls: ['./dapp-store.component.css']
})
export class DappStoreComponent implements OnInit {
  profile: any;

  constructor(public dialogService: DialogService) { }

  ngOnInit(): void {
  }

  public openDeployWordpressDialog(isReserved: boolean) {
    let priceLockId = '';
    if (isReserved) {
      priceLockId = this.profile.priceLockId;
    }
    const modalData = { priceLockId };

    this.dialogService.open(DeployWordpressComponent, {
      header: 'Deploy WordPress (Preview)',
      width: '540px',
      data: modalData,
    });
  }


}
