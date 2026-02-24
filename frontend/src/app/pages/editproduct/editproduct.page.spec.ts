import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditproductPage } from './editproduct.page';

describe('EditproductPage', () => {
  let component: EditproductPage;
  let fixture: ComponentFixture<EditproductPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditproductPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
