import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, interval, throwError } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';

import { GlobalService } from './global.service';
import { ModalService } from './modal.service';
import { AddressType } from '../models/address-type';

import { ColdStakingSetup } from "../models/coldstakingsetup";
import { ColdStakingSetupResponse } from "../models/coldstakingsetupresponse";
import { ColdStakingCreateAddressResponse } from "../models/coldstakingcreateaddressresponse";
import { ColdStakingCreateAccountResponse } from "../models/coldstakingcreateaccountresponse";
import { ColdStakingCreateAccountRequest } from "../models/coldstakingcreateaccountrequest";
import { ColdStakingGetInfoResponse } from "../models/coldstakinggetinforesponse";
import { ColdStakingWithdrawalResponse } from "../models/coldstakingwithdrawalresponse";
import { ColdStakingWithdrawalRequest } from "../models/coldstakingwithdrawalrequest";

@Injectable({
  providedIn: 'root'
})
export class ColdStakingService {
  constructor(private http: HttpClient, private globalService: GlobalService, private modalService: ModalService, private router: Router, private addressType: AddressType) {
    this.setApiUrl();
  }

  private pollingInterval = interval(5000);
  private apiPort;
  private x42ApiUrl;

  setApiUrl() {
    this.apiPort = this.globalService.getFullNodeApiPort();
    this.x42ApiUrl = 'http://localhost:' + this.apiPort + '/api';
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

  getAddress(walletName: string, isColdWalletAddress: boolean, isSegwit: string = ""): Observable<ColdStakingCreateAddressResponse> {
    if (isSegwit == "") {
      isSegwit = this.addressType.IsSegwit();
    }
    const params = new HttpParams()
      .set('walletName', walletName)
      .set('isColdWalletAddress', isColdWalletAddress.toString().toLowerCase())
      .set('Segwit', isSegwit);

    return this.http.get<ColdStakingCreateAddressResponse>(this.x42ApiUrl + '/coldstaking/cold-staking-address', { params }).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  createColdstaking(coldStakingSetup: ColdStakingSetup, silent?: boolean): Observable<ColdStakingSetupResponse> {
    return this.http.post<ColdStakingSetupResponse>(this.x42ApiUrl + '/coldstaking/setup-cold-staking', JSON.stringify(coldStakingSetup)).pipe(
      catchError(err => this.handleHttpError(err, silent))
    );
  }

  createColdStakingAccount(walletName: string, walletPassword: string, isColdWalletAddress: boolean, silent?: boolean): Observable<ColdStakingCreateAccountResponse> {
    var request = new ColdStakingCreateAccountRequest(walletName, walletPassword, isColdWalletAddress);
    return this.http.post<ColdStakingCreateAccountResponse>(this.x42ApiUrl + '/coldstaking/cold-staking-account', JSON.stringify(request)).pipe(
      catchError(err => this.handleHttpError(err, silent))
    );
  }

  withdrawColdStaking(coldStakingWithdrawalRequest: ColdStakingWithdrawalRequest): Observable<ColdStakingWithdrawalResponse> {
    return this.http.post<ColdStakingWithdrawalResponse>(this.x42ApiUrl + '/coldstaking/cold-staking-withdrawal', JSON.stringify(coldStakingWithdrawalRequest)).pipe(
      catchError(err => this.handleHttpError(err))
    );
  }

  private handleHttpError(error: HttpErrorResponse, silent?: boolean) {
    console.log(error);
    if (error.status >= 400) {
      if (error.error.errors[0].message && !silent) {
        this.modalService.openModal(null, error.error.errors[0].message);
      }
    }
    console.log(error);
    return throwError(error);
  }
}
