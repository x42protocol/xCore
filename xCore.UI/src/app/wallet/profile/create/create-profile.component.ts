import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ApiService } from '../../../shared/services/api.service';
import { GlobalService } from '../../../shared/services/global.service';
import { Logger } from '../../../shared/services/logger.service';
import { TransactionBuilding } from '../../../shared/models/transaction-building';
import { WalletInfo } from '../../../shared/models/wallet-info';
import { ThemeService } from '../../../shared/services/theme.service';
import { WorkerService } from '../../../shared/services/worker.service';
import { WorkerType } from '../../../shared/models/worker';
import { debounceTime, finalize } from 'rxjs/operators';
import { DynamicDialogRef, DynamicDialogConfig, DialogService } from 'primeng/dynamicdialog';
import { SubmitPaymentRequest } from '../../../shared/models/xserver-submit-payment-request';
import { SignMessageRequest } from '../../../shared/models/wallet-signmessagerequest';
import { ProfileReserveRequest } from '../../../shared/models/xserver-profile-reserve-request';

interface TxDetails {
  transactionFee?: number;
  sidechainEnabled?: boolean;
  opReturnAmount?: number;
  hasOpReturn?: boolean;
  amount?: any;
}

@Component({
  selector: 'app-create-profile',
  templateUrl: './create-profile.component.html',
  styleUrls: ['./create-profile.component.css'],
})
export class CreateProfileComponent implements OnInit, OnDestroy {
  constructor(
    private apiService: ApiService,
    private globalService: GlobalService,
    private fb: FormBuilder,
    public dialogService: DialogService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    public themeService: ThemeService,
    private log: Logger,
    private worker: WorkerService,
  ) {
    this.buildPaymentForm();
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
  }

  public balanceLoaded = false;
  public paymentForm: FormGroup;
  public coinUnit: string;
  public isSending = false;
  public isDarkTheme = false;
  public estimatedFee = 0;
  public totalBalance = 0;
  public apiError: string;
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
  public profileStatus = 0;
  public profile: any;
  public profileReserveExpireBlock: number;

  public outerColor = '#78C000';
  public innerColor = '#C7E596';

  private paymentPairId: number;

  public mainAccount = 'account 0';
  public coldStakingAccount = 'coldStakingColdAddresses';
  public hotStakingAccount = 'coldStakingHotAddresses';

  paymentFormErrors = {
    paymentPassword: ''
  };

  paymentValidationMessages = {
    paymentPassword: {
      required: 'Your password is required.'
    }
  };


  ngOnInit() {
    this.coinUnit = this.globalService.getCoinUnit();

    if (this.config.data !== undefined && this.config.data.priceLockId !== '') {
      console.log(this.config.data);
      this.priceLockId = this.config.data.priceLockId;
      this.getPriceLock(this.priceLockId);
    } else {
      this.startMethods();
    }
  }

  startMethods() {
    this.worker.timerStatusChanged.subscribe((status) => {
      if (status.running) {
        if (status.worker === WorkerType.ACCOUNT_BALANCE) { this.updateAccountBalanceDetails(); }
      }
    });
    this.worker.Start(WorkerType.ACCOUNT_BALANCE);
    this.updateAccountBalanceDetails();
  }

  ngOnDestroy() {
    this.worker.Stop(WorkerType.ACCOUNT_BALANCE);
  }

  private buildPaymentForm(): void {
    this.paymentForm = this.fb.group({
      paymentPassword: ['', Validators.required]
    });

    this.paymentForm.valueChanges.pipe(debounceTime(300))
      .subscribe(data => this.onPaymentValueChanged(data));
  }

