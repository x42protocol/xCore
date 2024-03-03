import { Component, OnInit, Input, Output, EventEmitter, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { WalletCreation } from '../../../shared/models/wallet-creation';
import { SecretWordIndexGenerator } from './secret-word-index-generator';
import { ThemeService } from '../../../shared/services/theme.service';

@Component({
  selector: 'app-confirm-mnemonic',
  templateUrl: './confirm-mnemonic.component.html',
  styleUrls: ['./confirm-mnemonic.component.css']
})
export class ConfirmMnemonicComponent implements OnInit {

  public secretWordIndexGenerator = new SecretWordIndexGenerator();

  constructor(
    private apiService: ApiService,
    private router: Router,
    private fb: UntypedFormBuilder,
    public themeService: ThemeService,
  ) {
    this.buildMnemonicForm();
    this.isDarkTheme = themeService.getCurrentTheme().themeType === 'dark';
  }

  @Input() queryParams: any;
  @Output() walletCreated: EventEmitter<boolean> = new EventEmitter<boolean>();

  private newWallet: WalletCreation;
  public mnemonicForm: UntypedFormGroup;
  public matchError = '';
  public isCreating: boolean;
  public isDarkTheme = false;

  @ViewChildren('words') focusableInputs: QueryList<ElementRef>;

  formErrors = {
    word1: '',
    word2: '',
    word3: ''
  };

  validationMessages = {
    word1: {
      required: 'This secret word is required.',
      minlength: 'A secret word must be at least one character long',
      maxlength: 'A secret word can not be longer than 24 characters',
      pattern: 'Please enter a valid scret word. [a-Z] are the only characters allowed.'
    },
    word2: {
      required: 'This secret word is required.',
      minlength: 'A secret word must be at least one character long',
      maxlength: 'A secret word can not be longer than 24 characters',
      pattern: 'Please enter a valid scret word. [a-Z] are the only characters allowed.'
    },
    word3: {
      required: 'This secret word is required.',
      minlength: 'A secret word must be at least one character long',
      maxlength: 'A secret word can not be longer than 24 characters',
      pattern: 'Please enter a valid scret word. [a-Z] are the only characters allowed.'
    }
  };

  ngOnInit() {
    const nameKey = 'name';
    const mnemonicKey = 'mnemonic';
    const passwordKey = 'password';
    const passphraseKey = 'passphrase';
    this.newWallet = new WalletCreation(
      this.queryParams[nameKey],
      this.queryParams[mnemonicKey],
      this.queryParams[passwordKey],
      this.queryParams[passphraseKey]
    );
  }

  private buildMnemonicForm(): void {
    this.mnemonicForm = this.fb.group({
      word1: ['',
        Validators.compose([
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(24),
          Validators.pattern(/^[a-zA-Z]*$/)
        ])
      ],
      word2: ['',
        Validators.compose([
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(24),
          Validators.pattern(/^[a-zA-Z]*$/)
        ])
      ],
      word3: ['',
        Validators.compose([
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(24),
          Validators.pattern(/^[a-zA-Z]*$/)
        ])
      ]
    });

    this.mnemonicForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged();
  }

  onValueChanged(data?: any) {
    if (!this.mnemonicForm) { return; }
    const form = this.mnemonicForm;

    // tslint:disable-next-line:forin
    for (const field in this.formErrors) {
      this.formErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];

        // tslint:disable-next-line:forin
        for (const key in control.errors) {
          this.formErrors[field] += messages[key] + ' ';
        }
      }
    }

    this.matchError = '';
  }

  public onConfirmClicked() {
    this.checkMnemonic();
    if (this.checkMnemonic()) {
      this.isCreating = true;
      this.createWallet(this.newWallet);
    }
  }

  public onBackClicked() {
    this.router.navigate(['/setup/create/show-mnemonic'], { queryParams: { name: this.newWallet.name, mnemonic: this.newWallet.mnemonic, password: this.newWallet.password, passphrase: this.newWallet.passphrase } });
  }

  private checkMnemonic(): boolean {
    const mnemonic = this.newWallet.mnemonic;
    const mnemonicArray = mnemonic.split(' ');

    if (this.mnemonicForm.get('word1').value.trim() === mnemonicArray[this.secretWordIndexGenerator.index1] &&
      this.mnemonicForm.get('word2').value.trim() === mnemonicArray[this.secretWordIndexGenerator.index2] &&
      this.mnemonicForm.get('word3').value.trim() === mnemonicArray[this.secretWordIndexGenerator.index3]) {
      return true;
    } else {
      this.matchError = 'The secret words do not match.';
      return false;
    }
  }

  private createWallet(wallet: WalletCreation) {
    this.apiService.createX42Wallet(wallet)
      .subscribe(
        response => {
          this.walletCreated.emit(true);
        },
        error => {
          this.isCreating = false;
        }
      );
  }

  public focusNext(event: KeyboardEvent) {
    const elemCount = this.focusableInputs.length;

    this.focusableInputs.forEach((focusableInput: any, index: number) => {
      if (focusableInput.nativeElement.id === (event.target as any).id) {

        const nextElIndex = index < elemCount - 1 ? index + 1 : 0;
        const focusableArray = this.focusableInputs.toArray();
        focusableArray[nextElIndex].nativeElement.focus();
      }
    });

    event.stopPropagation();
    event.preventDefault();
  }
}
