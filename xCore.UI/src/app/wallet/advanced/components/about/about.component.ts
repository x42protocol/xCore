import { Component, OnInit } from '@angular/core';
import { ApplicationStateService } from '../../../../shared/services/application-state.service';
import { UpdateService } from '../../../../shared/services/update.service';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  constructor(
    public appState: ApplicationStateService,
    private electron: ElectronService,
    public updateService: UpdateService,
  ) { }

  public isElectron: boolean;
  public installEnabled: boolean;

  ngOnInit() {
    this.isElectron = this.electron.isElectronApp;
  }

  openWalletDirectory(directory: string): void {
    if (!this.isElectron) {
      return;
    }
    this.electron.shell.showItemInFolder(directory);
  }

  updateTime() {
    const updatedTime = new Date(this.updateService.info.releaseDate);
    return updatedTime.toLocaleDateString();
  }
}