  checkProfileAvailability() {
    this.profileSearching = true;
    const xServerStatus = this.globalService.getxServerStatus();
    if (xServerStatus.nodes.length > 0) {
      const tierTwo = xServerStatus.nodes.find(n => n.tier === 2);
      if (tierTwo) {
        this.apiService.getProfile(this.profileName, '')
          .subscribe(
            response => {
              if (response.success) {
                console.log(response);
                this.profileStatus = response.status;
                this.profile = response;
                if (response.status === 1) {
                  this.profileReserveExpireBlock = response.reservationExpirationBlock;
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

    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.apiService.getUnusedReceiveAddress(walletInfo)
      .subscribe(
        unusedAddress => {
          this.signProfileRequest(unusedAddress);
        }
      );
  }

  signProfileRequest(returnAddress: string) {
    const walletName = this.globalService.getWalletName();
    const serverKey = `${this.profileName}${returnAddress}`;
    const keyAddress = this.globalService.getWalletKeyAddress();
    const password = this.paymentForm.get('paymentPassword').value;

    const signMessageRequest = new SignMessageRequest(walletName, this.coldStakingAccount, password, keyAddress, serverKey);

    this.apiService.signMessage(signMessageRequest)
      .subscribe(
        response => {
          const profileRequest = new ProfileReserveRequest(
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
            if (response.status === 1) {
              this.profileReserveExpireBlock = response.reservationExpirationBlock;
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

    // tslint:disable-next-line:forin
    for (const field in this.paymentFormErrors) {
      this.paymentFormErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.paymentValidationMessages[field];

        // tslint:disable-next-line:forin
        for (const key in control.errors) {
          this.paymentFormErrors[field] += messages[key] + ' ';
        }
      }
    }

    this.apiError = '';
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

          for (const pair of response) {
            if (this.paymentPairId === pair.id) {
              const symbolChar = this.globalService.getSymbolCharacter(pair.symbol);
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
    if (status === 0) {
      this.paymentMessage = 'Rejected';
      this.paymentSeverity = 'error';
    } else if (status === 1) {
      this.paymentMessage = 'Awaiting Payment...';
      this.paymentSeverity = 'info';
    } else if (status === 2) {
      this.paymentMessage = 'Payment received.';
      this.paymentSeverity = 'success';
      this.paymentSuccess = true;
    } else if (status === 3) {
      this.paymentMessage = 'Payment confirmed';
      this.paymentSeverity = 'success';
      this.paymentSuccess = true;
    } else if (status === 4) {
      this.paymentMessage = 'Payment mature';
      this.paymentSeverity = 'success';
      this.paymentSuccess = true;
    }
  }

  private updatePriceLockStatus() {
    const interval = setInterval(() => {
      if (this.priceLockId !== '') {
        this.apiService.getPriceLock(this.priceLockId)
          .subscribe(
            response => {
              if (response.success) {
                this.setPaymentStatus(response.status);
                if (response.status === 0 || response.status === 4) {
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
    this.percentageLeft = (this.blocksRemaining / 60) * 100;
    this.paymentExpired = this.blocksRemaining <= 0;

    if (this.paymentExpired) {
      this.remainingTitle = 'Expired';
      this.remainingSubTitle = ' ';
    } else {
      this.remainingTitle = this.blocksRemaining + ' blocks remaining';
      this.remainingSubTitle = 'Expires in ~' + this.blocksRemaining + ' minutes';
    }

    this.setProgressColors();
  }

  private startProgress(priceLockInfo: any) {
    const interval = setInterval(() => {
      this.updateProggress(priceLockInfo);
      if (this.blocksRemaining < 0) {
        clearInterval(interval);
      }
    }, 1000);
  }

  private setProgressColors() {
    if (this.percentageLeft <= 0) {
      this.outerColor = '#ff0000';
      this.innerColor = '#ff0000';
    } else if (this.percentageLeft < 25) {
      this.outerColor = '#FF6347';
      this.innerColor = '#ff0000';
    } else if (this.percentageLeft < 50) {
      this.outerColor = '#ffb10a';
      this.innerColor = '#FF6347';
    } else if (this.percentageLeft < 75) {
      this.outerColor = '#78C000';
      this.innerColor = '#ffb10a';
    }
  }

  makePayment() {
    this.isSending = true;
    this.buildPaymentTransaction();
  }

  public buildPaymentTransaction() {
    this.transaction = new TransactionBuilding(
      this.globalService.getWalletName(),
      'account 0',
      this.paymentForm.get('paymentPassword').value,
      this.payToAddress,
      this.paymentAmount.toString(),
      this.estimatedFee / 100000000,
      true,
      false
    );

    this.transaction.AddRecipient(this.payFeeToAddress, this.paymentFee.toString());

    this.apiService
      .buildTransaction(this.transaction)
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
  }

  private signPaymentId(builtTransaction) {
    const walletName = this.globalService.getWalletName();
    const accountName = 'account 0';
    const address = builtTransaction.inputAddress;
    console.log(this.priceLockId);
    const signMessageRequest = new SignMessageRequest(walletName, accountName, this.paymentForm.get('paymentPassword').value, address, this.priceLockId);
    console.log(signMessageRequest);
    this.apiService.signMessage(signMessageRequest)
      .subscribe(
        signatureResponse => {
          const payment = new SubmitPaymentRequest(
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
            this.paymentMessage = 'Payment sent!';
            this.paymentSeverity = 'success';
          }
          this.isSending = false;
        }
      );
  }

  private updateAccountBalanceDetails() {
    this.worker.Stop(WorkerType.ACCOUNT_BALANCE);
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.apiService.getWalletBalanceOnce(walletInfo)
      .pipe(finalize(() => {
        this.worker.Start(WorkerType.ACCOUNT_BALANCE);
      }))
      .subscribe(
        balanceResponse => {
          this.log.info('Get account balance result:', balanceResponse);
          this.totalBalance = balanceResponse.balances[0].amountConfirmed + balanceResponse.balances[0].amountUnconfirmed;
          this.balanceLoaded = true;
        },
        error => {
          this.apiService.handleException(error);
        }
      );
  }

  public goBack() {
    this.profileStatus = 0;
    this.apiError = '';
  }

}
