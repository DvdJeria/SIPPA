// src/app/models/ingrediente.ts

export interface Ingrediente {
  ing_id?: string; // UUID de Supabase
  ing_nombre: string;
  ing_precio: number;
  unmed_id: number;
  unmed_nombre?: string; // Foreign key a unidad_medida
  is_deleted: boolean; // Soft delete
}

export interface UnidadMedida {
  unmed_id: number;
  unmed_nombre: string;
}

export type UserRole = 'administrador' | 'user';

export interface Cotizacion {
  cot_id?: number;
  cot_fecha?: string; // DEFAULT now()
  cot_total: number;
  cot_detalle?: string | null;
  cli_id?: number | null;
}

export interface Cliente {
  cli_id?: number;
  cli_nombre: string;
  cli_apellido: string;
  cli_email: string;
}
