import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder, AbstractControl } from '@angular/forms';

import { FullNodeApiService } from '../../../shared/services/fullnode.api.service';
import { GlobalService } from '../../../shared/services/global.service';
import { CoinNotationPipe } from '../../../shared/pipes/coin-notation.pipe';

import { FeeEstimation } from '../../../shared/models/fee-estimation';
import { TransactionBuilding } from '../../../shared/models/transaction-building';
import { WalletInfo } from '../../../shared/models/wallet-info';
import { ThemeService } from '../../../shared/services/theme.service';

import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { DynamicDialogRef, DynamicDialogConfig, DialogService } from 'primeng/dynamicdialog';
import { PriceLockUtil } from '../../../shared/models/pricelockutil';
import { SubmitPaymentRequest } from '../../../shared/models/xserver-submit-payment-request';
import { SignMessageRequest } from '../../../shared/models/wallet-signmessagerequest';
import { ProfileReserveRequest } from '../../../shared/models/xserver-profile-reserve-request';

interface TxDetails {
  transactionFee?: number
  sidechainEnabled?: boolean
  opReturnAmount?: number
  hasOpReturn?: boolean
  amount?: any
}

@Component({
  selector: 'create-profile',
  templateUrl: './create-profile.component.html',
  styleUrls: ['./create-profile.component.css'],
})

export class CreateProfileComponent implements OnInit, OnDestroy {
  constructor(private apiService: FullNodeApiService, private globalService: GlobalService, private fb: FormBuilder, public dialogService: DialogService, public ref: DynamicDialogRef, public config: DynamicDialogConfig, private themeService: ThemeService) {
    this.buildPaymentForm();
    this.isDarkTheme = themeService.getCurrentTheme().themeType == 'dark';
  }

  public paymentForm: FormGroup;
  public coinUnit: string;
  public isSending: boolean = false;
  public isDarkTheme = false;
  public estimatedFee: number = 0;
  public totalBalance: number = 0;
  public apiError: string;
  public transactionComplete: boolean;
  public transactionDetails: TxDetails;
  public transaction: TransactionBuilding;
  public isPayment: boolean;
  public isLookingUpPriceLock: boolean;
  public priceLockFound: boolean;
  public remainingTitle: string;
  public remainingSubTitle: string;
  public priceLockId: string;
  public blocksRemaining: number;
  public percentageLeft: number;
  public payToAddress: string;
  public payFeeToAddress: string;
  public paymentTotal: string;
  public paymentAmount: number;
  public paymentFee: number;
  public paymentPairAmount: number;
  public pairSymbol: string;
  public pairName: string;
  public paymentExpired: boolean;
  public paymentSuccess: boolean;
  public paymentMessage: string;
  public paymentSeverity: string;

  public profileSearching: boolean;
  public profileReserving: boolean;
  public profileName: string;
  public profileStatus: number = 0;
  public profile: any;
  public profileReserveExpireBlock: number;

  public outerColor: string = "#78C000";
  public innerColor: string = "#C7E596";

  private paymentPairId: number;
  private walletBalanceSubscription: Subscription;

  public mainAccount: string = "account 0";
  public coldStakingAccount: string = "coldStakingColdAddresses";
  public hotStakingAccount: string = "coldStakingHotAddresses";

  ngOnInit() {
    this.startSubscriptions();
    this.coinUnit = this.globalService.getCoinUnit();

    if (this.config.data !== undefined && this.config.data.priceLockId != "") {
      console.log(this.config.data);
      this.priceLockId = this.config.data.priceLockId;
      this.getPriceLock(this.priceLockId)
    }
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  };

  private buildPaymentForm(): void {
    this.paymentForm = this.fb.group({
      "paymentPassword": ["", Validators.required]
    });

    this.paymentForm.valueChanges.pipe(debounceTime(300))
      .subscribe(data => this.onPaymentValueChanged(data));
  }

  checkProfileAvailability() {
    this.profileSearching = true;
    let xServerStatus = this.globalService.getxServerStatus();
    if (xServerStatus.nodes.length > 0) {
      let tierTwo = xServerStatus.nodes.find(n => n.tier == 2);
      if (tierTwo) {
        this.apiService.getProfile(this.profileName, "")
          .subscribe(
            response => {
              if (response.success) {
                console.log(response);
                this.profileStatus = response.status;
                this.profile = response;
                if (response.status == 1) {
                  this.profileReserveExpireBlock = response.reservationExpirationBlock
                }
              } else {
                this.profileStatus = -1;
              }
              this.profileSearching = false;
            }
          );
      }
    }
  }

