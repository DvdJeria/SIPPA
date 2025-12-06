export interface Ingrediente {
  ing_id?: string;
  ing_nombre: string;
  ing_precio: number;
  unmed_id: number;
  is_deleted: boolean;
  // 🚨 NO DEBE ESTAR: ing_estado: boolean;

  // Propiedades opcionales para los JOINs:
  unidad_medida?: { unmed_nombre: string } | null;
  unmed_nombre?: string;
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

interface SelectedIngredient {
  ing_id: string | null;  // ID del ingrediente seleccionado
  quantity: number;       // Cantidad ingresada por el cliente (gramos, cc, o unidades)
  unitPrice: number;      // Precio por unidad base (ing_precio de la DB)
  unitName: string;       // Nombre de la unidad (ej: 'unidad', 'gramos', 'cc')
  subtotal: number;       // unitPrice * factor de conversión * quantity
}

export interface IngredienteJoin extends Ingrediente {
  // Si usas el JOIN anidado:
  unidad_medida: { unmed_nombre: string } | null;
  // Si usas el JOIN simple que desanida unmed_nombre (MENOS COMÚN):
  // unmed_nombre?: string;
}
