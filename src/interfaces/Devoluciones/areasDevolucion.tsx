export interface DefectosAuditoria{
    id:number,
    key:string,
    value:string,
    operacion:ListaAuditoria[],
    defecto: ListaAuditoria[]
}

export interface ListaAuditoria{
    id:number,
    key:string,
    value:string 
}

export interface actualizarDefecto{
    id: number,
    idDevolucionDetalle: number,
    idDefecto: number,
    tipo: string,
    reparacion: number,
    idOperacion: number
  }