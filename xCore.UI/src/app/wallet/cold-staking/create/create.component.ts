import { Component, OnInit, OnDestroy } from '@angular/core';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { FormGroup, Validators, FormBuilder, AbstractControl } from '@angular/forms';

import { GlobalService } from '../../../shared/services/global.service';
import { CoinNotationPipe } from '../../../shared/pipes/coin-notation.pipe';
import { FullNodeApiService } from '../../../shared/services/fullnode.api.service';
import { ThemeService } from '../../../shared/services/theme.service';

import { FeeEstimation } from '../../../shared/models/fee-estimation';

import { ColdStakingService } from '../../../shared/services/coldstaking.service';
import { TransactionSending } from "../../../shared/models/transaction-sending";
import { Router } from '@angular/router';
import { ColdStakingSetup } from "../../../shared/models/coldstakingsetup";
import { ColdStakingCreateSuccessComponent } from "../create-success/create-success.component";
import { WalletInfo } from '../../../shared/models/wallet-info';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

type FeeType = { id: number, display: string, value: number };

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class ColdStakingCreateComponent implements OnInit, OnDestroy {
  feeTypes: FeeType[] = [];
  selectedFeeType: FeeType;

  constructor(private apiService: FullNodeApiService, private globalService: GlobalService, private stakingService: ColdStakingService, public activeModal: DynamicDialogRef, public dialogService: DialogService, private fb: FormBuilder, private themeService: ThemeService, private router: Router) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType == 'dark';
    this.setCoinUnit();
    this.buildSendForm();
  }

  public sendForm: FormGroup;
  public coinUnit: string;
  public spendableBalance: number = 0;
  public apiError: string;
  private walletBalanceSubscription: Subscription;
  public totalBalance: number = 0;
  public isSending: boolean = false;
  public estimatedFee: number = 0;
  public isDarkTheme = false;

  public mainAccount: string = "account 0";
  public coldStakingAccount: string = "coldStakingColdAddresses";
  public hotStakingAccount: string = "coldStakingHotAddresses";

  public ngOnInit() {
    this.startSubscriptions();
  }

  private setCoinUnit(): void {
    this.coinUnit = this.globalService.getCoinUnit();
  }

  private buildSendForm(): void {
    this.sendForm = this.fb.group({
      "hotWalletAddress": ["", Validators.compose([Validators.required, Validators.minLength(26)])],
      "amount": ["", Validators.compose([Validators.required, Validators.pattern(/^([0-9]+)?(\.[0-9]{0,8})?$/), Validators.min(0.00001), (control: AbstractControl) => Validators.max((this.spendableBalance - this.estimatedFee) / 100000000)(control)])],
      "password": ["", Validators.required],
      "fee": ["medium", Validators.required]
    });

    this.sendForm.valueChanges.pipe(debounceTime(300))
      .subscribe(data => this.onSendValueChanged(data));
  }

  private onSendValueChanged(data?: any) {
    if (!this.sendForm) { return; }
    const form = this.sendForm;
    for (const field in this.sendFormErrors) {
      this.sendFormErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.sendValidationMessages[field];
        for (const key in control.errors) {
          this.sendFormErrors[field] += messages[key] + ' ';
        }
      }
    }

    this.apiError = "";

    if (this.sendForm.get("hotWalletAddress").valid && this.sendForm.get("amount").valid) {
      this.estimateFee();
    }
  }

  sendFormErrors = {
    'hotWalletAddress': '',
    'amount': '',
    'password': ''
  };

  sendValidationMessages = {
    'hotWalletAddress': {
      'required': 'An delegated staking address is required.',
      'minlength': 'An a delegated staking address is at least 26 characters long.'
    },
    'amount': {
      'required': 'An amount is required.',
      'pattern': 'Enter a valid transaction amount. Only positive numbers and no more than 8 decimals are allowed.',
      'min': "The amount has to be more or equal to 0.00001 XLR.",
      'max': 'The total transaction amount exceeds your spendable balance.'
    },
    'password': {
      'required': 'Your password is required.'
    }
  };

  private getWalletBalance() {
    let walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.walletBalanceSubscription = this.apiService.getWalletBalance(walletInfo)
      .subscribe(
        response => {
          if (response != null) {
            let balanceResponse = response;
            this.totalBalance = balanceResponse.balances[0].amountConfirmed + balanceResponse.balances[0].amountUnconfirmed;
            this.spendableBalance = balanceResponse.balances[0].spendableAmount;
          }
        },
        error => {
          if (error.status === 0) {
            this.cancelSubscriptions();
          } else if (error.status >= 400) {
            if (!error.error.errors[0].message) {
              this.cancelSubscriptions();
              this.startSubscriptions();
            }
          }
        }
      );
  };

  public getMaxBalance() {
    let data = {
      walletName: this.globalService.getWalletName(),
      feeType: this.sendForm.get("fee").value
    }

    let balanceResponse;

    this.apiService.getMaximumBalance(data)
      .subscribe(
        response => {
          balanceResponse = response;
        },
        error => {
          this.apiError = error.error.errors[0].message;
        },
        () => {
          this.sendForm.patchValue({ amount: +new CoinNotationPipe().transform(balanceResponse.maxSpendableAmount) });
          this.estimatedFee = balanceResponse.fee;
        }
      )
  };

  private startSubscriptions() {
    this.getWalletBalance();
  }

  private cancelSubscriptions() {
    if (this.walletBalanceSubscription) {
      this.walletBalanceSubscription.unsubscribe();
    }
  };

  public send() {
    this.isSending = true;
    this.buildTransaction();
  };

  public ngOnDestroy() {
    this.cancelSubscriptions();
  };

  public estimateFee() {
    let transaction = new FeeEstimation(
      this.globalService.getWalletName(),
      this.mainAccount,
      this.sendForm.get("hotWalletAddress").value.trim(),
      this.sendForm.get("amount").value,
      this.sendForm.get("fee").value,
      true
    );

    this.apiService.estimateFee(transaction)
      .subscribe(
        response => {
          this.estimatedFee = response;
        },
        error => {
          this.apiError = error.error.errors[0].message;
        }
      );
  }

  public deligatedTransactionSent(transactionId: string) {
    this.activeModal.close("Transaction Sent");
    this.dialogService.open(ColdStakingCreateSuccessComponent, {
      header: 'Success',
      width: '540px'
    });
  }

  public buildTransaction(): void {
    const walletName = this.globalService.getWalletName();
    const walletPassword = this.sendForm.get("password").value;
    const amount = this.sendForm.get("amount").value;
    const hotWalletAddress = this.sendForm.get("hotWalletAddress").value.trim();
    const accountName = "account 0";
    const fee = this.estimatedFee;

    this.apiService.validateAddress(hotWalletAddress).subscribe(
      address => {
        this.stakingService.createColdStakingAccount(walletName, walletPassword, true)
          .subscribe(
            createColdStakingAccountResponse => {
              this.stakingService.getAddress(walletName, true, address.iswitness.toString().toLowerCase()).subscribe(getAddressResponse => {
                this.stakingService.createColdstaking(new ColdStakingSetup(
                  hotWalletAddress,
                  getAddressResponse.address,
                  amount,
                  walletName,
                  walletPassword,
                  accountName,
                  fee
                ))
                  .subscribe(
                    createColdstakingResponse => {
                      const transaction = new TransactionSending(createColdstakingResponse.transactionHex);
                      this.apiService
                        .sendTransaction(transaction)
                        .subscribe(
                          sendTransactionResponse => {
                            this.deligatedTransactionSent(sendTransactionResponse.transactionId)
                          },
                          error => {
                            this.isSending = false;
                            this.apiError = error.error.errors[0].message;
                          }
                        );
                    },
                    error => {
                      this.isSending = false;
                      this.apiError = error.error.errors[0].message;
                    }
                  );
              },
                error => {
                  this.isSending = false;
                  this.apiError = error.error.errors[0].message;
                });
            },
            error => {
              this.isSending = false;
              this.apiError = error.error.errors[0].message;
            },
          )
      },
      error => {
        this.isSending = false;
        this.apiError = error.error.errors[0].message;
      }
    );
  }


}
