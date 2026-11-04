export interface AuditoriaInternaRespuestaInterface {
    exito: boolean
    resultado: string
    mensaje: string
    id: number
}

export interface AuditoriaInternaCajaInterface {
    id: number
    op: string
    numeroCaja: number
    estado: string
    resultado: string | null
    modoValidacion: string
    conjunto: string | null
    origen: string
    contratista: string | null
    categoriaInterna: string | null
    articulo: string
    nombreArticulo: string | null
    productoEtiqueta: string | null
    estilo: string | null
    lote: string | null
    colorId: string | null
    colorDescripcion: string | null
    categoriaCaja: string | null
    empacadoPor: string | null
    plDespacho: string | null
    cantidadEsperada: number
    cantidadEscaneada: number
    diferencia: number
    faltantes: number
    sobrantes: number
    escaneos: number
    rechazos: number
    observaciones: string | null
    usuarioInicio: string
    fechaInicio: string
    usuarioCierre: string | null
    fechaCierre: string | null
}

export interface AuditoriaInternaLineaInterface {
    id: number
    ean: string
    talla: string
    cantidadEsperada: number
    cantidadEscaneada: number
    diferencia: number
    faltantes: number
    sobrantes: number
    escaneos: number
}

export interface AuditoriaInternaEscaneoInterface {
    exito: boolean
    resultado: string
    mensaje: string
    talla: string | null
    cantidad: number
    lineaEsperada: number
    lineaEscaneada: number
    cajaEsperada: number
    cajaEscaneada: number
    opSugerida: string | null
    cajaSugerida: number | null
}

export interface AuditoriaInternaAbrirCajaInterface {
    respuesta: AuditoriaInternaRespuestaInterface | null
    caja: AuditoriaInternaCajaInterface | null
    lineas: AuditoriaInternaLineaInterface[]
}

export interface AuditoriaInternaEscanearInterface {
    escaneo: AuditoriaInternaEscaneoInterface | null
    lineas: AuditoriaInternaLineaInterface[]
}

export interface AuditoriaInternaPendienteInterface {
    id: number
    op: string
    numeroCaja: number
    articulo: string
    estilo: string | null
    colorDescripcion: string | null
    origen: string
    contratista: string | null
    categoriaInterna: string | null
    modoValidacion: string
    cantidadEsperada: number
    cantidadEscaneada: number
    diferencia: number
    plDespacho: string | null
    usuarioInicio: string
    fechaInicio: string
    fechaUltimoEscaneo: string
}
