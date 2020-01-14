import { Component } from '@angular/core';
import { DynamicDialogRef, DialogService } from 'primeng/api';

@Component({
  selector: 'app-create-success',
  templateUrl: './create-success.component.html',
  styleUrls: ['./create-success.component.css']
})
export class ColdStakingCreateSuccessComponent {

  constructor(public ref: DynamicDialogRef, public dialogService: DialogService) { }

  okClicked() {
    this.ref.close();
  }
}
