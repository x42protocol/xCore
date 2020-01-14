import { Component } from '@angular/core';
import { DynamicDialogRef, DialogService } from 'primeng/api';

@Component({
  selector: 'app-withdraw-confirmation',
  templateUrl: './withdraw-confirmation.component.html',
  styleUrls: ['./withdraw-confirmation.component.css']
})
export class ColdStakingWithdrawConfirmationComponent{
  constructor(public activeModal: DynamicDialogRef, public dialogService: DialogService) { }

  okClicked() {
    this.activeModal.close();
  }
}
