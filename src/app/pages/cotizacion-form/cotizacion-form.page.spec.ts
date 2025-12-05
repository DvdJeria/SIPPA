import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CotizacionFormPage } from './cotizacion-form.page';

describe('CotizacionFormPage', () => {
  let component: CotizacionFormPage;
  let fixture: ComponentFixture<CotizacionFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CotizacionFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
