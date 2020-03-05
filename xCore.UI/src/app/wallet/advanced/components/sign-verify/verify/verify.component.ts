import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.css'],
})
export class VerifyComponent implements OnInit {
  constructor(public activeModal: DynamicDialogRef, public config: DynamicDialogConfig) { }

  public isvalid: boolean;

  ngOnInit() {
    this.isvalid = this.config.data.isvalid;
  }
}
