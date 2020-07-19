export class CreatePriceLockRequest {
  constructor(requestAmount: number, requestAmountPair: number, destinationAddress: string, expireBlock: number) {
    this.requestAmount = requestAmount;
    this.requestAmountPair = requestAmountPair;
    this.destinationAddress = destinationAddress;
    this.expireBlock = expireBlock;
  }

  public requestAmount: number;
  public requestAmountPair: number;
  public destinationAddress: string;
  public expireBlock: number;
}
