export interface ConsultaOPDetalleInterface {
    prodCutSheetID: string,
    prodID: string,
    size: string,
    color: string,
    cortado: number,
    receive: number,
    segundas: number,
    terceras: number,
    cajas: number,
    despachoID: number
}

export interface GrupoConsultaOPDetalleInterface {
    key: string,
    items: ConsultaOPDetalleInterface[]
}

export interface ConsultaOPOrdenesInterface {
    prodCutSheetID: string,
    despachoID: number
}

export interface ConsultaOPDetalleCajasInterface {
    size: string,
    box: number,
    qty: number
}