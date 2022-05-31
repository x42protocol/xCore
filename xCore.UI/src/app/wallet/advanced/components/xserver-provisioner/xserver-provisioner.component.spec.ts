import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XserverProvisionerComponent } from './xserver-provisioner.component';

describe('XserverProvisionerComponent', () => {
  let component: XserverProvisionerComponent;
  let fixture: ComponentFixture<XserverProvisionerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XserverProvisionerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XserverProvisionerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
