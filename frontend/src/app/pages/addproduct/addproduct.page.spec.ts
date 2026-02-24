import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddproductPage } from './addproduct.page';

describe('AddproductPage', () => {
  let component: AddproductPage;
  let fixture: ComponentFixture<AddproductPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddproductPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
