import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AddressLabel } from '../models/address-label';
import { WalletCreation } from '../models/wallet-creation';
import { WalletRecovery } from '../models/wallet-recovery';
import { WalletLoad } from '../models/wallet-load';
import { WalletInfo } from '../models/wallet-info';
import { FeeEstimation } from '../models/fee-estimation';
import { TransactionBuilding } from '../models/transaction-building';
import { TransactionSending } from '../models/transaction-sending';
import { NodeStatus } from '../models/node-status';
import { XServerStatus } from '../models/xserver-status';
import { WalletRescan } from '../models/wallet-rescan';
import { SignMessageRequest } from '../models/wallet-signmessagerequest';
import { VerifyRequest } from '../models/wallet-verifyrequest';
import { SplitCoins } from '../models/split-coins';
import { ValidateAddressResponse } from '../models/validateaddressresponse';
import { AddressType } from '../models/address-type';
import { ColdHotStateRequest } from '../models/coldhotstaterequest';
import { SignMessageResponse } from '../models/signmessageresponse';
import { TransactionOutput } from '../models/transaction-output';
import { XServerRegistrationRequest } from '../models/xserver-registration-request';
import { XServerRegistrationResponse } from '../models/xserver-registration-response';
import { XServerTestRequest } from '../models/xserver-test-request';
import { XServerTestResponse } from '../models/xserver-test-response';
import { CreatePriceLockRequest } from '../models/xserver-create-pl-request';
import { SubmitPaymentRequest } from '../models/xserver-submit-payment-request';
import { ProfileReserveRequest } from '../models/xserver-profile-reserve-request';
import { Logger } from './logger.service';
import { ChainService } from './chain.service';
import { ApplicationStateService } from './application-state.service';
import { ElectronService } from 'ngx-electron';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})

export class ApiService {
  static singletonInstance: ApiService;

  constructor(
    private http: HttpClient,
    private addressType: AddressType,
    private log: Logger,
    private chains: ChainService,
    private appState: ApplicationStateService,
    private electronService: ElectronService,
    private notifications: NotificationService
  ) {
    if (!ApiService.singletonInstance) {
      ApiService.singletonInstance = this;
    }

    return ApiService.singletonInstance;
  }

  private daemon;

  public apiUrl: string;
  public genesisDate: Date;
  public apiPort: number;

  /** Initialized the daemon running in the background, by sending configuration that has been picked by user, including chain, network and mode. */
  initialize() {
    // Get the current network (main, regtest, testnet), current blockchain (x42, bitcoin) and the mode (full, light, mobile)
    const chain = this.chains.getChain(this.appState.network);

    // Get the correct name of the chain that was found.
    this.appState.networkName = chain.networkname;

    // Make sure we copy some of the state information to the chain instance supplied to launch the daemon by the main process.
    chain.mode = this.appState.daemon.mode;
    chain.path = this.appState.daemon.path;
    chain.datafolder = this.appState.daemon.datafolder;

    this.genesisDate = chain.genesisDate;

    this.log.info('Api Service, Chain: ', chain);

    // For mobile mode, we won't launch any daemons.
    if (chain.mode === 'simple') {

    } else {
      if (this.electronService.ipcRenderer) {
        this.daemon = this.electronService.ipcRenderer.sendSync('start-daemon', chain);

        if (this.daemon !== 'OK') {
          this.notifications.add({
            title: 'xCore background error',
            hint: 'Messages from the background process received in xCore',
            message: this.daemon,
            icon: (this.daemon.indexOf('xCore was started in development mode') > -1) ? 'build' : 'warning'
          });
        }

        this.log.info('Node result: ', this.daemon);
        this.setApiPort(chain.apiPort);
      }
    }
  }

  /**
   * Set the API port to connect with full node API. This will differ depending on coin and network.
   */
  setApiPort(port: number) {
    this.apiPort = port;
    this.apiUrl = 'http://localhost:' + port + '/api';
  }

