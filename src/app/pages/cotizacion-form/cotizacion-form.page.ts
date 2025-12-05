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
  selector: 'app-cotizacion-form',
  templateUrl: './cotizacion-form.page.html',
  styleUrls: ['./cotizacion-form.page.scss'],
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
export class CotizacionFormPage implements OnInit {

  constructor() { }

  ngOnInit() {
    alert("Aquí va el formulario de cotizacion")
  }

}
