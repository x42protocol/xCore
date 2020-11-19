import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { SelectItem } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { ApiService } from '../../shared/services/api.service';
import { WorkerService } from '../../shared/services/worker.service';
import { WorkerType } from '../../shared/models/worker';
import { SendComponent } from '../send/send.component';
import { AddNewAddressComponent } from '../address-book/modals/add-new-address/add-new-address.component';
import { AddressLabel } from '../../shared/models/address-label';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-address-book',
  templateUrl: './address-book.component.html',
  styleUrls: ['./address-book.component.css']
})
export class AddressBookComponent implements OnInit, OnDestroy {
  constructor(
    private apiService: ApiService,
    private clipboardService: ClipboardService,
    public dialogService: DialogService,
    private worker: WorkerService,
  ) { }

  private workerSubscription: Subscription;

  public copyType: SelectItem[];
  addresses: AddressLabel[];

  ngOnInit() {
    this.copyType = [
      { label: 'Copy', value: 'Copy', icon: 'pi pi-copy' }
    ];

    this.startMethods();
  }

  startMethods() {
    this.workerSubscription = this.worker.timerStatusChanged.subscribe((status) => {
      if (status.running) {
        if (status.worker === WorkerType.ADDRESS_BOOK) { this.getAddressBookAddresses(); }
      }
    });

    this.worker.Start(WorkerType.ADDRESS_BOOK);
  }

  ngOnDestroy() {
    this.worker.Stop(WorkerType.ADDRESS_BOOK);
    this.cancelSubscriptions();
  }

  private cancelSubscriptions() {
    if (this.workerSubscription) {
      this.workerSubscription.unsubscribe();
    }
  }

  private getAddressBookAddresses() {
    this.worker.Stop(WorkerType.ADDRESS_BOOK);
    this.apiService.getAddressBookAddresses()
      .pipe(finalize(() => {
        this.worker.Start(WorkerType.ADDRESS_BOOK);
      }))
      .subscribe(
        response => {
          if (response != null) {
            this.addresses = null;
            if (response.addresses[0]) {
              this.addresses = [];
              const addressResponse = response.addresses;
              for (const address of addressResponse) {
                this.addresses.push(new AddressLabel(address.label, address.address));
              }
            }
          }
        }, error => {
          this.apiService.handleException(error);
        }
      );
  }

  copyToClipboardClicked(address: AddressLabel) {
    if (this.clipboardService.copyFromContent(address.address)) {
    }
  }

  sendClicked(address: AddressLabel) {
    const modalData = {
      address: address.address
    };

    this.dialogService.open(SendComponent, {
      header: 'Send to',
      width: '700px',
      data: modalData
    });
  }

  removeClicked(address: AddressLabel) {
    this.apiService.removeAddressBookAddress(address.label)
      .subscribe(() => {
        this.getAddressBookAddresses();
      });
  }

  addNewAddressClicked() {
    this.dialogService.open(AddNewAddressComponent, {
      header: 'New Address',
      width: '500px',
    });
  }
}
