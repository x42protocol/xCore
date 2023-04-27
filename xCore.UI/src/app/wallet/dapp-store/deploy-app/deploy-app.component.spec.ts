import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeployAppComponent } from './deploy-app.component';

describe('DeployAppComponent', () => {
  let component: DeployAppComponent;
  let fixture: ComponentFixture<DeployAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeployAppComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
