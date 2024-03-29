import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-advanced',
  templateUrl: './advanced.component.html',
  styleUrls: ['./advanced.component.css']
})

export class AdvancedComponent implements OnInit, OnDestroy {

  constructor(private router: Router) { }

  public items: MenuItem[];

  ngOnInit() {
    this.items = [{
      label: '',
      items: [
        {
          label: 'About',
          icon: 'pi pi-info',
          command: (event: Event) => {
            this.router.navigate(['/wallet/advanced/about']);
          }
        },
        {
          label: 'Settings',
          icon: 'pi pi-cog',
          command: (event: Event) => {
            this.router.navigate(['/wallet/advanced/settings']);
          }
        },
        {
          label: 'Sign & Verify',
          icon: 'pi pi-pencil',
          command: (event: Event) => {
            this.router.navigate(['/wallet/advanced/sign']);
          }
        },
        {
          label: 'Extended Public Key',
          icon: 'pi pi-key',
          command: (event: Event) => {
            this.router.navigate(['/wallet/advanced/extpubkey']);
          }
        },
        {
          label: 'Generate Addresses',
          icon: 'pi pi-list',
          command: (event: Event) => {
            this.router.navigate(['/wallet/advanced/generate-addresses']);
          }
        },
        {
          label: 'Rescan Wallet',
          icon: 'pi pi-refresh',
          command: (event: Event) => {
            this.router.navigate(['/wallet/advanced/resync']);
          }
        },
        {
          label: 'xServer',
          icon: 'pi pi-sitemap',
          command: (event: Event) => {
            this.router.navigate(['/wallet/advanced/xserver']);
          }
        },
        {
          label: 'xServer Provisioning',
          icon: 'pi pi-cloud-upload',
          command: (event: Event) => {
            this.router.navigate(['/wallet/advanced/xserverProvisioner']);
          }
        },
        {
          label: 'xServer Updater',
          icon: 'pi pi-arrow-circle-up',
          command: (event: Event) => {
            this.router.navigate(['/wallet/advanced/xserverUpdater']);
          }
        }
      ]
    }];
  }

  ngOnDestroy() {

  }
}
