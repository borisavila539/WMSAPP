export interface DetalleInventarioCliclicoTelainterface {
    journalID: string;
    itemID: string;
    inventLocationID: string;
    inventSerialID: string;
    apvendRoll: string;
    inventColorID: string;
    colorName: string;
    inventBatchID: string;
    inventOnHand: number;
    wmsLocationID: string;
    reference: string;
    configID: string;
    exist: boolean;
    new: boolean;
    createdBy: string | null;
    scanBy: string | null;
    createdDateTime: Date | null;
    scanDateTime: Date | null;
  }