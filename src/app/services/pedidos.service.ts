// src/app/services/pedidos.service.ts - CÓDIGO FINAL CON LÓGICA DE CONMUTACIÓN DE LECTURA

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SqliteService } from './sqlite.service';


import {
    Pedido,
    Cliente,
    PedidoFront,
    ClienteInsert
} from '../models/database.types';

export { PedidoFront, ClienteInsert };

@Injectable({
    providedIn: 'root'
})
export class PedidosService {
    // Asumimos que SupabaseService tiene un getter 'supabaseClient'
    private supabase = inject(SupabaseService);
    private sqliteService = inject(SqliteService);

    // ---------------------------------------------
    // 🔑 MÉTODOS DE LECTURA (LISTAR) - CONMUTACIÓN
    // ---------------------------------------------

    /**
     * Obtiene todos los pedidos. Conmuta entre fuente online (Supabase) y local (SQLite).
     * Este es el método que debería usar el componente de UI.
     */
    async listAll(): Promise<PedidoFront[]> {
        const isOnline = await this.supabase.isOnline();

        if (isOnline) {
            console.log("PEDIDOS: Obteniendo pedidos ONLINE (Supabase).");
            return this.listAllOnline();
        } else {
            console.log("PEDIDOS: Obteniendo pedidos OFFLINE (SQLite).");
            // Nota: La lectura offline es más simple y no tiene JOINs complejos prehechos.
            return this.listAllLocal();
        }
    }


    /**
     * Obtiene todos los pedidos desde Supabase (SU LÓGICA ORIGINAL)
     * Retorna la interfaz PedidoFront que necesita el calendario.
     */
    private async listAllOnline(): Promise<PedidoFront[]> {
        const { data: pedidosData, error } = await this.supabase.supabaseClient
            .from('pedido')
            .select('ped_id, cot_id, ped_fecha_entrega, ped_precio, est_id, cli_id')
            .order('ped_fecha_entrega', { ascending: true });

        console.log("PEDIDOS DATA:", pedidosData, "ERROR:", error);

        if (error) {
            console.error('Error al listar pedidos ONLINE:', error);
            throw new Error('No se pudo cargar la lista de pedidos.');
        }

        const pedidosFront: PedidoFront[] = [];

        for (const p of pedidosData as any[]) {
            // 1. Buscar el estado por est_id
            const { data: estadoData } = await this.supabase.supabaseClient
                .from('estado_pedido')
                .select('est_nombre')
                .eq('est_id', p.est_id)
                .single();

            // 2. Buscar el cliente por cli_id
            const { data: clienteData } = await this.supabase.supabaseClient
                .from('cliente')
                .select('cli_id, cli_nombre, cli_apellido, cli_telefono, cli_instagram')
                .eq('cli_id', p.cli_id)
                .single();

            pedidosFront.push({
                // === Pedido base ===
                id: p.ped_id,
                cotId: p.cot_id,
                fechaEntrega: p.ped_fecha_entrega,
                precio: p.ped_precio,
                est_id: p.est_id,
                ped_fecha_creacion: new Date().toISOString(),

                // === Estado ===
                estado: estadoData?.est_nombre?.toLowerCase() || 'desconocido',

                // === Cliente ===
                clienteId: clienteData?.cli_id ?? '',
                cli_nombre: clienteData?.cli_nombre || '',
                cli_apellido: clienteData?.cli_apellido || '',
                cli_telefono: clienteData?.cli_telefono || null,
                cli_instagram: clienteData?.cli_instagram || null,

                clienteNombre: clienteData?.cli_nombre || '',
                clienteApellido: clienteData?.cli_apellido || '',
                clienteTelefono: clienteData?.cli_telefono || null,
                clienteInstagram: clienteData?.cli_instagram || null,

                // === Campos legacy ===
                descripcion: null,
                clienteDireccion: null,
            });
        }

        return pedidosFront;
    }


