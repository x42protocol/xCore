import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddZoneDialogComponent } from './add-zone-dialog.component';

describe('AddZoneDialogComponent', () => {
  let component: AddZoneDialogComponent;
  let fixture: ComponentFixture<AddZoneDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddZoneDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddZoneDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
