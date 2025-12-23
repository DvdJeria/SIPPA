import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IngredienteFormPage } from './ingrediente-form.page';

describe('IngredienteFormPage', () => {
  let component: IngredienteFormPage;
  let fixture: ComponentFixture<IngredienteFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IngredienteFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
