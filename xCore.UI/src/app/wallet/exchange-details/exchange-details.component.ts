import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { GlobalService } from '../../shared/services/global.service';
import { CoinNotationPipe } from '../../shared/pipes/coin-notation.pipe';

@Component({
  selector: 'app-exchange-details',
  templateUrl: './exchange-details.component.html',
  styleUrls: ['./exchange-details.component.css']
})
export class ExchangeDetailsComponent implements OnInit {
  exchangeData: any[];
  balance: number;

  constructor(public config: DynamicDialogConfig, private globalService: GlobalService) { }

  ngOnInit(): void {
    this.exchangeData = [];
    this.balance = this.config.data.balance;
    this.config.data.rates.forEach((entry) => {
      const upperSymbol = entry.symbol.toUpperCase();
      const symbolCharacter = this.globalService.getSymbolCharacter(upperSymbol) + ' ';
      if (upperSymbol === 'BTC') {
        entry.total = symbolCharacter + new CoinNotationPipe(this.globalService).transform(entry.rate * this.balance);
      } else {
        entry.total = symbolCharacter + Number.parseFloat(new CoinNotationPipe(this.globalService).transform((entry.rate * this.balance)).toString()).toFixed(2);
      }
      entry.rate = symbolCharacter + entry.rate;
      this.exchangeData.push(entry);
    });
  }
}
