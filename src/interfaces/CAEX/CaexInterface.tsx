export interface DetallePickingRouteID{
    salesID: string;
    pickingRouteID: string;
    cuentaCliente: string;
    cliente: string;
    empacador: string;
    cajas: number;
    embarque: string;
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