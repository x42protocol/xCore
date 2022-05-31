import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeployWordpressComponent } from './deploy-wordpress.component';

describe('DeployWordpressComponent', () => {
  let component: DeployWordpressComponent;
  let fixture: ComponentFixture<DeployWordpressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeployWordpressComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployWordpressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
