import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { Router } from '@angular/router';

import { ApiService } from '../../shared/services/api.service';
import { GlobalService } from '../../shared/services/global.service';

@Component({
  selector: 'app-logout-confirmation',
  templateUrl: './logout-confirmation.component.html',
  styleUrls: ['./logout-confirmation.component.css']
})
export class LogoutConfirmationComponent {
  constructor(private router: Router, private FullNodeApiService: ApiService, private globalService: GlobalService, public ref: DynamicDialogRef) { }

  public onLogout() {
    this.FullNodeApiService.stopStaking().subscribe();
    this.globalService.setProfile(null);
    this.ref.close();
    this.router.navigate(['/login']);
  }
}
