export interface Talla {
  talla: string             
  cantidadSolicitada: number
  cantidadPreparada: number
  estadoOp:number
}
export interface ConsolidadoOpsPorColorInterface {
  inventcolorid: string     
  opsIds: string[]          
  tallas: Talla[]           
}

export interface ColorData {
  color: string
  colornName: string
  estado: number
  solicitado: Record<string, number>
  preparado: Record<string, string>
}
