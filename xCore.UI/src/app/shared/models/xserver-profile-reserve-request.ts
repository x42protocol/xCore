export class ProfileReserveRequest
{
  constructor(name: string, keyAddress: string, returnAddress: string, signature: string) {
    this.name = name;
    this.keyAddress = keyAddress;
    this.returnAddress = returnAddress;
    this.signature = signature;
  }

  public name: string;
  public keyAddress: string;
  public returnAddress: string;
  public signature: string;
}
