export interface DetallePickingRouteID {
    salesID: string,
    pickingRouteID: string,
    cuentaCliente: string,
    cliente: string,
    telefono: string,
    county: string,
    codigo: string,
    empacador: string,
    cajas: number,
    embarque: string,
    address: string
}

export interface ResultadoOperacion {
    resultadoExitoso: boolean;
    mensajeError: string;
    codigoRespuesta: number;
}

export interface DatosRecoleccion {
    recoleccionID: string;
    numeroPieza: number;
    numeroGuia: string;
    montoTarifa: number;
    urlConsulta: string;
    urlRecoleccion: string;
    resultadoOperacion: ResultadoOperacion;
    datosGuia: string;
}

export interface ListaRecolecciones {
    datosRecoleccion: DatosRecoleccion[];
}

export interface GenerarGuiaCaex {
    resultadoOperacionMultiple: ResultadoOperacion;
    listaRecolecciones: ListaRecolecciones;
}

export interface RequestGenerarGuia {
    cliente: string,
    cajas: number,
    usuario: string,
    listasEmpaque:DetallePickingRouteID[]
}

export interface ReimpresionCaex{
    idCaex_Rutas: number,
    numeroPieza: number,
    numeroGuia: string,
    urlConsulta: string,
    rutas: string
  }