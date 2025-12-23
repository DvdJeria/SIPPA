// src/app/guards/auth.guard.ts

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service'; // 🚨 CORRECCIÓN: Usar .service para la ruta típica
import { SqliteService } from '../services/sqlite.service'; // 🚨 CORRECCIÓN: Usar .service para la ruta típica

export const authGuard: CanActivateFn = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);
  const sqliteService = inject(SqliteService);

  // --- 1. LÓGICA ONLINE (Prioridad) ---
  const online = await supabaseService.isOnline();

  if (online) {
    const session = await supabaseService.getSession();

    // Verifica que haya una sesión activa (ej. no null)
    if (session?.user?.id) { // Verificar el ID del usuario en la sesión es más robusto que solo el email
      return true;
    }

    // Si está online pero no logueado, redirigir
    router.navigate(['/login'], { replaceUrl: true });
    return false;
  }

  // --- 2. LÓGICA OFFLINE (Fallback) ---
  // Si no hay conexión, verificar si puede operar offline
  const offlineAllowed = await sqliteService.hasLocalAuthEntry();

  if (offlineAllowed) {
    return true;
  }

  // Si no está ni online ni tiene credenciales locales, redirigir al login
  router.navigate(['/login'], { replaceUrl: true });
  return false;
};