import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PedidosCalendarPage } from './pedidos-calendar.page';

describe('PedidosCalendarPage', () => {
  let component: PedidosCalendarPage;
  let fixture: ComponentFixture<PedidosCalendarPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PedidosCalendarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
