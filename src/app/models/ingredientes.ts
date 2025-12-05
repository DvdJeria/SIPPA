// src/app/models/ingrediente.ts

export interface Ingrediente {
  ing_id?: string; // UUID de Supabase
  ing_nombre: string;
  ing_precio: number;
  ing_estado: boolean;
  unmed_id: number;
  unmed_nombre?: string; // Foreign key a unidad_medida
  is_deleted: boolean; // Soft delete
}

export interface UnidadMedida {
  unmed_id: number;
  unmed_nombre: string;
}

export type UserRole = 'administrador' | 'user';
