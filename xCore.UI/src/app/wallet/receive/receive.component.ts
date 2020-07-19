import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { FullNodeApiService } from '../../shared/services/fullnode.api.service';
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
  selector: 'receive-component',
  templateUrl: './receive.component.html',
  styleUrls: ['./receive.component.css'],
})

export class ReceiveComponent implements OnInit {
  constructor(private apiService: FullNodeApiService, private globalService: GlobalService, private themeService: ThemeService, public ref: DynamicDialogRef, private electronService: ElectronService, private fb: FormBuilder) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType == 'dark';
    this.buildCreatePLForm();
  }

  public priceLockForm: FormGroup;
  public address: any = "";
  public qrString: any;
  public copied: boolean = false;
  public showAll = false;
  public allAddresses: any;
  public usedAddresses: string[];
  public unusedAddresses: string[];
  public changeAddresses: string[];
  public pageNumberUsed: number = 1;
  public pageNumberUnused: number = 1;
  public pageNumberChange: number = 1;
  public isDarkTheme = false;
  public types: SelectItem[];
  public copyType: SelectItem[];
  public selectedType: string;
  public isPriceLock: boolean;
  public isPriceLockBusy: boolean;
  public isPriceLockVerifying: boolean;
  public priceLockId: string;
  public currentBlock: number = 896818;
  public blockExpire: number;
  public pairs: SelectItem[];
  public selectedPairSymbol: string = "$";
  public selectedPairLabel: string = "USD";
  public selectedPairId: number = 1;
  public priceLockUtil: PriceLockUtil = new PriceLockUtil();
  public destinationAmount: string;
  public feeAmount: string;
  public expirationBlock: string;

  private errorMessage: string;
  private showAbout: boolean;

  ngOnInit() {
    this.getPairs();
    this.getUnusedReceiveAddresses();
    this.types = [
      { label: 'Unused Addresses', value: 'Unused', icon: 'fa fa-file-o' },
      { label: 'Used Addresses', value: 'Used', icon: 'fa fa-file-text-o' },
      { label: 'Change Addresses', value: 'Change', icon: 'fa fa-files-o' }
    ];
    this.selectedType = "Unused";

    this.copyType = [
      { label: 'Copy', value: 'Copy', icon: 'pi pi-copy' }
    ];

    this.priceLockForm.patchValue({ 'blockExpire': 45 })
  }

  private buildCreatePLForm(): void {
    this.priceLockForm = this.fb.group({
      "pair": [],
      "amount": [""],
      "blockExpire": ["", Validators.compose([Validators.required, Validators.minLength(15), Validators.maxLength(60)])],
    });

    this.priceLockForm.valueChanges.pipe(debounceTime(1))
      .subscribe(data => {
        this.priceLockForm.patchValue({ 'blockExpire': parseInt(data.blockExpire) });
        this.blockExpire = parseInt(data.blockExpire);
      });

    this.priceLockForm.controls['pair'].valueChanges.subscribe(value => {
      console.log(value);
      let pair = this.pairs.find(x => x.value === value)
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
    this.errorMessage = "";
    let amount: number = parseFloat(parseFloat(this.priceLockForm.get("amount").value).toFixed(2));
    if (amount > 0.00) {
      let createPLRequest = new CreatePriceLockRequest(amount, this.selectedPairId, this.address, this.blockExpire)
      console.log(createPLRequest);
      this.apiService.createPriceLock(createPLRequest)
        .subscribe(
          response => {
            console.log(response);
            if (response.success) {
              if (response.destinationAddress != this.address) {
                this.errorMessage = "Destination address verification failed, try again.";
                return;
              }
              if (response.requestAmount != amount) {
                this.errorMessage = "Destination amount verification failed, try again.";
                return;
              }
              let paymentKey = `${response.priceLockId}${this.address}${response.destinationAmount}${response.feeAddress}${response.feeAmount}`;
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
      this.errorMessage = "Invalid amount.";
    }
  };

  private verifyPaymentSignature(paymentKey: string, signature: string, signAddress: string, priceLockId: string) {
    this.isPriceLockVerifying = true;
    let verifyRequest = new VerifyRequest(signature, signAddress, paymentKey);
    console.log(verifyRequest);
    this.apiService.verifyMessage(verifyRequest)
      .subscribe(
        response => {
          if (response.toLowerCase() === "true") {
            this.priceLockUtil.setPriceLockId(priceLockId);
            this.priceLockId = this.priceLockUtil.priceLockId;
            console.log(this.priceLockId);
            this.isPriceLockBusy = false;
          } else {
            this.errorMessage = "Payment verification failed, try again.";
            this.isPriceLockBusy = false;
          }
          this.isPriceLockVerifying = false;
        }
      );
  }

  private getUnusedReceiveAddresses() {
    let walletInfo = new WalletInfo(this.globalService.getWalletName())
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
    let walletInfo = new WalletInfo(this.globalService.getWalletName())
    this.apiService.getAllAddresses(walletInfo)
      .subscribe(
        response => {
          this.allAddresses = [];
          this.usedAddresses = [];
          this.unusedAddresses = [];
          this.changeAddresses = [];
          this.allAddresses = response.addresses;

          for (let address of this.allAddresses) {
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
          for (let pair of response) {
            let symbolChar = this.getSymbolCharacter(pair.symbol);
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
    this.electronService.shell.openExternal("https://github.com/x42protocol/xCore/wiki/Price-Locks");
  }
}
