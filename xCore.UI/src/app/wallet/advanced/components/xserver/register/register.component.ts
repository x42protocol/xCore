import { Component, OnInit } from '@angular/core';

import { FullNodeApiService } from '../../../../../shared/services/fullnode.api.service';
import { GlobalService } from '../../../../../shared/services/global.service';
import { ThemeService } from '../../../../../shared/services/theme.service';

import { WalletInfo } from '../../../../../shared/models/wallet-info';

import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ColdStakingSetup } from '../../../../../shared/models/coldstakingsetup';
import { TransactionSending } from '../../../../../shared/models/transaction-sending';
import { ServerIDResponse } from '../../../../../shared/models/serveridresponse';
import { ColdStakingService } from '../../../../../shared/services/coldstaking.service';
import { Subscription } from 'rxjs';
import { TransactionInfo } from '../../../../../shared/models/transaction-info';
import { SignMessageRequest } from '../../../../../shared/models/wallet-signmessagerequest';
import { TransactionOutput } from '../../../../../shared/models/transaction-output';
import { xServerRegistrationRequest } from '../../../../../shared/models/xserver-registration-request';

@Component({
  selector: 'register-component',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})

export class RegisterComponent implements OnInit {
  constructor(private apiService: FullNodeApiService, private stakingService: ColdStakingService, private globalService: GlobalService, private themeService: ThemeService, public activeModal: DynamicDialogRef, public config: DynamicDialogConfig) {
    this.isDarkTheme = themeService.getCurrentTheme().themeType == 'dark';
  }

  public isDarkTheme = false;
  public collateralProgress: number = 0;
  public currentStep: number = -1;
  public confirmations: number = 0;
  public transactionInfo: TransactionInfo;
  public registrationFailed: boolean = false;

  public xserverName: string;
  public selectedProtocol: number;
  public networkAddress: string;
  public networkPort: string = "4242";
  public selectedTier: string;
  public walletPassword: string;
  public errorMessage: string = "";

  private server: ServerIDResponse = new ServerIDResponse();
  private generalWalletInfoSubscription: Subscription;

  private signWithAddress: string;
  private signedMessage: string;
  private broadcastStarted: boolean = false;

  public mainAccount: string = "account 0";
  public coldStakingAccount: string = "coldStakingColdAddresses";
  public hotStakingAccount: string = "coldStakingHotAddresses";

  ngOnInit() {
    this.xserverName = this.config.data.xserverName;
    this.selectedProtocol = this.config.data.selectedProtocol;
    this.networkAddress = this.config.data.networkAddress;
    this.networkPort = this.config.data.networkPort;
    this.server.serverId = this.config.data.serverId;
    this.walletPassword = this.config.data.walletPassword;
    this.selectedTier = this.config.data.selectedTier;

    let previousConfirmation = 0;

    this.broadcastTransaction();
    this.currentStep++;

    let interval = setInterval(() => {
      if (this.errorMessage == "") {
        if (this.collateralProgress > 0 && this.currentStep < 1) {
          if (this.confirmations >= 6) {
            this.signRegistrationRequest();
            this.currentStep++;
            this.incrementProgress(20);
          } else {
            if (previousConfirmation != this.confirmations) {
              this.incrementProgress(this.confirmations * 2);
            }
          }
        }
        if (this.currentStep == 2 && !this.broadcastStarted) {
          this.broadcastStarted = true;
          this.broadcastRegistrationRequest();
        }
        if (this.collateralProgress >= 100) {
          this.collateralProgress = 100;
          clearInterval(interval);
        }
        previousConfirmation = this.confirmations;
      } else {
        console.log(this.errorMessage);
      }
    }, 1000);
  }

