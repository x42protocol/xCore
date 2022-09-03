import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteDnsRecordDialogComponent } from './delete-dns-record-dialog.component';

describe('DeleteDnsRecordDialogComponent', () => {
  let component: DeleteDnsRecordDialogComponent;
  let fixture: ComponentFixture<DeleteDnsRecordDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteDnsRecordDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteDnsRecordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
