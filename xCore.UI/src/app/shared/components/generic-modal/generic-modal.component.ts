import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/api';

@Component({
  selector: 'app-generic-modal',
  templateUrl: './generic-modal.component.html',
  styleUrls: ['./generic-modal.component.css']
})
export class GenericModalComponent implements OnInit, AfterViewInit {

  public message: string;

  constructor(public ref: DynamicDialogRef, public config: DynamicDialogConfig) { }

  @ViewChild('closeButton', { static: false }) focusElement: ElementRef;

  ngOnInit() {
    this.message = this.config.data.message;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.focusElement.nativeElement.focus();
    }, 0);
  }
}