  private broadcastRegistrationRequest() {

    let xServerTier: number;

    if (this.selectedTier = "1000") {
      xServerTier = 1;
    } else if (this.selectedTier = "20000") {
      xServerTier = 2;
    } else if (this.selectedTier = "100000") {
      xServerTier = 3;
    }
    const registrationRequest = new xServerRegistrationRequest(this.xserverName, this.selectedProtocol, this.networkAddress, Number(this.networkPort), this.signedMessage, this.signWithAddress, xServerTier);
    console.log(registrationRequest);
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
    const message = `${this.xserverName}${this.networkAddress}${this.networkPort}`;
    const address = this.signWithAddress;
    const password = this.walletPassword;

    const signMessageRequest = new SignMessageRequest(walletName, this.coldStakingAccount, password, address, message);

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
    this.collateralProgress = this.collateralProgress + progress;
  }

  private updateConfirmations() {
    this.generalWalletInfoSubscription = this.apiService.getTxOut(this.transactionInfo.transactionId, false, true)
      .subscribe(
        response => {
          let transactionOutput = response;
          if (transactionOutput != null) {
            this.confirmations = transactionOutput.confirmations;
          }
        },
        error => {
          if (error.status === 0) {
            this.cancelWalletSubscriptions();
            this.errorMessage = "Could not get confirmation.";
          } else if (error.status >= 400) {
            if (!error.error.errors[0].message) {
              this.cancelWalletSubscriptions();
              this.errorMessage = "Could not get confirmation..";
            }
          }
        }
      );
  };

  public deligatedTransactionSent(transactionInfo: TransactionInfo) {
    this.transactionInfo = transactionInfo;
    this.incrementProgress(10);
    this.updateConfirmations();
  }

  public broadcastTransaction(): void {
    const walletName = this.globalService.getWalletName();
    const walletPassword = this.walletPassword;
    const amount = Number(this.selectedTier);
    const hotWalletAddress = this.server.getAddressFromServerId();
    const fee = 0;

    if (hotWalletAddress == "") {
      this.errorMessage = "Invalid xServer ID";
    } else {
      console.log(hotWalletAddress);

      this.apiService.validateAddress(hotWalletAddress).subscribe(
        address => {
          this.stakingService.createColdStakingAccount(walletName, walletPassword, true)
            .subscribe(
              createColdStakingAccountResponse => {
                this.stakingService.getAddress(walletName, true, address.iswitness.toString().toLowerCase()).subscribe(getAddressResponse => {
                  this.signWithAddress = getAddressResponse.address;
                  console.log("Sign Addy: " + this.signWithAddress);
                  this.stakingService.createColdstaking(new ColdStakingSetup(
                    hotWalletAddress,
                    getAddressResponse.address,
                    amount,
                    walletName,
                    walletPassword,
                    this.mainAccount,
                    fee
                  ))
                    .subscribe(
                      createColdstakingResponse => {
                        const transaction = new TransactionSending(createColdstakingResponse.transactionHex);
                        this.apiService
                          .sendTransaction(transaction)
                          .subscribe(
                            sendTransactionResponse => {
                              this.deligatedTransactionSent(sendTransactionResponse)
                            },
                            error => {
                              this.errorMessage = "Sending: " + error.error.errors[0].message;
                            }
                          );
                      },
                      error => {
                        this.errorMessage = "Setup: " + error.error.errors[0].message;
                      }
                    );
                },
                  error => {
                    this.errorMessage = "Retrieve: " + error.error.errors[0].message;
                  });
              },
              error => {
                this.errorMessage = "Creating: " + error.error.errors[0].message;
              },
            )
        },
        error => {
          this.errorMessage = "Validate: " + error.error.errors[0].message;
        }
      );
    }
  }

  private cancelWalletSubscriptions() {
    if (this.generalWalletInfoSubscription) {
      this.generalWalletInfoSubscription.unsubscribe();
    }
  };

  public Close() {
    this.activeModal.close('Close click');
  }

  public Cancel() {
    this.errorMessage = "User Canceled";
    this.currentStep = -2;
  }

}
