// src/app/login/login.page.ts - CÓDIGO FINAL CORREGIDO

import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { CommonModule } from '@angular/common';

// 🔑 IMPORTACIÓN NECESARIA: Importar el servicio de sincronización
import { SyncService } from '../services/sync.service';

//Importo el servicio centralizado para mostrar mensajes.
import { ToastService } from 'src/app/services/toast.service';

//IMPORTACIONES INDIVIDUALES DE IONIC:
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  //Propiedades requeridas para Componentes Autónomos
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    IonContent,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton
  ]
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);

  // 🔑 INYECCIÓN DEL SERVICIO DE SINCRONIZACIÓN
  private syncService = inject(SyncService);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, /*Validators.minLength(6)*/]],
  });

  /**
   * Manejo el inicio de sesión, diferenciando entre flujo online y offline.
   */
  async signIn() {
    // 1. Validación de Formulario
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.presentToast('Por favor, ingresa credenciales válidas.', 'warning');
      return;
    }

    const email = this.form.value.email;
    const password = this.form.value.password;

    // Verifico el estado de la conexión a Internet.
    const online = await this.supabaseService.isOnline();

    if (!online) {
      // 2. Flujo Offline: Intento hacer login con credenciales almacenadas localmente.
      const ok = await this.supabaseService.localSignIn(email);
      if (ok) {
        this.toastService.presentToast('Login offline exitoso. Accediendo a datos locales.', 'success');
        this.router.navigate(['/home'], { replaceUrl: true });
        return;
      }
      this.toastService.presentToast('No hay conexión a internet y no existe una sesión previa almacenada.', 'error');
      return;
    }

    // 3. Flujo Online: Intento hacer login contra Supabase.
    try {
      // 3.1. Intentar iniciar sesión en Supabase (esto incluye setLocalAuth)
      await this.supabaseService.signIn(email, password);

      // 🔑 3.2. INICIAR LA SINCRONIZACIÓN COMPLETA (Sync Down)
      // Descargar todos los datos maestros y transaccionales
      this.toastService.presentToast('Inicio de sesión exitoso. Sincronizando datos...', 'success');

      // La sincronización puede ser lenta, la llamamos sin await para no bloquear la navegación,
      // o con await si la navegación depende de que los datos estén cargados.
      // DADO EL CONTEXTO, ES MEJOR HACER AWAIT para garantizar que los datos estén.
        await this.syncService.fullSync();

      // 3.3. Navegar a la home si el inicio de sesión Y la sincronización son exitosos.
      this.router.navigate(['/home'], { replaceUrl: true });

    } catch (e: any) {
      // Manejo y muestro los errores de Supabase.
      const msg = e.message.includes('Invalid login credentials') ?
          'Credenciales inválidas. Verifica tu email y contraseña.' :
          'Error al iniciar sesión: ' + e.message;

      this.toastService.presentToast(msg, 'error');
    }
  }
}