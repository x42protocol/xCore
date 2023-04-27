import { Component, OnInit } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { ApiService } from '../../shared/services/api.service';
import { GlobalService } from '../../shared/services/global.service';
import { AddEditDnsRecordDialogComponent } from './add-edit-dns-record-dialog/add-edit-dns-record-dialog.component';
import { AddZoneDialogComponent } from './add-zone-dialog/add-zone-dialog.component';

@Component({
  selector: 'app-dns-management',
  templateUrl: './dns-management.component.html',
  styleUrls: ['./dns-management.component.css']
})
export class DnsManagementComponent implements OnInit {
  keyAddress: string;
  selectedZone: { zone: string; records: { name: string; type: string; status: string; ttl: string; data: string; }[]; };

  constructor(public dialogService: DialogService, private apiService: ApiService, private globalService: GlobalService) { }

  zones = [];
  featureEnabled = false;
  loadingZones = false;
  zoneRecords = [];
  totalRecords = 0;
  zoneData = [];

  ngOnInit(): void {

    this.setKeyAddress();
    if (this.featureEnabled){
      this.loadingZones = true;
      this.SetupDNS();
    }

  }


  private SetupDNS() {
    this.apiService.getZonesByKeyAddress(this.keyAddress).subscribe(results => {
      this.loadingZones = false;
      this.zoneData = [
        {
          zone: 'dimit3.org',
          records: [
            {
              name: 'myweb',
              type: 'A',
              status: 'Active',
              ttl: '300',
              data: 'xServer Network'
            },
            {
              name: 'mystore',
              type: 'A',
              status: 'Active',
              ttl: '300',
              data: 'xServer Network'
            },
          ]
        },
        {
          zone: 'jimmy.net',
          records: [
            {
              name: '@',
              type: 'A',
              status: 'Active',
              ttl: '300',
              data: '144.91.95.235'
            },
            {
              name: 'mysql',
              type: 'A',
              status: 'Active',
              ttl: '300',
              data: '144.91.95.2354'
            },
            {
              name: 'myweb',
              type: 'A',
              status: 'Active',
              ttl: '300',
              data: 'xServer Network'
            },
            {
              name: 'mail',
              type: 'CNAME',
              status: 'Active',
              ttl: '300',
              data: 'igw17.site4now.net'
            },
            {
              name: '@',
              type: 'MX',
              status: 'Active',
              ttl: '300',
              data: 'igw17.site4now.net'
            }
          ]
        }
      ];

      this.zoneRecords = this.zoneData[0].records;


      this.zones = results.map(result => {
        return { label: result, value: result };
      });

      this.getZoneRecords(this.zones[0].value);

    });
  }

  getZoneRecords(zone: string) {

    this.apiService.getZoneRecords(zone).subscribe(results => {


      console.log(results);
    });

  }

  private setKeyAddress() {
    this.keyAddress = this.globalService.getWalletKeyAddress();
    console.log(this.keyAddress);
  }


  public openAddNewRecordDialog() {
    this.dialogService.open(AddZoneDialogComponent, {
      header: 'Add New Zone',
      width: '540px',
    });
  }
  public openAddRecordDialog() {

    this.dialogService.open(AddEditDnsRecordDialogComponent, {
      header: 'Add New DNS Record',
      width: '540px',
    });
  }

  public zoneChanged(zone: string) {

    this.zoneRecords = this.zoneData.find(l => l.zone === zone).records;

  }
}
