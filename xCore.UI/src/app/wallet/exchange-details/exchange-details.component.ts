import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { GlobalService } from '../../shared/services/global.service';
import { CoinNotationPipe } from '../../shared/pipes/coin-notation.pipe';
import { SettingsService } from '../../shared/services/settings.service';
import { ApiEvents } from '../../shared/services/api.events';
import { WorkerType } from '../../shared/models/worker';

@Component({
  selector: 'app-exchange-details',
  templateUrl: './exchange-details.component.html',
  styleUrls: ['./exchange-details.component.css']
})
export class ExchangeDetailsComponent implements OnInit {
  exchangeData: any[];
  balance: number;
  preferredFiatExchangeCurrency: string;
  preferredCryptoExchangeCurrency: string;

  constructor(public config: DynamicDialogConfig, private globalService: GlobalService, private settingsService: SettingsService, private apiEvents: ApiEvents) { }

  ngOnInit(): void {
    this.preferredFiatExchangeCurrency = this.settingsService.preferredFiatExchangeCurrency;
    this.preferredCryptoExchangeCurrency = this.settingsService.preferredCryptoExchangeCurrency;

    this.exchangeData = [];
    this.balance = this.config.data.balance;
    const currencies = this.globalService.getCurrencies();

    this.config.data.rates.forEach((entry) => {
      const matchedCurrency = currencies.find(l => l.abbreviation === entry.symbol.toUpperCase());
      entry.currency = matchedCurrency.name;
      entry.total = matchedCurrency.symbol.toUpperCase() + ' ' + Number.parseFloat(new CoinNotationPipe(this.globalService).transform((entry.rate * this.balance)).toString()).toFixed(matchedCurrency.decimals);
      entry.abbreviation = matchedCurrency.abbreviation;
      entry.type = matchedCurrency.type;
      entry.rate = matchedCurrency.symbol.toUpperCase() + ' ' + (+entry.rate).toFixed(matchedCurrency.decimals);
      this.exchangeData.push(entry);
    });
  }

  setPreferredExchangeCurrency(exchangeData: any) {
    if (exchangeData.type === 'f') {
      this.settingsService.preferredFiatExchangeCurrency = exchangeData.abbreviation.toUpperCase();
      this.preferredFiatExchangeCurrency = exchangeData.abbreviation.toUpperCase();
    }

    if (exchangeData.type === 'c') {
      this.settingsService.preferredCryptoExchangeCurrency = exchangeData.abbreviation.toUpperCase();
      this.preferredCryptoExchangeCurrency = exchangeData.abbreviation.toUpperCase();
    }
    this.apiEvents.ManualTick(WorkerType.COINGECKO_EXCHANGE_RATES);
  }
}
