import { TrasladoDespachoDTO } from "./TrasladoDespachoDTO"

export interface DespachoCreado {
  id: number // El API devuelve número, no string
  truck: string
  driver: string
  store: string
  createdBy: string
  createdDateTime: string // El API devuelve string ISO, no Date
  statusId: number
  traslados: TrasladoDespachoDTO[] | null
}
