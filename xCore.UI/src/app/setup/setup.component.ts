import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-setup-component',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css'],
})
export class SetupComponent {
  constructor(
    private router: Router,
  ) { }
  public onCreateClicked() {
    this.router.navigate(['setup/create']);
  }

  public onRecoverClicked() {
    this.router.navigate(['setup/recover']);
  }

  public onBackClicked() {
    this.router.navigate(['login']);
  }
}
