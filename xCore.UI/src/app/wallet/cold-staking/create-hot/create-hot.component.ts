import { Component } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder } from '@angular/forms';
import { SelectItem } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { GlobalService } from '../../../shared/services/global.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { ColdStakingService } from '../../../shared/services/coldstaking.service';
import { debounceTime } from 'rxjs/operators';

type FeeType = { id: number, display: string, value: number };

@Component({
  selector: 'app-create-hot',
  templateUrl: './create-hot.component.html',
  styleUrls: ['./create-hot.component.css']
})
export class ColdStakingCreateHotComponent {
  feeTypes: FeeType[] = [];
  selectedFeeType: FeeType;
  public copyType: SelectItem[];

  constructor(
    private globalService: GlobalService,
    private stakingService: ColdStakingService,
    public activeModal: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private fb: UntypedFormBuilder,
    public themeService: ThemeService,
  ) {
    this.buildSendForm();
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
  }

  public isDarkTheme = false;
  public sendForm: UntypedFormGroup;
  public apiError: string;
  public isSending = false;
  public address: string;
  public acknowledgeWarning = false;
  public addressCopied = false;

  sendFormErrors = {
    password: ''
  };

  sendValidationMessages = {
    password: {
      required: 'Your password is required.'
    }
  };

  private buildSendForm(): void {
    this.copyType = [
      { label: 'Copy', value: 'Copy', icon: 'pi pi-copy' }
    ];

    this.sendForm = this.fb.group({
      password: ['', Validators.required]
    });

    this.sendForm.valueChanges.pipe(debounceTime(300)).subscribe(data => this.onSendValueChanged(data));
  }

  private onSendValueChanged(data?: any) {
    if (!this.sendForm) { return; }
    const form = this.sendForm;

    // tslint:disable-next-line:forin
    for (const field in this.sendFormErrors) {
      this.sendFormErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.sendValidationMessages[field];

        // tslint:disable-next-line:forin
        for (const key in control.errors) {
          this.sendFormErrors[field] += messages[key] + ' ';
        }
      }
    }

    this.apiError = '';
  }

  public onCopiedClick() {
    this.addressCopied = true;
  }

  getFirstUnusedAddress() {
    this.stakingService.getAddress(this.globalService.getWalletName(), false).subscribe(x => this.address = x.address);
  }

  public createAccount(): void {
    this.isSending = true;
    const walletName = this.globalService.getWalletName();
    const walletPassword = this.sendForm.get('password').value;

    this.stakingService.createColdStakingAccount(walletName, walletPassword, true)
      .subscribe(
        createColdStakingAccountResponse => {
          this.stakingService.createColdStakingAccount(walletName, walletPassword, false)
            .subscribe(() => {
              setTimeout(() => {
                this.getFirstUnusedAddress();
              }, 2000);
            });
        },
        error => {
          this.isSending = false;
          this.apiError = error.error.errors[0].message;
        }
      );
  }

  onAcknowledge() {
    this.acknowledgeWarning = true;
  }

}
