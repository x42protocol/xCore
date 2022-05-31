import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DappStoreComponent } from './dapp-store.component';

describe('DappStoreComponent', () => {
  let component: DappStoreComponent;
  let fixture: ComponentFixture<DappStoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DappStoreComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DappStoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
