import { SupabaseService } from './supabase.service';
import { Injectable, inject } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { Network } from '@capacitor/network';

@Injectable({
    providedIn: 'root'
})
export class SyncService {

    private supabaseService = inject(SupabaseService);
    private sqliteService = inject(SqliteService);
    private isSyncing = false;

    constructor() {
        Network.addListener('networkStatusChange', (status) => {
            if (status.connected && !this.isSyncing) {
                console.log("Conexión restaurada. Iniciando Sync Up de Deltas.");
                this.syncUp();
            }
        });
    }

    private async syncAllData(internalCall = false): Promise<void> {

        if (!internalCall && (this.isSyncing || !this.sqliteService.isSQLiteActive)) {
            console.warn('SYNC: Ya está sincronizando o SQLite no está activo.');
            return;
        }

        const isOnline = await this.supabaseService.isOnline();
        if (!isOnline) {
            console.log("Offline. No se puede realizar el Sync Down.");
            return;
        }

        if (!internalCall) this.isSyncing = true;
        console.log('SYNC: Iniciando Full Sync Down desde Supabase...');

        try {

            const unidades = await this.supabaseService.getUnidadesMedida();
            const ingredientes = await this.supabaseService.getIngredientes();
            const estados = await this.supabaseService.getAllEstadosPedidoForSync();

            const clientes = await this.supabaseService.getAllClientesForSync();
            const cotizaciones = await this.supabaseService.getAllCotizacionesForSync();
            const pedidos = await this.supabaseService.getAllPedidosForSync();

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

            if (!internalCall) this.isSyncing = false;
            throw new Error('Fallo la sincronización de descarga.');
        } finally {

            if (!internalCall) this.isSyncing = false;
        }
    }

    private async syncUp(internalCall = false): Promise<void> {

        if (!internalCall && (this.isSyncing || !this.sqliteService.isSQLiteActive)) return;

        const isOnline = await this.supabaseService.isOnline();
        if (!isOnline) return;

        if (!internalCall) this.isSyncing = true;
        console.log('SYNC: Iniciando Sync Up de Deltas locales...');

        try {
            const deltas = await this.sqliteService.getSyncDeltas();

            const processDeltas = async (deltaArray: any[], handler: (action: string, payload: any) => Promise<any>, tableName: string) => {
                for (const delta of deltaArray) {
                    try {

                        const payloadObj = typeof delta.payload === 'string' ? JSON.parse(delta.payload) : delta.payload;

                        await handler(delta.action, payloadObj);
                        await this.sqliteService.deleteSyncDelta(delta.delta_id, tableName);
                    } catch (error) {

                        console.error(`Error al subir Delta ID ${delta.delta_id} de ${tableName}. Se reintentará.`, error);
                    }
                }
            };

            await processDeltas(
                deltas.clientes,
                (action, payload) => this.supabaseService.handleClientDelta(action, payload),
                'delta_clientes'
            );

            await processDeltas(
                deltas.cotizaciones,
                (action, payload) => this.supabaseService.handleCotizacionDelta(action, payload),
                'delta_cotizaciones'
            );

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

            await this.syncUp(true);

            await this.syncAllData(true);

            console.log('SYNC: Sincronización Completa exitosa.');

        } catch (error) {
            console.error('SYNC: Falló la Sincronización Completa.', error);
        } finally {
            this.isSyncing = false;
        }
    }
}