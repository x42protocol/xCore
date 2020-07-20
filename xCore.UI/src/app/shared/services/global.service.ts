import {Injectable} from "@angular/core";
import { ElectronService } from 'ngx-electron';
import { XServerStatus } from '../models/xserver-status';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  constructor(private electronService: ElectronService) {
    this.setApplicationVersion();
    this.setSidechainEnabled();
    this.setTestnetEnabled();
    this.setApiPort();
    this.setWalletName("");
    this.setWalletName("");
  }

  private applicationVersion: string = "0.1.0";
  private testnet: boolean = false;
  private sidechain: boolean = false;
  private mainApiPort: number = 42220;
  private testApiPort: number = 42221;
  private mainSideChainApiPort: number = 42221;
  private testSideChainApiPort: number = 42221;
  private apiPort: number;
  private walletPath: string;
  private currentWalletName: string;
  private coinUnit: string;
  private network: string;
  private walletKeyAddress: string;
  private blockHeight: number;
  private xServerStatus: XServerStatus;
  private profile: any;

  quitApplication() {
    this.electronService.remote.app.quit();
  }

  getApplicationVersion() {
    return this.applicationVersion;
  }

  setApplicationVersion() {
    if (this.electronService.isElectronApp) {
      this.applicationVersion = this.electronService.remote.app.getVersion();
    }
  }

  getTestnetEnabled() {
    return this.testnet;
  }

  setTestnetEnabled() {
    if (this.electronService.isElectronApp) {
      this.testnet = this.electronService.ipcRenderer.sendSync('get-testnet');
    }
  }

  getSidechainEnabled() {
    return this.sidechain;
  }

  setSidechainEnabled() {
    if (this.electronService.isElectronApp) {
      this.sidechain = this.electronService.ipcRenderer.sendSync('get-sidechain');
    }
  }

  getFullNodeApiPort() {
    return this.apiPort;
  }

  setApiPort() {
    if (this.electronService.isElectronApp) {
      this.apiPort = this.electronService.ipcRenderer.sendSync('get-port');
    } else if (this.testnet && !this.sidechain) {
      this.apiPort = this.testApiPort;
    } else if (!this.testnet && !this.sidechain) {
      this.apiPort = this.mainApiPort;
    } else if (this.testnet && this.sidechain) {
      this.apiPort = this.testSideChainApiPort;
    } else if (!this.testnet && this.sidechain) {
      this.apiPort = this.mainSideChainApiPort;
    }
  }

  getWalletPath() {
    return this.walletPath;
  }

  setWalletPath(walletPath: string) {
    this.walletPath = walletPath;
  }

  getNetwork() {
    return this.network;
  }

  setNetwork(network: string) {
    this.network = network;
  }

  getWalletName() {
    return this.currentWalletName;
  }

  setWalletName(currentWalletName: string) {
    this.currentWalletName = currentWalletName;
  }

  getWalletKeyAddress() {
    return this.walletKeyAddress;
  }

  setWalletKeyAddress(keyaddress: string) {
    this.walletKeyAddress = keyaddress;
  }

  getCoinUnit() {
    return this.coinUnit;
  }

  setCoinUnit(coinUnit: string) {
    this.coinUnit = coinUnit;
  }

  setBlockHeight(height: number) {
    this.blockHeight = height;
  }

  getBlockHeight() {
    return this.blockHeight;
  }

  setxServerStatus(xServerStatus: XServerStatus) {
    this.xServerStatus = xServerStatus;
  }

  getxServerStatus() {
    return this.xServerStatus;
  }

  setProfile(profileInfo: any) {
    this.profile = profileInfo;
  }

  getProfile() {
    return this.profile;
  }

  public getSymbolCharacter(symbol: string): string {
    let result: string;
    switch (symbol) {
      case "AED":
        result = "د.إ";
        break;
      case "BDT":
        result = "৳";
        break;
      case "BRL":
        result = "R$";
        break;
      case "CHF":
        result = "CHF";
        break;
      case "CZK":
        result = "Kč";
        break;
      case "DKK":
        result = "kr";
        break;
      case "GBP":
        result = "£";
        break;
      case "HKD":
        result = "“元”";
        break;
      case "HUF":
        result = "ft";
        break;
      case "ILS":
        result = "₪";
        break;
      case "INR":
        result = "₹";
        break;
      case "LKR":
        result = "Rs";
        break;
      case "MYR":
        result = "RM";
        break;
      case "NOK":
        result = "kr";
        break;
      case "PHP":
        result = "₱";
        break;
      case "PKR":
        result = "Rs";
        break;
      case "PLN":
        result = "zł";
        break;
      case "SEK":
        result = "kr";
        break;
      case "THB":
        result = "฿";
        break;
      case "TRY":
        result = "₺";
        break;
      case "UAH":
        result = "₴";
        break;
      case "VND":
        result = "₫";
        break;
      case "ZAR":
        result = "R";
        break;
      default:
        result = "$";
    }
    return result;
  }
}
