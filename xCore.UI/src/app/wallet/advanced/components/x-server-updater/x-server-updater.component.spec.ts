import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XServerUpdaterComponent } from './x-server-updater.component';

describe('XServerUpdaterComponent', () => {
  let component: XServerUpdaterComponent;
  let fixture: ComponentFixture<XServerUpdaterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XServerUpdaterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XServerUpdaterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
