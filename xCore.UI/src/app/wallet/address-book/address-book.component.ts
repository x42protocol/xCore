import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { SelectItem } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { ApiService } from '../../shared/services/api.service';
import { ApiEvents } from '../../shared/services/api.events';
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
    private apiEvents: ApiEvents,
  ) { }

  private addressBookSubscription: Subscription;

  public copyType: SelectItem[];
  addresses: AddressLabel[];

  ngOnInit() {
    this.copyType = [
      { label: 'Copy', value: 'Copy', icon: 'pi pi-copy' }
    ];

    this.startMethods();
  }

  startMethods() {
    this.addressBookSubscription = this.apiEvents.AddressBook.subscribe((result) => {
      if (result !== null) {
        this.getAddressBookAddresses(result);
      }
    });
    this.apiEvents.ManualTick(WorkerType.ADDRESS_BOOK);
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }

  private cancelSubscriptions() {
    if (this.addressBookSubscription) {
      this.addressBookSubscription.unsubscribe();
    }
  }

  private getAddressBookAddresses(response) {
    this.addresses = null;
    if (response.addresses[0]) {
      this.addresses = [];
      const addressResponse = response.addresses;
      for (const address of addressResponse) {
        this.addresses.push(new AddressLabel(address.label, address.address));
      }
    }
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
        this.apiEvents.ManualTick(WorkerType.ADDRESS_BOOK);
      });
  }

  addNewAddressClicked() {
    this.dialogService.open(AddNewAddressComponent, {
      header: 'New Address',
      width: '500px',
    });
  }

  public saveToFile() {

    const addressExportObject = { addresses: this.addresses };
    const textExport = document.createElement('a');
    textExport.href = 'data:attachment/text,' + JSON.stringify(addressExportObject);
    textExport.target = '_blank';
    textExport.download = 'addressbook.json';
    textExport.click();
  }
}
