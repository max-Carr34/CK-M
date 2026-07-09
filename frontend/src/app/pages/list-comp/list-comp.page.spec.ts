import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListCompPage } from './list-comp.page';

describe('ListCompPage', () => {
  let component: ListCompPage;
  let fixture: ComponentFixture<ListCompPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListCompPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
