import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalService } from '../shared/services/modal.service';
import { GlobalService } from '../shared/services/global.service';
import { ApiService } from '../shared/services/api.service';
import { ApplicationStateService } from '../shared/services/application-state.service';
import { WalletLoad } from '../shared/models/wallet-load';
import { ThemeService } from '../shared/services/theme.service';
import { SelectItem, Message, MenuItem } from 'primeng/api';
import { ColdStakingService } from '../shared/services/coldstaking.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  constructor(
    private globalService: GlobalService,
    private apiService: ApiService,
    private router: Router,
    private fb: FormBuilder,
    public themeService: ThemeService,
    private stakingService: ColdStakingService,
    public appState: ApplicationStateService,
    public modalService: ModalService,
  ) {
    this.buildDecryptForm();
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
  }

  public hasWallet = false;
  public isWalletLoading = false;
  public isDecrypting = false;
  public isDarkTheme = false;
  public wallets: SelectItem[] = [];
  public contextMenuItems: MenuItem[];
  public walletSelected = false;
  public noWalletsFound: Message[] = [{ severity: 'info', summary: 'Create or restore wallet', detail: '<br>' + 'Please use one of the menu items at the top to create or restore a wallet' }];
  public openWalletForm: FormGroup;

  formErrors = {
    password: ''
  };

  validationMessages = {
    password: {
      required: 'Please enter your password.'
    }
  };

  ngOnInit() {
    this.isWalletLoading = true;
    this.getWalletFiles();
    this.getCurrentNetwork();
    this.stakingService.initialize();

    this.contextMenuItems = [
      {
        label: 'x42 xCore ' + this.appState.version,
        icon: 'pi goat-icon'
      }
    ];
  }

  private buildDecryptForm(): void {
    this.openWalletForm = this.fb.group({
      selectWallet: [{ value: '', disabled: this.isDecrypting }, Validators.required],
      password: [{ value: '', disabled: this.isDecrypting }, Validators.required]
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

    // tslint:disable-next-line:forin
    for (const field in this.formErrors) {
      this.formErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];

        // tslint:disable-next-line:forin
        for (const key in control.errors) {
          this.formErrors[field] += messages[key] + ' ';
        }
      }
    }
  }

  private getWalletFiles() {
    this.apiService.getWalletFiles()
      .subscribe(
        response => {
          this.globalService.setWalletPath(response.walletsPath);
          if (response.walletsFiles.length > 0) {
            this.hasWallet = true;
            this.isWalletLoading = false;

            // tslint:disable-next-line:forin
            for (const wallet in response.walletsFiles) {
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
    const selectedWalletName: string = this.openWalletForm.get('selectWallet').value.label;
    this.globalService.setWalletName(selectedWalletName);
    const walletLoad = new WalletLoad(
      selectedWalletName,
      this.openWalletForm.get('password').value
    );
    if (walletLoad.name.length > 0) {
      this.loadWallet(walletLoad);
    }

  }

  private loadWallet(walletLoad: WalletLoad) {
    this.apiService.loadX42Wallet(walletLoad)
      .subscribe(
        response => {
          this.getKeyAddress(walletLoad.name, walletLoad.password);
        },
        error => {
          this.modalService.openModal('Login', error.error.errors[0].message);
          this.isDecrypting = false;
        }
      );
  }

  private getKeyAddress(walletName: string, walletPassword: string) {
    this.stakingService.getProfileAddress(walletName, walletPassword).subscribe(
      getProfileAddressResponse => {
        this.globalService.setWalletKeyAddress(getProfileAddressResponse.address);
        console.log(getProfileAddressResponse.address);
        this.router.navigate(['wallet/dashboard']);
      },
      error => {
        this.isDecrypting = false;
      });
  }

  private getCurrentNetwork() {
    this.apiService.getNodeStatus()
      .subscribe(
        response => {
          const responseMessage = response;
          this.globalService.setCoinName(responseMessage.coinTicker);
          this.globalService.setCoinUnit(responseMessage.coinTicker);
          this.globalService.setNetwork(responseMessage.network);
          this.appState.fullNodeVersion = responseMessage.version;
          this.appState.protocolVersion = responseMessage.protocolVersion;
          this.appState.dataDirectory = responseMessage.dataDirectoryPath;
        }
      );
  }

}
