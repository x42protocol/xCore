import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XServerDetailsComponent } from './x-server-details.component';

describe('XServerDetailsComponent', () => {
  let component: XServerDetailsComponent;
  let fixture: ComponentFixture<XServerDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XServerDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XServerDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
