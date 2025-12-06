import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { SupabaseService } from '../../../services/supabase';
import { Cliente } from '../../../models/Database.types';

@Component({
    selector: 'app-pedido-modal',
    templateUrl: './pedido-modal.component.html',
    styleUrls: ['./pedido-modal.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule]
})
export class PedidoModalComponent implements OnInit {
    clientes: Cliente[] = [];

    // Form fields
    selectedClienteId: number | null = null;
    fechaEntrega: string = new Date().toISOString();
    precio: number | null = null;

    @Input() prefilledPrice: number | null = null;
    @Input() orderToEdit: any = null;
    @Input() conversionMode: boolean = false;

    // New Client fields
    isNewClient = false;
    newClienteNombre = '';
    newClienteApellido = '';
    newClienteEmail = '';

  private modalCtrl= inject(ModalController);
  private supabaseService= inject(SupabaseService);

    constructor() { }

    async ngOnInit() {
        this.clientes = await this.supabaseService.getClientes() || [];

        if (this.prefilledPrice) {
            this.precio = this.prefilledPrice;
        }

        if (this.conversionMode) {
            this.isNewClient = true; // Force new client view for conversion (simplification)
        }

        if (this.orderToEdit) {
            this.isNewClient = false;
            this.selectedClienteId = this.orderToEdit.cli_id;
            this.fechaEntrega = this.orderToEdit.ped_fecha_entrega;
            this.precio = this.orderToEdit.ped_precio;
        }
    }

    cancel() {
        return this.modalCtrl.dismiss(null, 'cancel');
    }

    async confirm() {
        if (this.conversionMode) {
            if (!this.newClienteNombre || !this.newClienteApellido || !this.newClienteEmail || !this.fechaEntrega || this.precio === null) {
                return;
            }
            const data = {
                nombre: this.newClienteNombre,
                apellido: this.newClienteApellido,
                email: this.newClienteEmail,
                fechaEntrega: this.fechaEntrega,
                precio: this.precio
            };
            return this.modalCtrl.dismiss(data, 'confirm');
        }

        let clienteId = this.selectedClienteId;

        if (this.isNewClient) {
            if (!this.newClienteNombre || !this.newClienteApellido || !this.newClienteEmail) {
                return; // Validate new client fields
            }
            // Create new client first
            const newClientData = {
                cli_nombre: this.newClienteNombre,
                cli_apellido: this.newClienteApellido,
                cli_email: this.newClienteEmail
            };

            const { data, error } = await this.supabaseService.createCliente(newClientData as any);

            if (error || !data) {
                console.error('Error creating client', error);
                return;
            }
            clienteId = (data as any).cli_id;
        }

        if (!clienteId || !this.fechaEntrega || this.precio === null) {
            return;
        }

        const pedido = {
            ped_fecha_entrega: this.fechaEntrega,
            ped_precio: this.precio, // Corrected from this.pedidoData.precio
            ped_estado: 'PENDIENTE',
            // ped_alias: this.pedidoData.alias, // ped_alias and pedidoData are not defined
            cli_id: clienteId, // Use the potentially new clienteId
            // cliente: this.isNewClient ? { cli_nombre: this.nuevoCliente.nombre, cli_telefono: this.nuevoCliente.telefono } : this.clientes.find(c => c.cli_id === this.selectedClienteId) // nuevoCliente and cli_telefono not defined
        };

        return this.modalCtrl.dismiss(pedido, 'confirm');
    }
}
