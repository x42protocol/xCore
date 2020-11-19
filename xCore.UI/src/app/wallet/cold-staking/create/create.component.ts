import { Component, OnInit, OnDestroy } from '@angular/core';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { FormGroup, Validators, FormBuilder, AbstractControl } from '@angular/forms';
import { GlobalService } from '../../../shared/services/global.service';
import { CoinNotationPipe } from '../../../shared/pipes/coin-notation.pipe';
import { ApiService } from '../../../shared/services/api.service';
import { Logger } from '../../../shared/services/logger.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { WorkerService } from '../../../shared/services/worker.service';
import { WorkerType } from '../../../shared/models/worker';
import { FeeEstimation } from '../../../shared/models/fee-estimation';
import { ColdStakingService } from '../../../shared/services/coldstaking.service';
import { TransactionSending } from '../../../shared/models/transaction-sending';
import { ColdStakingSetup } from '../../../shared/models/coldstakingsetup';
import { debounceTime, finalize } from 'rxjs/operators';
type FeeType = { id: number, display: string, value: number };

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class ColdStakingCreateComponent implements OnInit, OnDestroy {
  feeTypes: FeeType[] = [];
  selectedFeeType: FeeType;

  constructor(
    private apiService: ApiService,
    private globalService: GlobalService,
    private stakingService: ColdStakingService,
    public activeModal: DynamicDialogRef,
    public dialogService: DialogService,
    private fb: FormBuilder,
    public themeService: ThemeService,
    private log: Logger,
    private worker: WorkerService,
  ) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
    this.setCoinUnit();
    this.buildSendForm();
  }

  public balanceLoaded: boolean;
  public sendForm: FormGroup;
  public coinUnit: string;
  public apiError: string;
  public totalBalance = 0;
  public isSending = false;
  public estimatedFee = 0;
  public isDarkTheme = false;
  public sendSuccess: boolean;

  public mainAccount = 'account 0';
  public coldStakingAccount = 'coldStakingColdAddresses';
  public hotStakingAccount = 'coldStakingHotAddresses';

  sendFormErrors = {
    hotWalletAddress: '',
    amount: '',
    password: ''
  };

  sendValidationMessages = {
    hotWalletAddress: {
      required: 'An delegated staking address is required.',
      minlength: 'An a delegated staking address is at least 26 characters long.'
    },
    amount: {
      required: 'An amount is required.',
      pattern: 'Enter a valid transaction amount. Only positive numbers and no more than 8 decimals are allowed.',
      min: 'The amount has to be more or equal to 0.00001 x42.',
      max: 'The total transaction amount exceeds your spendable balance.'
    },
    password: {
      required: 'Your password is required.'
    }
  };

  public ngOnInit() {
    this.worker.timerStatusChanged.subscribe((status) => {
      if (status.running) {
        if (status.worker === WorkerType.ACCOUNT_BALANCE) { this.updateAccountBalanceDetails(); }
      }
    });

    this.worker.Start(WorkerType.ACCOUNT_BALANCE);
  }

  public ngOnDestroy() {
    this.worker.Stop(WorkerType.ACCOUNT_BALANCE);
  }

  private setCoinUnit(): void {
    this.coinUnit = this.globalService.getCoinUnit();
  }

  private buildSendForm(): void {
    this.sendForm = this.fb.group({
      hotWalletAddress: ['', Validators.compose([Validators.required, Validators.minLength(26)])],
      amount: ['', Validators.compose([Validators.required, Validators.pattern(/^([0-9]+)?(\.[0-9]{0,8})?$/), Validators.min(0.00001), (control: AbstractControl) => Validators.max((this.totalBalance - this.estimatedFee) / 100000000)(control)])],
      password: ['', Validators.required],
      fee: ['medium', Validators.required]
    });

    this.sendForm.valueChanges.pipe(debounceTime(300))
      .subscribe(data => this.onSendValueChanged(data));
  }

  private onSendValueChanged(data?: any) {
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

    if (this.sendForm.get('hotWalletAddress').valid && this.sendForm.get('amount').valid) {
      this.estimateFee();
    }
  }

  public getMaxBalance() {
    this.sendForm.patchValue({ amount: +new CoinNotationPipe(this.globalService).transform(this.totalBalance) });
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

  public send() {
    this.isSending = true;
    this.buildTransaction();
  }

  public estimateFee() {
    const transaction = new FeeEstimation(
      this.globalService.getWalletName(),
      this.mainAccount,
      this.sendForm.get('hotWalletAddress').value.trim(),
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

  public deligatedTransactionSent(transactionId: string) {
    this.sendSuccess = true;
  }

  public buildTransaction(): void {
    const walletName = this.globalService.getWalletName();
    const walletPassword = this.sendForm.get('password').value;
    const amount = this.sendForm.get('amount').value;
    const hotWalletAddress = this.sendForm.get('hotWalletAddress').value.trim();
    const accountName = 'account 0';
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
                            this.deligatedTransactionSent(sendTransactionResponse.transactionId);
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
          );
      },
      error => {
        this.isSending = false;
        this.apiError = error.error.errors[0].message;
      }
    );
  }


}
