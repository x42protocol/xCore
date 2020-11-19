import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, Validators, FormBuilder, AbstractControl } from '@angular/forms';

import { ApiService } from '../../shared/services/api.service';
import { GlobalService } from '../../shared/services/global.service';
import { Logger } from '../../shared/services/logger.service';
import { WorkerService } from '../../shared/services/worker.service';
import { WorkerType } from '../../shared/models/worker';
import { CoinNotationPipe } from '../../shared/pipes/coin-notation.pipe';

import { FeeEstimation } from '../../shared/models/fee-estimation';
import { TransactionBuilding } from '../../shared/models/transaction-building';
import { TransactionSending } from '../../shared/models/transaction-sending';
import { ThemeService } from '../../shared/services/theme.service';
import { debounceTime, finalize } from 'rxjs/operators';

import { DynamicDialogRef, DynamicDialogConfig, DialogService } from 'primeng/dynamicdialog';
import { PriceLockUtil } from '../../shared/models/pricelockutil';
import { SubmitPaymentRequest } from '../../shared/models/xserver-submit-payment-request';
import { SignMessageRequest } from '../../shared/models/wallet-signmessagerequest';

interface TxDetails {
  transactionFee?: number;
  sidechainEnabled?: boolean;
  opReturnAmount?: number;
  hasOpReturn?: boolean;
  amount?: any;
}

