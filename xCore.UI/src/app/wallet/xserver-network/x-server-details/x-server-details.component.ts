import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ApiEvents } from '../../../shared/services/api.events';
import { ApiService } from '../../../shared/services/api.service';
import { GlobalService } from '../../../shared/services/global.service';

@Component({
  selector: 'app-x-server-details',
  templateUrl: './x-server-details.component.html',
  styleUrls: ['./x-server-details.component.css']
})
export class XServerDetailsComponent implements OnInit {
  xServer: any;
    ipApiData: any;
    loadingGeolocation = true;

  constructor(
    private globalService: GlobalService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private apiService: ApiService) { }

  ngOnInit(): void {

    this.xServer = this.config.data.details;
    this.loadingGeolocation = true;

    this.apiService.getxServerDetails(this.xServer.networkAddress).subscribe((data) => {

      this.ipApiData = data;
      this.loadingGeolocation = false;

    });
  }
}
