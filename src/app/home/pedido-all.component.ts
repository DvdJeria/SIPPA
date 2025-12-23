// src/app/pages/home/pedido-all.component.ts

import { Component, OnInit } from '@angular/core';
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
    IonBadge,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { PedidosService, PedidoFront } from '../services/pedidos.service'; // 🔑 Importamos PedidoFront
import { PedidoFormComponent } from './pedido-form.component';

@Component({
    selector: 'app-pedido-all',
    standalone: true,
    imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonBadge],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-title>Todos los pedidos</ion-title>
                <ion-buttons slot="end">
                    <ion-button (click)="close()">Cerrar</ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
            <ion-list>
                <ion-item *ngFor="let p of pedidos">
                    <ion-label>
                        <h3>{{ p.descripcion || '(sin descripción)' }}</h3>
                        <p>Entrega: {{ formatFecha(p.fechaEntrega) }}</p>
                        <p>Precio: {{ formatPrecio(p.precio) }}</p>
                        <p>Cliente: {{ p.clienteNombre || '(sin nombre)' }} {{ p.clienteApellido }}</p>
                        <p>Tel: {{ p.clienteTelefono || '(sin teléfono)' }}</p>
                        <p>Dirección: {{ p.clienteDireccion || '(sin dirección)' }}</p>
                    </ion-label>
                    <ion-badge [color]="p.estado === 'cancelado' ? 'medium' : 'primary'">{{ p.estado }}</ion-badge>
                    <ion-button fill="clear" (click)="edit(p)">Editar</ion-button>
                    <ion-button color="danger" fill="clear" (click)="cancel(p)" *ngIf="p.estado !== 'cancelado'">Cancelar</ion-button>
                    <ion-button color="success" fill="clear" (click)="deliver(p)" *ngIf="p.estado !== 'entregado' && p.estado !== 'cancelado'">Entregar</ion-button>
                    <ion-button color="success" fill="clear" (click)="reactivate(p)" *ngIf="p.estado === 'cancelado'">Reactivar</ion-button>
                </ion-item>
            </ion-list>
        </ion-content>
    `,
})

export class PedidoAllComponent implements OnInit {
    pedidos: PedidoFront[] = []; // 🔑 CORRECCIÓN: Usamos PedidoFront

    constructor(private modalCtrl: ModalController, public pedidosSvc: PedidosService) {}

    async ngOnInit() {
        this.pedidos = await this.pedidosSvc.listAll();
        this.sortPedidos();
    }

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
        if (res?.data?.updated) {
            this.pedidos = await this.pedidosSvc.listAll();
            this.sortPedidos();
        }
    }

    // 🔑 CORRECCIÓN: Usamos PedidoFront y p.id
    async cancel(p: PedidoFront) {
        try {
            await this.pedidosSvc.cancelPedido(p.id);
            this.pedidos = await this.pedidosSvc.listAll();
            this.sortPedidos();
        } catch (e: any) {
            alert(e.message || 'Error al cancelar');
        }
    }

    // 🔑 CORRECCIÓN: Usamos PedidoFront y p.id
    async reactivate(p: PedidoFront) {
        try {
            await this.pedidosSvc.reactivatePedido(p.id);
            this.pedidos = await this.pedidosSvc.listAll();
            this.sortPedidos();
        } catch (e: any) {
            alert(e.message || 'Error al reactivar');
        }
    }

    // 🔑 CORRECCIÓN: Usamos PedidoFront y p.id
    async deliver(p: PedidoFront) {
        if (!confirm('Marcar este pedido como entregado?')) return;
        try {
            await this.pedidosSvc.deliverPedido(p.id);
            this.pedidos = await this.pedidosSvc.listAll();
            this.sortPedidos();
        } catch (e: any) {
            alert(e.message || 'Error al marcar como entregado');
        }
    }

    private sortPedidos() {
        // 🔑 CORRECCIÓN: Usamos PedidoFront
        this.pedidos.sort((a: PedidoFront, b: PedidoFront) => {
            const da = new Date(a.fechaEntrega).getTime();
            const db = new Date(b.fechaEntrega).getTime();
            return da - db;
        });
    }

    public formatFecha(fecha?: string): string {
        if (!fecha) return '(sin fecha)';
        const parts = fecha.split('-');
        if (parts.length < 3) return fecha;
        const [year, month, day] = parts;
        const d = parseInt(day, 10);
        const m = parseInt(month, 10);
        return `${d}/${m}/${year}`;
    }

    public formatPrecio(valor?: number | null): string {
        if (valor == null) return '(sin precio)';
        return String(Math.round(Number(valor)));
    }
}