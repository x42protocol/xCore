import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../../../shared/services/api.service';
import { ApiEvents } from '../../../../../shared/services/api.events';
import { GlobalService } from '../../../../../shared/services/global.service';
import { ThemeService } from '../../../../../shared/services/theme.service';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ColdStakingSetup } from '../../../../../shared/models/coldstakingsetup';
import { TransactionSending } from '../../../../../shared/models/transaction-sending';
import { ServerIDResponse } from '../../../../../shared/models/serveridresponse';
import { ColdStakingService } from '../../../../../shared/services/coldstaking.service';
import { Logger } from '../../../../../shared/services/logger.service';
import { TransactionInfo } from '../../../../../shared/models/transaction-info';
import { SignMessageRequest } from '../../../../../shared/models/wallet-signmessagerequest';
import { XServerRegistrationRequest } from '../../../../../shared/models/xserver-registration-request';
import { XServerTestRequest } from '../../../../../shared/models/xserver-test-request';
import { NodeStatus } from '../../../../../shared/models/node-status';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register-component',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})

export class RegisterComponent implements OnInit, OnDestroy {
  constructor(
    private apiService: ApiService,
    private stakingService: ColdStakingService,
    private globalService: GlobalService,
    public themeService: ThemeService,
    public activeModal: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private log: Logger,
    private apiEvents: ApiEvents,
    private router: Router,
  ) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
  }

  private server: ServerIDResponse = new ServerIDResponse();

  private signedMessage: string;
  private broadcastStarted = false;
  private txConfirmationSubscription: Subscription;
  private registrationIntervalId: any;

  public isDarkTheme = false;
  public collateralProgress = 0;
  public currentStep = -1;
  public confirmations = 0;
  public transactionInfo: TransactionInfo;
  public registrationFailed = false;
  public profileName: string;
  public selectedProtocol: number;
  public networkAddress: string;
  public networkPort: string;
  public selectedTier: string;
  public walletPassword: string;
  public keyAddress: string;
  public feeAddress: string;
  public errorMessage = '';
  public testStatus = 0;

  public mainAccount = 'account 0';
  public coldStakingAccount = 'coldStakingColdAddresses';
  public hotStakingAccount = 'coldStakingHotAddresses';

  ngOnInit() {
    this.profileName = this.config.data.profileName;
    this.selectedProtocol = this.config.data.selectedProtocol;
    this.networkAddress = this.config.data.networkAddress;
    this.networkPort = this.config.data.networkPort;
    this.server.serverId = this.config.data.serverId;
    this.walletPassword = this.config.data.walletPassword;
    this.selectedTier = this.config.data.selectedTier;
    this.keyAddress = this.config.data.keyAddress;
    this.feeAddress = this.config.data.feeAddress;

    this.startMethods();
  }

  startMethods() {
    this.apiService.getNodeStatus()
      .subscribe(
        (data: NodeStatus) => {
          const statusResponse = data;
          this.testXServer(statusResponse.blockStoreHeight);
        }
      );
  }

  startTransactionConfirmation() {
    this.txConfirmationSubscription = this.apiEvents.TransactionConfirmation(this.transactionInfo.transactionId).subscribe((result) => {
      if (result !== null) {
        this.updateTransactionConfirmations(result);
      } else {
        this.confirmations = 0;
      }
    });
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private cancelSubscriptions() {
    if (this.txConfirmationSubscription) {
      this.txConfirmationSubscription.unsubscribe();
    }
  }

  private cleanup() {
    clearInterval(this.registrationIntervalId);
    this.confirmations = 0;
    this.apiEvents.TransactionConfirmation('');
    this.cancelSubscriptions();
  }

  private testXServer(blockHeight: number) {
    const registrationRequest = new XServerTestRequest(this.selectedProtocol, this.networkAddress, Number(this.networkPort), blockHeight);
    this.log.info('Registration request', registrationRequest);
    this.apiService.testxServer(registrationRequest)
      .subscribe(
        response => {
          if (response.success) {
            this.testStatus = 1;
            this.startRegistration();
          } else {
            this.testStatus = -1;
            this.errorMessage = response.resultMessage;
          }
        }
      );
  }

  private getTierNumber(): number {
    let xServerTier = 0;
    if (this.selectedTier === '1000') {
      xServerTier = 1;
    } else if (this.selectedTier === '20000') {
      xServerTier = 2;
    } else if (this.selectedTier === '50000') {
      xServerTier = 3;
    }
    return xServerTier;
  }

  private startRegistration() {
    let previousConfirmation = 0;
    this.broadcastTransaction();
    this.currentStep++;
    this.registrationIntervalId = setInterval(() => {
      if (this.errorMessage === '') {
        if (this.collateralProgress > 0 && this.currentStep < 1) {
          if (this.confirmations >= 6) {
            this.signRegistrationRequest();
            this.currentStep++;
            this.incrementProgress(20);
          } else {
            if (previousConfirmation !== this.confirmations) {
              this.incrementProgress(this.confirmations * 2);
            }
          }
        }
        if (this.currentStep === 2 && !this.broadcastStarted) {
          this.broadcastStarted = true;
          this.broadcastRegistrationRequest();
        }
        if (this.collateralProgress >= 100) {
          this.collateralProgress = 100;
          clearInterval(this.registrationIntervalId);
        }
        previousConfirmation = this.confirmations;
      } else {
        clearInterval(this.registrationIntervalId);
        this.log.info('Registration Error', this.errorMessage);
      }
    }, 1000);
  }

  private broadcastRegistrationRequest() {
    const registrationRequest = new XServerRegistrationRequest(this.profileName, this.selectedProtocol, this.networkAddress, Number(this.networkPort), this.signedMessage, this.keyAddress, this.server.getAddressFromServerId(), this.feeAddress, this.getTierNumber());
    this.log.info('Broadcast Registration', registrationRequest);
    this.apiService.registerxServer(registrationRequest)
      .subscribe(
        response => {
          if (response.success) {
            this.incrementProgress(40);
            this.currentStep++;
          } else {
            this.errorMessage = response.resultMessage;
          }
        }
      );
  }

  private signRegistrationRequest() {
    const walletName = this.globalService.getWalletName();
    const serverKey = `${this.networkAddress}${this.networkPort}${this.keyAddress}${this.server.getAddressFromServerId()}${this.feeAddress}${this.getTierNumber()}${this.profileName}`;
    const address = this.keyAddress;
    const password = this.walletPassword;
    const signMessageRequest = new SignMessageRequest(walletName, this.coldStakingAccount, password, address, serverKey);

    this.apiService.signMessage(signMessageRequest)
      .subscribe(
        response => {
          this.signedMessage = response.signature;
          this.incrementProgress(20);
          this.currentStep++;
        }
      );
  }

  private incrementProgress(progress: number) {
    let totalProgress = this.collateralProgress + progress;
    if (totalProgress > 100) {
      totalProgress = 100;
    }
    this.collateralProgress = totalProgress;
  }

  private updateTransactionConfirmations(transactionOutput) {
    if (transactionOutput != null) {
      this.confirmations = transactionOutput.confirmations;
    }
  }

  public deligatedTransactionSent(transactionInfo: TransactionInfo) {
    this.transactionInfo = transactionInfo;
    this.incrementProgress(10);
    this.startTransactionConfirmation();
  }

  public broadcastTransaction(): void {
    const walletName = this.globalService.getWalletName();
    const walletPassword = this.walletPassword;
    const amount = Number(this.selectedTier);
    const hotWalletAddress = this.server.getAddressFromServerId();
    const fee = 0;

    if (hotWalletAddress === '') {
      this.stopWithErrorMessage('Invalid xServer ID');
    } else {
      this.log.info('xServer Address', hotWalletAddress);
      this.stakingService.createColdstaking(new ColdStakingSetup(
        hotWalletAddress,
        this.keyAddress,
        amount,
        walletName,
        walletPassword,
        this.mainAccount,
        fee
      ), true)
        .subscribe(
          createColdstakingResponse => {
            const transaction = new TransactionSending(createColdstakingResponse.transactionHex);
            this.apiService
              .sendTransaction(transaction)
              .subscribe(
                sendTransactionResponse => {
                  this.deligatedTransactionSent(sendTransactionResponse);
                },
                error => {
                  this.stopWithErrorMessage('Sending: ' + error.error.errors[0].message);
                }
              );
          },
          error => {
            this.stopWithErrorMessage('Setup: ' + error.error.errors[0].message);
          }
        );
    }
  }

  private stopWithErrorMessage(message: string) {
    this.errorMessage = message;
    this.currentStep = -2;
  }

  public Close() {
    if (this.currentStep === 3) {
      this.router.navigate(['/wallet/advanced/about']);
    }
    this.activeModal.close('Close click');
  }

  public Cancel() {
    this.stopWithErrorMessage('User Canceled');
  }

}
