export interface LineasDiariointerface{
    itembarcode:string,
    itemid: string,
    inventcolorid: string,
    inventsizeid: string,
    imboxcode:string,
    qty : number
}

export interface GrupoLineasDiariointerface{
    key: string,
    items: LineasDiariointerface[]
}

export interface CajasLineasDiario{
    key: string,
    show: boolean,
    items: GrupoLineasDiariointerface[]
}