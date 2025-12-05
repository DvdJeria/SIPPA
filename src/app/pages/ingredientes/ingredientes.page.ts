import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase'; // Ajusta la ruta si es necesario
import { Router } from '@angular/router';
import {IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonChip,
  IonButton,
  IonIcon} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  addCircleOutline,
  createOutline,
  trashOutline,
  repeatOutline
} from 'ionicons/icons';

import { Ingrediente, UserRole } from '../../models/ingredientes';

@Component({
  selector: 'app-ingredientes',
  templateUrl: './ingredientes.page.html',
  styleUrls: ['./ingredientes.page.scss'],
  standalone: true,
  imports: [CommonModule, // Necesario para el pipe 'number' y directivas *ngIf/*ngFor
    // Lista de Componentes de Ionic:
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonChip,
    IonButton,
    IonIcon
  ]
})
export class IngredientesPage {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  // Propiedades para la vista
  ingredientes: Ingrediente[] = [];
  userRole: UserRole = 'user';
  isLoading: boolean = false;

  constructor() {
    addIcons({
      'add-circle-outline': addCircleOutline,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
      'repeat-outline': repeatOutline
    });
  }

  // Usamos este hook para cargar datos cada vez que la página se vuelve visible
  async ionViewWillEnter() {
    await this.loadData();
  }

  // Método para cargar los datos y el rol
  async loadData() {
    this.isLoading = true;
    try {
      // 1. Obtener el rol del usuario (para RBAC visual)
      this.userRole = await this.supabaseService.getUserRole();

      // 2. Obtener los ingredientes (la lógica de filtrado por is_deleted
      // ya está en el servicio basada en el rol)
      this.ingredientes = await this.supabaseService.getIngredientes();

    } catch (error) {
      console.error('Error al cargar datos:', error);
      // Podrías mostrar una alerta o un mensaje de error aquí
    } finally {
      this.isLoading = false;
    }
  }

  // Método placeholders para las acciones del CRUD del Administrador
  edit(id: string) {
    //Pendiente: Navegar a la página de edición
    alert(`Editar ingrediente ID: ${id}`);
  }

  async softDelete(id: string, nombre: string, isCurrentlyDeleted: boolean) {
    // El nuevo estado es el opuesto al actual
    const newState = !isCurrentlyDeleted;

    // Determinar la acción para el mensaje
    const action = newState ? 'ELIMINAR suavemente' : 'RESTAURAR';

    if (confirm(`¿Estás seguro de ${action} el ingrediente "${nombre}"?`)) {
      try {
        // 1. Llamar al servicio para cambiar el estado en la DB
        await this.supabaseService.softDeleteIngrediente(id, newState);

        // 2. Recargar la lista para que el cambio de estado se refleje en la vista
        await this.loadData();

        alert(`Ingrediente "${nombre}" ${newState ? 'ELIMINADO' : 'RESTAURADO'} con éxito.`);

      } catch (error) {
        console.error(`Error al ejecutar ${action}:`, error);
        alert(`Error al ejecutar ${action}. Verifica los permisos RLS (UPDATE para Administradores).`);
      }
    }
  }

  isAdministrador(): boolean {
    return this.userRole === 'administrador';
  }
}
