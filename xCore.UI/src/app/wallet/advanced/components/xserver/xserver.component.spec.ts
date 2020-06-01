import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { XServerComponent } from './xserver.component';

describe('XServerComponent', () => {
  let component: XServerComponent;
  let fixture: ComponentFixture<XServerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [XServerComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(XServerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
