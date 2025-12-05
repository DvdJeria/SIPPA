import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IngredientesPage } from './ingredientes.page';

describe('IngredientesPage', () => {
  let component: IngredientesPage;
  let fixture: ComponentFixture<IngredientesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IngredientesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