@Component({
  selector: 'app-send-component',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.css'],
})
export class SendComponent implements OnInit, OnDestroy {
  private address: string;
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
    this.buildSendForm();
    this.buildPaymentForm();
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
  }

  public balanceLoaded: boolean;
  public sendForm: FormGroup;
  public paymentForm: FormGroup;
  public sendToSidechainForm: FormGroup;
  public sidechainEnabled: boolean;
  public hasOpReturn: boolean;
  public coinUnit: string;
  public isSending = false;
  public isDarkTheme = false;
  public estimatedFee = 0;
  public estimatedSidechainFee = 0;
  public totalBalance = 0;
  public apiError: string;
  public firstTitle: string;
  public secondTitle: string;
  public opReturnAmount = 1000;
  public transactionComplete: boolean;
  public transactionDetails: TxDetails;
  public transaction: TransactionBuilding;
  public isPayment: boolean;
  public isLookingUpPriceLock: boolean;
  public priceLockFound: boolean;
  public remainingTitle: string;
  public remainingSubTitle: string;
  public priceLockId: string;
  public priceLockUtil: PriceLockUtil = new PriceLockUtil();
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

  public outerColor = '#78C000';
  public innerColor = '#C7E596';

  private paymentPairId: number;
  private transactionHex: string;

  paymentFormErrors = {
    paymentPassword: ''
  };

  paymentValidationMessages = {
    paymentPassword: {
      required: 'Your password is required.'
    }
  };

  sendFormErrors = {
    address: '',
    amount: '',
    fee: '',
    password: ''
  };

  sendValidationMessages = {
    address: {
      required: 'An address is required.',
      minlength: 'An address is at least 26 characters long.'
    },
    amount: {
      required: 'An amount is required.',
      pattern: 'Enter a valid transaction amount. Only positive numbers and no more than 8 decimals are allowed.',
      min: 'The amount has to be more or equal to 0.00001 x42.',
      max: 'The total transaction amount exceeds your available balance.'
    },
    fee: {
      required: 'A fee is required.'
    },
    password: {
      required: 'Your password is required.'
    }
  };

  sendToSidechainFormErrors = {
    destionationAddress: '',
    federationAddress: '',
    amount: '',
    fee: '',
    password: ''
  };

  sendToSidechainValidationMessages = {
    destinationAddress: {
      required: 'An address is required.',
      minlength: 'An address is at least 26 characters long.'
    },
    federationAddress: {
      required: 'An address is required.',
      minlength: 'An address is at least 26 characters long.'
    },
    amount: {
      required: 'An amount is required.',
      pattern: 'Enter a valid transaction amount. Only positive numbers and no more than 8 decimals are allowed.',
      min: 'The amount has to be more or equal to 0.00001 x42.',
      max: 'The total transaction amount exceeds your available balance.'
    },
    fee: {
      required: 'A fee is required.'
    },
    password: {
      required: 'Your password is required.'
    }
  };

  ngOnInit() {
    this.sidechainEnabled = false;
    if (this.sidechainEnabled) {
      this.firstTitle = 'Sidechain';
      this.secondTitle = 'Mainchain';
    } else {
      this.firstTitle = 'Mainchain';
      this.secondTitle = 'Sidechain';
    }
    this.coinUnit = this.globalService.getCoinUnit();
    if (this.config.data !== undefined) {
      this.address = this.config.data.address;
      this.sendForm.patchValue({ address: this.address });
    }

    this.startMethods();
  }

  startMethods() {
    this.worker.timerStatusChanged.subscribe((status) => {
      if (status.running) {
        if (status.worker === WorkerType.ACCOUNT_BALANCE) { this.updateAccountBalanceDetails(); }
      }
    });
    this.worker.Start(WorkerType.ACCOUNT_BALANCE);
  }

  ngOnDestroy() {
    this.worker.Stop(WorkerType.ACCOUNT_BALANCE);
  }

  private buildSendForm(): void {
    this.sendForm = this.fb.group({
      address: ['', Validators.compose([Validators.required, Validators.minLength(26)])],
      amount: ['', Validators.compose([Validators.required, Validators.pattern(/^([0-9]+)?(\.[0-9]{0,8})?$/), Validators.min(0.00001), (control: AbstractControl) => Validators.max((this.totalBalance - this.estimatedFee) / 100000000)(control)])],
      fee: ['medium', Validators.required],
      password: ['', Validators.required]
    });

    this.sendForm.valueChanges.pipe(debounceTime(300))
      .subscribe(data => this.onSendValueChanged(data));
  }

  private buildPaymentForm(): void {
    this.paymentForm = this.fb.group({
      paymentPassword: ['', Validators.required]
    });

    this.paymentForm.valueChanges.pipe(debounceTime(300))
      .subscribe(data => this.onPaymentValueChanged(data));
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

  onSendValueChanged(data?: any) {
    if (!this.sendForm) { return; }
    const form = this.sendForm;

    // tslint:disable-next-line:forin
    for (const field in this.sendFormErrors) {
      this.sendFormErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.sendValidationMessages[field];

        // tslint:disable-next-line:forin
        for (const key in control.errors) {
          this.sendFormErrors[field] += messages[key] + ' ';
        }
      }
    }

    this.apiError = '';

    if (this.sendForm.get('address').valid && this.sendForm.get('amount').valid) {
      this.estimateFee();
    }
  }

  public showPriceLock() {
    this.isPayment = true;
  }

  public lookupPayment() {
    this.priceLockUtil.priceLockId = this.priceLockId;
    const paymentId = this.priceLockUtil.getPriceLockId();
    if (paymentId !== '') {
      this.isLookingUpPriceLock = true;
      this.apiService.getPriceLock(paymentId)
        .subscribe(
          response => {
            if (response.success) {
              this.getPairs(response);
            } else {
              this.apiError = response.resultMessage;
              this.isLookingUpPriceLock = false;
            }
          },
          error => {
            this.apiError = error.error.errors[0].message;
            this.isLookingUpPriceLock = false;
          }
        );
    }
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
      const paymentId = this.priceLockUtil.getPriceLockId();
      if (paymentId !== '') {
        this.isLookingUpPriceLock = true;
        this.apiService.getPriceLock(paymentId)
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
          this.transactionHex = response.hex;
          if (this.isSending) {
            this.hasOpReturn = false;
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

    const signMessageRequest = new SignMessageRequest(walletName, accountName, this.paymentForm.get('paymentPassword').value, address, this.priceLockUtil.getPriceLockId());

    this.apiService.signMessage(signMessageRequest)
      .subscribe(
        signatureResponse => {
          const payment = new SubmitPaymentRequest(
            this.priceLockUtil.getPriceLockId(),
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

  public getMaxBalance() {
    this.sendForm.patchValue({ amount: +new CoinNotationPipe(this.globalService).transform(this.totalBalance) });
  }

  public estimateFee() {
    const transaction = new FeeEstimation(
      this.globalService.getWalletName(),
      'account 0',
      this.sendForm.get('address').value.trim(),
      this.sendForm.get('amount').value,
      this.sendForm.get('fee').value,
      true
    );

    this.apiService.estimateFee(transaction)
      .subscribe(
        response => {
          this.estimatedFee = response;
        },
        error => {
          this.apiError = 'Invalid Address';
        }
      );
  }

  public buildTransaction() {
    this.transaction = new TransactionBuilding(
      this.globalService.getWalletName(),
      'account 0',
      this.sendForm.get('password').value,
      this.sendForm.get('address').value.trim(),
      this.sendForm.get('amount').value,
      // this.sendForm.get("fee").value,
      // TO DO: use coin notation
      this.estimatedFee / 100000000,
      true,
      false
    );

    this.apiService
      .buildTransaction(this.transaction)
      .subscribe(
        response => {
          console.log(response);
          this.estimatedFee = response.fee;
          this.transactionHex = response.hex;
          if (this.isSending) {
            this.hasOpReturn = false;
            this.sendTransaction(this.transactionHex);
          }
        },
        error => {
          this.isSending = false;
          this.apiError = 'Invalid Password';
        }
      );
  }

  public buildSidechainTransaction() {
    this.transaction = new TransactionBuilding(
      this.globalService.getWalletName(),
      'account 0',
      this.sendToSidechainForm.get('password').value,
      this.sendToSidechainForm.get('federationAddress').value.trim(),
      this.sendToSidechainForm.get('amount').value,
      // this.sendToSidechainForm.get("fee").value,
      // TO DO: use coin notation
      this.estimatedSidechainFee / 100000000,
      true,
      false,
      this.sendToSidechainForm.get('destinationAddress').value.trim(),
      this.opReturnAmount / 100000000
    );
    this.apiService.buildTransaction(this.transaction)
      .subscribe(
        response => {
          this.estimatedSidechainFee = response.fee;
          this.transactionHex = response.hex;
          if (this.isSending) {
            this.hasOpReturn = true;
            this.sendTransaction(this.transactionHex);
          }
        },
        error => {
          this.isSending = false;
          this.apiError = error.error.errors[0].message;
        }
      );
  }

  public send() {
    this.isSending = true;
    this.buildTransaction();
  }

  public sendToSidechain() {
    this.isSending = true;
    this.buildSidechainTransaction();
  }

  private sendTransaction(hex: string) {
    const transaction = new TransactionSending(hex);
    this.apiService
      .sendTransaction(transaction, true)
      .subscribe(
        response => {
          if (response.transactionId) {
            this.transactionDetails = {
              transactionFee: this.estimatedFee,
              sidechainEnabled: this.sidechainEnabled,
              opReturnAmount: this.opReturnAmount,
              hasOpReturn: this.hasOpReturn,
              amount: this.sendForm.get('amount').value
            };
            this.transactionComplete = true;
          }
        },
        error => {
          this.isSending = false;
          this.apiError = error.error.errors[0].message;
        }
      );
  }

  private updateAccountBalanceDetails() {
    this.worker.Stop(WorkerType.ACCOUNT_BALANCE);
    const maxBalanceRequest = {
      walletName: this.globalService.getWalletName(),
      feeType: this.sendForm.get('fee').value
    };
    this.apiService.getMaximumBalance(maxBalanceRequest)
      .pipe(finalize(() => {
        this.worker.Start(WorkerType.ACCOUNT_BALANCE);
      }))
      .subscribe(
        response => {
          this.log.info('Get max balance result:', response);
          this.estimatedFee = response.fee;
          this.totalBalance = response.maxSpendableAmount;
          this.balanceLoaded = true;
        },
        error => {
          this.apiService.handleException(error);
        }
      );
  }

  public goBack() {
    this.isPayment = false;
  }
}
