import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

import { GlobalService } from '../shared/services/global.service';
import { FullNodeApiService } from '../shared/services/fullnode.api.service';
import { ModalService } from '../shared/services/modal.service';

import { WalletLoad } from '../shared/models/wallet-load';
import { ThemeService } from '../shared/services/theme.service';

import { SelectItem, Message, MenuItem } from 'primeng/api';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {
  constructor(private globalService: GlobalService, private FullNodeApiService: FullNodeApiService, private genericModalService: ModalService, private router: Router, private fb: FormBuilder, private themeService: ThemeService) {
    this.buildDecryptForm();
    this.isDarkTheme = themeService.getCurrentTheme().themeType == 'dark';
  }

  public hasWallet: boolean = false;
  public isWalletLoading: boolean = false;
  public isDecrypting = false;
  public isDarkTheme = false;
  public wallets: SelectItem[] = [];
  public contextMenuItems: MenuItem[];
  public walletSelected: boolean = false;
  public noWalletsFound: Message[] = [{ severity: 'info', summary: 'Create or restore wallet', detail: '<br>' + 'Please use one of the menu items at the top to create or restore a wallet' }];
  public openWalletForm: FormGroup;

  ngOnInit() {
    this.isWalletLoading = true;
    this.getWalletFiles();
    this.getCurrentNetwork();

    this.contextMenuItems = [
      {
        label: 'x42 xCore ' + this.globalService.getApplicationVersion(),
        icon: 'pi pi-fw pi-question-circle'
      }
    ];
  }

  private buildDecryptForm(): void {
    this.openWalletForm = this.fb.group({
      "selectWallet": [{ value: "", disabled: this.isDecrypting }, Validators.required],
      "password": [{ value: "", disabled: this.isDecrypting }, Validators.required]
    });

    this.openWalletForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged();
  }

  onValueChanged(data?: any) {
    if (!this.openWalletForm) { return; }
    if (data !== undefined && data.selectWallet.label.length > 0) {
      this.walletSelected = true;
    }
    const form = this.openWalletForm;
    for (const field in this.formErrors) {
      this.formErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];
        for (const key in control.errors) {
          this.formErrors[field] += messages[key] + ' ';
        }
      }
    }
  }

  formErrors = {
    'password': ''
  };

  validationMessages = {
    'password': {
      'required': 'Please enter your password.'
    }
  };

  private getWalletFiles() {
    this.FullNodeApiService.getWalletFiles()
      .subscribe(
        response => {
          this.globalService.setWalletPath(response.walletsPath);
          if (response.walletsFiles.length > 0) {
            this.hasWallet = true;
            this.isWalletLoading = false;
            for (let wallet in response.walletsFiles) {
              this.wallets.push({ label: response.walletsFiles[wallet].slice(0, -12), value: response.walletsFiles[wallet].slice(0, -12) });
            }
          } else {
            this.hasWallet = false;
            this.isWalletLoading = false;
          }
        }
      );
  }

  public onCreateClicked() {
    this.router.navigate(['setup']);
  }

  public onEnter() {
    if (this.openWalletForm.valid) {
      this.onDecryptClicked();
    }
  }

  public onDecryptClicked() {
    this.isDecrypting = true;
    let selectedWalletName: string = this.openWalletForm.get("selectWallet").value.label;
    this.globalService.setWalletName(selectedWalletName);
    let walletLoad = new WalletLoad(
      selectedWalletName,
      this.openWalletForm.get("password").value
    );
    if (walletLoad.name.length > 0) {
      this.loadWallet(walletLoad);
    }

  }

  private loadWallet(walletLoad: WalletLoad) {
    this.FullNodeApiService.loadX42Wallet(walletLoad)
      .subscribe(
        response => {
          this.router.navigate(['wallet/dashboard']);
        },
        error => {
          this.isDecrypting = false;
        }
      );
  }

  private getCurrentNetwork() {
    this.FullNodeApiService.getNodeStatus()
      .subscribe(
        response => {
          let responseMessage = response;
          this.globalService.setCoinUnit(responseMessage.coinTicker);
          this.globalService.setNetwork(responseMessage.network);
        }
      );
  }
}
