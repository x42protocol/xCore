import { Component, OnInit } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { AddEditDnsRecordDialogComponent } from './add-edit-dns-record-dialog/add-edit-dns-record-dialog.component';
import { AddZoneDialogComponent } from './add-zone-dialog/add-zone-dialog.component';

@Component({
  selector: 'app-dns-management',
  templateUrl: './dns-management.component.html',
  styleUrls: ['./dns-management.component.css']
})
export class DnsManagementComponent implements OnInit {

  constructor(public dialogService: DialogService) { }

  zones = [];
  loadingZones = true;
  zoneRecords = [];
  zoneData = [
    {
      zone: 'jimmy.com',
      records: [
        {
          name: '@',
          type: 'A',
          status: 'Active',
          ttl: '300',
          data: '144.91.95.234'
        },
        {
          name: 'mysql',
          type: 'A',
          status: 'Active',
          ttl: '300',
          data: '144.91.95.234'
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

  ngOnInit(): void {

    setTimeout(() => {
      this.zoneRecords = this.zoneData[0].records;

      this.zones = [
        { label: 'jimmy.com', value: 'jimmy.com' },
        { label: 'jimmy.net', value: 'jimmy.net' },
        { label: 'jimmy.org', value: 'jimmy.org' }
      ];
      this.loadingZones = false;
    }, 300);
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
    console.log(zone);
  }
}
