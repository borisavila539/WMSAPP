export interface PrinterInterface{
    iM_DESCRIPTION_PRINTER:string,
    iM_IPPRINTER: string
}

export interface PrintersInterface{
    ShowImpresoras: boolean,
    IMBoxCode:string,
    onPress: ()=> void
    Tipo: boolean,
    peticion:string
}