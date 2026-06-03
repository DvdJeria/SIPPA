export interface UnidadMedida {
    unmed_id: string;
    unmed_nombre: string;
}

export interface Ingrediente {
    ing_id?: string;
    ing_nombre: string;
    ing_precio: number;
    unmed_id: string;
    is_deleted: boolean;
    ing_cantidad_base: number;
    unidad_medida?: { unmed_nombre: string } | null;
    unmed_nombre?: string;
}

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

export interface Cotizacion {
    cot_id?: string;
    cot_fecha?: string;
    cot_total: number;
    cot_nombre: string | null;
}

export interface Pedido {
    ped_id?: string;
    cot_id: string | null;
    cli_id: string;
    ped_fecha_entrega: string;
    est_id: string;
    ped_precio: number;
    estado_pedido?: { est_nombre: string } | null;
}

export interface EstadoPedido {
    est_id: string;
    est_nombre: string;
}

export interface CotizacionDetalleInsert {
    ing_id: string;
    cantidad_usada: number;
    precio_unitario_fijo: number;
}

export interface CotizacionData {
    cot_total: number;
    cot_nombre: string | null;
    detalles: CotizacionDetalleInsert[];
}

export type UserRole = 'administrador' | 'user';

export type ClienteInsert = Omit<Cliente, 'cli_id' | 'created_at' | 'updated_at' | 'deleted_at'>;

export type CotizacionInsert = Omit<Cotizacion, 'cot_id' | 'cot_fecha'>;

export interface PedidoFront {
    id: string;
    cotId: string | null;
    est_id: string;
    ped_fecha_creacion: string;
    fechaEntrega: string;
    precio: number;

    estado: 'pendiente' | 'entregado' | 'cancelado' | 'desconocido' | string;


    clienteId: string;
    cli_nombre: string;
    cli_apellido: string;
    cli_telefono: string | null;
    cli_instagram: string | null;

    clienteNombre: string;
    clienteApellido: string;
    clienteTelefono: string | null;
    clienteInstagram: string | null;

    descripcion: string | null;
    clienteDireccion: string | null;
}
export interface CotizacionDetalleExtendida {
    cantidad_usada: number;
    ingredientes: {
        ing_nombre: string;
        unidad_medida: {
            unmed_nombre: string;
        } | null;
    } | null;
}