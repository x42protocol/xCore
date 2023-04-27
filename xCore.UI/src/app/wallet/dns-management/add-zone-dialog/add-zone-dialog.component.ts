import { Component, OnDestroy, OnInit } from '@angular/core';
import { TransactionBuilding } from '@models/transaction-building';
import { TransactionSending } from '@models/transaction-sending';
import { XDocument } from '@models/x-document';
import {
  InstructionTypeEnum,
  XDocumentTypeEnum,
} from 'src/app/shared/contants/x-document-constants';
import { GlobalService } from 'src/app/shared/services/global.service';
import { WorkerType } from '../../../shared/models/worker';
import {
  XServerPeer,
  XServerStatus,
} from '../../../shared/models/xserver-status';
import { ApiEvents } from '../../../shared/services/api.events';
import { ApiService } from '../../../shared/services/api.service';

@Component({
  selector: 'app-add-zone-dialog',
  templateUrl: './add-zone-dialog.component.html',
  styleUrls: ['./add-zone-dialog.component.css'],
})
export class AddZoneDialogComponent implements OnInit, OnDestroy {
  xServerInfoSubscription: any;
  peers: XServerPeer[] = [];
  peerdata: any[];
  reserved = false;

  constructor(
    private apiEvents: ApiEvents,
    private apiService: ApiService,
    private globalService: GlobalService
  ) { }

  domainName = '';
  selectedPeers = [];
  reserving = false;
  reservinglabel = 'Reserve';

  ngOnInit(): void {
    this.startSubscriptions();
  }

  ngOnDestroy() {
    this.cancelSubscriptions();
  }
  startSubscriptions() {
    this.xServerInfoSubscription = this.apiEvents.XServerInfo.subscribe(
      (result: XServerStatus) => {
        if (result !== null && this.peers.length === 0) {
          this.peers = result.nodes
            .filter((l) => l.tier === 3)
            .sort((l) => l.responseTime);

          console.log(this.peers);
          this.peerdata = [];

          let i = 1;
          this.peers.forEach((peer) => {
            const peerentry: any = peer;

            peerentry.nameserver = 'ns.' + i.toString() + '.xserver.network';
            i++;
          });
        }
      }
    );
    this.apiEvents.ManualTick(WorkerType.XSERVER_INFO);
  }

  private cancelSubscriptions() {
    if (this.xServerInfoSubscription) {
      this.xServerInfoSubscription.unsubscribe();
    }
  }
  reserveZone() {
    this.reserving = true;
    this.reservinglabel = 'Reserving...';

    const data = { zone: 'dimi123456.org' };

    const xDocument = new XDocument(
      XDocumentTypeEnum.Internal,
      InstructionTypeEnum.NewDnsZone,
      'XH1QXLSugGGEgkoy7wNBqe6So5SoAuKNaD',
      data,
      'Alexandros',
      '!Coco1nut'
    );

    this.createXDocument(xDocument);
    setTimeout(() => {
      this.reserving = false;
      this.reserved = true;
    }, 3000);
  }

  createXDocument(xDocument: XDocument) {
    this.apiService.createXDocument(xDocument).subscribe((data) => {
      this.apiService.getDocumentHash(data).subscribe((reponse) => {
        console.log(reponse.hash);

        this.apiService.broadcast(data).subscribe(res => { console.log(res); });

        const transaction = new TransactionBuilding(
          this.globalService.getWalletName(),
          'account 0',
          '!Coco1nut',
          'XNNxaDeeoyAmFJiTr3Zv5ZXM5KATAP6xUh',
          '0.5',
          0.01,
          true,
          false,
          'false',
          reponse.hash,
          0
        );

        this.apiService.buildTransaction(transaction).subscribe((response) => {
          this.apiService.sendTransaction(new TransactionSending(response.hex)).subscribe(x => {

            console.log(x);
          });
        });
      });
    });
  }

}
