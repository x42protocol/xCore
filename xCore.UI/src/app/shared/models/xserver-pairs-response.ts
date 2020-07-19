export class PairResults {
  constructor(pairs: Pair[]) {
    this.pairs = pairs;
  }

  public pairs: Pair[];
}

export class Pair {
  constructor(id: number, symbol: string) {
    this.id = id;
    this.symbol = symbol;
  }

  public id: number;
  public symbol: string;
  
}