  startProfileReservation() {
    this.profileReserving = true;

    let walletInfo = new WalletInfo(this.globalService.getWalletName())
    this.apiService.getUnusedReceiveAddress(walletInfo)
      .subscribe(
        unusedAddress => {
          this.signProfileRequest(unusedAddress);
        }
      );
  }

  signProfileRequest(returnAddress: string) {
    let walletName = this.globalService.getWalletName();
    let serverKey = `${this.profileName}${returnAddress}`;
    let keyAddress = this.globalService.getWalletKeyAddress();
    let password = this.paymentForm.get("paymentPassword").value;

    let signMessageRequest = new SignMessageRequest(walletName, this.coldStakingAccount, password, keyAddress, serverKey);

    this.apiService.signMessage(signMessageRequest)
      .subscribe(
        response => {
          let profileRequest = new ProfileReserveRequest(
            this.profileName,
            keyAddress,
            returnAddress,
            response.signature
          );
          this.reserveProfile(profileRequest);
        }
      );
  }

  reserveProfile(profileReserveRequest: ProfileReserveRequest) {
    this.apiService.reserveProfile(profileReserveRequest)
      .subscribe(
        response => {
          if (response.success) {
            console.log(response);
            if (response.status == 1) {
              this.profileReserveExpireBlock = response.reservationExpirationBlock
            }

            if (response.priceLockId) {
              this.profileStatus = response.status;
              this.profile = response;
              this.globalService.setProfile(null); // Reset profile. 
              this.getPriceLock(response.priceLockId);
            } else {
              this.profileReserving = false;
              this.apiError = response.resultMessage;
              this.profileStatus = -1;
            }
          } else {
            this.profileStatus = -1;
          }
          this.profileReserving = false;
        },
        error => {
          this.apiError = error.error.errors[0].message;
          this.profileReserving = false;
          this.profileStatus = -1;
        }
      );
  }

  getPriceLock(priceLockId: string) {
    this.priceLockId = priceLockId;
    this.isLookingUpPriceLock = true;
    this.paymentForm.reset();
    this.apiService.getPriceLock(priceLockId)
      .subscribe(
        response => {
          if (response.success) {
            this.getPairs(response);
          } else {
            this.apiError = response.resultMessage;
            this.profileReserving = false;
            this.isPayment = true;
          }
        },
        error => {
          this.apiError = error.error.errors[0].message;
          this.profileReserving = false;
          this.isLookingUpPriceLock = false;
          this.isPayment = true;
        }
      );
  }

  onPaymentValueChanged(data?: any) {
    if (!this.paymentForm) { return; }
    const form = this.paymentForm;
    for (const field in this.paymentFormErrors) {
      this.paymentFormErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.paymentValidationMessages[field];
        for (const key in control.errors) {
          this.paymentFormErrors[field] += messages[key] + ' ';
        }
      }
    }

