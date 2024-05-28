export interface EstatusOPPTInterface {
    userPicking: string
    prodcutsheetid: string
    prodid: string
    size: string
    escaneado: number
    cortado: number
    Costura1: string
    Textil1: string
    Costura2: string
    Textil2: string
}

export interface EstatusOPPTSendInterface {
    id: number
    prodID: string
    size: string
    costura1: number
    textil1: number
    costura2: number
    textil2: number
    usuario: string
}