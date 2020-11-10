import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ApiService } from '../../shared/services/api.service';
import { GlobalService } from '../../shared/services/global.service';
import { ThemeService } from '../../shared/services/theme.service';
import { WalletInfo } from '../../shared/models/wallet-info';
import { SelectItem } from 'primeng/api';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { CreatePriceLockRequest } from '../../shared/models/xserver-create-pl-request';
import { VerifyRequest } from '../../shared/models/wallet-verifyrequest';
import { PriceLockUtil } from '../../shared/models/pricelockutil';

@Component({
  selector: 'app-receive-component',
  templateUrl: './receive.component.html',
  styleUrls: ['./receive.component.css'],
})
export class ReceiveComponent implements OnInit {
  constructor(
    private apiService: ApiService,
    private globalService: GlobalService,
    public themeService: ThemeService,
    public ref: DynamicDialogRef,
    private electronService: ElectronService,
    private fb: FormBuilder,
  ) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
    this.buildCreatePLForm();
  }

  public priceLockForm: FormGroup;
  public address: any = '';
  public qrString: any;
  public copied = false;
  public showAll = false;
  public allAddresses: any;
  public usedAddresses: string[];
  public unusedAddresses: string[];
  public changeAddresses: string[];
  public pageNumberUsed = 1;
  public pageNumberUnused = 1;
  public pageNumberChange = 1;
  public isDarkTheme = false;
  public types: SelectItem[];
  public copyType: SelectItem[];
  public selectedType: string;
  public isPriceLock: boolean;
  public isPriceLockBusy: boolean;
  public isPriceLockVerifying: boolean;
  public priceLockId: string;
  public currentBlock = 896818;
  public blockExpire: number;
  public pairs: SelectItem[];
  public selectedPairSymbol = '$';
  public selectedPairLabel = 'USD';
  public selectedPairId = 1;
  public priceLockUtil: PriceLockUtil = new PriceLockUtil();
  public destinationAmount: string;
  public feeAmount: string;
  public expirationBlock: string;
  public showAbout: boolean;
  public errorMessage: string;

  ngOnInit() {
    this.getPairs();
    this.getUnusedReceiveAddresses();
    this.types = [
      { label: 'Unused Addresses', value: 'Unused', icon: 'fa fa-file-o' },
      { label: 'Used Addresses', value: 'Used', icon: 'fa fa-file-text-o' },
      { label: 'Change Addresses', value: 'Change', icon: 'fa fa-files-o' }
    ];
    this.selectedType = 'Unused';

    this.copyType = [
      { label: 'Copy', value: 'Copy', icon: 'pi pi-copy' }
    ];

    this.priceLockForm.patchValue({ blockExpire: 45 });
  }

  private buildCreatePLForm(): void {
    this.priceLockForm = this.fb.group({
      pair: [],
      amount: [''],
      blockExpire: ['', Validators.compose([Validators.required, Validators.minLength(15), Validators.maxLength(60)])],
    });

    this.priceLockForm.valueChanges.pipe(debounceTime(1))
      .subscribe(data => {
        this.priceLockForm.patchValue({ blockExpire: Number(data.blockExpire) });
        this.blockExpire = Number(data.blockExpire);
      });

    const pairKey = 'pair';
    this.priceLockForm.controls[pairKey].valueChanges.subscribe(value => {
      console.log(value);
      const pair = this.pairs.find(x => x.value === value);
      this.selectedPairSymbol = pair.label;
      this.selectedPairLabel = pair.title;
      this.selectedPairId = pair.value;
    });
  }

  public onCopiedClick() {
    this.copied = true;
  }

  public showAllAddresses() {
    this.showAll = true;
    this.getAddresses();
  }

  public showOneAddress() {
    this.getUnusedReceiveAddresses();
    this.showAll = false;
    this.isPriceLock = false;
  }

  public showPriceLock() {
    this.isPriceLock = true;
  }

  public createPriceLock() {
    this.isPriceLockBusy = true;
    this.isPriceLockVerifying = false;
    this.errorMessage = '';
    const amount: number = parseFloat(parseFloat(this.priceLockForm.get('amount').value).toFixed(2));
    if (amount > 0.00) {
      const createPLRequest = new CreatePriceLockRequest(amount, this.selectedPairId, this.address, this.blockExpire);
      console.log(createPLRequest);
      this.apiService.createPriceLock(createPLRequest)
        .subscribe(
          response => {
            console.log(response);
            if (response.success) {
              if (response.destinationAddress !== this.address) {
                this.errorMessage = 'Destination address verification failed, try again.';
                return;
              }
              if (response.requestAmount !== amount) {
                this.errorMessage = 'Destination amount verification failed, try again.';
                return;
              }
              const paymentKey = `${response.priceLockId}${this.address}${response.destinationAmount}${response.feeAddress}${response.feeAmount}`;
              this.verifyPaymentSignature(paymentKey, response.priceLockSignature, response.signAddress, response.priceLockId);
              this.destinationAmount = response.destinationAmount;
              this.feeAmount = response.feeAmount;
              this.expirationBlock = response.expireBlock;
            } else {
              this.errorMessage = response.resultMessage;
              this.isPriceLockBusy = false;
            }
          }
        );
    } else {
      this.errorMessage = 'Invalid amount.';
    }
  }

  private verifyPaymentSignature(paymentKey: string, signature: string, signAddress: string, priceLockId: string) {
    this.isPriceLockVerifying = true;
    const verifyRequest = new VerifyRequest(signature, signAddress, paymentKey);
    console.log(verifyRequest);
    this.apiService.verifyMessage(verifyRequest)
      .subscribe(
        response => {
          if (response.toLowerCase() === 'true') {
            this.priceLockUtil.setPriceLockId(priceLockId);
            this.priceLockId = this.priceLockUtil.priceLockId;
            console.log(this.priceLockId);
            this.isPriceLockBusy = false;
          } else {
            this.errorMessage = 'Payment verification failed, try again.';
            this.isPriceLockBusy = false;
          }
          this.isPriceLockVerifying = false;
        }
      );
  }

  private getUnusedReceiveAddresses() {
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.apiService.getUnusedReceiveAddress(walletInfo)
      .subscribe(
        response => {
          this.address = response;
          this.qrString = response;
        }
      );
  }

  public getSymbolCharacter(symbol: string) {
    return this.globalService.getSymbolCharacter(symbol);
  }

  private getAddresses() {
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.apiService.getAllAddresses(walletInfo)
      .subscribe(
        response => {
          this.allAddresses = [];
          this.usedAddresses = [];
          this.unusedAddresses = [];
          this.changeAddresses = [];
          this.allAddresses = response.addresses;

          for (const address of this.allAddresses) {
            if (address.isUsed) {
              this.usedAddresses.push(address.address);
            } else if (address.isChange) {
              this.changeAddresses.push(address.address);
            } else {
              this.unusedAddresses.push(address.address);
            }
          }
        }
      );
  }

  private getPairs() {
    this.isPriceLockBusy = true;
    this.apiService.getAvailablePairs()
      .subscribe(
        response => {
          this.pairs = [];
          for (const pair of response) {
            const symbolChar = this.getSymbolCharacter(pair.symbol);
            this.pairs.push({ title: pair.symbol, label: symbolChar, value: pair.id });
          }

          this.isPriceLockBusy = false;
        }
      );
  }

  public showAboutPriceLocks() {
    this.showAbout = true;
  }

  public openPriceLockAbout() {
    this.electronService.shell.openExternal('https://github.com/x42protocol/xCore/wiki/Price-Locks');
  }
}
