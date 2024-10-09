export interface AuditoriaCajaDenimInterface{
    id:number,
    op: string,
    articulo: string,
    numeroCaja: number,
    cantidad: number,
    ubicacion: string,
    enviado: boolean,
    usuario: string,
    auditado: number,
    talla: string
}

export interface AuditoriaCajaDenimInsertInterface{
    response:string
}
  