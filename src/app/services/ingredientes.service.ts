import { Injectable, inject } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { SupabaseService } from './supabase.service';
import { Ingrediente, UnidadMedida } from '../models/database.types';
import { Platform } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class IngredientesService {

    private sqliteService = inject(SqliteService);
    private supabaseService = inject(SupabaseService);
    private platform = inject(Platform);

    private isNative: boolean;

    constructor() {
        this.isNative = this.platform.is('android') || this.platform.is('ios');
        console.log(`[IngredientesService] Entorno Nativo detectado: ${this.isNative ? 'SÍ (Usando SQLite)' : 'NO (Usando Supabase en Web)'}`);

        this.isNative = this.platform.is('capacitor') || this.platform.is('cordova');
    }

    public async getIngredientes(searchText?: string, forceSync: boolean = false): Promise<Ingrediente[]> {

        if (!forceSync && this.isNative && this.sqliteService.isSQLiteActive) {
            try {
                const ingredientesLocal = await this.sqliteService.getIngredientes(searchText);

                if (ingredientesLocal && ingredientesLocal.length > 0) {
                    console.log(`[IngredientesService] ✅ Leyendo ${ingredientesLocal.length} ingredientes desde SQLite.`);
                    return ingredientesLocal;
                }
            } catch (error) {
                console.error("[IngredientesService] Error crítico de SQLite, recurriendo a Supabase:", error);
            }
        }

        try {
            const ingredientesRemotos = await this.supabaseService.getIngredientes(searchText);
            console.log(`[IngredientesService] 🌐 Leyendo ${ingredientesRemotos.length} ingredientes desde Supabase (Web/Sync).`);

            if (this.isNative && this.sqliteService.isSQLiteActive) {

                const unidadesRemotas = await this.supabaseService.getUnidadesMedida();

                console.log(`[IngredientesService] 💾 Caché SQLite actualizado con datos remotos.`);
            }

            return ingredientesRemotos;

        } catch (error) {
            console.error("[IngredientesService] Error al obtener ingredientes de Supabase:", error);
            return [];
        }
    }

    public async getUnidadesMedida(): Promise<UnidadMedida[]> {
        if (this.sqliteService.isSQLiteActive) {
            try {
                const unidadesLocal = await this.sqliteService.getUnidadesMedida();

                if (unidadesLocal.length > 0) {
                    console.log(`[IngredientesService] ✅ Leyendo ${unidadesLocal.length} unidades desde SQLite.`);
                    return unidadesLocal;
                }

            } catch (error) {
                console.error("[IngredientesService] Error al leer unidades de SQLite:", error);

            }
        }

        try {
            const unidadesRemotas = await this.supabaseService.getUnidadesMedida();
            console.log("[IngredientesService] 🌐 Leyendo unidades desde Supabase.");
            return unidadesRemotas;
        } catch (error) {
            console.error("[IngredientesService] Error al obtener unidades de Supabase:", error);
            return [];
        }
    }
}