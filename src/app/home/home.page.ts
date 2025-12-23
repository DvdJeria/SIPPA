import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    ModalController,
    IonMenuButton,
    AlertController,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { chevronBack, chevronForward, addCircleOutline } from 'ionicons/icons';

// Importar los servicios y tipos necesarios
import { PedidosService, PedidoFront } from '../services/pedidos.service';
import { SupabaseService } from '../services/supabase.service';
import { SyncService } from '../services/sync.service';

// IMPORTAR LOS COMPONENTES MODALES STANDALONE
import { PedidoListComponent } from './pedido-list.component';
import { PedidoFormComponent } from './pedido-form.component';
import { PedidoAllComponent } from './pedido-all.component';



// Definición de tipo auxiliar para la vista del calendario
interface DayCell {
    date: Date;
    inMonth: boolean;
    count: number;
}

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonButton,
        IonButtons,
        IonIcon,
        IonMenuButton
    ],
})

export class HomePage implements OnInit {
    private syncService = inject(SyncService);
    private pedidos = inject(PedidosService);
    private modalCtrl = inject(ModalController);
    private alertController = inject(AlertController);

    public async sincronizarManualmente() {
        try {
            console.log("SYNC_MANUAL: Usuario solicitó la sincronización completa.");
            await this.syncService.fullSync();
            alert('Sincronización completa. Verifique los datos.');
        } catch (e) {
            alert('Fallo la sincronización. Vea Logcat para detalles.');
        }
    }

    // Estado del calendario
    currentMonth: Date = new Date();
    currentLabel: string = '';
    days: DayCell[] = [];
    allPedidos: PedidoFront[] = [];

    // Inicializar íconos
    constructor() {
        addIcons({ chevronBack, chevronForward, addCircleOutline });
    }
    ionViewWillEnter() {
        console.log("HomePage: Verificando y sincronizando datos de referencia...");

        // Llamamos a la sincronización. No necesitamos esperar el resultado aquí,
        // ya que no bloquea la UI y maneja sus propios errores internos.
        this.syncService.fullSync();
    }

    ngOnInit() {
        this.loadCalendar();
    }

    async loadCalendar() {
        try {
            this.allPedidos = await this.pedidos.listAll();
            this.updateCalendar(this.currentMonth);
            this.checkUpcomingOrders(); // 🔑 LLAMADA A LA FUNCIÓN DE ALERTA DESPUÉS DE CARGAR
        } catch (e) {
            console.error('Error al cargar pedidos:', e);
            this.updateCalendar(this.currentMonth);
        }
    }

    // -----------------------------------------------------------
    // 🔑 LÓGICA DE NOTIFICACIÓN DE PEDIDOS A 3 DÍAS
    // -----------------------------------------------------------

    async checkUpcomingOrders() {
        // Obtenemos la fecha de hoy, limpia de hora.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Obtener la fecha límite (Hoy + 3 días)
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3); // Suma 3 días

        // 2. Filtrar los pedidos que cumplen con el criterio
        const upcomingOrders = this.allPedidos.filter(pedido => {

            // Convertimos la fecha de entrega del pedido a objeto Date (limpio)
            // Asumo que pedido.fechaEntrega es una string en formato 'YYYY-MM-DD'
            const deliveryDate = new Date(pedido.fechaEntrega.split('T')[0]);

            // 🛑 CORRECCIÓN: Filtrar el RANGO
            // Los pedidos deben estar entre HOY (inclusive) y HOY + 3 DÍAS (inclusive)
            const isAfterOrEqualToday = deliveryDate.getTime() >= today.getTime();
            const isBeforeOrEqualLimit = deliveryDate.getTime() <= threeDaysFromNow.getTime();

            return isAfterOrEqualToday && isBeforeOrEqualLimit;
        });

        // 3. Mostrar la notificación si hay pedidos
        if (upcomingOrders.length > 0) {

            // Usar 'descripcion' o 'id' si la descripción está vacía
            const orderTitles = upcomingOrders.map(p => {
                const nombreCliente = p.cli_nombre ? `${p.cli_nombre} ` : '';
                // 🔑 Formato: NombreCliente - Fecha (e.g., "Juan Pérez - 15/05")
                return `${nombreCliente} (${new Date(p.fechaEntrega).toLocaleDateString('es-ES', { month: 'numeric', day: 'numeric' })})`;
            }).join(', ');

            await this.presentNotificationAlert(upcomingOrders.length, orderTitles);
        }
    }


    async presentNotificationAlert(count: number, titles: string) {
        const alert = await this.alertController.create({
            header: '¡RECORDATORIO DE ENTREGA!',
            subHeader: `Tienes ${count} pedido(s) pendientes a entregar en 3 días.`,
            message: `Pedidos a preparar: ${titles}.`,
            buttons: ['Entendido']
        });

        await alert.present();
    }

    // -----------------------------------------------------------
    // FIN LÓGICA DE NOTIFICACIÓN
    // -----------------------------------------------------------


    updateCalendar(date: Date) {
        this.currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        this.currentLabel = this.currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        this.days = this.getCalendarDays(this.currentMonth);
    }

    getCalendarDays(date: Date): DayCell[] {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay() || 7;

        const days: DayCell[] = [];
        const startOffset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = startOffset; i > 0; i--) {
            const dayDate = new Date(year, month - 1, prevMonthDays - i + 1);
            days.push({
                date: dayDate,
                inMonth: false,
                count: this.getPedidosCountForDay(dayDate)
            });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDate = new Date(year, month, i);
            days.push({
                date: dayDate,
                inMonth: true,
                count: this.getPedidosCountForDay(dayDate)
            });
        }

        const totalDays = days.length;
        const remainingCells = 42 - totalDays;

        for (let i = 1; i <= remainingCells && totalDays + i <= 42; i++) {
            const dayDate = new Date(year, month + 1, i);
            days.push({
                date: dayDate,
                inMonth: false,
                count: this.getPedidosCountForDay(dayDate)
            });
        }

        return days;
    }

    getPedidosCountForDay(date: Date): number {
        const dayStr = date.toISOString().split('T')[0];
        return this.allPedidos.filter(p => p.fechaEntrega.startsWith(dayStr)).length;
    }

    prevMonth() {
        const newMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
        this.updateCalendar(newMonth);
    }

    nextMonth() {
        const newMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        this.updateCalendar(newMonth);
    }

    // LÓGICA DE MODALES
    async onDayClick(day: DayCell) {
        if (!day.inMonth || day.count === 0) return;

        const dayStr = day.date.toISOString().split('T')[0];
        const pedidosDelDia = this.allPedidos.filter(p => p.fechaEntrega.startsWith(dayStr));

        const modal = await this.modalCtrl.create({
            component: PedidoListComponent,
            componentProps: {
                pedidos: pedidosDelDia,
                date: dayStr
            },
        });
        await modal.present();

        const { data } = await modal.onDidDismiss();
        if (data && data.updated) {
            this.loadCalendar();
        }
    }

    async createPedidoPrompt() {
        const modal = await this.modalCtrl.create({
            component: PedidoFormComponent,
        });
        await modal.present();

        const { data } = await modal.onDidDismiss();
        if (data && data.updated) {
            this.loadCalendar();
        }
    }

    async showAllPedidos() {
        const modal = await this.modalCtrl.create({
            component: PedidoAllComponent,
            componentProps: {
                pedidos: this.allPedidos,
            },
        });
        await modal.present();

        const { data } = await modal.onDidDismiss();
        if (data && data.updated) {
            this.loadCalendar();
        }
    }

}