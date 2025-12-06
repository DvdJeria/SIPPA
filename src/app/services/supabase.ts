import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { SqliteService } from './sqlite';
import { Network } from '@capacitor/network';

const supabaseUrl = 'https://ymdcsjmzmagjyudfijtz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZGNzam16bWFnanl1ZGZpanR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODQzMjAsImV4cCI6MjA3OTI2MDMyMH0.KzFLfbkzWcVt3HjMoSgXfA6Lemh-UmKLuPFMd8rNXok';

import { Ingrediente, UserRole, UnidadMedida } from '../models/Database.types';

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
  public async getIngredientes(searchText?: string): Promise<Ingrediente[]> {
    const session = await this.getSession(); // Asumo que tienes este método
    if (!session) {
      throw new Error('No hay sesión activa para realizar la consulta.');
    }

    const userRole = await this.getUserRole(); // Asumo que tienes este método

    let query = this.supabase
      .from('ingredientes')
      .select('*, unidad_medida(unmed_nombre)');

    // 🚨 1. FILTRADO POR BÚSQUEDA (ilike)
    if (searchText && searchText.trim() !== '') {
      // Busca coincidencias parciales en el nombre, insensible a mayúsculas/minúsculas
      query = query.ilike('ing_nombre', `%${searchText}%`);
    }

    // 2. Aplicar filtro de Soft Delete basado en el rol
    if (userRole === 'user') {
      // ROL SIMPLE: Solo ve los activos
      query = query.eq('is_deleted', false);
    }

    // 3. Ordenamiento
    query = query.order('ing_nombre', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error en getIngredientes:', error);
      throw error;
    }

    // Asegúrate de que este mapeo sea consistente con cómo vienen tus datos.
    const mappedData = data.map((item: any) => ({
      ing_id: item.ing_id,
      ing_nombre: item.ing_nombre,
      ing_precio: item.ing_precio,
      is_deleted: item.is_deleted,
      // La forma de acceder depende de tu join, si la versión original te funcionaba, úsala.
      unmed_nombre: (item.unidad_medida && item.unidad_medida[0]
        ? item.unidad_medida[0].unmed_nombre
        : item.unidad_medida?.unmed_nombre || 'N/A'),
    }));

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
          unmed_id,
          is_deleted,
          unidad_medida (unmed_nombre)`) // 🚨 ing_estado ha sido eliminado del select
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

    // Cuando se usa .single(), el JOIN 1:1 devuelve un OBJETO.
    const unidadMedidaObjeto = data.unidad_medida as unknown as { unmed_nombre: string } | null;

    // Extracción simple
    const nombreUnidad = unidadMedidaObjeto
        ? unidadMedidaObjeto.unmed_nombre
        : 'N/A';


    const ingrediente: Ingrediente = {
      ing_id: data.ing_id,
      ing_nombre: data.ing_nombre,
      ing_precio: data.ing_precio,
      is_deleted: data.is_deleted,
      // 🚨 ing_estado ha sido eliminado de aquí también

      unmed_nombre: nombreUnidad,
      unidad_medida: unidadMedidaObjeto,

      unmed_id: data.unmed_id, // Asumimos que es number
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



  //*****************************************************************
  //Métodos cótización
  public async createCotizacion(cotizacion: any) {
    const { data, error } = await this.supabase
      .from('cotizacion')
      // @ts-ignore
      .insert(cotizacion)
      .select('cot_id')
      .single();

    return { data, error };
  }

  public async convertirAPedido(data: {
    nombre: string;
    apellido: string;
    email: string;
    fechaEntrega: string;
    precio: number;
    cotId: number;
  }) {
    let cli_id: number;

    // 1. Gestión del Cliente (Upsert)
    // Buscar si existe el email
    const { data: existingClient, error: searchError } = await this.supabase
      .from('cliente')
      .select('cli_id')
      .eq('cli_email', data.email)
      .single();

    if (existingClient) {
      cli_id = (existingClient as any).cli_id;
    } else {
      // Si NO existe, insertar nuevo cliente
      const { data: newClient, error: createError } = await this.supabase
        .from('cliente')
        // @ts-ignore
        .insert({
          cli_nombre: data.nombre,
          cli_apellido: data.apellido,
          cli_email: data.email
        })
        .select('cli_id')
        .single();

      if (createError || !newClient) {
        console.error('Error creating client in convert:', createError);
        return { data: null, error: createError };
      }
      cli_id = (newClient as any).cli_id;
    }

    // 2. Crear el Pedido
    const { data: newOrder, error: orderError } = await this.supabase
      .from('pedido') // 🚨 Verificar que esta es la tabla correcta
      // @ts-ignore
      .insert({
        cli_id: cli_id,
        cot_id: data.cotId,
        ped_fecha_entrega: data.fechaEntrega,
        ped_precio: data.precio,
        ped_estado: 'CONFIRMADO' // o el estado inicial que uses
      })
      .select()
      .single();

    return { data: newOrder, error: orderError };
  }

  // 1. Método para obtener clientes (usado por el modal)
  async getClientes() {
    const { data, error } = await this.supabase
      .from('cliente')
      .select('*')
      .order('cli_nombre', { ascending: true });

    if (error) {
      console.error('Error fetching clientes:', error);
      return [];
    }
    return data;
  }

// 2. Método para crear un cliente (usado por el modal)
  async createCliente(cliente: any) { // Usamos 'any' si no tienes la interfaz DB['Tables']['cliente']['Insert']
    const { data, error } = await this.supabase
      .from('cliente')
      .insert(cliente)
      .select()
      .single();

    return { data, error };
  }


}
