import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { CommonModule } from '@angular/common';

// 🚨 IMPORTACIONES INDIVIDUALES DE IONIC:
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
  // 🚨 Propiedades requeridas para Componentes Autónomos
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

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, /*Validators.minLength(6)*/]],
  });

  async signIn() {
    // 1. Validación de Formulario
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      //alert('Por favor, ingresa credenciales válidas (mínimo 6 caracteres para la contraseña).');
      return;
    }

    const email = this.form.value.email;
    const password = this.form.value.password;

    const online = await this.supabaseService.isOnline();

    if (!online) {
      // 2. Flujo Offline
      const ok = await this.supabaseService.localSignIn(email);
      if (ok) {
        alert('Login offline exitoso. Accediendo a datos locales.');
        this.router.navigate(['/home'], { replaceUrl: true });
        return;
      }
      alert('No hay conexión a internet y no existe una sesión previa almacenada.');
      return;
    }

    // 3. Flujo Online (Estabilizado)
    try {
      await this.supabaseService.signIn(email, password);
      this.router.navigate(['/home'], { replaceUrl: true });
    } catch (e: any) {
      const msg = e.message.includes('Invalid login credentials') ?
        'Credenciales inválidas. Verifica tu email y contraseña.' :
        'Error al iniciar sesión: ' + e.message;
      alert(msg);
    }
  }
}
