import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { Ingrediente } from '../../models/Database.types';
import { PedidoModalComponent } from '../agenda/pedido-modal/pedido-modal.component';

interface SelectedIngredient {
  ingredient: Ingrediente;
  quantity: number;
}

@Component({
  selector: 'app-cotizacion',
  templateUrl: './cotizacion.page.html',
  styleUrls: ['./cotizacion.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CotizacionPage implements OnInit {
  ingredients: Ingrediente[] = [];
  selectedIngredients: SelectedIngredient[] = [];
  margin: number = 30; // Default margin

  selectedIngredientId: string | null = null;
  selectedQuantity: number = 1;

  // Refactored for Bulk Selection
  ingredientQuantities: { [key: string]: number } = {};

  private supabaseService= inject(SupabaseService);
  private modalCtrl= inject(ModalController);
  private toastCtrl= inject(ToastController);
  private router= inject (Router);

  constructor(

  ) { }

  async ngOnInit() {
    this.ingredients = await this.supabaseService.getIngredientes() || [];
    // Initialize quantities
    this.ingredients.forEach(ing => {
      this.ingredientQuantities[ing.ing_id!] = 0; // Ensure ing_id is treated as string
    });
  }

  get selectedIngredientsList(): SelectedIngredient[] {
    return this.ingredients
      .filter(ing => ing.ing_id && this.ingredientQuantities[ing.ing_id] > 0)
      .map(ing => ({
        ingredient: ing,
        quantity: this.ingredientQuantities[ing.ing_id!]
      }));
  }

  get totalCost(): number {
    return this.selectedIngredientsList.reduce((sum, item) => {
      return sum + (item.ingredient.ing_precio * item.quantity);
    }, 0);
  }

  get suggestedPrice(): number {
    return this.totalCost * (1 + (this.margin / 100));
  }

  incrementQuantity(id: string) {
    this.ingredientQuantities[id] = (this.ingredientQuantities[id] || 0) + 1;
  }

  decrementQuantity(id: string) {
    if (this.ingredientQuantities[id] > 0) {
      this.ingredientQuantities[id]--;
    }
  }

  async guardarCotizacion(): Promise<number | null> {
    const selected = this.selectedIngredientsList;
    if (selected.length === 0) {
      this.presentToast('Agrega al menos un ingrediente', 'danger');
      return null;
    }

    // RN-8.2.1: Validate Margin
    if (this.margin < 0) {
      this.presentToast('El margen de ganancia no puede ser negativo.', 'danger');
      return null;
    }

    const cotizacion = {
      cot_total: Math.round(this.suggestedPrice),
      cot_detalle: JSON.stringify(selected.map(item => ({
        nombre: item.ingredient.ing_nombre,
        cantidad: item.quantity,
        precio_unitario: item.ingredient.ing_precio,
        subtotal: item.ingredient.ing_precio * item.quantity
      }))),
      cli_id: 1 // Cliente Mostrador
    };

    const { data, error } = await this.supabaseService.createCotizacion(cotizacion);

    if (error || !data) {
      console.error('Error saving cotizacion:', error);
      this.presentToast('Error al guardar la cotización', 'danger');
      return null;
    } else {
      this.presentToast('Cotización guardada correctamente', 'success');
      return (data as any).cot_id;
    }
  }

  async convertToPedido() {
    // 1. Save Quotation first to get ID
    const cotId = await this.guardarCotizacion();
    if (!cotId) return;

    // 2. Open Modal in Conversion Mode
    const modal = await this.modalCtrl.create({
      component: PedidoModalComponent,
      componentProps: {
        prefilledPrice: Math.round(this.suggestedPrice),
        conversionMode: true
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      // 3. Call Service to Convert
      const conversionData = {
        ...data,
        cotId: cotId
      };

      const { error } = await this.supabaseService.convertirAPedido(conversionData);

      if (error) {
        this.presentToast('Error al convertir cotización a pedido', 'danger');
      } else {
        this.presentToast('Pedido agendado exitosamente', 'success');
        this.selectedIngredients = []; // Reset
        // Reset quantities
        this.ingredients.forEach(ing => {
          if (ing.ing_id) this.ingredientQuantities[ing.ing_id] = 0;
        });
        // 4. Redirect to Calendar
        this.router.navigate(['/agenda']);
      }
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }
}
