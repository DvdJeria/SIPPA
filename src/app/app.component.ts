import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import {
  IonApp,
  IonRouterOutlet,
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { archiveOutline, calendarOutline, logOutOutline, createOutline } from 'ionicons/icons';

import { SupabaseService } from './services/supabase';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonApp,
    IonRouterOutlet,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle
  ]
})
export class AppComponent {

  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  public appPages = [
    { title: 'Materia Prima', url: '/pages/ingredientes', icon: 'archive' },
    { title: 'Pedidos', url: '/pages/pedidos-calendar', icon: 'calendar' },
    { title: 'Generar Cotización', url: '/cotizacion', icon: 'create' }
  ];

  constructor() {
    addIcons({ archiveOutline, calendarOutline, logOutOutline, createOutline });

    setTimeout(() => {
      this.supabaseService['sqliteService'].initializeDatabase();
    }, 300);
  }

  public async logout() {
    try {
      await this.supabaseService.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
