import { Component, OnInit } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { DeployAppComponent } from './deploy-app/deploy-app.component';

@Component({
  selector: 'app-dapp-store',
  templateUrl: './dapp-store.component.html',
  styleUrls: ['./dapp-store.component.css']
})
export class DappStoreComponent implements OnInit {
  profile: any;
  selectedApp: any;

  apps = [
    {
      name: 'Wordpress (Preview)',
      image: 'wordpress-logo.png',
      monthlyPrice: 2.50
    },
    {
      name: 'Presta Shop',
      image: 'Prestashop.png',
      monthlyPrice: 3.25
    },
    {
      name: 'Magento Cart',
      image: 'Magento.png',
      monthlyPrice: 4.10
    },
    {
      name: 'Open Project',
      image: 'OpenProject.png',
      monthlyPrice: 5.15
    },
    {
      name: 'MariaDB',
      image: 'MariaDB.png',
      monthlyPrice: 6.50
    }
  ];

  constructor(public dialogService: DialogService) { }

  ngOnInit(): void {

  }

  public openApp(app: any) {

    this.selectedApp = this.apps.find(l => l.name === app.name);
    this.openDeployAppDialog(false);
  }

  public openDeployAppDialog(isReserved: boolean) {
    let priceLockId = '';
    if (isReserved) {
      priceLockId = this.profile.priceLockId;
    }
    const modalData = { priceLockId, selectedApp: this.selectedApp.name, price: this.selectedApp.monthlyPrice, image: this.selectedApp.image  };


    this.dialogService.open(DeployAppComponent, {
      header: 'Deploy ' + this.selectedApp.name,
      width: '540px',
      data: modalData,
    });
  }


}
