import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XserverNetworkComponent } from './xserver-network.component';

describe('XserverNetworkComponent', () => {
  let component: XserverNetworkComponent;
  let fixture: ComponentFixture<XserverNetworkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XserverNetworkComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XserverNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
