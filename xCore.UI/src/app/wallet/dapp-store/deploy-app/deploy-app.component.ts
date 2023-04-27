import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ApiService } from '../../../shared/services/api.service';
import { ApiEvents } from '../../../shared/services/api.events';
import { GlobalService } from '../../../shared/services/global.service';
import { TransactionBuilding } from '../../../shared/models/transaction-building';
import { WalletInfo } from '../../../shared/models/wallet-info';
import { ThemeService } from '../../../shared/services/theme.service';
import { WorkerType } from '../../../shared/models/worker';
import { debounceTime } from 'rxjs/operators';
import { DynamicDialogRef, DynamicDialogConfig, DialogService } from 'primeng/dynamicdialog';
import { SubmitPaymentRequest } from '../../../shared/models/xserver-submit-payment-request';
import { SignMessageRequest } from '../../../shared/models/wallet-signmessagerequest';
import { Subscription } from 'rxjs';
import { AddressType } from '../../../shared/models/address-type';
import { WordPressReserveRequest } from '../../../shared/models/xserver-wordpress-reserve-request';
import { WordPressProvisionRequest } from '../../../shared/models/xserver-wordpress-provision-request';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { XServerStatus } from '../../../shared/models/xserver-status';

interface TxDetails {
  transactionFee?: number;
  sidechainEnabled?: boolean;
  opReturnAmount?: number;
  hasOpReturn?: boolean;
  amount?: any;
}

@Component({
  selector: 'app-deploy-app',
  templateUrl: './deploy-app.component.html',
  styleUrls: ['./deploy-app.component.css']
})
export class DeployAppComponent implements OnInit, OnDestroy {
  domains: string[];
  domainsLoading: boolean;
  provisioningWordpress: boolean;
  provisioningWordpressComplete: boolean;
  appName: any;
  appPrice: any;
  zones: { label: string; value: string; }[];
  appImage: any;
  zoneRecords: { name: string; type: string; status: string; ttl: string; data: string; }[];
  loadingZones = false;
  keyAddress: string;
  selectNode = false;
  selectedRecord ='';
  form = new FormGroup({});
  model = {};
  fields = [{
    type: 'flex-layout',
    templateOptions: {
      fxLayout: 'row',
    },
    fieldGroup: [
      {
        type: 'input',
        key: 'firstname',
        className: 'sec1',
        templateOptions: {
          placeholder: 'First name',
        }
      },
      {
        type: 'input',
        key: 'lastname',
        className: 'sec2',
        templateOptions: {
          placeholder: 'last name',
        }
      },
      {
        type: 'input',
        key: 'age',
        className: 'sec3',
        templateOptions: {
          type: 'number',
          placeholder: 'Age',
        }
      },
    ]
  }
  ];
    selectedZone: string;
    xServerInfoSubscription: Subscription;
    peers: any[];
  constructor(
    private apiService: ApiService,
    private globalService: GlobalService,
    private fb: FormBuilder,
    public dialogService: DialogService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    public themeService: ThemeService,
    private apiEvents: ApiEvents,
    private addressType: AddressType,
  ) {
    this.buildPaymentForm();
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
  }

  private accountBalanceSubscription: Subscription;

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
  public appDeploying: boolean;
  public domainName = 'mystore.xserver.network';
  public profileStatus = -1;
  public profile: any;
  public profileReserveExpireBlock: number;

  public outerColor = '#78C000';
  public innerColor = '#C7E596';

  private paymentPairId: number;

  public mainAccount = 'account 0';
  public coldStakingAccount = 'coldStakingColdAddresses';
  public hotStakingAccount = 'coldStakingHotAddresses';

  public progress = 0;
  public progresstimer: any;

  paymentFormErrors = {
    paymentPassword: ''
  };

  paymentValidationMessages = {
    paymentPassword: {
      required: 'Your password is required.'
    }
  };

  totalRecords = 0;
  zoneData = [];
  options: FormlyFormOptions = {};

  private setKeyAddress() {
    this.keyAddress = this.globalService.getWalletKeyAddress();
  }

  getZoneRecords(zone: string) {
    this.loadingZones = true;

    this.apiService.getZoneRecords(zone).subscribe(results => {

      this.loadingZones = false;

      console.log(results);
    });

  }


