// En src/app/pages/agenda/pedido-modal/pedido-modal.component.ts

import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    ModalController,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonButton,
    IonButtons,
    IonToggle,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
} from '@ionic/angular/standalone';

import { Cliente } from '../../../models/database.types';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
    selector: 'app-pedido-modal',
    templateUrl: './pedido-modal.component.html',
    styleUrls: ['./pedido-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonList,
        IonListHeader,
        IonItem,
        IonLabel,
        IonSelect,
        IonSelectOption,
        IonInput,
        IonButton,
        IonButtons,
        IonToggle,
        IonDatetimeButton,
        IonModal,
        IonDatetime,
    ],
})
export class PedidoModalComponent implements OnInit {
    @Input() prefilledPrice: number = 0;
    @Input() conversionMode: boolean = false; // Indica si viene de cotización

    // Variables del Cliente
    clientes: Cliente[] = [];
    isNewClient: boolean = true;
    selectedClienteId: string | null = null;

    // 🔑 VARIABLES DE CLIENTE CORREGIDAS
    newClienteNombre: string = '';
    newClienteApellido: string = '';
    newClienteInstagram: string = ''; // Reemplaza a newClienteEmail
    newClienteTelefono: string = '';
    // ------------------------------------

    // Variables del Pedido
    fechaEntrega: string = new Date().toISOString();
    precio: number = 0;

    private supabaseService = inject(SupabaseService);
    public modalCtrl = inject(ModalController);

    constructor() {}

    ngOnInit() {
        this.precio = this.prefilledPrice;

        if (!this.conversionMode) {
            this.loadClientes();
        }

        if (this.conversionMode) {
            this.isNewClient = true;
        }
    }

    async loadClientes() {
        const { data, error } = await this.supabaseService.getClientes();
        if (error) {
            console.error('Error loading clients:', error);
        } else {
            // Usamos 'as any' para evitar el error TS2352 ya que la BD ahora devuelve 'instagram' en lugar de 'email'.
            this.clientes = data as any[] || [];
        }
    }

    toggleNewClient(event: any) {
        this.isNewClient = event.detail.checked;
        if (!this.isNewClient) {
            this.selectedClienteId = this.clientes.length > 0
                ? this.clientes[0].cli_id ?? null // 🔑 CORRECCIÓN: Si es undefined, lo convierte a null.
                : null;
        }
    }

    cancel() {
        return this.modalCtrl.dismiss(null, 'cancel');
    }

    confirm() {
        const payload: any = {
            // Datos del Pedido (Precio y Fecha)
            fechaEntrega: this.fechaEntrega,
            precio: this.precio,
        };

        // 1. Lógica para el modo CONVERSIÓN (ConversionMode = true)
        // En este modo, SIEMPRE enviamos los datos del nuevo cliente del formulario.
        // El servicio se encargará de insertarlos o actualizarlos.
        if (this.conversionMode) {
            payload.nombre = this.newClienteNombre;
            payload.apellido = this.newClienteApellido;
            payload.instagram = this.newClienteInstagram;
            payload.telefono = this.newClienteTelefono;
        }

        // 2. Lógica para el modo PEDIDO NORMAL (ConversionMode = false)
        else {
            if (this.isNewClient) {
                // Si es un nuevo cliente, enviamos los datos del formulario.
                payload.nombre = this.newClienteNombre;
                payload.apellido = this.newClienteApellido;
                payload.instagram = this.newClienteInstagram;
                payload.telefono = this.newClienteTelefono;
            } else {
                // ⚠️ NOTA: Si es un cliente EXISTENTE, el método convertirAPedido fallará
                // porque espera los campos de nombre/apellido/etc., no solo el cliId.
                // Para el flujo actual, si no es conversión, este caso debe manejarse con un método diferente.
                payload.cliId = this.selectedClienteId;
            }
        }

        // Si estás en el flujo de CONVERSIÓN, el componente padre (cotizacion.page.ts)
        // se encargará de agregar el cotId antes de llamar al servicio.
        return this.modalCtrl.dismiss(payload, 'confirm');
    }
}