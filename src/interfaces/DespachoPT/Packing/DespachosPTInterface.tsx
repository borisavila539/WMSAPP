export interface DespachosPTInterface{
    id: number,
    driver: string,
    truck: string,
    createdDateTime: Date
    name: string
}

export interface EnviarDespachoPTInterface{
    id: number,
    descripcion: string
  }