import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ApiService } from '../../../../shared/services/api.service';
import { GlobalService } from '../../../../shared/services/global.service';
import { AddressType, AddressTypes } from '../../../../shared/models/address-type';
import { ColdHotStateRequest } from '../../../../shared/models/coldhotstaterequest';
import { SelectItemGroup, SelectItem } from 'primeng/api';

@Component({
  selector: 'app-about',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  constructor(
    private nodeApiService: ApiService,
    private globalService: GlobalService,
    private themeService: ThemeService,
    private electronService: ElectronService,
    private addressType: AddressType,
  ) { }

  public groupedThemes: SelectItemGroup[];
  public addressTypeOptions: SelectItem[];
  public coldWalletTypeOptions: SelectItem[];
  public selectedAddressType: AddressTypes;
  public isColdHotWallet: boolean;
  public logoFileName: string;
  public selectedTheme: string;

  ngOnInit() {
    this.groupedThemes = [
      {
        label: 'Light', value: 'fa fa-lightbulb-o',
        items: [
          { label: 'Green (Default)', value: 'Rhea' },
          { label: 'Blue', value: 'Nova-Dark' },
          { label: 'Mixed Colors', value: 'Nova-Colored' }
        ]
      },
      {
        label: 'Dark', value: 'fa fa-moon-o',
        items: [
          { label: 'Amber', value: 'Luna-amber' },
          { label: 'Blue', value: 'Luna-blue' },
          { label: 'Green', value: 'Luna-green' },
          { label: 'Pink', value: 'Luna-pink' }
        ]
      }
    ];
    this.selectedTheme = this.themeService.getCurrentTheme().name;

    this.addressTypeOptions = [
      { label: 'Classic', value: AddressTypes.Classic, icon: 'fa fa-address-card-o' },
      { label: 'Segwit', value: AddressTypes.Segwit, icon: 'fa fa-address-card' }
    ];

    this.coldWalletTypeOptions = [
      { label: 'Cold (Default)', value: false, icon: 'fa fa-shield' },
      { label: 'Hot', value: true, icon: 'fa fa-fire' }
    ];

    this.selectedAddressType = this.addressType.Type;

    this.nodeApiService
      .getColdHotState(this.globalService.getWalletName())
      .subscribe(
        isHot => {
          this.isColdHotWallet = isHot;
        }
      );
  }

  isAddressTypeSegwit(): boolean {
    return this.selectedAddressType === AddressTypes.Segwit;
  }

  onThemeChange(event) {
    this.themeService.setTheme(event.value);
    this.setLogoPath();
  }

  setLogoPath() {
    this.logoFileName = this.themeService.getLogo();
  }

  onColdWalletTypeChange(event) {
    const requestData = new ColdHotStateRequest(this.globalService.getWalletName(), event.value);
    this.nodeApiService
      .toggleColdHotState(requestData)
      .subscribe();
  }

  onAddressTypeChange(event) {
    this.addressType.changeType(event.value);
  }

  public openSegwit() {
    this.electronService.shell.openExternal('https://en.bitcoin.it/wiki/Segregated_Witness');
  }

  public openColdHotSetup() {
    this.electronService.shell.openExternal('https://github.com/x42protocol/documentation/blob/master/xCore-ColdStakingHotSetup.md');
  }
}
