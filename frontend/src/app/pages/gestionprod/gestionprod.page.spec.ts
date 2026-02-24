import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionprodPage } from './gestionprod.page';

describe('GestionprodPage', () => {
  let component: GestionprodPage;
  let fixture: ComponentFixture<GestionprodPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestionprodPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
