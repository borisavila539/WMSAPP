export interface RespuestaEtiquetaUnidad<T> {
    exito: boolean
    mensaje: string
    datos: T
}

export type FormatoEtiquetaUnidad = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

// Tipo de articulo para buscar por casillas (Pantalon, Calceta, Boxer, Camisa...)
export interface EtiquetaUnidadCasillaInterface {
    largo: number
    etiqueta: string
    valor: string      // valor sugerido ('' = vacia = cualquiera)
    fijo: boolean      // no se puede cambiar
}

export interface EtiquetaUnidadTipoInterface {
    tipoId: number
    nombre: string
    ayuda: string
    casillas: EtiquetaUnidadCasillaInterface[]
}

// SKU de AX: articulo + color + talla + EAN
export interface EtiquetaUnidadSkuInterface {
    articulo: string
    descripcion: string
    colorId: string
    colorNombre: string
    talla: string
    ean: string
}

// Datos de la etiqueta de un EAN
export interface EtiquetaUnidadDatosInterface {
    articulo: string
    descripcion: string
    colorId: string
    colorNombre: string
    talla: string
    ean: string
    composicion: string
    estiloA: string
    estiloB: string
    estiloC: string
    estiloD: string
    workOrderId: string | null
    lote: string
    conjunto: string
    empresa: string
    sigla: string
    referencia: string
    proveedor: string
    unidadesPaquete: number
    formatoSugerido: FormatoEtiquetaUnidad
    categoria: string
    subcategoria: string
    codigoBase: string     // formato F: VI184
    marca: string          // formato F: PEPE / MOTT & BOW
    estiloF: string        // formato F: 03 184 0006
    etiquetasImpresas: number
}

export interface ImprimirEtiquetaUnidadItem {
    ean: string
    cantidad: number
}

export interface ImprimirEtiquetaUnidadRequest {
    ean: string
    formato: FormatoEtiquetaUnidad
    cantidad: number
    items?: ImprimirEtiquetaUnidadItem[]   // varias tallas (busqueda sin codigo de barras)
    unidadesPaquete: number | null
    estilo: string
    usuario: string
    impresora: string
}

export interface ImprimirEtiquetaUnidadResponse {
    cantidad: number
    serialDesde: number
    serialHasta: number
    conQR: boolean
}
