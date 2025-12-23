import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, Platform } from '@ionic/angular';

// 🔑 IMPORTACIÓN DE SERVICIO DE SUPABASE (RUTA CORREGIDA)
import { SupabaseService } from '../../../services/supabase.service';
import { Cliente } from '../../../models/database.types'; // Interfaz de Cliente

// 🚨 IMPORTACIONES INDIVIDUALES DE IONIC
import {
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
    IonSearchbar, IonContent, IonList, IonItem, IonLabel,
    IonIcon, IonButton, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-clientes',
    templateUrl: './clientes.page.html',
    styleUrls: ['./clientes.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        // Componentes de Ionic
        IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
        IonSearchbar, IonContent, IonList, IonItem, IonLabel,
        IonIcon, IonButton, IonCard, IonCardHeader, IonCardTitle,
        IonCardContent
    ],
})
export class ClientesPage implements OnInit {
    clientes: Cliente[] = [];
    clientesCopia: Cliente[] = [];

    constructor(
        private supabaseService: SupabaseService,
        private router: Router,
        private alertController: AlertController,
        private loadingController: LoadingController,
        private platform: Platform
    ) { }

    ngOnInit() {
        this.loadClientes();
    }

    ionViewWillEnter() {
        this.loadClientes();
    }

    async loadClientes() {
        const loading = await this.loadingController.create({ message: 'Cargando clientes...' });
        await loading.present();

        // Usando el método getClientes del servicio
        const { data, error } = await this.supabaseService.getClientes();

        loading.dismiss();

        if (error) {
            console.error('Error al cargar clientes:', error);
        } else {
            this.clientes = data as Cliente[];
            this.clientesCopia = [...this.clientes];
        }
    }

    goToForm(cliId?: string) {
        if (cliId) {
            this.router.navigate(['/agenda/cliente-form', cliId]);
        } else {
            this.router.navigate(['/agenda/cliente-form']);
        }
    }

    async searchClientes(event: any) {
        const searchTerm = event.detail.value;

        if (!searchTerm || searchTerm.length < 3) {
            this.clientes = [...this.clientesCopia];
            return;
        }

        // Usando el método searchClientes del servicio
        const { data, error } = await this.supabaseService.searchClientes(searchTerm);

        if (error) {
            console.error('Error en la búsqueda:', error);
        } else {
            this.clientes = data as Cliente[];
        }
    }

    async confirmDelete(cliId: string, nombreCliente: string) {
        const alert = await this.alertController.create({
            header: 'Confirmar Eliminación',
            message: `¿Estás seguro de eliminar (soft delete) al cliente ${nombreCliente}?`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar',
                    handler: async () => {
                        const loading = await this.loadingController.create({ message: 'Eliminando...' });
                        await loading.present();

                        // Usando el método softDeleteCliente del servicio
                        const { error } = await this.supabaseService.softDeleteCliente(cliId);

                        loading.dismiss();

                        if (error) {
                            console.error('Error al eliminar:', error);
                        } else {
                            this.loadClientes();
                        }
                    },
                },
            ],
        });

        await alert.present();
    }
}