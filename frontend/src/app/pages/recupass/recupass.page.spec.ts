import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecupassPage } from './recupass.page';

describe('RecupassPage', () => {
  let component: RecupassPage;
  let fixture: ComponentFixture<RecupassPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecupassPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
