import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service'; // Asegúrate de que la ruta sea correcta
import { AlertController } from '@ionic/angular/standalone';

export const adminRoleGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);
  const alertController = inject(AlertController); // Para mostrar un mensaje de acceso denegado

  // 1. Obtener el rol del usuario actual
  const role = await supabaseService.getUserRole();

  if (role === 'administrador') {
    // 2. Si es administrador, permitir el acceso
    return true;
  } else {
    // 3. Si NO es administrador, denegar el acceso y notificar

    // Opcional: Mostrar una alerta al usuario
    const alert = await alertController.create({
      header: 'Acceso Denegado',
      message: 'No tienes permisos de administrador para ver esta página.',
      buttons: ['OK']
    });
    await alert.present();

    // 4. Redirigir a una página segura (ej. home)
    router.navigate(['/home'], { replaceUrl: true });
    return false;
  }
};
