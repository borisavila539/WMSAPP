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
