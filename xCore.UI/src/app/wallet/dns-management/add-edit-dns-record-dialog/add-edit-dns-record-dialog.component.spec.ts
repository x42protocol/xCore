import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditDnsRecordDialogComponent } from './add-edit-dns-record-dialog.component';

describe('AddEditDnsRecordDialogComponent', () => {
  let component: AddEditDnsRecordDialogComponent;
  let fixture: ComponentFixture<AddEditDnsRecordDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditDnsRecordDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditDnsRecordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
