export interface ControlCajaEtiquetadointerface {
    id: number,
    boxNum: string,
    employee: string,
    initDate: Date,
    finalDate: Date
}
export interface ControlCajaEtiquetadoFiltro {
    pedido: string,
    ruta: string,
    boxNum: string,
    lote: string,
    empleado: string,
    page: number,
    size: number
}
export interface ControlCajasEtiquetadoDetalleInterface {
    pedido: string,
    ruta: string,
    codigoCaja: string,
    numeroCaja: string,
    unidades: number,
    bfplineid: string,
    temporada: string,
    inicio: Date,
    fin: Date,
    tiempo: Date,
    empleado: string
}
