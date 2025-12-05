import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton // ⬅️ Necesario para el menú
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-pedidos-calendar',
  templateUrl: './pedidos-calendar.page.html',
  styleUrls: ['./pedidos-calendar.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonButtons, // ⬅️ Añadido
    IonMenuButton // ⬅️ Añadido
  ]
})
export class PedidosCalendarPage implements OnInit {

  constructor() { }

  ngOnInit() {
    alert("Aquí va el calendario de pedidos.")
  }

}
