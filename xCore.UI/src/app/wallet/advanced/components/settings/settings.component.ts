import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../../shared/services/theme.service';
import { FullNodeApiService } from '../../../../shared/services/fullnode.api.service';
import { SelectItemGroup } from 'primeng/api';

@Component({
  selector: 'app-about',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  constructor(private nodeApiService: FullNodeApiService, private themeService: ThemeService) { }

  public groupedThemes: SelectItemGroup[];
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
  }

  onThemeChange(event) {
    this.themeService.setTheme(event.value);
    this.setLogoPath();
  }

  setLogoPath() {
    this.logoFileName = this.themeService.getLogo();
  }
}