    /**
     * Obtiene todos los pedidos desde SQLite (NUEVA LÓGICA OFFLINE)
     * NOTA: Este método solo obtiene la data PLANA guardada localmente,
     * y requiere más esfuerzo para "rehidratar" los nombres de cliente y estado.
     * Por ahora, solo retorna los datos planos del pedido.
     */
    // MÉTODO listAllLocal CORREGIDO
    private async listAllLocal(): Promise<PedidoFront[]> {
        // Obtenemos los pedidos planos de SQLite
        const pedidosPlano = await this.sqliteService.getPedidosLocal();

        // Mapeamos los datos planos a la interfaz PedidoFront
        return pedidosPlano.map(p => ({
            // === 1. PROPIEDADES BASE DEL PEDIDO ===
            id: p.ped_id as string, // Aseguramos que el ID es un string, si es null o undefined, el tipado de SQLiteService debe manejarlo.
            cotId: p.cot_id || null,
            fechaEntrega: p.ped_fecha_entrega,
            precio: p.ped_precio,
            est_id: p.est_id,

            // === 2. PROPIEDADES JOINED (ESTADO) ===
            // Placeholder hasta que implementemos la búsqueda local por est_id
            estado: 'pendiente',

            // === 3. PROPIEDADES JOINED (CLIENTE) ===
            clienteId: p.cli_id,
            cli_nombre: 'Cliente Local', // Placeholder
            cli_apellido: '',            // Placeholder
            cli_telefono: null,          // Placeholder
            cli_instagram: null,         // Placeholder

            // === 4. PROPIEDADES USADAS POR EL FORMULARIO / ALIASES (¡CORRECCIÓN!) ===
            // TypeScript requería que estos campos estuvieran presentes para cumplir con PedidoFront
            clienteNombre: 'Cliente Local',
            clienteApellido: '',
            clienteTelefono: null,
            clienteInstagram: null,

            // Campos Legacy
            descripcion: null,
            clienteDireccion: null,

            // Propiedad Faltante 1 (ped_fecha_creacion): Ya la tenías
            ped_fecha_creacion: new Date().toISOString(),
        }));
    }

    // ---------------------------------------------
    // 🔑 MÉTODOS DE ACCIÓN (ESTADOS/EDITAR) - SIN CAMBIOS
    // ---------------------------------------------

    // ... (El resto de los métodos: getEstadoId, cancelPedido, reactivatePedido,
    // deliverPedido, createPedido, createPedidoOnline, updatePedido, isEditable,
    // createPedidoFromCotizacion, getEstadoIdByName) ...

    /**
     * Obtiene el ID del estado por su nombre (ej: 'PENDIENTE', 'ENTREGADO').
     */
    private async getEstadoId(estadoName: 'PENDIENTE' | 'CANCELADO' | 'ENTREGADO'): Promise<string> {
        const { data, error } = await this.supabase.supabaseClient
            .from('estado_pedido')
            .select('est_id')
            .eq('est_nombre', estadoName)
            .single();

        if (error || !data) {
            throw new Error(`Estado ${estadoName} no encontrado en la DB. Asegúrate de que existe.`);
        }
        return data.est_id as string;
    }

    /**
     * Cancela un pedido (actualiza el est_id al estado CANCELADO).
     */
    async cancelPedido(pedId: string): Promise<void> {
        const isOnline = await this.supabase.isOnline();

        if (isOnline) {
            console.log(`PEDIDO: Marcar CANCELADO ID ${pedId} ONLINE.`);
            const estId = await this.getEstadoId('CANCELADO');
            const { error } = await this.supabase.supabaseClient
                .from('pedido')
                .update({ est_id: estId })
                .eq('ped_id', pedId);

            if (error) throw new Error('Error al cancelar el pedido online.');

        } else {
            console.warn(`PEDIDO: Marcar CANCELADO ID ${pedId} OFFLINE en Delta.`);
            // Acción Delta: Guardamos la acción y el ID del pedido afectado
            await this.sqliteService.insertPedidoDelta('UPDATE_ESTADO_CANCELADO', { ped_id: pedId });
        }
    }

