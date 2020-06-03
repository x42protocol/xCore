export class xServerRegistrationRequest {
  constructor(name: string, networkProtocol: number, networkAddress: string, networkPort: number, signature: string, address: string, tier: number) {
    this.name = name;
    this.networkProtocol = networkProtocol;
    this.networkAddress = networkAddress;
    this.networkPort = networkPort;
    this.signature = signature;
    this.address = address;
    this.tier = tier;
  }

  public name: string;
  public networkProtocol: number;
  public networkAddress: string;
  public networkPort: number;
  public signature: string;
  public address: string;
  public tier: number;
}
