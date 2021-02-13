import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, interval, throwError } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import { ModalService } from './modal.service';
import { AddressType } from '../models/address-type';
import { ColdStakingSetup } from '../models/coldstakingsetup';
import { ColdStakingSetupResponse } from '../models/coldstakingsetupresponse';
import { ColdStakingCreateAddressResponse } from '../models/coldstakingcreateaddressresponse';
import { ColdStakingCreateAccountResponse } from '../models/coldstakingcreateaccountresponse';
import { ColdStakingCreateAccountRequest } from '../models/coldstakingcreateaccountrequest';
import { ColdStakingGetInfoResponse } from '../models/coldstakinggetinforesponse';
import { ColdStakingWithdrawalResponse } from '../models/coldstakingwithdrawalresponse';
import { ColdStakingWithdrawalRequest } from '../models/coldstakingwithdrawalrequest';
import { ChainService } from './chain.service';
import { ApplicationStateService } from './application-state.service';

@Injectable({
  providedIn: 'root'
})
export class ColdStakingService {
  constructor(
    private http: HttpClient,
    private modalService: ModalService,
    private addressType: AddressType,
    private chains: ChainService,
    private appState: ApplicationStateService,
  ) {
    this.initialize();
  }

  private pollingInterval = interval(5000);
  private x42ApiUrl;

  initialize() {
    const chain = this.chains.getChain(this.appState.network);
    this.setApiUrl(chain.apiPort);
  }

  setApiUrl(port: number) {
    this.x42ApiUrl = 'http://localhost:' + port + '/api';
  }

  getInfo(walletName: string): Observable<ColdStakingGetInfoResponse> {
    const params = new HttpParams()
      .set('walletName', walletName);

    return this.pollingInterval.pipe(
      startWith(0),
      switchMap(() => this.http.get<ColdStakingGetInfoResponse>(this.x42ApiUrl + '/coldstaking/cold-staking-info', { params })),
      catchError(err => this.handleHttpError(err))
    );
  }

  getAddress(walletName: string, isColdWalletAddress: boolean, isSegwit: string = '', silent?: boolean): Observable<ColdStakingCreateAddressResponse> {
    if (isSegwit === '') {
      isSegwit = this.addressType.IsSegwit();
    }
    const params = new HttpParams()
      .set('walletName', walletName)
      .set('isColdWalletAddress', isColdWalletAddress.toString().toLowerCase())
      .set('Segwit', isSegwit);

    return this.http.get<ColdStakingCreateAddressResponse>(this.x42ApiUrl + '/coldstaking/cold-staking-address', { params }).pipe(
      catchError(err => this.handleHttpError(err, silent))
    );
  }

  createColdstaking(coldStakingSetup: ColdStakingSetup, silent?: boolean): Observable<ColdStakingSetupResponse> {
    return this.http.post<ColdStakingSetupResponse>(this.x42ApiUrl + '/coldstaking/setup-cold-staking', JSON.stringify(coldStakingSetup)).pipe(
      catchError(err => this.handleHttpError(err, silent))
    );
  }

  createColdStakingAccount(walletName: string, walletPassword: string, isColdWalletAddress: boolean, silent?: boolean): Observable<ColdStakingCreateAccountResponse> {
    const request = new ColdStakingCreateAccountRequest(walletName, walletPassword, isColdWalletAddress);
    return this.http.post<ColdStakingCreateAccountResponse>(this.x42ApiUrl + '/coldstaking/cold-staking-account', JSON.stringify(request)).pipe(
      catchError(err => this.handleHttpError(err, silent))
    );
  }

  withdrawColdStaking(coldStakingWithdrawalRequest: ColdStakingWithdrawalRequest, silent?: boolean): Observable<ColdStakingWithdrawalResponse> {
    return this.http.post<ColdStakingWithdrawalResponse>(this.x42ApiUrl + '/coldstaking/cold-staking-withdrawal', JSON.stringify(coldStakingWithdrawalRequest)).pipe(
      catchError(err => this.handleHttpError(err, silent))
    );
  }

  /**
   * Get get the address for your profile.
   */
  getProfileAddress(walletName: string, walletPassword: string): Observable<any> {
    const params = new HttpParams()
      .set('walletName', encodeURIComponent(walletName))
      .set('walletPassword', encodeURIComponent(walletPassword))
      .set('isColdWalletAccount', 'true')
      .set('segwit', 'false');
    console.log(params);
    return this.http.get(this.x42ApiUrl + '/coldstaking/getprofileaddress', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  private handleHttpError(error: HttpErrorResponse, silent?: boolean) {
    if (error.status >= 400) {
      if (error.error.errors[0].message && !silent) {
        this.modalService.openModal(null, error.error.errors[0].message);
      }
    }
    console.log(error);
    return throwError(error);
  }
}
