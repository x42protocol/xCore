import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormGroup, Validators, FormBuilder, AbstractControl } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig, DialogService } from 'primeng/dynamicdialog';
import { ApiService } from '../../../shared/services/api.service';
import { GlobalService } from '../../../shared/services/global.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { CoinNotationPipe } from '../../../shared/pipes/coin-notation.pipe';
import { ColdStakingService } from '../../../shared/services/coldstaking.service';
import { FeeEstimation } from '../../../shared/models/fee-estimation';
import { TransactionSending } from '../../../shared/models/transaction-sending';
import { WalletInfo } from '../../../shared/models/wallet-info';
import { ColdStakingWithdrawalRequest } from '../../../shared/models/coldstakingwithdrawalrequest';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

type FeeType = { id: number, display: string, value: number };

@Component({
  selector: 'app-withdraw-component',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.css'],
})

export class ColdStakingWithdrawComponent implements OnInit, OnDestroy {
  @Input() address: string;

  feeTypes: FeeType[] = [];
  selectedFeeType: FeeType;

  constructor(
    private apiService: ApiService,
    private globalService: GlobalService,
    public activeModal: DynamicDialogRef,
    public config: DynamicDialogConfig,
    public dialogService: DialogService,
    private fb: FormBuilder,
    private stakingService: ColdStakingService,
    public themeService: ThemeService,
  ) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
    this.setCoinUnit();
    this.setFeeTypes();
    this.buildSendForm();
  }

  public sendForm: FormGroup;
  public hasOpReturn: boolean;
  public coinUnit: string;
  public isSending = false;
  public estimatedFee = 0;
  public totalBalance = 0;
  public spendableBalance = 0;
  public apiError: string;
  public firstTitle: string;
  public secondTitle: string;
  public opReturnAmount = 0;
  public isColdStaking: boolean;
  public isDarkTheme = false;
  public transactionComplete: boolean;

  private transactionHex: string;
  private walletBalanceSubscription: Subscription;
  private coldStakingAccount = 'coldStakingColdAddresses';
  private hotStakingAccount = 'coldStakingHotAddresses';

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
      max: 'The total transaction amount exceeds your spendable balance.'
    },
    fee: {
      required: 'A fee is required.'
    },
    password: {
      required: 'Your password is required.'
    }
  };

  ngOnInit() {
    this.isColdStaking = this.config.data.isColdStaking;

    this.startSubscriptions();
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }

  private setCoinUnit(): void {
    this.coinUnit = this.globalService.getCoinUnit();
  }

  private getAccount(): string {
    return this.isColdStaking ? this.coldStakingAccount : this.hotStakingAccount;
  }

  private setFeeTypes(): void {
    this.feeTypes.push({ id: 0, display: 'Low - 0.0001 ' + this.coinUnit, value: 0.0001 });
    this.feeTypes.push({ id: 1, display: 'Medium - 0.001 ' + this.coinUnit, value: 0.001 });
    this.feeTypes.push({ id: 2, display: 'High - 0.01 ' + this.coinUnit, value: 0.01 });

    this.selectedFeeType = this.feeTypes[0];
  }

  private buildSendForm(): void {
    this.sendForm = this.fb.group({
      address: ['', Validators.compose([Validators.required, Validators.minLength(26)])],
      amount: ['', Validators.compose([Validators.required, Validators.pattern(/^([0-9]+)?(\.[0-9]{0,8})?$/), Validators.min(0.00001), (control: AbstractControl) => Validators.max((this.spendableBalance - this.estimatedFee) / 100000000)(control)])],
      fee: ['medium', Validators.required],
      password: ['', Validators.required]
    });

    this.sendForm.valueChanges.pipe(debounceTime(300))
      .subscribe(data => this.onSendValueChanged(data));
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

  public getMaxBalance() {
    const data = {
      walletName: this.globalService.getWalletName(),
      feeType: this.sendForm.get('fee').value
    };

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
          this.sendForm.patchValue({ amount: +new CoinNotationPipe(this.globalService).transform(this.spendableBalance) });
          this.estimatedFee = balanceResponse.fee;
        }
      );
  }

  public estimateFee() {
    const transaction = new FeeEstimation(
      this.globalService.getWalletName(),
      this.getAccount(),
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
          this.apiError = error.error.errors[0].message;
        }
      );
  }

  public buildTransaction() {
    this.stakingService.withdrawColdStaking(new ColdStakingWithdrawalRequest(
      this.sendForm.get('address').value.trim(),
      this.sendForm.get('amount').value,
      this.globalService.getWalletName(),
      this.sendForm.get('password').value,
      this.estimatedFee
    ), true).subscribe(withdrawal => {
      this.transactionHex = withdrawal.transactionHex;
      if (this.isSending) {
        this.hasOpReturn = false;
        this.sendTransaction(this.transactionHex);
      }
    },
      error => {
        this.isSending = false;
        this.apiError = error.error.errors[0].message;
      });
  }

  public send() {
    this.isSending = true;
    this.buildTransaction();
  }

  private sendTransaction(hex: string) {
    const transaction = new TransactionSending(hex);
    this.apiService
      .sendTransaction(transaction, true)
      .subscribe(
        response => {
          if (response.transactionId) {
            this.transactionComplete = true;
          }
        },
        error => {
          this.isSending = false;
          this.apiError = error.error.errors[0].message;
        }
      );
  }

  private getWalletBalance() {
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    walletInfo.accountName = this.getAccount();

    this.walletBalanceSubscription = this.apiService.getWalletBalance(walletInfo)
      .subscribe(
        response => {
          if (response != null) {
            const balanceResponse = response;
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
  }

  private cancelSubscriptions() {
    if (this.walletBalanceSubscription) {
      this.walletBalanceSubscription.unsubscribe();
    }
  }

  private startSubscriptions() {
    this.getWalletBalance();
  }
}