    this.apiError = "";
  }

  public showPriceLock() {
    this.isPayment = true;
  }

  private getPairs(priceLockInfo: any) {
    this.apiService.getAvailablePairs()
      .subscribe(
        response => {
          this.payToAddress = priceLockInfo.destinationAddress;
          this.paymentTotal = parseFloat(priceLockInfo.destinationAmount + priceLockInfo.feeAmount).toFixed(8);
          this.paymentAmount = priceLockInfo.destinationAmount;
          this.paymentFee = priceLockInfo.feeAmount;
          this.payFeeToAddress = priceLockInfo.feeAddress;

          this.paymentPairAmount = priceLockInfo.requestAmount;
          this.paymentPairId = priceLockInfo.requestAmountPair;

          for (let pair of response) {
            if (this.paymentPairId == pair.id) {
              let symbolChar = this.globalService.getSymbolCharacter(pair.symbol);
              this.pairName = pair.symbol;
              this.pairSymbol = symbolChar;
              break;
            }
          }

          this.updateProggress(priceLockInfo);
          this.startProgress(priceLockInfo);
          this.setPaymentStatus(priceLockInfo.status);

          this.isLookingUpPriceLock = false;
          this.priceLockFound = true;

          this.updatePriceLockStatus();
        }
      );
  }

  private setPaymentStatus(status) {
    if (status == 0) {
      this.paymentMessage = "Rejected";
      this.paymentSeverity = "error";
    } else if (status == 1) {
      this.paymentMessage = "Awaiting Payment...";
      this.paymentSeverity = "info";
    } else if (status == 2) {
      this.paymentMessage = "Payment received.";
      this.paymentSeverity = "success";
      this.paymentSuccess = true;
    } else if (status == 3) {
      this.paymentMessage = "Payment confirmed";
      this.paymentSeverity = "success";
      this.paymentSuccess = true;
    } else if (status == 4) {
      this.paymentMessage = "Payment mature";
      this.paymentSeverity = "success";
      this.paymentSuccess = true;
    }
  }

  private updatePriceLockStatus() {
    let interval = setInterval(() => {
      if (this.priceLockId != "") {
        this.apiService.getPriceLock(this.priceLockId)
          .subscribe(
            response => {
              if (response.success) {
                this.setPaymentStatus(response.status);
                if (response.status == 0 || response.status == 4) {
                  clearInterval(interval);
                }
              }
            }
          );
      }
    }, 30000);
  }

  private updateProggress(priceLockInfo: any) {
    this.blocksRemaining = priceLockInfo.expireBlock - this.globalService.getBlockHeight();
    this.percentageLeft = (this.blocksRemaining / 60) * 100
    this.paymentExpired = this.blocksRemaining <= 0;

    if (this.paymentExpired) {
      this.remainingTitle = "Expired";
      this.remainingSubTitle = " ";
    } else {
      this.remainingTitle = this.blocksRemaining + " blocks remaining";
      this.remainingSubTitle = "Expires in ~" + this.blocksRemaining + " minutes";
    }

    this.setProgressColors();
  }

  private startProgress(priceLockInfo: any) {
    let interval = setInterval(() => {
      this.updateProggress(priceLockInfo);
      if (this.blocksRemaining < 0) {
        clearInterval(interval);
      }
    }, 1000);
  }

  private setProgressColors() {
    if (this.percentageLeft <= 0) {
      this.outerColor = "#ff0000";
      this.innerColor = "#ff0000";
    } else if (this.percentageLeft < 25) {
      this.outerColor = "#FF6347";
      this.innerColor = "#ff0000";
    } else if (this.percentageLeft < 50) {
      this.outerColor = "#ffb10a";
      this.innerColor = "#FF6347";
    } else if (this.percentageLeft < 75) {
      this.outerColor = "#78C000";
      this.innerColor = "#ffb10a";
    }
  }

  makePayment() {
    this.isSending = true;
    this.buildPaymentTransaction();
  }

  public buildPaymentTransaction() {
    this.transaction = new TransactionBuilding(
      this.globalService.getWalletName(),
      "account 0",
      this.paymentForm.get("paymentPassword").value,
      this.payToAddress,
      this.paymentAmount.toString(),
      this.estimatedFee / 100000000,
      true,
      false
    );

    this.transaction.AddRecipient(this.payFeeToAddress, this.paymentFee.toString());

    this.apiService
      .buildTransaction(this.transaction, true)
      .subscribe(
        response => {
          console.log(response);
          this.estimatedFee = response.fee;
          if (this.isSending) {
            this.signPaymentId(response);
          }
        },
        error => {
          this.isSending = false;
          this.apiError = error.error.errors[0].message;
        }
      );
  };

  private signPaymentId(builtTransaction) {
    let walletName = this.globalService.getWalletName();
    let accountName = "account 0";
    let address = builtTransaction.inputAddresses[0];
    console.log(this.priceLockId);
    let signMessageRequest = new SignMessageRequest(walletName, accountName, this.paymentForm.get("paymentPassword").value, address, this.priceLockId);
    console.log(signMessageRequest);
    this.apiService.signMessage(signMessageRequest)
      .subscribe(
        signatureResponse => {
          let payment = new SubmitPaymentRequest(
            this.priceLockId,
            builtTransaction.hex,
            builtTransaction.transactionId,
            signatureResponse.signature
          );
          console.log(signatureResponse);
          this.submitPayment(payment);
        }
      );
  }

  submitPayment(paymentRequest) {
    this.apiService.submitPayment(paymentRequest)
      .subscribe(
        paymentResponse => {
          this.paymentSuccess = paymentResponse.success;
          if (paymentResponse.success) {
            this.paymentMessage = "Payment sent!";
            this.paymentSeverity = "success";
          }
          this.isSending = false;
        }
      );
  }


  paymentFormErrors = {
    'paymentPassword': ''
  };

  paymentValidationMessages = {
    'paymentPassword': {
      'required': 'Your password is required.'
    }
  };

  private getWalletBalance() {
    let walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.walletBalanceSubscription = this.apiService.getWalletBalance(walletInfo)
      .subscribe(
        response => {
          let balanceResponse = response;
          //TO DO - add account feature instead of using first entry in array
          this.totalBalance = balanceResponse.balances[0].amountConfirmed + balanceResponse.balances[0].amountUnconfirmed;
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

  public goBack() {
    this.profileStatus = 0;
    this.apiError = "";
  }

  private cancelSubscriptions() {
    if (this.walletBalanceSubscription) {
      this.walletBalanceSubscription.unsubscribe();
    }
  };

  private startSubscriptions() {
    this.getWalletBalance();
  }
}
