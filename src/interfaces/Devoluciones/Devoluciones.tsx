export interface DevolucionesInterface{
    id: number,
    numDevolucion: string,
    fechaCrea: Date,
    numeroRMA: string,
    fechaCreacionAX: Date,
    asesor: string,
    descricpcion: string,
    totalUnidades:number,
    camion:string,

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
    defecto?:string,
    tipo?:string,
    reparacion?:boolean
    area:string,
    operacion:String
  }

  export interface DevolucionesDefectosInterface{
    id: number,
    estructura: string,
    defecto: string,
    activo: boolean
  }

  export interface EnviarDevolucionInterface {
    id: number;
    numDevolucion: string;
    fechaCrea: Date; 
    numeroRMA: string;
    fechaCreacionAX: Date; 
    asesor: string;
    descricpcion: string;
    totalUnidades: number;
    camion:string,
    cajas: Caja[];
  }
  
  export interface Caja {
    id: number;
    idDevolucion: number;
    caja: number;
    tipo: string;
    packing: boolean;
    userPacking: string;
    recibir: boolean;
    userRecibir: string;
  }

  export interface ConsolidacionCajas{
    usuario:string,
    numDevolucion:string
  }
  