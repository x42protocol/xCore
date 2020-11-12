import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ApiService } from '../../../../shared/services/api.service';
import { GlobalService } from '../../../../shared/services/global.service';
import { ApplicationStateService } from '../../../../shared/services/application-state.service';
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
    private apiService: ApiService,
    private globalService: GlobalService,
    private themeService: ThemeService,
    private electronService: ElectronService,
    private addressType: AddressType,
    public appState: ApplicationStateService,
  ) { }

  public groupedThemes: SelectItemGroup[];
  public addressTypeOptions: SelectItem[];
  public coldWalletTypeOptions: SelectItem[];
  public modeTypeOptions: SelectItem[];
  public selectedAddressType: AddressTypes;
  public isColdHotWallet: boolean;
  public logoFileName: string;
  public selectedTheme: string;
  public isDeveloper: boolean;

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
      { label: 'Hot (Delegated)', value: true, icon: 'fa fa-fire' }
    ];

    this.modeTypeOptions = [
      { label: 'Open Developer Tools', value: true, icon: 'pi pi-user-plus' }
    ];

    this.selectedAddressType = this.addressType.Type;

    this.apiService
      .getColdHotState(this.globalService.getWalletName())
      .subscribe(
        isHot => {
          this.isColdHotWallet = isHot;
          this.appState.delegated = isHot;
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

  onModeChange(event) {
    if (event.value) {
      this.electronService.ipcRenderer.sendSync('open-dev-tools');
    }
  }

  setLogoPath() {
    this.logoFileName = this.themeService.getLogo();
  }

  onColdWalletTypeChange(event) {
    this.appState.delegated = event.value;
    const requestData = new ColdHotStateRequest(this.globalService.getWalletName(), event.value);
    this.apiService
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
    this.electronService.shell.openExternal('https://github.com/x42protocol/xCore/wiki/Remote-Delegated-Cold-Staking-Setup');
  }
}
