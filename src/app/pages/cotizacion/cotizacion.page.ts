import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    ToastController, AlertController,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
    IonListHeader, IonItem, IonLabel,
    IonSelect, IonSelectOption, IonInput,
    IonButton, IonButtons, IonMenuButton,
    IonGrid, IonRow, IonCol,
    IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { trashOutline, refreshOutline, addCircleOutline } from 'ionicons/icons';

import { Router } from '@angular/router';

import { SupabaseService } from '../../services/supabase.service';
import { IngredientesService } from '../../services/ingredientes.service';
import { Ingrediente, CotizacionData, CotizacionDetalleInsert } from '../../models/database.types';

interface SelectedIngredient {
    ing_id: string | null;
    quantity: number;
    unitPrice: number;
    unitName: string;
    subtotal: number;
}

@Component({
    selector: 'app-cotizacion',
    templateUrl: './cotizacion.page.html',
    styleUrls: ['./cotizacion.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonFooter,
        IonListHeader,
        IonItem,
        IonLabel,
        IonSelect,
        IonSelectOption,
        IonInput,
        IonButton,
        IonButtons,
        IonMenuButton,
        IonGrid,
        IonRow,
        IonCol,
        IonIcon
    ]
})
export class CotizacionPage implements OnInit {
    ingredients: Ingrediente[] = [];
    selectedIngredients: SelectedIngredient[] = [];

    private supabaseService = inject(SupabaseService)
    private ingredientesService = inject(IngredientesService);
    private toastCtrl = inject(ToastController);
    private router = inject(Router);
    private alertCtrl = inject(AlertController);

    constructor() {
        addIcons({
            trashOutline,
            refreshOutline,
            addCircleOutline
        });
    }

    async ngOnInit() {
        this.ingredients = [];

        try {
            await this.ingredientesService.getIngredientes(undefined, true);

            this.ingredients = await this.ingredientesService.getIngredientes();

            console.log(`[CotizacionPage] Carga final exitosa (${this.ingredients.length} items).`);

        } catch (error) {
            console.error('Error al cargar/sincronizar ingredientes:', error);
        }

        if (this.selectedIngredients.length === 0) {
            this.addIngredient();
        }
    }

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

    updateIngredientDetails(index: number) {
        const selectedItem = this.selectedIngredients[index];
        const fullIngredient = this.ingredients.find(i => i.ing_id === selectedItem.ing_id);

        if (fullIngredient) {

            selectedItem.unitPrice = Math.round(fullIngredient.ing_precio);

            selectedItem.unitName = fullIngredient.unmed_nombre || 'unidad';

        } else {
            selectedItem.unitPrice = 0;
            selectedItem.unitName = '';
        }

        this.calculateTotals();
    }

    calculateTotals() {
        this.selectedIngredients.forEach(item => {
            const cantidadUsada = Number(item.quantity) || 0;
            let subtotal = 0;

            const fullIngredient = this.ingredients.find(i => i.ing_id === item.ing_id);

            if (!fullIngredient || cantidadUsada === 0) {
                item.subtotal = 0;
                return;
            }

            const precioTotalBase = Math.round(fullIngredient.ing_precio);
            const cantidadBase = fullIngredient.ing_cantidad_base || 1;

            const unitNameClean = item.unitName.toLowerCase().trim();

            console.log(`[DEBUG SWITCH] Ingrediente: ${fullIngredient.ing_nombre}`);
            console.log(`[DEBUG SWITCH] Unidad limpia a comparar: '${unitNameClean}'`);
            console.log(`[DEBUG SWITCH] Precio Base: ${precioTotalBase} / Cantidad Base: ${cantidadBase}`);

            switch (unitNameClean) {
                case 'unidad':
                    subtotal = precioTotalBase * cantidadUsada;
                    break;
                case 'gramo':
                case 'cc':

                    subtotal = (precioTotalBase * cantidadUsada) / cantidadBase;
                    break;
                default:

                    console.error(`[ERROR CÁLCULO] Unidad no reconocida ('${unitNameClean}'). Cayendo en multiplicación total.`);
                    subtotal = precioTotalBase * cantidadUsada;
                    break;
            }

            item.subtotal = Math.round(subtotal);

            console.log(`[DEBUG RESULTADO] Subtotal Calculado (Redondeado): ${item.subtotal}`);
        });
    }

    public debugValue(value: any, label: string): any {
        console.log(`[DEBUG HTML] ${label}:`, value);
        return value;
    }


    get totalCost(): number {

        this.calculateTotals();

        const total = this.selectedIngredients.reduce((sum, item) => sum + item.subtotal, 0);

        return Math.round(total);
    }

    get laborCost(): number {

        return Math.round(this.totalCost);
    }

    get suggestedPrice(): number {

        return Math.round(this.totalCost + this.laborCost);
    }

    async guardarCotizacion(): Promise<string | null> {

        const selected = this.selectedIngredients.filter(item => item.ing_id && item.quantity > 0);

        if (selected.length === 0) {
            this.presentToast('Agrega al menos un ingrediente con cantidad válida.', 'danger');
            return null;
        }

        const session = await this.supabaseService.getSession();
        if (!session) {
            this.presentToast('Debes iniciar sesión para guardar una cotización.', 'danger');
            this.router.navigate(['/login']);
            return null;
        }
        const name = await this.presentNameInputAlert();

        if (name === null) {
            this.presentToast('Guardado cancelado.', 'danger');
            return null;
        }

        const cotizacionNombre = name.trim();

        if (!cotizacionNombre) {
            this.presentToast(
                'Debes ingresar un nombre para la cotización.',
                'danger'
            );

            return null;
        }

        const detallesParaDB: CotizacionDetalleInsert[] = selected.map(
            (item: SelectedIngredient) => ({

                ing_id: item.ing_id!,
                cantidad_usada: item.quantity,
                precio_unitario_fijo: item.unitPrice,
            })
        );

        const cotizacionData: CotizacionData = {
            cot_total: Math.round(this.suggestedPrice),
            cot_nombre: cotizacionNombre,
            detalles: detallesParaDB
        };

        const { data, error } = await this.supabaseService.createCotizacion(cotizacionData);

        if (error || !data) {
            console.error('Error al guardar la cotización:', error);
            if (error) {
                console.error('Detalle del error de Supabase:', error.message);
            }
            this.presentToast('Error al guardar la cotización. Verifica permisos RLS o los datos.', 'danger');
            return null;
        } else {
            this.presentToast(
                `Cotización '${cotizacionNombre}' guardada correctamente`,
                'success'
            );

            this.resetForm();
            return data.cot_id as string;
        }
    }

    async presentNameInputAlert(): Promise<string | null> {
        const inputAlert = await this.alertCtrl.create({
            header: 'Nombre de Cotización',
            inputs: [
                {
                    name: 'cotizacionName',
                    type: 'text',
                    placeholder: 'Ej: Torta 3 leches cumpleaños Juan',
                },
            ],
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                },
                {
                    text: 'Guardar',
                    role: 'confirm',
                },
            ],
        });

        await inputAlert.present();

        const { data, role } = await inputAlert.onWillDismiss();

        if (role === 'cancel') {
            return null;
        }

        return data?.values?.cotizacionName || '';
    }


    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 2000,
            color
        });
        await toast.present();
    }

    public resetForm(): void {
        this.selectedIngredients = [];
        this.addIngredient();
    }

    get canSave(): boolean {

        return this.selectedIngredients.some(
            item => item.ing_id && item.quantity > 0
        );
    }
}