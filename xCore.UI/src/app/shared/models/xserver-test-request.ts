export class XServerTestRequest {
  constructor(networkProtocol: number, networkAddress: string, networkPort: number, blockHeight: number) {
    this.networkProtocol = networkProtocol;
    this.networkAddress = networkAddress;
    this.networkPort = networkPort;
    this.blockHeight = blockHeight;
  }

  public networkProtocol: number;
  public networkAddress: string;
  public networkPort: number;
  public blockHeight: number;
}