    /**
     * Reactiva un pedido (actualiza el est_id al estado PENDIENTE).
     */
    async reactivatePedido(pedId: string): Promise<void> {
        const isOnline = await this.supabase.isOnline();

        if (isOnline) {
            console.log(`PEDIDO: Marcar PENDIENTE ID ${pedId} ONLINE.`);
            const estId = await this.getEstadoId('PENDIENTE');
            const { error } = await this.supabase.supabaseClient
                .from('pedido')
                .update({ est_id: estId })
                .eq('ped_id', pedId);

            if (error) throw new Error('Error al reactivar el pedido online.');

        } else {
            console.warn(`PEDIDO: Marcar PENDIENTE ID ${pedId} OFFLINE en Delta.`);
            // Acción Delta: Guardamos la acción y el ID del pedido afectado
            await this.sqliteService.insertPedidoDelta('UPDATE_ESTADO_PENDIENTE', { ped_id: pedId });
        }
    }

    /**
     * Marca un pedido como entregado (actualiza el est_id al estado ENTREGADO).
     */
    async deliverPedido(pedId: string): Promise<void> {
        const isOnline = await this.supabase.isOnline();
        if (isOnline) {
            console.log(`PEDIDO: Marcar ENTREGADO ID ${pedId} ONLINE.`);
            const estId = await this.getEstadoId('ENTREGADO');
            const { error } = await this.supabase.supabaseClient
                .from('pedido')
                .update({ est_id: estId })
                .eq('ped_id', pedId);
            if (error) throw new Error('Error al marcar como entregado online.');
        } else {
            console.warn(`PEDIDO: Marcar ENTREGADO ID ${pedId} OFFLINE en Delta.`);
            await this.sqliteService.insertPedidoDelta('UPDATE_ESTADO_ENTREGADO', { ped_id: pedId });
        }
    }

    // ---------------------------------------------
    // 🔑 MÉTODOS DE ESCRITURA (CREAR/ACTUALIZAR) - SIN CAMBIOS
    // ---------------------------------------------

    /**
     * Crea un nuevo cliente si no existe (simplificado) y luego crea el pedido.
     */
    async createPedido(data: PedidoFront): Promise<void> {
        const isOnline = await this.supabase.isOnline();
        const pedidoData = { // Preparamos el payload común para Supabase o Delta
            clienteNombre: data.clienteNombre,
            clienteApellido: data.clienteApellido || '',
            clienteTelefono: data.clienteTelefono,
            clienteInstagram: data.clienteInstagram,
            fechaEntrega: data.fechaEntrega,
            precio: data.precio,
            cotId: data.cotId || null, // Puede venir de una cotización o ser nuevo
        };

        if (isOnline) {
            console.log("PEDIDO: Creando pedido ONLINE en Supabase.");
            // Lógica Online: Usar la función existente (simplificada)
            await this.createPedidoOnline(pedidoData);
        } else {
            console.warn("PEDIDO: Creando pedido OFFLINE en Delta (Requiere sync).");
            // Lógica Offline: Registrar en Delta
            await this.sqliteService.insertPedidoDelta('INSERT', pedidoData);
        }
    }

    public async createPedidoOnline(data: any): Promise<void> {
        const estId = await this.getEstadoId('PENDIENTE');

        // 1. Crear el Cliente
        const clientInfo: ClienteInsert = {
            cli_nombre: data.clienteNombre,
            cli_apellido: data.clienteApellido || '',
            cli_telefono: data.clienteTelefono,
            cli_instagram: data.clienteInstagram,
        };

        const { data: newClient, error: clientError } = await this.supabase.supabaseClient
            .from('cliente')
            .insert(clientInfo)
            .select('cli_id')
            .single();

        if (clientError || !newClient) {
            console.error('Error al crear cliente:', clientError);
            throw new Error('Error al crear el cliente para el pedido.');
        }

        const cliId = (newClient as any).cli_id;

        // 2. Crear el Pedido
        const { error: orderError } = await this.supabase.supabaseClient
            .from('pedido')
            .insert({
                cli_id: cliId,
                ped_fecha_entrega: data.fechaEntrega,
                ped_precio: data.precio,
                est_id: estId,
                cot_id: data.cotId, // Usamos el cotId que viene en el payload
            });

        if (orderError) {
            throw new Error('Error al crear el pedido.');
        }
    }

