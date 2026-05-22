export interface OrdenesLiquidacionInterface{
    numeroOPPakingList: string
    prodCutSheetID:string
    vendAccount:string
    purchId:string 
    tieneDiarioRecepcion : number
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
        recibido: number,
        prodStatus: number ,
        cortado: number,
        cumpleBOM: number,
}

export interface BuscarVendPackingSlipJourInterface{
    purchId: string,
    packingSlipId: string
}