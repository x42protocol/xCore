export class ColdHotStateRequest {
  constructor(
    Name: string,
    isColdHotWallet: boolean
  ) {
    this.Name = Name;
    this.isColdHotWallet = isColdHotWallet;
  }
  public Name: string;
  public isColdHotWallet: boolean;
}
