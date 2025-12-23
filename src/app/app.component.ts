import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Platform } from '@ionic/angular';
import { SyncService } from './services/sync.service';

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

import { SupabaseService } from './services/supabase.service';

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
  private platform = inject(Platform);
    private syncService = inject(SyncService);

  public appPages = [
    { title: 'Materia Prima', url: '/pages/ingredientes', icon: 'archive' },
    { title: 'Pedidos', url: 'home', icon: 'calendar' },
    { title: 'Generar Cotización', url: '/cotizacion', icon: 'create' }
  ];

    constructor() {
        addIcons({ archiveOutline, calendarOutline, logOutOutline, createOutline });

        this.platform.ready().then(async () => {
            try {
                console.log('APP_INIT: Plataforma lista. Inicializando SQLite...');

                // 1. Inicializa la base de datos local
                await this.supabaseService.sqliteService.initializeDatabase();

                console.log('APP_INIT: SQLite inicializado con éxito. Iniciando sincronización de datos...');

                // 2. 🚀 Lanza la sincronización inicial (Up + Down)
                // Esto subirá deltas pendientes y descargará todos los datos de Supabase.
                await this.syncService.fullSync();

                console.log('APP_INIT: Sincronización inicial completa.');

            } catch (e) {
                console.error(
                    // El error puede ser de SQLite o del SyncService (ej. sin conexión o fallo de BD).
                    'APP_INIT: Error grave durante la inicialización/sincronización.',
                    e
                );
            }
        });

    }

  public async logout() {
    try {
      await this.supabaseService.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}