import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-signature',
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.css'],
})
export class SignatureComponent implements OnInit {
  constructor(
    public activeModal: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) { }

  public content = '';
  public address = '';
  public message = '';
  public copied = false;

  ngOnInit() {
    this.content = this.config.data.content;
    this.address = this.config.data.address;
    this.message = this.config.data.message;
  }

  public onCopiedClick() {
    this.copied = true;
  }
}
