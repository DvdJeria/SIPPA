import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IngredientesService } from '../../services/ingredientes.service';
import { SupabaseService } from '../../services/supabase.service';
import { Router, RouterModule } from '@angular/router';
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
  IonSearchbar,
  IonIcon} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  addCircleOutline,
  createOutline,
  trashOutline,
  repeatOutline
} from 'ionicons/icons';

import { Ingrediente, UserRole } from '../../models/database.types';

@Component({
  selector: 'app-ingredientes',
  templateUrl: './ingredientes.page.html',
  styleUrls: ['./ingredientes.page.scss'],
  standalone: true,
  imports: [CommonModule,
    RouterModule,
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
    IonIcon,
    IonSearchbar
  ]
})
export class IngredientesPage {

  private supabaseService = inject(SupabaseService);
  private ingredientesService = inject(IngredientesService);
  private router = inject(Router);

  ingredientes: Ingrediente[] = [];
  userRole: UserRole = 'user';
  isLoading: boolean = false;

  public searchTerm: string = '';

  handleSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.loadData();
  }

  constructor() {
    addIcons({
      'add-circle-outline': addCircleOutline,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
      'repeat-outline': repeatOutline
    });
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      this.userRole = await this.supabaseService.getUserRole();

      this.ingredientes = await this.ingredientesService.getIngredientes(this.searchTerm, true);

    } catch (error) {
      console.error('Error al cargar datos:', error);

    } finally {
      this.isLoading = false;
    }
  }

  public edit(id: string) {

    this.router.navigate(['/ingredientes', id]);
  }

  async softDelete(id: string, nombre: string, isCurrentlyDeleted: boolean) {

    const newState = !isCurrentlyDeleted;

    const action = newState ? 'ELIMINAR suavemente' : 'RESTAURAR';

    if (confirm(`¿Estás seguro de ${action} el ingrediente "${nombre}"?`)) {
      try {

        await this.supabaseService.softDeleteIngrediente(id, newState);

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