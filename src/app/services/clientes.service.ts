// src/app/services/clientes.service.ts

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SqliteService } from './sqlite.service';
import { ClienteInsert, Cliente } from '../models/database.types'; // Asume que este tipo existe

@Injectable({
    providedIn: 'root'
})
export class ClientesService {
    private supabaseService = inject(SupabaseService);
    private sqliteService = inject(SqliteService);

    constructor() {}

    /**
     * Crea un nuevo cliente. Usa Supabase si está online, o Delta si está offline.
     * @param clientInfo Datos del cliente a insertar.
     * @returns Promesa que resuelve al ID del cliente (Supabase ID o ID temporal local).
     */
    async createCliente(clientInfo: ClienteInsert): Promise<string> {
        const isOnline = await this.supabaseService.isOnline();

        if (isOnline) {
            console.log("CLIENTE: Creando cliente ONLINE en Supabase.");
            return this.createClienteOnline(clientInfo);
        } else {
            console.warn("CLIENTE: Creando cliente OFFLINE en Delta (Requiere sync).");

            // 1. Registrar en Delta
            await this.sqliteService.insertClienteDelta(clientInfo);

            // 2. Retornamos un ID temporal local que será reemplazado al sincronizar.
            // Esto evita errores de clave foránea temporalmente si se usa en un Pedido.
            return 'LOCAL-' + Date.now();
        }
    }

    /**
     * Lógica pura de Supabase para crear un cliente (usada por createCliente y SyncService).
     * @param clientInfo Datos del cliente a insertar.
     * @returns Promesa que resuelve al ID del cliente creado.
     */
    public async createClienteOnline(clientInfo: ClienteInsert): Promise<string> {
        const { data: newClient, error: clientError } = await this.supabaseService.supabaseClient
            .from('cliente')
            .insert(clientInfo)
            .select('cli_id')
            .single();

        if (clientError || !newClient) {
            console.error('Error al crear cliente ONLINE:', clientError);
            throw new Error('Error al crear el cliente en Supabase.');
        }

        return (newClient as any).cli_id;
    }

    public async getClientes(): Promise<Cliente[]> {
        const isOnline = await this.supabaseService.isOnline();

        if (isOnline) {
            console.log("CLIENTE: Obteniendo clientes ONLINE (Supabase).");
            return this.getClientesOnline();
        } else {
            console.log("CLIENTE: Obteniendo clientes OFFLINE (SQLite).");
            return this.getClientesLocal();
        }
    }

    /**
     * Obtiene la lista de clientes desde Supabase (usado en modo Online).
     */
    private async getClientesOnline(): Promise<Cliente[]> {
        // Reutilizamos el método de SyncDown que ya existe en SupabaseService
        const clientesRaw = await this.supabaseService.getAllClientesForSync();

        // Asumimos que getAllClientesForSync devuelve una estructura compatible con Cliente[]
        return clientesRaw as Cliente[];
    }

    /**
     * Obtiene la lista de clientes desde SQLite (usado en modo Offline).
     */
    private async getClientesLocal(): Promise<Cliente[]> {
        // Llamada directa al método de lectura local implementado en SqliteService
        return this.sqliteService.getClientesLocal();
    }
}