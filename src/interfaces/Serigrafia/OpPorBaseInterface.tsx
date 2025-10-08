
export interface ConsultaOpsPorBaseInterface {
    prodMasterId: string;
    itemIdEstilo: string;
    inventcolorid: string;
    tallas: TallaInterface[];
}

export interface TallaInterface {
    talla: string;
    cantidadSolicitada: number;
    cantidadPreparada: number;
}
