export class XServerRegistrationRequest {
  constructor(profileName: string, networkProtocol: number, networkAddress: string, networkPort: number, signature: string, keyAddress: string, signAddress: string, feeAddress: string, tier: number) {
    this.profileName = profileName;
    this.networkProtocol = networkProtocol;
    this.networkAddress = networkAddress;
    this.networkPort = networkPort;
    this.keyAddress = keyAddress;
    this.feeAddress = feeAddress;
    this.signature = signature;
    this.signAddress = signAddress;
    this.tier = tier;
  }

  public profileName: string;
  public networkProtocol: number;
  public networkAddress: string;
  public networkPort: number;
  public keyAddress: string;
  public feeAddress: string;
  public signature: string;
  public signAddress: string;
  public tier: number;
}
