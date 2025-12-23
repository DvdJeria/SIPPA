import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';

// 🔑 IMPORTACIÓN DE SERVICIO DE SUPABASE (RUTA CORREGIDA)
import { SupabaseService } from '../../../services/supabase.service';

// 🚨 IMPORTACIONES INDIVIDUALES DE IONIC
import {
    IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonContent, IonItem, IonInput, IonButton
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-cliente-form',
    templateUrl: './cliente-form.page.html',
    styleUrls: ['./cliente-form.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule, // 🔑 Necesario para FormBuilder
        // Componentes de Ionic
        IonHeader, IonToolbar, IonButtons, IonBackButton,
        IonTitle, IonContent, IonItem, IonInput, IonButton
    ],
})
export class ClienteFormPage implements OnInit {
    clienteForm: FormGroup;
    isEditing: boolean = false;
    cliId: string | null = null;

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService,
        private router: Router,
        private route: ActivatedRoute,
        private loadingController: LoadingController,
        private toastController: ToastController
    ) {
        this.clienteForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(50)]],
            apellido: ['', [Validators.required, Validators.maxLength(50)]],
            email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
            telefono: ['', [Validators.maxLength(20)]],
        });
    }

    ngOnInit() {
        this.cliId = this.route.snapshot.paramMap.get('id');
        this.isEditing = !!this.cliId;

        if (this.isEditing) {
            this.loadClienteData();
        }
    }

    async loadClienteData() {
        // Cargar todos los clientes y filtrar (ajustar si tienes un getClienteById más eficiente)
        const { data: clientes } = await this.supabaseService.getClientes();
        const cliente = clientes?.find((c: any) => c.cli_id === this.cliId);

        if (cliente) {
            this.clienteForm.patchValue(cliente);
        } else {
            this.showToast('No se pudieron cargar los datos del cliente.', 'danger');
        }
    }

    async saveCliente() {
        if (this.clienteForm.invalid) {
            this.showToast('Verifica que todos los campos requeridos estén llenos.', 'danger');
            return;
        }

        const loading = await this.loadingController.create({
            message: this.isEditing ? 'Actualizando cliente...' : 'Creando cliente...'
        });
        await loading.present();

        const clienteData = {
            ...this.clienteForm.value,
            // Si es edición, añade el ID para que el upsert sepa qué fila actualizar
            ...(this.isEditing && { cli_id: this.cliId })
        };

        // Usando el método saveCliente (que usa upsert) del servicio
        const { error } = await this.supabaseService.saveCliente(clienteData);

        loading.dismiss();

        if (error) {
            console.error('Error al guardar cliente:', error);
            let msg = 'Error desconocido al guardar.';
            if (error.code === '23505') {
                msg = 'Ya existe un cliente con ese email. Verifica los datos.';
            }
            this.showToast(msg, 'danger');
        } else {
            this.showToast('Cliente guardado exitosamente.', 'success');
            this.router.navigate(['/agenda/clientes']);
        }
    }

    async showToast(message: string, color: string) {
        const toast = await this.toastController.create({
            message: message,
            duration: 3000,
            color: color,
        });
        toast.present();
    }
}