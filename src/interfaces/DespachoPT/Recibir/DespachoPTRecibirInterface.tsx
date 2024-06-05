export interface DespachoPTRecibirInterface{
    id: number,
    prodID: string,
    size: string,
    color: string,
    fechaPacking: Date,
    itemID: string,
    box: number,
    qty: number,
    needAudit:Boolean,
    receive: boolean
}

export interface ReceiveDespachoPTInterface{
    prodid: string,
    box: number,
    receive: boolean,
    userReceive: string,
    fechaReceive: Date,
    despachoID: number
  }