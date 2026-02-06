
export interface ConsultaOpsPorBaseInterface {
    prodMasterId: string;
    itemIdEstilo: string;
    inventcolorid: string;
    colorName: string;
    estadoOp: number;
    tallas: TallaInterface[];
}

export interface TallaInterface {
    talla: string;
    cantidadSolicitada: number;
    cantidadPreparada: number;
    cantidadEmpacada: number;
    estadoOP: number;
}
