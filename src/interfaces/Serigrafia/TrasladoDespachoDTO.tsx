export interface TrasladoDespachoDTO {
  despachoId: number
  transferId: string
  inventLocationIdFrom: string
  inventLocationIdTo: string
  itemId: string
  montoTraslado: number
  statusId: number
  selected?: boolean
}