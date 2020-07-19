export class SubmitPaymentRequest
{
  constructor(priceLockId: string, transactionHex: string, transactionId: string, payeeSignature: string) {
    this.priceLockId = priceLockId;
    this.transactionHex = transactionHex;
    this.transactionId = transactionId;
    this.payeeSignature = payeeSignature;
  }

  public priceLockId: string;
  public transactionHex: string;
  public transactionId: string;
  public payeeSignature: string;
}
