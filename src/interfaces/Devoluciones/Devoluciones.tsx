export interface DevolucionesInterface{
    id: number,
    numDevolucion: string,
    fechaCrea: Date,
    numeroRMA: string,
    fechaCreacionAX: Date,
    asesor: string,
    descricpcion: string
  }

  export interface DevolucionDetalleinterface {
    id: number;
    idDevolucion: number;
    articulo: string;
    talla: string;
    color: string;
    cantidad: number;
    recibidaPlanta: number;
    nombreArticulo: string;
    usuarioRecepcionPlanta: string;
    usuarioRecepcionCD: string;
    recibidaCD: number;
    itembarcode: string;
    defecto?:DevolucionDefectoDetalleINterface[]
  }

  export interface DevolucionDefectoDetalleINterface{
    id:number,
    idDevolucionDetalle:number,
    idDefecto?:number,
    tipo?:string
  }

  export interface DevolucionesDefectosInterface{
    id: number,
    estructura: string,
    defecto: string,
    activo: boolean
  }
  