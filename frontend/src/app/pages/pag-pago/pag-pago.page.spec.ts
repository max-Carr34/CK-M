import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagPagoPage } from './pag-pago.page';

describe('PagPagoPage', () => {
  let component: PagPagoPage;
  let fixture: ComponentFixture<PagPagoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PagPagoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
