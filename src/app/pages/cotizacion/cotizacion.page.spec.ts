import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CotizacionPage } from './cotizacion.page';

describe('CotizacionPage', () => {
  let component: CotizacionPage;
  let fixture: ComponentFixture<CotizacionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CotizacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
