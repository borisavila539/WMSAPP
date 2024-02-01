export interface LineasDiariointerface{
    itemid: string,
    inventcolorid: string,
    inventsizeid: string,
    qty : number
}

export interface GrupoLineasDiariointerface{
    key: string,
    items: LineasDiariointerface[]
}