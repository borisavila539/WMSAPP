export interface RecepcionMBInterface {
    id: number;
    lote: string;
    orden: string;
    articulo: string;
    numeroCaja: number;
    talla: number;
    cantidad: number;
    color: string;
    nombreColor: string;
    ubicacionRecepcion: string;
    fechaRecepcion: Date;
    idConsolidado: number;
}

export interface DespachoMBInterface {
    id: number,
    usuarioCreacion: string,
    fechaCreacion: Date,
    enviado: Boolean
}

export interface DespachoPicking {
    id: number,
    lote: string,
    orden: string,
    articulo: string,
    numeroCaja: number,
    talla: string,
    cantidad: number,
    color: string,
    nombreColor: string,
    ubicacionRecepcion: string,
    idConsolidado: number,
    picking: boolean
}

export interface DespachoPacking {
    id: number,
    lote: string,
    orden: string,
    articulo: string,
    numeroCaja: number,
    talla: string,
    cantidad: number,
    color: string,
    nombreColor: string,
    idConsolidado: number,
    packing: boolean,
    pallet: string
}
