export interface TopTelaPickingByVendroll {
    proveedorId:        string;
    activityUUID:       string;
    cantidadEscaneados: number;
    nombreProveedor:    string;
    fechaInicioEscaneo: string;
    fechaUltimoEscaneo: string;
}

export interface ListaProveedores {
    accountnum: string;
    name:       string;
}

export interface TipoDeTela {
    telaPickingTypeId: number;
    reference:         string;
    description?:      string | null;
    isActive:          boolean;
}

export interface RolloByUUID {
    telaPickingByVendrollId: number;
    vendRoll:                string;
    proveedorId:             string;
    location:                string;
    createdDate:             Date;
    createdBy:               string;
    nameProveedor:           string;
    activityUUID:            string;
    reference:               string;
    description?:            string;
    telaPickingTypeId:       number;
}

export interface BodyTelaPickingByVendroll {
    VendRoll:          string;
    ProveedorId:       string;
    Location:          string;
    CreatedBy:         string;
    ActivityUUID:      string;
    TelaPickingTypeId: number;
}

