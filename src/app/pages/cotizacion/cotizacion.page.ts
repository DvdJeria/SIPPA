import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

import { SupabaseService } from '../../services/supabase';
// Importa las interfaces necesarias desde tu fuente única
import { Ingrediente, Cotizacion } from '../../models/Database.types';
import { PedidoModalComponent } from '../agenda/pedido-modal/pedido-modal.component';

// -----------------------------------------------------------
// INTERFAZ PARA LA TABLA DINÁMICA DE INGREDIENTES SELECCIONADOS
// -----------------------------------------------------------
interface SelectedIngredient {
  ing_id: string | null;  // ID del ingrediente seleccionado
  quantity: number;       // Cantidad ingresada por el cliente (gramos, cc, o unidades)
  unitPrice: number;      // Precio por unidad base (ing_precio de la DB)
  unitName: string;       // Nombre de la unidad (ej: 'unidad', 'gramos', 'cc')
  subtotal: number;       // unitPrice * factor de conversión * quantity
}

@Component({
  selector: 'app-cotizacion',
  templateUrl: './cotizacion.page.html',
  styleUrls: ['./cotizacion.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CotizacionPage implements OnInit {
  ingredients: Ingrediente[] = []; // Lista completa de ingredientes de la DB
  selectedIngredients: SelectedIngredient[] = []; // Array para las filas dinámicas

  // Inyecciones
  private supabaseService = inject(SupabaseService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  constructor() {}

  async ngOnInit() {
    this.ingredients = await this.supabaseService.getIngredientes() || [];

    // Inicializar con una fila vacía si el array está vacío
    if (this.selectedIngredients.length === 0) {
      this.addIngredient();
    }
  }

  // -----------------------------------------------------------
  // MÉTODOS DE LA TABLA DINÁMICA
  // -----------------------------------------------------------

  addIngredient() {
    this.selectedIngredients.push({
      ing_id: null,
      quantity: 1,
      unitPrice: 0,
      unitName: '',
      subtotal: 0
    });
  }

  removeIngredient(index: number) {
    this.selectedIngredients.splice(index, 1);
    this.calculateTotals();
  }

  // Actualiza el precio unitario y la unidad cuando se selecciona un ingrediente
  updateIngredientDetails(index: number) {
    const selectedItem = this.selectedIngredients[index];

    const fullIngredient = this.ingredients.find(i => i.ing_id === selectedItem.ing_id);

    if (fullIngredient) {
      selectedItem.unitPrice = fullIngredient.ing_precio;
      // Obtener el nombre de la unidad (asumiendo que viene anidado)
      selectedItem.unitName = fullIngredient.unidad_medida?.unmed_nombre || 'unidad';

    } else {
      selectedItem.unitPrice = 0;
      selectedItem.unitName = '';
    }

    this.calculateTotals();
  }

  // -----------------------------------------------------------
  // LÓGICA DE CÁLCULO DE PRESUPUESTO (Regla de Medida)
  // -----------------------------------------------------------

  calculateTotals() {
    this.selectedIngredients.forEach(item => {
      const qty = Number(item.quantity) || 0;
      let subtotal = 0;

      // IMPLEMENTACIÓN DE LAS REGLAS DE CÁLCULO
      switch (item.unitName.toLowerCase()) {
        case 'unidad':
          // Precio por UNIDAD * Cantidad de unidades
          subtotal = item.unitPrice * qty;
          break;

        case 'gramos':
        case 'cc':
          // Precio por Gramo/CC * Cantidad ingresada
          subtotal = item.unitPrice * qty;
          break;

        default:
          subtotal = item.unitPrice * qty;
          break;
      }

      item.subtotal = subtotal;
    });
  }

  // Getters para el Footer (Totales)

  get totalCost(): number {
    this.calculateTotals();
    return this.selectedIngredients.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get laborCost(): number {
    // Mano de obra es igual al 100% del Total Ingredientes
    return this.totalCost;
  }

  get suggestedPrice(): number {
    // Total Presupuesto = Total Ingredientes + Mano de Obra
    return this.totalCost + this.laborCost;
  }

  // -----------------------------------------------------------
  // FLUJO DE GUARDADO Y CONVERSIÓN
  // -----------------------------------------------------------

  async guardarCotizacion(): Promise<number | null> {
    const selected = this.selectedIngredients.filter(item => item.ing_id && item.quantity > 0);

    if (selected.length === 0) {
      this.presentToast('Agrega al menos un ingrediente con cantidad válida.', 'danger');
      return null;
    }

    // Usamos el Total Presupuesto (suggestedPrice) como el costo final de la cotización
    const cotizacion: Partial<Cotizacion> = {
      cot_total: Math.round(this.suggestedPrice),
      cot_detalle: JSON.stringify(selected.map(item => ({
        ing_id: item.ing_id,
        nombre: this.ingredients.find(i => i.ing_id === item.ing_id)?.ing_nombre,
        cantidad: item.quantity,
        precio_unitario: item.unitPrice,
        subtotal: item.subtotal,
        unidad_medida: item.unitName // Añadir la unidad para el registro
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
    // 1. Guardar Cotización primero
    const cotId = await this.guardarCotizacion();
    if (!cotId) return;

    // 2. Abrir Modal en Modo Conversión, enviando el precio total
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
      // 3. Llamar al servicio para convertir la cotización a pedido
      const conversionData = {
        ...data,
        cotId: cotId
      };

      const { error } = await this.supabaseService.convertirAPedido(conversionData);

      if (error) {
        this.presentToast('Error al convertir cotización a pedido', 'danger');
      } else {
        this.presentToast('Pedido agendado exitosamente', 'success');
        this.selectedIngredients = []; // Resetear lista
        this.addIngredient(); // Dejar una fila vacía

        // 4. Redirigir a la Agenda
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