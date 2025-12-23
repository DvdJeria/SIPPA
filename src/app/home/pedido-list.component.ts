// src/app/pages/home/pedido-list.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { PedidosService, PedidoFront } from '../services/pedidos.service';
import { PedidoFormComponent } from './pedido-form.component';

@Component({
    selector: 'app-pedido-list',
    standalone: true,
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonContent,
        IonList,
        IonItem,
        IonLabel,
    ],
    styleUrls: ['./pedido-list.component.scss'],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-title>Pedidos - {{ label }}</ion-title>
                <ion-buttons slot="end">
                    <ion-button (click)="close()">Cerrar</ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>
        <ion-content>
            <ion-list>
                <ion-item *ngFor="let p of pedidos; let i = index">
                    <ion-label>
                        <h3>{{ p.clienteNombre || '(Sin Nombre)' }} {{ p.clienteApellido || '' }}</h3>

                        <p>
                            Total: <strong>{{ formatPrecio(p.precio) }}</strong>
                            | Abono: <strong>{{ formatPrecio(p.precio / 2) }}</strong>
                        </p>

                        <p>Tel: {{ p.clienteTelefono || 'N/A' }} | IG: {{ p.clienteInstagram || 'N/A' }}</p>

                        <p>Estado: {{ p.estado }}</p>

                    </ion-label>

                    <ion-button fill="clear" (click)="edit(p)">Editar</ion-button>
                    <ion-button color="danger" fill="clear" (click)="cancel(p)" *ngIf="p.estado !== 'cancelado'">Cancelar</ion-button>
                    <ion-button color="success" fill="clear" (click)="deliver(p)" *ngIf="p.estado !== 'entregado' && p.estado !== 'cancelado'">Entregar</ion-button>
                    <ion-button color="success" fill="clear" *ngIf="p.estado === 'cancelado'" (click)="reactivate(p)">Reactivar</ion-button>
                </ion-item>
            </ion-list>
        </ion-content>
    `,
})
export class PedidoListComponent {
    @Input() pedidos: PedidoFront[] = []; // 🔑 CORRECCIÓN: Usamos PedidoFront
    @Input() label = '';

    constructor(private modalCtrl: ModalController, public pedidosSvc: PedidosService) {}

    close() {
        this.modalCtrl.dismiss({ updated: false });
    }

    // 🔑 CORRECCIÓN: Usamos PedidoFront
    async edit(p: PedidoFront) {
        if (!this.pedidosSvc.isEditable(p)) {
            alert('No se puede editar este pedido con menos de 24 horas para la entrega.');
            return;
        }
        const modal = await this.modalCtrl.create({ component: PedidoFormComponent, componentProps: { pedido: p } });
        await modal.present();
        const res = await modal.onDidDismiss();
        // Si se actualizó, notificamos a la página principal para que refresque el conteo
        if (res?.data?.updated) {
            await this.modalCtrl.dismiss({ updated: true });
        }
    }

    // 🔑 CORRECCIÓN: Usamos PedidoFront
    async cancel(p: PedidoFront) {
        try {
            await this.pedidosSvc.cancelPedido(p.id);

            // Actualizar el estado localmente sin recargar la lista completa
            p.estado = 'cancelado';
            await this.modalCtrl.dismiss({ updated: true }); // Refrescar el contador en el Home
        } catch (e: any) {
            alert(e.message || 'Error al cancelar');
        }
    }

    // 🔑 CORRECCIÓN: Usamos PedidoFront
    async reactivate(p: PedidoFront) {
        try {
            await this.pedidosSvc.reactivatePedido(p.id);

            // Actualizar el estado localmente sin recargar la lista completa
            p.estado = 'pendiente';
            await this.modalCtrl.dismiss({ updated: true }); // Refrescar el contador en el Home
        } catch (e: any) {
            alert(e.message || 'Error al reactivar');
        }
    }

    // 🔑 CORRECCIÓN: Usamos PedidoFront
    async deliver(p: PedidoFront) {
        if (!confirm('Marcar este pedido como entregado?')) return;
        try {
            await this.pedidosSvc.deliverPedido(p.id);

            // Actualizar el estado localmente sin recargar la lista completa
            p.estado = 'entregado';
            await this.modalCtrl.dismiss({ updated: true }); // Refrescar el contador en el Home
        } catch (e: any) {
            alert(e.message || 'Error al marcar como entregado');
        }
    }

    public formatPrecio(valor?: number | null): string {
        if (valor == null) return '(sin precio)';
        return String(Math.round(Number(valor)));
    }
}