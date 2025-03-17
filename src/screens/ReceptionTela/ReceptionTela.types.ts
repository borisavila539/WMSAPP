export interface ListTelas {
    journalId:          string;
    description:        string;
    numOfLines:         number;
    journalNameId:      string;
    numOfLinesComplete: number;
}

export interface TelaPickingMerge {
    itemId:                 string;
    inventColorId:          string;
    inventBatchId:          string;
    qty:                    number;
    tela_picking_id:        number;
    journalId:              string;
    inventSerialId:         string;
    vendRoll:               string;
    user?:                  string;
    created_date:           Date;
    is_scanning:            boolean;
    update_date:            Date;
    inventserialid_picking: string;
    vendroll_picking:       string;
    reference:              string | null;
    nameColor:              string | null;
    telaPickingDefectoId:   number;
    descriptionDefecto:     string | null;
    location:               string | null;
}

export interface TelaPickingIsScanning {
    userCode:       string;
    vendroll:       string;
    journalId:      string;
    inventSerialId: string;
    location: string;
    telaPickingDefectoId?: number | null;
}


export interface TelaPickingUpdate {
    tela_picking_id:      number;
    journalid:            string;
    inventserialid:       string;
    vendroll:             string;
    user:                 number;
    created_date:         Date;
    is_scanning:          boolean;
    update_date:          Date;
    location:             string;
    itemId:               string;
    telaPickingDefectoId: number;
}

export interface TelaPickingDefecto {
    telaPickingDefectoId: number;
    descriptionDefecto:   string;
}


export interface TelaPickingRule {
    telaPickingRuleId: number;
    startWith:         string;
    maxCount:          number;
    isActive:          boolean;
}

export interface ActualCount{
    location: string;
    qtyActual: number;
    maxCount: number;
    isComplete: boolean;
}