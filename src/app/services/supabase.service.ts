import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, Session, SupportedStorage } from '@supabase/supabase-js';
import { SqliteService } from './sqlite.service';
import { environment } from '../../environments/environment';

import { CotizacionDetalleExtendida} from "../models/database.types";
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';

const CapacitorStorage: SupportedStorage = {
    getItem: async (key: string): Promise<string | null> => {
        const result = await Preferences.get({ key });
        return result.value;
    },
    setItem: async (key: string, value: string): Promise<void> => {
        await Preferences.set({ key, value });
    },

    removeItem: async (key: string): Promise<void> => {
        await Preferences.remove({ key });
    },
};

const supabaseUrl = environment.supabaseUrl;
const supabaseKey = environment.supabaseKey;

import {
    Ingrediente,
    UnidadMedida,
    Cotizacion,
    CotizacionData,
    CotizacionInsert,
} from '../models/database.types';

@Injectable({
  providedIn: 'root'
})

export class SupabaseService {

    private supabase: SupabaseClient;
    private router = inject(Router);
    public sqliteService = inject(SqliteService);

    constructor() {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                storage: CapacitorStorage,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
            },
        });
    }

    public async isOnline(): Promise<boolean> {
        const status = await Network.getStatus();
        return status.connected;
    }

    public async getSession(): Promise<Session | null> {
        const isConnected = await this.isOnline();

        try {

            const {data: {session}} = await this.supabase.auth.getSession();

            if (session) {
                return session;
            }
        } catch (e) {

            console.warn('Error al verificar sesión en línea (posiblemente desconectado).', e);
        }

        if (!isConnected) {

            const isAuthenticatedLocally = await this.sqliteService.hasLocalAuthEntry(); // -- Este es el método delegado

            if (isAuthenticatedLocally) {
                console.log('Sesión validada OFFLINE vía caché local. Permitiendo navegación.');

                return { user: { id: 'local-user', email: 'local@local.com' } } as Session;
            }
        }

        return null;
    }

    public async signIn(email: string, password: string): Promise<any> {
        const {data, error} = await this.supabase.auth.signInWithPassword({email, password});
        if (error) throw error;

        if (data.user?.email) {
            try {

                await this.sqliteService.setLocalAuth(data.user.email);
            } catch (e) {
                console.error('Error SQLite:', e);

            }
        }

        return data.user; // Retornamos los datos del usuario para que el componente lo use
    }

    public async localSignIn(email: string): Promise<boolean> {
        return this.sqliteService.checkLocalAuth(email);
    }

    public async signOut(): Promise<void> {
        try {
            await this.supabase.auth.signOut();

            this.router.navigate(['/login'], {replaceUrl: true});

        } catch (e) {
            console.warn('No se pudo cerrar sesión:', e);
        }
    }

    public async getIngredientes(searchText?: string): Promise<Ingrediente[]> {
        const session = await this.getSession();
        if (!session) {
            throw new Error('No hay sesión activa para realizar la consulta.');
        }

        const userRole = await this.getUserRole();

        let query = this.supabase
            .from('ingredientes')
            .select('*, unidad_medida(unmed_nombre)');

        if (searchText && searchText.trim() !== '') {

            query = query.ilike('ing_nombre', `%${searchText}%`);
        }

        if (userRole === 'user') {

            query = query.eq('is_deleted', false);
        }

        query = query.order('ing_nombre', {ascending: true});

        const {data, error} = await query;

        if (error) {
            console.error('Error en getIngredientes:', error);
            throw error;
        }

        const mappedData = data.map((item: any) => ({

            ing_id: item.ing_id,
            ing_nombre: item.ing_nombre,
            ing_precio: item.ing_precio,
            ing_cantidad_base: item.ing_cantidad_base,
            is_deleted: item.is_deleted,
            unmed_id: item.unmed_id,
            unidad_medida: item.unidad_medida || null,
            unmed_nombre: item.unidad_medida?.unmed_nombre || 'N/A',

        }));

        return mappedData as Ingrediente[];
    }

    public async getUserRole(): Promise<'administrador' | 'user'> {
        const session = await this.getSession();
        if (!session) {
            return 'user';
        }

        try {
            const {data, error} = await this.supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error("Error al obtener el rol del perfil:", error.message);
                return 'user';
            }

            const role = data.role?.toLowerCase().trim();

            if (role === 'administrador') {
                return 'administrador';
            }

            return 'user';

        } catch (e) {
            console.error("Excepción en getUserRole:", e);
            return 'user';
        }
    }

    public async softDeleteIngrediente(id: string, isDeleted: boolean): Promise<void> {
        const {error} = await this.supabase
            .from('ingredientes')
            .update({is_deleted: isDeleted})
            .eq('ing_id', id);

        if (error) throw error;
    }

    public async getUnidadesMedida(): Promise<UnidadMedida[]> {
        const {data, error} = await this.supabase
            .from('unidad_medida')
            .select('unmed_id, unmed_nombre')
            .order('unmed_nombre', {ascending: true});

        if (error) {
            console.error("Error al obtener unidades de medida:", error.message);
            throw new Error('Error al cargar las unidades de medida.');
        }
        return data as UnidadMedida[];
    }

    public async getIngredienteById(id: string): Promise<Ingrediente> {
        const {data, error} = await this.supabase
            .from('ingredientes')
            .select(`
          ing_id,
          ing_nombre,
          ing_precio,
          unmed_id,
          is_deleted,
          ing_cantidad_base,
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

        const unidadMedidaObjeto = data.unidad_medida as unknown as { unmed_nombre: string } | null;

        const nombreUnidad = unidadMedidaObjeto
            ? unidadMedidaObjeto.unmed_nombre
            : 'N/A';


        const ingrediente: Ingrediente = {
            ing_id: data.ing_id,
            ing_nombre: data.ing_nombre,
            ing_precio: data.ing_precio,
            is_deleted: data.is_deleted,
            ing_cantidad_base: data.ing_cantidad_base,

            unmed_nombre: nombreUnidad,
            unidad_medida: unidadMedidaObjeto,

            unmed_id: data.unmed_id, // Asumimos que es number
        };

        return ingrediente;
    }

    public async addIngrediente(data: Partial<Ingrediente>): Promise<void> {

        const {unmed_nombre, ...ingredienteData} = data;

        const {error} = await this.supabase
            .from('ingredientes')
            .insert([ingredienteData]);

        if (error) {
            console.error("Error al agregar ingrediente:", error.message);
            throw new Error('Error al agregar el ingrediente. Verifique políticas RLS de INSERT.');
        }
    }

    public async updateIngrediente(id: string, data: Partial<Ingrediente>): Promise<void> {

        const {unmed_nombre, ...ingredienteData} = data;

        const {error} = await this.supabase
            .from('ingredientes')
            .update(ingredienteData)
            .eq('ing_id', id);

        if (error) {
            console.error("Error al actualizar ingrediente:", error.message);
            throw new Error('Error al actualizar el ingrediente. Verifique políticas RLS de UPDATE.');
        }
    }

    public async createCotizacion(data: CotizacionData) {

        const { detalles, ...cotizacionCabecera } = data;

        const { data: cotizacionData, error: cotizacionError } = await this.supabase
            .from('cotizacion')
            .insert(cotizacionCabecera as CotizacionInsert)
            .select('cot_id')
            .single();

        if (cotizacionError) {
            console.error('Error al crear cabecera de cotización:', cotizacionError);
            return { data: null, error: cotizacionError };
        }

        const newCotId = (cotizacionData as Cotizacion).cot_id;

        if (detalles && detalles.length > 0 && newCotId) {

            const detallesToInsert = detalles.map(d => ({
                cot_id: newCotId,
                ing_id: d.ing_id,
                cantidad_usada: d.cantidad_usada,
                precio_unitario_fijo: d.precio_unitario_fijo,
            }));

            const { error: detalleError } = await this.supabase
                .from('cotizacion_detalle')
                .insert(detallesToInsert);

            if (detalleError) {
                console.error('Error al insertar detalles de cotización:', detalleError);
                return { data: null, error: detalleError };
            }
        }
        return { data: { ...data, cot_id: newCotId }, error: null };
    }

    public async convertirAPedido(data: {
        nombre: string;
        apellido: string;
        instagram: string;
        telefono: string;
        fechaEntrega: string;
        precio: number;
        cotId: string;
    }) {

        const newClientId = crypto.randomUUID();
        const newPedidoId = crypto.randomUUID();

        const clientePayload = {
            cli_id: newClientId,
            cli_nombre: data.nombre,
            cli_apellido: data.apellido,
            cli_instagram: data.instagram,
            cli_telefono: data.telefono
        };

        const isOnline = await this.isOnline();

        if (isOnline) {
            try {

                const { error: clientError } = await this.supabase.from('cliente').insert(clientePayload);
                if (clientError) throw clientError;

                const { data: estado } = await this.supabase
                    .from('estado_pedido')
                    .select('est_id')
                    .eq('est_nombre', 'PENDIENTE')
                    .single();

                const pedidoPayload = {
                    ped_id: newPedidoId,
                    cli_id: newClientId,
                    cot_id: data.cotId,
                    ped_fecha_entrega: data.fechaEntrega,
                    ped_precio: data.precio,
                    est_id: estado?.est_id
                };

                const { data: pedido, error: pedidoError } = await this.supabase
                    .from('pedido')
                    .insert(pedidoPayload)
                    .select()
                    .single();

                if (pedidoError) throw pedidoError;

                return { data: pedido, error: null };

            } catch (error: any) {
                console.warn('Fallo guardado online, reintentando via Delta Offline...', error.message);
            }
        }

        //3cf10b55-cda6-4d8d-947e-7d21f69343f9

        //6fa7b884-32f7-4f46-98be-6065d3d921ce
        //aba57b28-3414-429c-b524-ffd1aecfde72

        try {

            await this.sqliteService.insertClienteDelta(clientePayload);

            const pedidoOfflinePayload = {
                ped_id: newPedidoId,
                cli_id: newClientId,
                cot_id: data.cotId,
                ped_fecha_entrega: data.fechaEntrega,
                ped_precio: data.precio,
                est_id: null
            };

            await this.sqliteService.insertPedidoDelta('INSERT', pedidoOfflinePayload);

            console.log('SQLITE: Pedido y Cliente guardados en tablas Delta correctamente.');
            return { data: pedidoOfflinePayload, error: null };

        } catch (e) {
            console.error('ERROR CRÍTICO: No se pudo guardar ni en nube ni en local', e);
            return { data: null, error: e };
        }
    }

    async getClientes() {
        const {data, error} = await this.supabase
            .from('cliente')
            .select('cli_id, cli_nombre, cli_apellido, cli_telefono, cli_instagram')
            .order('cli_nombre', {ascending: true});

        if (error) {
            console.error('Error fetching clientes:', error);
            return {data: [], error};
        }
        return {data, error};
    }

  async createCliente(cliente: any) { // Usamos 'any' si no tienes la interfaz DB['Tables']['cliente']['Insert']
    const { data, error } = await this.supabase
      .from('cliente')
      .insert(cliente)
      .select()
      .single();

    return { data, error };
  }

    public async saveCliente(clienteData: any) {
        const { data, error } = await this.supabase
            .from('cliente')
            .upsert(clienteData)
            .select('*')
            .single();

        return { data, error };
    }

    public async searchClientes(searchTerm: string) {
        const { data, error } = await this.supabase
            .from('cliente')
            .select('*')
            .is('deleted_at', null)
            .or(`nombre.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            .order('nombre', { ascending: true });

        return { data, error };
    }

    public async softDeleteCliente(cliId: string) {
        const { data, error } = await this.supabase
            .from('cliente')
            .update({ deleted_at: new Date().toISOString() })
            .eq('cli_id', cliId);

        return { data, error };
    }

    public get supabaseClient(): SupabaseClient {
        return this.supabase;
    }

    public async getCotizacionDetailsByCotId(cotId: string | number): Promise<CotizacionDetalleExtendida[]> {

        const { data, error } = await this.supabase
            .from('cotizacion_detalle')
            .select(`
        cantidad_usada,
        precio_unitario_fijo,
        ingredientes ( ing_nombre, unidad_medida ( unmed_nombre ) ) 
    `)
            .eq('cot_id', cotId);

        if (error) {
            console.error("Error al obtener detalles de cotización:", error);
            throw error;
        }

        if (!data || data.length === 0) {
            return [];
        }

        const mappedData: CotizacionDetalleExtendida[] = data.map((detail: any) => {

            const ingredienteCrudo = detail.ingredientes;

            let ingredienteAdaptado: CotizacionDetalleExtendida['ingredientes'] = null;

            if (ingredienteCrudo) {

                const unidadMedidaAdaptada = ingredienteCrudo.unidad_medida;

                ingredienteAdaptado = {
                    ing_nombre: ingredienteCrudo.ing_nombre,
                    unidad_medida: unidadMedidaAdaptada
                };
            }

            return {
                cantidad_usada: detail.cantidad_usada,
                precio_unitario_fijo: detail.precio_unitario_fijo,
                ingredientes: ingredienteAdaptado
            } as CotizacionDetalleExtendida;
        });

        return mappedData;
    }

    public async getAllClientesForSync(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('cliente')
            .select('*')
            .order('cli_nombre', { ascending: true });

        if (error) {
            console.error('Error Sync Down clientes:', error);
            throw error;
        }
        return data || [];
    }

    public async getAllCotizacionesForSync(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('cotizacion')
            .select(`
                *,
                cotizacion_detalle (*)
            `)
            .order('cot_fecha', { ascending: false });

        if (error) {
            console.error('Error Sync Down cotizaciones:', error);
            throw error;
        }
        return data || [];
    }

    public async getAllPedidosForSync(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('pedido')
            .select(`
                *,
                estado_pedido(est_nombre),
                cliente!inner(cli_nombre, cli_apellido)
            `)
            .order('ped_fecha_entrega', { ascending: false });

        if (error) {
            console.error('Error Sync Down pedidos:', error);
            throw error;
        }
        return data || [];
    }

    public async getAllEstadosPedidoForSync(): Promise<any[]> {
        console.log('SUPABASE: Obteniendo todos los estados de pedido...');
        const { data, error } = await this.supabase
            .from('estado_pedido')
            .select('*');

        if (error) {
            console.error('Error al obtener estados de pedido:', error);
            throw error;
        }
        return data || [];
    }

    public async handleClientDelta(action: string, clientPayload: any): Promise<void> {
        console.log(`SUPABASE: Procesando Delta Cliente: ${action}`);
        const table = 'cliente';

        if (action === 'INSERT' || action === 'UPDATE') {
            const { error } = await this.supabase
                .from(table)
                .upsert(clientPayload)
                .select();

            if (error) throw error;

        } else if (action === 'DELETE') {
            const { error } = await this.supabase
                .from(table)
                .update({ deleted_at: new Date().toISOString() })
                .eq('cli_id', clientPayload.cli_id); // Usa el ID del payload

            if (error) throw error;
        }
    }

    public async handleCotizacionDelta(action: string, cotizacionPayload: any): Promise<void> {
        console.log(`SUPABASE: Procesando Delta Cotización: ${action}`);

        const { cotizacion_detalle, ...cabecera } = cotizacionPayload;

        const { error: cabeceraError } = await this.supabase
            .from('cotizacion')
            .upsert(cabecera); // Upsert basado en cot_id

        if (cabeceraError) throw cabeceraError;

        if (cotizacion_detalle && cotizacion_detalle.length > 0) {

            const { error: detalleError } = await this.supabase
                .from('cotizacion_detalle')
                .upsert(cotizacion_detalle, { onConflict: 'cot_id, ing_id' });

            if (detalleError) throw detalleError;
        }
    }

    public async handlePedidoDelta(action: string, pedidoPayload: any): Promise<void> {
        console.log(`SUPABASE: Procesando Delta Pedido: ${action}`);

        if (action === 'INSERT' || action === 'UPDATE') {
            const { error } = await this.supabase
                .from('pedido')
                .upsert(pedidoPayload);

            if (error) throw error;
        }
    }
}
