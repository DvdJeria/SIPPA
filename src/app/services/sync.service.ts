// src/app/services/sync.service.ts - CÓDIGO FINAL CORREGIDO

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SqliteService } from './sqlite.service';
import { Network } from '@capacitor/network';
import { PedidosService } from './pedidos.service';
import { ClientesService } from './clientes.service';
import { CotizacionService } from './cotizacion.service';

@Injectable({
    providedIn: 'root'
})
export class SyncService {

    private supabaseService = inject(SupabaseService);
    private sqliteService = inject(SqliteService);
    // Aunque no se usan directamente en esta versión final, mantenemos las inyecciones
    // por si los servicios de dominio necesitan ser usados en el futuro.
    private pedidosService = inject(PedidosService);
    private clientesService = inject(ClientesService);
    private cotizacionService = inject(CotizacionService);

    // Bandera para evitar ejecuciones simultáneas de la cola de sync
    private isSyncing = false;

    constructor() {
        Network.addListener('networkStatusChange', (status) => {
            if (status.connected && !this.isSyncing) {
                console.log("Conexión restaurada. Iniciando Sync Up de Deltas.");
                // Al restaurar la conexión, solo subimos los cambios pendientes.
                this.syncUp();
            }
        });
    }



    /* -------------------------------------------------------------
       SYNC DOWN: DESCARGA TOTAL (BORRADO Y REINSERCIÓN)
       ------------------------------------------------------------- */

    /**
     * Realiza la descarga completa (Full Sync Down) de todas las tablas
     * desde Supabase hacia la base de datos local (SQLite).
     */
    private async syncAllData(internalCall = false): Promise<void> {
        // Solo verificamos si no es una llamada interna (para evitar doble chequeo)
        if (!internalCall && (this.isSyncing || !this.sqliteService.isSQLiteActive)) {
            console.warn('SYNC: Ya está sincronizando o SQLite no está activo.');
            return;
        }

        const isOnline = await this.supabaseService.isOnline();
        if (!isOnline) {
            console.log("Offline. No se puede realizar el Sync Down.");
            return;
        }

        // Si no es llamada interna, ponemos la bandera de sincronización.
        if (!internalCall) this.isSyncing = true;
        console.log('SYNC: Iniciando Full Sync Down desde Supabase...');

        try {
            // A. Descarga de Datos de Referencia (Base)
            const unidades = await this.supabaseService.getUnidadesMedida();
            const ingredientes = await this.supabaseService.getIngredientes();
            const estados = await this.supabaseService.getAllEstadosPedidoForSync();

            // B. Descarga de Datos Transaccionales
            const clientes = await this.supabaseService.getAllClientesForSync();
            const cotizaciones = await this.supabaseService.getAllCotizacionesForSync();
            const pedidos = await this.supabaseService.getAllPedidosForSync();

            // C. Guardar en SQLite: Vaciado completo y reinserción
            // ⚠️ CRÍTICO: Este método DEBE usar una transacción SQLite interna.
            await this.sqliteService.saveFullSyncDown(
                ingredientes,
                unidades,
                clientes,
                cotizaciones,
                pedidos,
                estados
            );

            console.log(`SYNC DOWN exitoso. Clientes: ${clientes.length}, Pedidos: ${pedidos.length}, etc. guardados localmente.`);

        } catch (error) {
            console.error('SYNC ERROR en syncAllData:', error instanceof Error ? error.message : JSON.stringify(error));
            // Si hay error y no es llamada interna, lanzamos la excepción y limpiamos la bandera.
            if (!internalCall) this.isSyncing = false;
            throw new Error('Fallo la sincronización de descarga.');
        } finally {
            // Solo limpiamos la bandera si NO es una llamada interna
            if (!internalCall) this.isSyncing = false;
        }
    }

    /* -------------------------------------------------------------
       SYNC UP: SUBIDA DE DELTAS PENDIENTES
       ------------------------------------------------------------- */

    /**
     * Procesa la cola de Deltas (registros INSERT/UPDATE/DELETE hechos offline)
     * y los envía a Supabase.
     */
    private async syncUp(internalCall = false): Promise<void> {
        // Solo verificamos si no es una llamada interna
        if (!internalCall && (this.isSyncing || !this.sqliteService.isSQLiteActive)) return;

        const isOnline = await this.supabaseService.isOnline();
        if (!isOnline) return;

        if (!internalCall) this.isSyncing = true;
        console.log('SYNC: Iniciando Sync Up de Deltas locales...');

        try {
            const deltas = await this.sqliteService.getSyncDeltas();

            // Función auxiliar para procesar Deltas por categoría
            const processDeltas = async (deltaArray: any[], handler: (action: string, payload: any) => Promise<any>, tableName: string) => {
                for (const delta of deltaArray) {
                    try {
                        // CRÍTICO: Asegurar que el payload sea un objeto
                        const payloadObj = typeof delta.payload === 'string' ? JSON.parse(delta.payload) : delta.payload;

                        await handler(delta.action, payloadObj);
                        await this.sqliteService.deleteSyncDelta(delta.delta_id, tableName);
                    } catch (error) {
                        // Si hay un error, dejamos el Delta para reintentar más tarde.
                        console.error(`Error al subir Delta ID ${delta.delta_id} de ${tableName}. Se reintentará.`, error);
                    }
                }
            };

            // 1. Subir Clientes
            await processDeltas(
                deltas.clientes,
                (action, payload) => this.supabaseService.handleClientDelta(action, payload),
                'delta_clientes'
            );

            // 2. Subir Cotizaciones
            await processDeltas(
                deltas.cotizaciones,
                (action, payload) => this.supabaseService.handleCotizacionDelta(action, payload),
                'delta_cotizaciones'
            );

            // 3. Subir Pedidos
            await processDeltas(
                deltas.pedidos,
                (action, payload) => this.supabaseService.handlePedidoDelta(action, payload),
                'delta_pedidos'
            );

            console.log('SYNC UP completado y deltas locales procesados.');
        } catch (error) {
            console.error('SYNC ERROR en syncUp:', error);
            throw new Error('Fallo la sincronización de subida.');
        } finally {
            if (!internalCall) this.isSyncing = false;
        }
    }

    public async fullSync(): Promise<void> {
        if (this.isSyncing || !this.sqliteService.isSQLiteActive) {
            console.warn('SYNC: Ya está sincronizando o SQLite no está activo.');
            return;
        }

        const isOnline = await this.supabaseService.isOnline();
        if (!isOnline) {
            console.log("Offline. No se puede iniciar la sincronización completa.");
            return;
        }

        this.isSyncing = true;
        console.log('SYNC: Iniciando Full Sync (Up + Down)...');

        try {
            // A. ⬆️ Paso 1: Subir Deltas locales (Sync Up)
            await this.syncUp(true);

            // B. ⬇️ Paso 2: Descargar todo (Full Sync Down)
            await this.syncAllData(true);

            console.log('SYNC: Sincronización Completa exitosa.');

        } catch (error) {
            console.error('SYNC: Falló la Sincronización Completa.', error);
        } finally {
            this.isSyncing = false;
        }
    }
}