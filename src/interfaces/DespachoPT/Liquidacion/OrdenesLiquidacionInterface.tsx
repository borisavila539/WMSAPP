export interface OrdenesLiquidacionInterface{
    prodCutSheetID:string
}

export interface DetalleOrdenLiquidacionInterfacegroup{
    title: string,
    data: DetalleOrdenLiquidacionInterface[]
}

export interface DetalleOrdenLiquidacionInterface{    
        numero: number,
        secuencia: number,
        prodID: string,
        prodCutSheetID: string,
        size: number,
        enviado: number,
        recibido: number      
}