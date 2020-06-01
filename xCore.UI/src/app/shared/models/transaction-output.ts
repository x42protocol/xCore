export class TransactionOutput {
  constructor(bestblock: string, confirmations: number, value: number, scriptPubKey: ScriptPubKey, coinbase: boolean) {
    this.bestblock = bestblock;
    this.confirmations = confirmations;
    this.value = value;
    this.scriptPubKey = scriptPubKey;
    this.coinbase = coinbase;
  }

  public bestblock: string;
  public confirmations: number;
  public value: number;
  public scriptPubKey: ScriptPubKey;
  public coinbase: boolean;
}

export interface ScriptPubKey {
  asm: string;
  hex: string;
  type: string;
}
