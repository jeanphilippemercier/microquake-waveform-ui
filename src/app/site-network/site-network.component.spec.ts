import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteNetworkComponent } from './site-network.component';

describe('SiteNetworkComponent', () => {
  let component: SiteNetworkComponent;
  let fixture: ComponentFixture<SiteNetworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SiteNetworkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SiteNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
