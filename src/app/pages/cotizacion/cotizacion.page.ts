import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importaciones de componentes individuales
import {
    ModalController, ToastController, AlertController,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
    IonList, IonListHeader, IonItem, IonLabel,
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
import { PedidoModalComponent } from '../agenda/pedido-modal/pedido-modal.component';


// -----------------------------------------------------------
// INTERFAZ PARA LA TABLA DINÁMICA DE INGREDIENTES SELECCIONADOS
// -----------------------------------------------------------
interface SelectedIngredient {
    ing_id: string | null;
    quantity: number;       // Cantidad ingresada por el cliente (gramos, cc, o unidades)
    unitPrice: number;      // Precio por unidad base (ing_precio de la DB)
    unitName: string;
    subtotal: number;       // unitPrice * factor de conversión * quantity
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
        IonList,
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

    // Inyecciones
    private supabaseService = inject(SupabaseService)
    private ingredientesService = inject(IngredientesService);
    public modalCtrl = inject(ModalController);
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
            // 🔑 FUERZA LA SINCRONIZACIÓN: Llama a Supabase y guarda los datos corregidos en SQLite.
            await this.ingredientesService.getIngredientes(undefined, true);

            // 🔑 LECTURA NORMAL: Ahora ya podemos leer la caché, que debe tener el valor 1000.
            this.ingredients = await this.ingredientesService.getIngredientes();

            console.log(`[CotizacionPage] Carga final exitosa (${this.ingredients.length} items).`);

        } catch (error) {
            console.error('Error al cargar/sincronizar ingredientes:', error);
        }

        if (this.selectedIngredients.length === 0) {
            this.addIngredient();
        }
    }

    // ... (MÉTODOS DE LA TABLA DINÁMICA y LÓGICA DE CÁLCULO sin cambios)
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
            // 🔑 CORRECCIÓN: Usamos Math.round() para evitar decimales en el precio de costo
            selectedItem.unitPrice = Math.round(fullIngredient.ing_precio);

            // Aseguramos que el nombre de la unidad se capture correctamente
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

            // 🔑 LIMPIEZA DE LA UNIDAD JUSTO ANTES DEL SWITCH
            const unitNameClean = item.unitName.toLowerCase().trim();

            // 🔑 DEBUG: Imprimir la unidad de medida que realmente usa el switch
            console.log(`[DEBUG SWITCH] Ingrediente: ${fullIngredient.ing_nombre}`);
            console.log(`[DEBUG SWITCH] Unidad limpia a comparar: '${unitNameClean}'`);
            console.log(`[DEBUG SWITCH] Precio Base: ${precioTotalBase} / Cantidad Base: ${cantidadBase}`);

            // USAMOS unitNameClean EN EL SWITCH
            switch (unitNameClean) {
                case 'unidad':
                    subtotal = precioTotalBase * cantidadUsada;
                    break;
                case 'gramo':
                case 'cc':
                    // Lógica de división
                    subtotal = (precioTotalBase * cantidadUsada) / cantidadBase;
                    break;
                default:
                    // DEBUG CRÍTICO: Si llegamos aquí, ¡el nombre de la unidad está mal!
                    console.error(`[ERROR CÁLCULO] Unidad no reconocida ('${unitNameClean}'). Cayendo en multiplicación total.`);
                    subtotal = precioTotalBase * cantidadUsada;
                    break;
            }

            // Redondeo final a entero (para el formato chileno)
            item.subtotal = Math.round(subtotal);

            // 🔑 PUNTO DE VERIFICACIÓN CLAVE (Nuevo log del resultado)
            console.log(`[DEBUG RESULTADO] Subtotal Calculado (Redondeado): ${item.subtotal}`);
        });
        // ... (rest of the method)
    }

    public debugValue(value: any, label: string): any {
        console.log(`[DEBUG HTML] ${label}:`, value);
        return value;
    }


    get totalCost(): number {
        // Ejecuta los subtotales redondeados
        this.calculateTotals();

        // Suma los subtotales (que ya son enteros)
        const total = this.selectedIngredients.reduce((sum, item) => sum + item.subtotal, 0);

        // Finalizamos redondeando el total general, aunque debería ser ya un entero.
        return Math.round(total);
    }

    get laborCost(): number {
        // Redondeamos el resultado final para asegurar un entero en la interfaz.
        return Math.round(this.totalCost);
    }

    get suggestedPrice(): number {
        // Redondeamos el resultado final para asegurar un entero en la interfaz.
        return Math.round(this.totalCost + this.laborCost);
    }

    // -----------------------------------------------------------
    // FLUJO DE GUARDADO Y CONVERSIÓN (MODIFICADO)
    // -----------------------------------------------------------

    async guardarCotizacion(): Promise<string | null> {

        // 1. FILTRADO Y VALIDACIÓN INICIAL (Tu lógica original)
        const selected = this.selectedIngredients.filter(item => item.ing_id && item.quantity > 0);

        if (selected.length === 0) {
            this.presentToast('Agrega al menos un ingrediente con cantidad válida.', 'danger');
            return null;
        }

        // VERIFICACIÓN DE SESIÓN (Tu lógica original)
        const session = await this.supabaseService.getSession();
        if (!session) {
            this.presentToast('Debes iniciar sesión para guardar una cotización.', 'danger');
            this.router.navigate(['/login']);
            return null;
        }
        // NOTA: La línea await this.supabaseService.client.auth.setSession(session);
        // y la variable accessToken ya no son necesarias para la llamada, se eliminan.

        // 2. FLUJO SECUENCIAL PARA CAPTURAR EL NOMBRE (Tu lógica original)
        const wantsName = await this.presentNameConfirmationAlert();

        if (wantsName === null) {
            this.presentToast('Guardado de cotización cancelado.', 'danger');
            return null;
        }

        let cotizacionNombre: string | null = null;

        if (wantsName === true) {
            const name = await this.presentNameInputAlert();

            if (name === null) {
                this.presentToast('Guardado cancelado. No se proporcionó el nombre.', 'danger');
                return null;
            }

            const trimmedName = name.trim();
            cotizacionNombre = trimmedName.length > 0 ? trimmedName : null;
        }

        // 3. 🔑 CONSTRUCCIÓN DEL OBJETO NORMALIZADO (Corrección de errores TS2353)

        // A. Mapear el detalle al formato de la tabla 'cotizacion_detalle' (CotizacionDetalleInsert)
        const detallesParaDB: CotizacionDetalleInsert[] = selected.map(
            (item: SelectedIngredient) => ({
                // Los únicos campos de la lógica de cotización que la DB necesita son:
                ing_id: item.ing_id!,
                cantidad_usada: item.quantity,
                precio_unitario_fijo: item.unitPrice,
            })
        );

        // B. Construir el objeto CotizacionData que el servicio espera
        const cotizacionData: CotizacionData = {
            cot_total: Math.round(this.suggestedPrice),
            cot_nombre: cotizacionNombre,
            detalles: detallesParaDB // Enviamos los detalles normalizados
        };

        // 4. LLAMAR AL SERVICIO DE SUPABASE (Corrección de errores TS2554)
        // Se llama con UN SOLO argumento (cotizacionData), ya no se pasa el accessToken.
        const { data, error } = await this.supabaseService.createCotizacion(cotizacionData);

        if (error || !data) {
            console.error('Error al guardar la cotización:', error);
            if (error) {
                console.error('Detalle del error de Supabase:', error.message);
            }
            this.presentToast('Error al guardar la cotización. Verifica permisos RLS o los datos.', 'danger');
            return null;
        } else {
            this.presentToast(`Cotización '${cotizacionNombre || "sin nombre"}' guardada correctamente`, 'success');

            // El servicio retorna el objeto CotizacionData que incluye el nuevo cot_id
            return data.cot_id as string;
        }
    }

    async convertToPedido() {
        // ... (Lógica sin cambios)
        const cotId = await this.guardarCotizacion();
        if (!cotId) return;

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

            const conversionData = {
                ...data,
                cotId: cotId
            };

            const { error } = await this.supabaseService.convertirAPedido(conversionData);

            if (error) {
                this.presentToast('Error al convertir cotización a pedido', 'danger');
            } else {
                this.presentToast('Pedido agendado exitosamente', 'success');
                this.selectedIngredients = [];
                this.addIngredient();

                this.router.navigate(['/agenda']);
            }
        }
    }

    // -----------------------------------------------------------
    // MÉTODOS DE ALERTA (MODIFICADOS)
    // -----------------------------------------------------------

    /**
     * Muestra una alerta preguntando si el usuario desea guardar la cotización con nombre.
     * @returns {Promise<boolean | null>} true (Sí, con nombre), false (No, sin nombre), o null (cancelado).
     */
    async presentNameConfirmationAlert(): Promise<boolean | null> {
        const alert = await this.alertCtrl.create({
            header: 'Guardar Cotización',
            message: '¿Desea guardar esta cotización con un nombre específico?',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    handler: () => {}, // Solo cierra
                },
                {
                    text: 'No (Sin nombre)',
                    role: 'no-name', // 🔑 Nuevo rol específico para "No"
                    handler: () => {},
                },
                {
                    text: 'Sí (Con nombre)',
                    role: 'yes-name', // 🔑 Nuevo rol específico para "Sí"
                    handler: () => {},
                }
            ],
        });

        await alert.present();

        const { role } = await alert.onWillDismiss();

        // 🔑 Decidimos la acción basándonos solo en el ROLE
        if (role === 'yes-name') {
            return true;
        }
        if (role === 'no-name') {
            return false;
        }
        // Si cancela, o click en el fondo
        return null;
    }


    /**
     * Muestra el input para que el usuario ingrese el nombre de la cotización.
     * Se llama solo si se confirma que se quiere el nombre.
     * @returns {Promise<string | null>} El nombre ingresado (string), o null si cancela.
     */
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
                    role: 'confirm',  // 👈 IMPORTANTE
                },
            ],
        });

        await inputAlert.present();

        const { data, role } = await inputAlert.onWillDismiss();

        if (role === 'cancel') {
            return null;
        }

        // Aquí Ionic devuelve el input así:
        // data = { values: { cotizacionName: 'texto ingresado' } }
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

    /**
     * Restablece la cotización actual, borrando todos los ingredientes seleccionados.
     */
    public resetForm(): void {
        // 1. Borra la lista de ingredientes seleccionados.
        this.selectedIngredients = [];

        // 2. Añade la primera línea vacía para que el usuario pueda empezar de nuevo.
        this.addIngredient();

        // Opcional: Notificar al usuario (usando Toast, si lo tienes)
        // console.log('Formulario de cotización restablecido.');
    }
}