export class SignMessageResponse {
  constructor(
    signedAddress: string,
    signature: string
  ) {
    this.signedAddress = signedAddress;
    this.signature = signature;
  }
  public signedAddress: string;
  public signature: string;
}
