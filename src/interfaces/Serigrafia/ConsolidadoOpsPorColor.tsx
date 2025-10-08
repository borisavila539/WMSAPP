export interface Talla {
  talla: string             
  cantidadSolicitada: number
  cantidadPreparada: number
}
export interface ConsolidadoOpsPorColorInterface {
  inventcolorid: string     
  opsIds: string[]          
  tallas: Talla[]           
}

export interface ColorData {
  color: string
  solicitado: Record<string, number>
  preparado: Record<string, string>
}