  /**
   * Get the status of the node.
   */
  getNodeStatus(): Observable<NodeStatus> {
    return this.http
      .get(this.apiUrl + '/node/status')
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: NodeStatus) => response));
  }

  /**
   * Get the status of the xServer network
   */
  getxServerInfo(): Observable<XServerStatus> {
    return this.http
      .get(this.apiUrl + '/xServer/getxserverstats')
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: XServerStatus) => response));
  }

  /**
   * Test an xServer by sending a ping, and returning the result.
   */
  testxServer(testRequest: XServerTestRequest): Observable<XServerTestResponse> {
    return this.http
      .post(this.apiUrl + '/xServer/testxserverports', JSON.stringify(testRequest))
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: XServerTestResponse) => response));
  }

  /**
   * Register an xServer to the network.
   */
  registerxServer(registrationRequest: XServerRegistrationRequest): Observable<XServerRegistrationResponse> {
    return this.http
      .post(this.apiUrl + '/xServer/registerxserver', JSON.stringify(registrationRequest))
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: XServerRegistrationResponse) => response));
  }

  /**
   * Get the available pairs from the xServer network.
   */
  getAvailablePairs(): Observable<any> {
    return this.http
      .get(this.apiUrl + '/xServer/getavailablepairs')
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Create a price lock
   */
  createPriceLock(createPLRequest: CreatePriceLockRequest): Observable<any> {
    return this.http
      .post(this.apiUrl + '/xServer/createpricelock', JSON.stringify(createPLRequest))
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Get a profile
   */
  getProfile(name: string, keyAddress: string): Observable<any> {
    const params = new HttpParams()
      .set('name', name)
      .set('keyAddress', keyAddress);

    return this.http
      .get(this.apiUrl + '/xServer/getprofile', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Submit a payment
   */
  submitPayment(submitPaymentRequest: SubmitPaymentRequest): Observable<any> {
    return this.http
      .post(this.apiUrl + '/xServer/submitpayment', JSON.stringify(submitPaymentRequest))
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Get a price lock
   */
  getPriceLock(priceLockId: string): Observable<any> {
    const params = new HttpParams().set('priceLockId', priceLockId);

    return this.http
      .get(this.apiUrl + '/xServer/getpricelock', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Reserve a profile.
   */
  reserveProfile(profileReserveRequest: ProfileReserveRequest): Observable<any> {
    return this.http
      .post(this.apiUrl + '/xServer/reserveprofile', JSON.stringify(profileReserveRequest))
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Search for xServer by Profile Name
   */
  searchForXServerByProfile(profileName: string): Observable<any> {
    const params = new HttpParams().set('profileName', profileName);
    return this.http
      .get(this.apiUrl + '/xServer/searchforxserver', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Get addresss from address book.
   */
  getAddressBookAddresses(): Observable<any> {
    return this.http
      .get(this.apiUrl + '/AddressBook')
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Add an address to the address book.
   */
  addAddressBookAddress(data: AddressLabel): Observable<any> {
    return this.http
      .post(this.apiUrl + '/AddressBook/address', JSON.stringify(data))
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Add an address to the address book.
   */
  removeAddressBookAddress(label: string): Observable<any> {
    const params = new HttpParams().set('label', label);

    return this.http
      .delete(this.apiUrl + '/AddressBook/address', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Get the cold/hot state of the wallet.
   * Returns true if it's a hot false if cold.
   */
  getColdHotState(walletName: string): Observable<boolean> {
    const params = new HttpParams().set('Name', walletName);

    return this.http
      .get(this.apiUrl + '/wallet/getcoldhotstate', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: boolean) => response));
  }

  /**
   * Toggle the wallet cold/hot state.
   */
  toggleColdHotState(data: ColdHotStateRequest): Observable<any> {
    return this.http
      .post(this.apiUrl + '/wallet/setcoldhotstate', JSON.stringify(data))
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Gets available wallets at the default path
   */
  getWalletFiles(): Observable<any> {
    return this.http
      .get(this.apiUrl + '/wallet/files')
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   *  Gets the extended public key from a certain wallet
   */
  getExtPubkey(data: WalletInfo): Observable<any> {
    const params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', 'account 0');

    return this.http
      .get(this.apiUrl + '/wallet/extpubkey', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   *  Get a new mnemonic
   */
  getNewMnemonic(): Observable<any> {
    const params = new HttpParams()
      .set('language', 'English')
      .set('wordCount', '12');

    return this.http
      .get(this.apiUrl + '/wallet/mnemonic', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   *  Create a new x42 wallet.
   */
  createX42Wallet(data: WalletCreation): Observable<any> {
    return this.http
      .post(this.apiUrl + '/wallet/create/', JSON.stringify(data))
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   *  Recover a x42 wallet.
   */
  recoverX42Wallet(data: WalletRecovery): Observable<any> {
    return this.http
      .post(this.apiUrl + '/wallet/recover/', JSON.stringify(data))
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   *  Load a x42 wallet
   */
  loadX42Wallet(data: WalletLoad): Observable<any> {
    return this.http
      .post(this.apiUrl + '/wallet/load/', JSON.stringify(data))
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   *  Get wallet status info from the API.
   */
  getWalletStatus(): Observable<any> {
    return this.http
      .get(this.apiUrl + '/wallet/status')
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   *  Get general wallet info from the API.
   */
  getGeneralInfo(data: WalletInfo): Observable<any> {
    const params = new HttpParams().set('Name', data.walletName);

    return this.http
      .get(this.apiUrl + '/wallet/general-info', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   *  Gets the unspent outputs of a specific vout in a transaction.
   */
  getTxOut(trxid: string, includeMemPool: boolean): Observable<TransactionOutput> {
    const params = new HttpParams()
      .set('trxid', trxid)
      .set('includeMemPool', includeMemPool ? 'true' : 'false');

    return this.http
      .get(this.apiUrl + '/Node/gettxout', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: TransactionOutput) => response));
  }

  /**
   *  Get wallet balance from the API once.
   */
  getWalletBalance(data: WalletInfo): Observable<any> {
    const params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', data.accountName);

    return this.http
      .get(this.apiUrl + '/wallet/balance', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Get the maximum sendable amount for a given fee from the API
   */
  getMaximumBalance(data): Observable<any> {
    const params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', 'account 0')
      .set('feeType', data.feeType)
      .set('allowUnconfirmed', 'true');

    return this.http
      .get(this.apiUrl + '/wallet/maxbalance', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Get a wallets transaction history info from the API.
   * This uses the historyslim method.
   */
  getWalletHistory(data: WalletInfo, skip: number = -1, take: number = -1): Observable<any> {
    let params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', data.accountName);
    if (take > 0) {
      params = params.set('Skip', skip.toString())
        .set('Take', take.toString());
    }

    return this.http
      .get(this.apiUrl + '/wallet/historyslim', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Get an unused receive address for a certain wallet from the API.
   */
  getUnusedReceiveAddress(data: WalletInfo): Observable<any> {
    const params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', 'account 0')
      .set('Segwit', this.addressType.IsSegwit());

    return this.http
      .get(this.apiUrl + '/wallet/unusedaddress', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Get multiple unused receive addresses for a certain wallet from the API.
   */
  getUnusedReceiveAddresses(data: WalletInfo, count: string): Observable<any> {
    const params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', 'account 0')
      .set('count', count)
      .set('Segwit', this.addressType.IsSegwit());

    return this.http
      .get(this.apiUrl + '/wallet/unusedaddresses', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Get get all addresses for an account of a wallet from the API.
   */
  getAllAddresses(data: WalletInfo): Observable<any> {
    const params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', data.accountName)
      .set('Segwit', this.addressType.IsSegwit());

    return this.http
      .get(this.apiUrl + '/wallet/addresses', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Get get all addresses for an account of a wallet from the API.
   * All Non-Segwit for xServer support.
   * This is if a user wallet is set to use segwit.
   */
  getNonSegwitAddresses(data: WalletInfo): Observable<any> {
    const params = new HttpParams()
      .set('walletName', data.walletName)
      .set('accountName', data.accountName)
      .set('Segwit', 'false');

    return this.http
      .get(this.apiUrl + '/wallet/addresses', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Estimate the fee of a transaction
   */
  estimateFee(data: FeeEstimation): Observable<any> {
    return this.http
      .post(this.apiUrl + '/wallet/estimate-txfee', JSON.stringify(data))
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Build a transaction
   */
  buildTransaction(data: TransactionBuilding): Observable<any> {
    return this.http
      .post(this.apiUrl + '/wallet/build-transaction', JSON.stringify(data))
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Send transaction
   */
  sendTransaction(data: TransactionSending): Observable<any> {
    return this.http
      .post(this.apiUrl + '/wallet/send-transaction', JSON.stringify(data))
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Remove transaction
   */
  removeAllTransactions(walletName: string): Observable<any> {
    const params = new HttpParams()
      .set('walletName', walletName)
      .set('all', 'true')
      .set('resync', 'true');

    return this.http
      .delete(this.apiUrl + '/wallet/remove-transactions', { params })
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Rescan wallet from a certain date using remove-transactions
   */
  rescanWallet(data: WalletRescan): Observable<any> {
    const params = new HttpParams()
      .set('walletName', data.name)
      .set('fromDate', data.fromDate.toDateString())
      .set('reSync', 'true');

    return this.http
      .delete(this.apiUrl + '/wallet/remove-transactions', { params })
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Sign the given message with the private key of the given address
   */
  signMessage(data: SignMessageRequest): Observable<SignMessageResponse> {
    return this.http
      .post(this.apiUrl + '/wallet/signmessage', JSON.stringify(data))
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: SignMessageResponse) => response));
  }

  /**
   * Verify the given signature with the given address
   */
  verifyMessage(data: VerifyRequest): Observable<any> {
    return this.http
      .post(this.apiUrl + '/wallet/verifymessage', JSON.stringify(data))
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   *  Gets the balance at a specific wallet address
   */
  receivedByAddress(address: string): Observable<any> {
    const params = new HttpParams()
      .set('Address', address);

    return this.http
      .get(this.apiUrl + '/wallet/received-by-address', { params })
      .pipe(catchError(err => this.handleInitialError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Start staking
   */
  startStaking(data: any): Observable<any> {
    return this.http
      .post(this.apiUrl + '/staking/startstaking', JSON.stringify(data))
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Get staking info
   */
  getStakingInfo(): Observable<any> {
    return this.http
      .get(this.apiUrl + '/staking/getstakinginfo')
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: Response) => response));
  }

  /** Stop staking */
  stopStaking(): Observable<any> {
    return this.http
      .post(this.apiUrl + '/staking/stopstaking', 'true')
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Send shutdown signal to the daemon
   */
  shutdownNode(): Observable<any> {
    return this.http
      .post(this.apiUrl + '/node/shutdown', 'true')
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: Response) => response));
  }

  /**
   * Get address information if valid.
   */
  validateAddress(address: string): Observable<ValidateAddressResponse> {
    const params = new HttpParams()
      .set('address', address);

    return this.http
      .get(this.apiUrl + '/node/validateaddress', { params })
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: ValidateAddressResponse) => response));
  }

  /*
   * Posts a coin split request
   */
  postCoinSplit(splitCoins: SplitCoins): Observable<any> {
    return this.http
      .post(this.apiUrl + '/wallet/splitcoins', splitCoins)
      .pipe(catchError(err => this.handleError(err)))
      .pipe(map((response: Response) => response));
  }

  /** Use this to handle error in the initial startup (wallet/files) of xCore. */
  handleInitialError(error: HttpErrorResponse | any) {
    // Only display message with errors when we have a connection. Initially we will receive some errors due to aggresive
    // attempts at connecting to the node.
    if (this.appState.connected) {
      this.handleException(error);
    }

    return throwError(error);
  }

  /** Use this to handle error (exceptions) that happens in RXJS pipes. This handler will rethrow the error. */
  handleError(error: HttpErrorResponse | any) {
    this.handleException(error);
    return throwError(error);
  }

  /** Use this to handle errors (exceptions) that happens outside of an RXJS pipe. See the "handleError" for pipeline error handling. */
  handleException(error: HttpErrorResponse | any) {
    let errorMessage = '';

    try {
      if (error.error instanceof ErrorEvent) {
        errorMessage = 'An error occurred:' + error.error.message;
        // A client-side or network error occurred. Handle it accordingly.
      } else if (error.error !== undefined && error.error !== null && error.error.errors !== null) {
        errorMessage = `${error.error.errors[0].message} (Code: ${error.error.errors[0].status})`;
      } else if (error.name === 'HttpErrorResponse') {
        errorMessage = `Unable to connect with background daemon: ${error.message} (${error.status})`;
      } else if (error.message !== undefined) {
        errorMessage = `Error: ${error.message} (${error.status})`;
      } else {
        errorMessage = `Error: ${error}`;
      }
    } catch (ex) {
      errorMessage = ex;
    }
    this.log.error(errorMessage);

    this.notifications.add({
      title: 'Communication error',
      hint: 'These types of errors are not uncommon, happens when there is issues communicating between xCore and x42.Node process',
      message: errorMessage,
      icon: 'warning'
    });
  }
}