  ngOnInit() {
    this.setKeyAddress();

    this.startSubscriptions();




    this.loadingZones = true;

    this.apiService.getZonesByKeyAddress(this.keyAddress).subscribe(results => {
      this.loadingZones = false;

      this.zoneData = [
        {
          zone: 'dimit3.org',
          records: [
            {
              name: 'myweb',
              type: 'A',
              status: 'Active',
              ttl: '300',
              data: 'xServer Network'
            },
            {
              name: 'mystore',
              type: 'A',
              status: 'Active',
              ttl: '300',
              data: 'xServer Network'
            }
          ]
        },
      ];

      this.zoneRecords = this.zoneData[0].records;
      this.zones = results.map(result => {
        return { label: result, value: result };
      });

      this.selectedZone = this.zones[0].value;
      this.getZoneRecords(this.zones[0].value);
    });

    this.coinUnit = this.globalService.getCoinUnit();
    this.getWordpressPreviewDomains();
    this.appPrice = this.config.data.price;
    this.appImage = this.config.data.image;

    if (this.config.data !== undefined && this.config.data.priceLockId !== '') {
      this.priceLockId = this.config.data.priceLockId;
      this.appName = this.config.data.selectedApp;
      this.appPrice = this.config.data.price;

      this.getPriceLock(this.priceLockId);
    } else {
      this.startMethods();
    }
  }
  ngOnDestroy() {
  }
  startSubscriptions() {

    this.xServerInfoSubscription = this.apiEvents.XServerInfo.subscribe((result: XServerStatus) => {
      if (result !== null) {
        this.peers = result.nodes.sort(l => l.responseTime).map((peer) => {

          return { label: peer.name, value: peer.name };

        });
      }
    });
    this.apiEvents.ManualTick(WorkerType.XSERVER_INFO);
  }



  getWordpressPreviewDomains() {
    this.domainsLoading = true;
    this.apiService.getWordpressPreviewDomains().subscribe((result: string[]) => {
      this.domains = result;
      this.domainsLoading = false;

    });
  }

  startMethods() {
    this.accountBalanceSubscription = this.apiEvents.AccountBalance.subscribe((result) => {
      if (result !== null) {
        this.updateAccountBalanceDetails(result);
      }
    });
    this.apiEvents.ManualTick(WorkerType.ACCOUNT_BALANCE);
  }



  private cancelSubscriptions() {
    if (this.accountBalanceSubscription) {
      this.accountBalanceSubscription.unsubscribe();
    }
    if (this.xServerInfoSubscription) {
      this.xServerInfoSubscription.unsubscribe();
    }
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
        this.apiService.getProfile(this.domainName, '')
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

  startAppDeployment() {
    this.appDeploying = true;
    const walletInfo = new WalletInfo(this.globalService.getWalletName());
    this.apiService.getUnusedReceiveAddress(walletInfo)
      .subscribe(
        unusedAddress => {
          this.signAppDeploymentRequest(unusedAddress);
        }
      );
  }

  signAppDeploymentRequest(returnAddress: string) {
    const walletName = this.globalService.getWalletName();
    const serverKey = `${this.domainName}${returnAddress}`;
    const keyAddress = this.globalService.getWalletKeyAddress();
    const password = this.paymentForm.get('paymentPassword').value;

    const signMessageRequest = new SignMessageRequest(walletName, this.coldStakingAccount, password, keyAddress, serverKey);

    this.apiService.signMessage(signMessageRequest)
      .subscribe(
        response => {
          const profileRequest = new WordPressReserveRequest(
            this.domainName,
            keyAddress,
            returnAddress,
            response.signature
          );

          this.deployApp(profileRequest);

        }
      );
  }

  deployApp(wordPressReserveRequest: WordPressReserveRequest) {
     this.apiService.reserveWordpressDomain(wordPressReserveRequest)
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
              this.appDeploying = false;
              this.apiError = response.resultMessage;
              this.profileStatus = -1;
            }
          } else {
            this.profileStatus = -1;
          }
          this.appDeploying = false;
        },
        error => {
          this.apiError = error.error.errors[0].message;
          this.appDeploying = false;
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
            this.appDeploying = false;
            this.isPayment = true;
          }
        },
        error => {
          this.apiError = error.error.errors[0].message;
          this.appDeploying = false;
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
      false,
      this.addressType.IsSegwit()
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
            this.provisioningWordpress = true;
            this.startProgressTimer();
            this.provisionWordPress();
          }
          this.isSending = false;
        }
      );
  }

  startProgressTimer() {

    this.progresstimer = setInterval(() => {
      this.progress += 0.5;
      if (this.progress >= 100) {
        if (this.progresstimer) {
          clearInterval(this.progresstimer);
          this.provisioningWordpressComplete = true;
          this.provisioningWordpress = false;
        }
      }
    }, 200);
  }
  provisionWordPress() {

    this.apiService.provisionWordPress(new WordPressProvisionRequest(this.domainName)).subscribe((res) => {
      this.provisioningWordpressComplete = true;
      this.provisioningWordpress = false;
    });

  }

  private updateAccountBalanceDetails(balanceResponse) {
    this.totalBalance = balanceResponse.balances[0].amountConfirmed + balanceResponse.balances[0].amountUnconfirmed;
    this.balanceLoaded = true;
  }

  public goBack() {
    this.profileStatus = 0;
    this.apiError = '';
  }

}
