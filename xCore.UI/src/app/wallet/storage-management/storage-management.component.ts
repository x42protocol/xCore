import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../shared/services/storage.service';

@Component({
  selector: 'app-storage-management',
  templateUrl: './storage-management.component.html',
  styleUrls: ['./storage-management.component.css']
})
export class StorageManagementComponent implements OnInit {
  storjSettings: any = { satelliteAddress : ''};

  constructor(public storageService: StorageService) { }

  ngOnInit(): void {

    const storjSettings = this.storageService.getStorjSettings();

    console.log(storjSettings);

    if (storjSettings == null) {

      this.storjSettings = { satelliteAddress: '', apiKey: '', secret: '', bucketName: '' };

    } else {
      this.storjSettings = storjSettings;
    }


  }

  saveStorjSettings() {

    this.storageService.setStorjSettings(this.storjSettings);

  }


}
