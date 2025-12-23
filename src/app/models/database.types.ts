// src/app/models/database.types.ts

// ***************************************************************
// TIPOS BASE DEL NEGOCIO (Relacionados a tablas de DB)
// ***************************************************************

// 1. Unidades de Medida
export interface UnidadMedida {
    unmed_id: string; // 🔑 CORREGIDO a string (UUID)
    unmed_nombre: string;
}

// 2. Ingredientes
export interface Ingrediente {
    ing_id?: string;
    ing_nombre: string;
    ing_precio: number;
    unmed_id: string; // 🔑 CORREGIDO a string (UUID)
    is_deleted: boolean;
    ing_cantidad_base: number;

    // Propiedades para el JOIN (usadas en el frontend)
    unidad_medida?: { unmed_nombre: string } | null;
    unmed_nombre?: string; // Propiedad plana para el formulario/lista
}

// 3. Cliente
export interface Cliente {
    cli_id?: string | null;
    cli_nombre: string;
    cli_apellido: string;
    cli_instagram: string | null;
    cli_telefono: string | null;
    created_at?: string;
    updated_at?: string | null;
    deleted_at?: string | null;
}

// 4. Cotización (Cabecera Maestra)
export interface Cotizacion {
    cot_id?: string;
    cot_fecha?: string;
    cot_total: number;
    cot_nombre: string | null;
}

// 5. Pedido
export interface Pedido {
    ped_id?: string;
    cot_id: string | null;
    cli_id: string;
    //ped_fecha_creacion?: string;
    ped_fecha_entrega: string;
    est_id: string;
    ped_precio: number;

    // Opcional: para usar en el frontend al hacer el JOIN
    estado_pedido?: { est_nombre: string } | null;
}

export interface EstadoPedido {
    est_id: string;
    est_nombre: string;
}


// ***************************************************************
// TIPOS DE NORMALIZACIÓN Y AUXILIARES (Para Lógica de Inserción/Formulario)
// ***************************************************************

// 1. Detalle de Cotización (Estructura para insertar en la tabla cotizacion_detalle)
export interface CotizacionDetalleInsert {
    ing_id: string;
    cantidad_usada: number;
    precio_unitario_fijo: number;
}

// 2. Estructura que se usa en el servicio para crear una cotización (Cabecera + Detalles)
export interface CotizacionData {
    cot_total: number;
    cot_nombre: string | null;
    detalles: CotizacionDetalleInsert[]; // Array de los ingredientes seleccionados
}

// 3. Roles de Usuario
export type UserRole = 'administrador' | 'user';

// 4. Tipos Omit (Para INSERT/UPDATE)

// Para Clientes (CORREGIDO el nombre de la propiedad de teléfono)
export type ClienteInsert = Omit<Cliente, 'cli_id' | 'created_at' | 'updated_at' | 'deleted_at'>;

// Para Cotización
export type CotizacionInsert = Omit<Cotizacion, 'cot_id' | 'cot_fecha'>;

// 🔑 CORRECCIÓN: Usamos nombres del frontend para mapear correctamente
// src/app/models/database.types.ts

// ... otras interfaces ...

/**
 * Interfaz usada por la capa de la UI (ej. Calendario, formularios).
 * Contiene propiedades planas del Pedido, Cliente y Estado.
 *
 * Esta interfaz es la vista "rehidratada" de los datos, ya sea que vengan de:
 * 1. Supabase (con JOINs).
 * 2. SQLite (con mapeo de IDs a nombres).
 * 3. Formulario (con datos planos).
 */
export interface PedidoFront {
    // === 1. PROPIEDADES BASE DEL PEDIDO ===
    id: string;                         // ped_id (UUID)
    cotId: string | null;               // cot_id (UUID o null)
    est_id: string;                     // ID del estado (UUID)
    ped_fecha_creacion: string;         // Fecha de creación del pedido
    fechaEntrega: string;               // ped_fecha_entrega
    precio: number;                     // ped_precio

    // === 2. PROPIEDADES JOINED (ESTADO) ===
    estado: 'pendiente' | 'entregado' | 'cancelado' | 'desconocido' | string; // Nombre del estado (ej. 'PENDIENTE')

    // === 3. PROPIEDADES JOINED (CLIENTE) ===
    clienteId: string;                  // cli_id
    cli_nombre: string;                 // Nombre del cliente
    cli_apellido: string;               // Apellido del cliente
    cli_telefono: string | null;        // Teléfono del cliente
    cli_instagram: string | null;       // Instagram del cliente

    // === 4. PROPIEDADES USADAS POR EL FORMULARIO / LEGACY ===
    // (A menudo son alias de las propiedades JOINED, pero se mantienen para compatibilidad con la UI)
    clienteNombre: string;              // Alias de cli_nombre
    clienteApellido: string;            // Alias de cli_apellido
    clienteTelefono: string | null;     // Alias de cli_telefono
    clienteInstagram: string | null;    // Alias de cli_instagram

    descripcion: string | null;         // Campo Legacy o de nota
    clienteDireccion: string | null;    // Campo Legacy o de dirección
}

// ... otras interfaces ...

export interface CotizacionDetalleExtendida {
    cantidad_usada: number;
    // 'ingredientes' es un objeto singular (relación 1:1 desde el detalle)
    ingredientes: {
        ing_nombre: string;
        // 'unidad_medida' es un objeto singular (relación 1:1 desde el ingrediente)
        unidad_medida: {
            unmed_nombre: string;
        } | null;
    } | null;
}