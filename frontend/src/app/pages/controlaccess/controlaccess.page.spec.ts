import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlaccessPage } from './controlaccess.page';

describe('ControlaccessPage', () => {
  let component: ControlaccessPage;
  let fixture: ComponentFixture<ControlaccessPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlaccessPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
