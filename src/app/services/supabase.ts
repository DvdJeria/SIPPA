import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { SqliteService } from './sqlite';
import { Network } from '@capacitor/network';

const supabaseUrl = 'https://ymdcsjmzmagjyudfijtz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZGNzam16bWFnanl1ZGZpanR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODQzMjAsImV4cCI6MjA3OTI2MDMyMH0.KzFLfbkzWcVt3HjMoSgXfA6Lemh-UmKLuPFMd8rNXok';

import { Ingrediente, UserRole, UnidadMedida } from '../models/ingredientes';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private router = inject(Router);
  private sqliteService = inject(SqliteService);

  constructor() {
    // 🚨 CORRECCIÓN CRÍTICA DE ESTABILIDAD: Evitar conflicto de LockManager en Capacitor
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: localStorage, // <--- Obliga a usar localStorage
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  /** Verifica si hay conexión a internet */
  public async isOnline(): Promise<boolean> {
    const status = await Network.getStatus();
    return status.connected;
  }

  /** Obtiene la sesión actual de Supabase */
  public async getSession(): Promise<Session | null> {
    try {
      const {data: {session}} = await this.supabase.auth.getSession();
      return session;
    } catch {
      return null;
    }
  }

  /** LOGIN ONLINE */
  public async signIn(email: string, password: string): Promise<void> {
    const {data, error} = await this.supabase.auth.signInWithPassword({email, password});
    if (error) throw error;

    // Guardar email local en SQLite
    if (data.user?.email) {
      try {
        await this.sqliteService.setLocalAuth(data.user.email);
        // Opcional: Si tienes una función syncTablesToSQLite, descoméntala.
        // await this.syncTablesToSQLite();
      } catch (e) {
        console.error('Error SQLite o sincronización:', e);
      }
    }
  }

  /** LOGIN OFFLINE */
  public async localSignIn(email: string): Promise<boolean> {
    return this.sqliteService.checkLocalAuth(email);
  }

  /** Cierre de sesión y navega a la página de login */
  public async signOut(): Promise<void> {
    try {
      await this.supabase.auth.signOut();

      // Usamos replaceUrl: true para que el usuario no pueda volver con el botón "atrás" del navegador.
      this.router.navigate(['/login'], { replaceUrl: true });

    } catch (e) {
      console.warn('No se pudo cerrar sesión:', e);
    }
  }

  /**
   * Obtiene el listado de Ingredientes según el rol del usuario.
   * - Administrador: Ve activos y eliminados (is_deleted: true o false).
   * - Simple: Solo ve activos (is_deleted: false).
   * @returns Promesa que resuelve un array de Ingrediente.
   */
  public async getIngredientes(): Promise<Ingrediente[]> {
    const session = await this.getSession();
    if (!session) {
      throw new Error('No hay sesión activa para realizar la consulta.');
    }

    const userRole = await this.getUserRole();

    let query = this.supabase
      .from('ingredientes')
      .select('*, unidad_medida(unmed_nombre)');

    // Aplicar filtro de Soft Delete basado en el rol
    if (userRole === 'user') {
      //ROL SIMPLE: Solo ve los activos
      query = query.eq('is_deleted', false);
    }
    //ROL ADMINISTRADOR: No aplicamos filtro de is_deleted,
    // por lo que ve TODOS los registros (true o false).

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const mappedData = data.map((item: any) => ({
      ing_id: item.ing_id,
      ing_nombre: item.ing_nombre,
      ing_precio: item.ing_precio,
      ing_estado: item.ing_estado,
      is_deleted: item.is_deleted,
      // La forma de acceder depende si es un arreglo o un objeto anidado.
      // Usaremos la versión más segura (asumiendo que puede ser un arreglo de un elemento)
      unmed_nombre: (item.unidad_medida && item.unidad_medida[0]
        ? item.unidad_medida[0].unmed_nombre
        : item.unidad_medida?.unmed_nombre || 'N/A'),
    }));

    // Retorna los datos ya mapeados
    return mappedData as Ingrediente[];
  }

  /**
   * Obtiene el rol del usuario actual desde la tabla 'profiles'.
   * @returns El rol del usuario ('administrador' o 'simple'), por defecto 'simple'.
   */
  public async getUserRole(): Promise<'administrador' | 'user'> {
    const session = await this.getSession();
    if (!session) {
      return 'user';
    }

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error("Error al obtener el rol del perfil:", error.message);
        // Si hay un error de consulta (ej. perfil no encontrado), asignamos el rol más restrictivo.
        return 'user';
      }

      // Esto asegura que " Administrador " se trate como "administrador".
      const role = data.role?.toLowerCase().trim();

      if (role === 'administrador') {
        return 'administrador';
      }

      // Cualquier otro valor (incluyendo 'user', 'null', o cualquier otra cosa)
      return 'user';

    } catch (e) {
      console.error("Excepción en getUserRole:", e);
      return 'user';
    }
  }

  /**
   * Realiza la Eliminación Suave (Soft Delete) o Restauración de un ingrediente.
   * El usuario debe tener rol 'administrador' para que el RLS lo permita.
   * @param id El ing_id del ingrediente.
   * @param isDeleted El nuevo estado: true para eliminar, false para restaurar.
   */
  public async softDeleteIngrediente(id: string, isDeleted: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('ingredientes')
      .update({ is_deleted: isDeleted }) // Cambia el estado
      .eq('ing_id', id); // Donde el ID coincide

    if (error) throw error;
  }

  /**
   * Obtiene las unidades de medida disponibles para el formulario.
   * La columna unmed_id es de tipo INT4, por eso usamos number.
   * @returns Promesa que resuelve una lista de objetos UnidadMedida.
   */
  public async getUnidadesMedida(): Promise<UnidadMedida[]> {
    const { data, error } = await this.supabase
      .from('unidad_medida') //Asegura que el nombre de la tabla sea este
      .select('unmed_id, unmed_nombre') // Columnas necesarias
      .order('unmed_nombre', { ascending: true });

    if (error) {
      console.error("Error al obtener unidades de medida:", error.message);
      throw new Error('Error al cargar las unidades de medida.');
    }

    // Usamos el casting para asegurar que el ID es tratado como number.
    return data as UnidadMedida[];
  }

  /**
   * Obtiene los detalles de un ingrediente específico para edición.
   * Realiza un JOIN implícito para obtener el nombre de la unidad de medida.
   */
  // En src/app/services/supabase.ts, dentro de la clase SupabaseService:

  public async getIngredienteById(id: string): Promise<Ingrediente> {
    const { data, error } = await this.supabase
      .from('ingredientes')
      .select(`
            ing_id,
            ing_nombre,
            ing_precio,
            ing_estado,
            unmed_id,
            is_deleted,
            unidad_medida (unmed_nombre)`)
      .eq('ing_id', id)
      .limit(1)
      .single();

    if (error) {
      console.error("Error al obtener ingrediente:", error.message);
      throw new Error('No se pudo cargar el ingrediente.');
    }

    if (!data) {
      throw new Error(`Ingrediente con ID ${id} no encontrado.`);
    }

    // 🚨 CORRECCIÓN: Accedemos a la propiedad anidada como un ARREGLO
    // y tomamos el primer elemento [0] antes de acceder a unmed_nombre.
    const unidadMedidaArray = data.unidad_medida as any[] | null;
    const nombreUnidad = unidadMedidaArray && unidadMedidaArray.length > 0
      ? unidadMedidaArray[0].unmed_nombre
      : 'N/A';


    const ingrediente: Ingrediente = {
      ing_id: data.ing_id,
      ing_nombre: data.ing_nombre,
      ing_precio: data.ing_precio,
      ing_estado: data.ing_estado,
      is_deleted: data.is_deleted,

      unmed_nombre: nombreUnidad, // 👈 Usamos el nombre extraído

      // Aseguramos que unmed_id sea number
      unmed_id: Number(data.unmed_id),
    };

    return ingrediente;
  }

  /**
   * Agrega un nuevo ingrediente a la base de datos.
   * Excluye propiedades que no son parte de la tabla 'ingredientes'.
   */
  public async addIngrediente(data: Partial<Ingrediente>): Promise<void> {
    // Usamos la desestructuración para excluir 'unmed_nombre' (solo está en la interfaz)
    const { unmed_nombre, ...ingredienteData } = data;

    const { error } = await this.supabase
      .from('ingredientes')
      .insert([ingredienteData]); // Insertamos solo los campos de la tabla

    if (error) {
      console.error("Error al agregar ingrediente:", error.message);
      throw new Error('Error al agregar el ingrediente. Verifique políticas RLS de INSERT.');
    }
  }

  /**
   * Actualiza los datos de un ingrediente existente.
   */
  public async updateIngrediente(id: string, data: Partial<Ingrediente>): Promise<void> {
    // Excluimos 'unmed_nombre' antes de actualizar
    const { unmed_nombre, ...ingredienteData } = data;

    const { error } = await this.supabase
      .from('ingredientes')
      .update(ingredienteData)
      .eq('ing_id', id);

    if (error) {
      console.error("Error al actualizar ingrediente:", error.message);
      throw new Error('Error al actualizar el ingrediente. Verifique políticas RLS de UPDATE.');
    }
  }

}
