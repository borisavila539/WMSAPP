export interface DevolucionesInterface{
    id: number,
    numDevolucion: string,
    fechaCrea: Date,
    numeroRMA: string,
    fechaCreacionAX: Date,
    asesor: string,
    descricpcion: string,
    totalUnidades:number
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

  export interface EnviarDevolucionInterface {
    id: number;
    numDevolucion: string;
    fechaCrea: Date; // Puede cambiar a Date si planeas convertirlo
    numeroRMA: string;
    fechaCreacionAX: Date; // Puede cambiar a Date si planeas convertirlo
    asesor: string;
    descricpcion: string;
    totalUnidades: number;
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
  