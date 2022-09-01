import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DnsManagementComponent } from './dns-management.component';

describe('DnsManagementComponent', () => {
  let component: DnsManagementComponent;
  let fixture: ComponentFixture<DnsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DnsManagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DnsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
