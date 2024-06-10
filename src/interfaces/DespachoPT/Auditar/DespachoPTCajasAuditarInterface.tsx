export interface DespachoPTCajasAuditarInterface{
    id: number,
    prodID: string,
    size: string,
    color: string,
    itemID: string,
    box: number,
    qty: number,
    auditado: number 
}

export interface DespachoPTDetalleAuditoriaCajaInterface{
    itemID: string,
    size: string,
    color: string,
    qty: number,
    auditada: number
}