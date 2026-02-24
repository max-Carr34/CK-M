import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangepasswPage } from './changepassw.page';

describe('ChangepasswPage', () => {
  let component: ChangepasswPage;
  let fixture: ComponentFixture<ChangepasswPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangepasswPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