    /**
     * Actualiza solo los campos del pedido (fecha y precio).
     */
    async updatePedido(pedidoId: string, updatedPedido: any): Promise<void> {
        const isOnline = await this.supabase.isOnline();
        const updatePayload = {
            ped_id: pedidoId,
            ...updatedPedido
        };

        if (isOnline) {
            console.log(`PEDIDO: Actualizando pedido ID ${pedidoId} ONLINE.`);
            const { error } = await this.supabase.supabaseClient
                .from('pedido')
                .update(updatedPedido)
                .eq('ped_id', pedidoId);

            if (error) throw new Error('Error al actualizar el pedido online.');

        } else {
            console.warn(`PEDIDO: Actualizando pedido ID ${pedidoId} OFFLINE en Delta.`);
            // Lógica Offline: Registrar en Delta. Aquí usamos 'UPDATE_GENERAL'
            await this.sqliteService.insertPedidoDelta('UPDATE_GENERAL', updatePayload);
        }
    }


    // ---------------------------------------------
    // 🔑 LÓGICA DE NEGOCIO (Usada por los Componentes) - SIN CAMBIOS
    // ---------------------------------------------

    /**
     * Verifica si el pedido es editable (más de 24 horas para la entrega).
     */
    isEditable(pedido: PedidoFront): boolean { // 🔑 Usa PedidoFront
        if (pedido.estado === 'entregado' || pedido.estado === 'cancelado') return false;

        const entrega = new Date(pedido.fechaEntrega).getTime();
        const ahora = new Date().getTime();
        const diferenciaHoras = (entrega - ahora) / (1000 * 60 * 60);

        return diferenciaHoras > 24;
    }

    async createPedidoFromCotizacion(
        cotizacionId: string,
        fechaEntrega: string,
        cotizacionTotal: number,
        clienteNombre: string,
        clienteApellido: string | null,
        clienteTelefono: string | null,
        clienteInstagram: string | null
    ): Promise<void> {
        const pedidoData: PedidoFront = {
            id: '', // Vacío para nuevo pedido
            cotId: cotizacionId,
            fechaEntrega: fechaEntrega,
            precio: cotizacionTotal,
            clienteNombre: clienteNombre,
            clienteApellido: clienteApellido || '',
            clienteTelefono: clienteTelefono,
            clienteInstagram: clienteInstagram || '',
            // Campos requeridos por PedidoFront pero no usados aquí:
            est_id: '',
            estado: 'pendiente',
            ped_fecha_creacion: new Date().toISOString(),
            clienteId: '',
            cli_nombre: clienteNombre,
            cli_apellido: clienteApellido || '',
            cli_telefono: clienteTelefono,
            cli_instagram: clienteInstagram || '',
            descripcion: null,
            clienteDireccion: null,
        };

        // 🔑 REUTILIZAMOS LA LÓGICA DE PERSISTENCIA
        await this.createPedido(pedidoData);
    }

    async getEstadoIdByName(name: string): Promise<string> {
        const { data, error } = await this.supabase.supabaseClient
            .from('estado_pedido') // Asume que esta es tu tabla de estados
            .select('id:est_id')
            .eq('est_nombre', name)
            .single();

        if (error || !data) {
            throw new Error(`No se pudo encontrar el ID del estado '${name}'.`);
        }
        return data.id;
    }
}