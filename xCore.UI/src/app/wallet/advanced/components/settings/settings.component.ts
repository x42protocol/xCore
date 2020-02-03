import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ThemeService } from '../../../../shared/services/theme.service';
import { FullNodeApiService } from '../../../../shared/services/fullnode.api.service';
import { AddressType, AddressTypes } from '../../../../shared/models/address-type';
import { SelectItemGroup, SelectItem } from 'primeng/api';

@Component({
  selector: 'app-about',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  constructor(private nodeApiService: FullNodeApiService, private themeService: ThemeService, private electronService: ElectronService, private addressType: AddressType) { }

  public groupedThemes: SelectItemGroup[];
  public addressTypeOptions: SelectItem[];
  public selectedAddressType: AddressTypes;
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
      { label: 'Segwit (Default)', value: AddressTypes.Segwit, icon: 'fa fa-address-card' },
      { label: 'Classic ', value: AddressTypes.Classic, icon: 'fa fa-address-card-o' }
    ];

    this.selectedAddressType = this.addressType.Type;

  }

  isAddressTypeSegwit(): boolean {
    return this.selectedAddressType == AddressTypes.Segwit;
  }

  onThemeChange(event) {
    this.themeService.setTheme(event.value);
    this.setLogoPath();
  }

  setLogoPath() {
    this.logoFileName = this.themeService.getLogo();
  }

  onAddressTypeChange(event) {
    this.addressType.changeType(event.value);
  }

  public openSupport() {
    this.electronService.shell.openExternal("https://en.bitcoin.it/wiki/Segregated_Witness");
  }
}
