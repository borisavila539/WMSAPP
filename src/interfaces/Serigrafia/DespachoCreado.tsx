import { TrasladoDespachoDTO } from "./TrasladoDespachoDTO"

export interface DespachoCreado {
  id: number // El API devuelve número, no string
  descripcion: string
  store: string
  createdBy: string
  createdDateTime: string // El API devuelve string ISO, no Date
  sended: number
  received: number
  traslados: TrasladoDespachoDTO[] | null
}
