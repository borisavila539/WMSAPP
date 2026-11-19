// Logica de la pantalla Etiqueta Unidad sin dependencias de React Native (se prueba con Jest:
// __tests__/etiquetaUnidadLogica.test.ts).
import {
    EtiquetaUnidadDatosInterface,
    EtiquetaUnidadSkuInterface,
    EtiquetaUnidadTipoInterface,
    FormatoEtiquetaUnidad,
    ImprimirEtiquetaUnidadItem
} from '../../../interfaces/EtiquetaUnidad/EtiquetaUnidadInterface'

export const MAX_ETIQUETAS = 100   // por talla
export const MAX_ORDEN = 200       // total de una orden con varias tallas

// Estilo sugerido segun el formato (en E es el texto de STYLE:, en F el codigo base VI184)
export const estiloSugerido = (d: EtiquetaUnidadDatosInterface, f: FormatoEtiquetaUnidad): string =>
    ({ A: d.estiloA, B: d.estiloB, C: d.estiloC, D: d.estiloD, E: d.articulo, F: d.codigoBase }[f] ?? '')

// Orden de tallas: letras (XXS..5XL), luego numeros de menor a mayor, al final las de empaque (Empaq, Pre-pack)
const ORDEN_LETRAS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', '4XL', '5XL']

export const pesoTalla = (t: string): [number, number, string] => {
    const u = t.trim().toUpperCase()
    if (/EMPAQ|PACK|PAQ|PRE-/.test(u)) return [3, 0, u]
    const i = ORDEN_LETRAS.indexOf(u)
    if (i >= 0) return [0, i, u]
    const n = parseFloat(u.replace(/\s+1\/2$/, '.5').replace(/[^0-9.]/g, ''))
    return isNaN(n) ? [2, 0, u] : [1, n, u]
}

export const compararTalla = (a: string, b: string): number => {
    const [ga, na, sa] = pesoTalla(a), [gb, nb, sb] = pesoTalla(b)
    return ga - gb || na - nb || sa.localeCompare(sb)
}

export interface GrupoArticulo {
    articulo: string
    descripcion: string
    colorId: string
    colorNombre: string
    tallas: EtiquetaUnidadSkuInterface[]
}

// Agrupa los SKU por articulo + color (el mismo estilo puede tener varios articulos que solo
// cambian la secuencia) y ordena las tallas de cada grupo.
export const agruparPorArticulo = (lista: EtiquetaUnidadSkuInterface[]): GrupoArticulo[] => {
    const grupos: GrupoArticulo[] = []
    lista.forEach(s => {
        let g = grupos.find(x => x.articulo === s.articulo && x.colorId === s.colorId)
        if (!g) {
            g = { articulo: s.articulo, descripcion: s.descripcion, colorId: s.colorId, colorNombre: s.colorNombre, tallas: [] }
            grupos.push(g)
        }
        g.tallas.push(s)
    })
    grupos.forEach(g => g.tallas.sort((a, b) => compararTalla(a.talla, b.talla)))
    return grupos
}

// Lo que el usuario escribe en una casilla: solo letras y numeros, en mayusculas
export const limpiarCasilla = (texto: string): string => texto.replace(/[^0-9A-Za-z]/g, '').toUpperCase()

// Patron para AX segun el tipo: cada casilla con ceros a la izquierda y vacia = '_' (cualquier
// caracter). Devuelve null si el usuario no escribio nada propio (no bastan los valores sugeridos).
export const armarPatron = (tipo: EtiquetaUnidadTipoInterface | null, casillas: string[]): string | null => {
    if (!tipo) return null
    const partes = tipo.casillas.map((c, i) => {
        const v = (casillas[i] ?? '').trim()
        return v ? v.padStart(c.largo, '0').slice(-c.largo) : '_'.repeat(c.largo)
    })
    const llenas = tipo.casillas.filter((c, i) => {
        const v = (casillas[i] ?? '').trim()
        return !c.fijo && v !== '' && (c.valor === '' || v !== c.valor)
    }).length
    return llenas > 0 ? partes.join(' ') : null
}

// Seleccion de varias tallas (ean -> cantidad escrita)
export const totalSeleccion = (seleccion: Record<string, string>): number =>
    Object.values(seleccion).reduce((t, v) => t + (parseInt(v, 10) || 0), 0)

// Mensaje de error o null si la seleccion se puede imprimir
export const validarSeleccion = (seleccionadas: EtiquetaUnidadSkuInterface[], seleccion: Record<string, string>): string | null => {
    if (seleccionadas.length === 0) return 'Marque al menos una talla.'
    const mala = seleccionadas.find(s => {
        const n = parseInt(seleccion[s.ean], 10) || 0
        return n < 1 || n > MAX_ETIQUETAS
    })
    if (mala) return `La cantidad de la talla ${mala.talla} debe estar entre 1 y ${MAX_ETIQUETAS}.`
    const total = seleccionadas.reduce((t, s) => t + (parseInt(seleccion[s.ean], 10) || 0), 0)
    if (total > MAX_ORDEN) return `Son ${total} etiquetas; el máximo por orden es ${MAX_ORDEN}.`
    return null
}

// Tallas que se mandan a imprimir
export const itemsSeleccion = (seleccionadas: EtiquetaUnidadSkuInterface[], seleccion: Record<string, string>): ImprimirEtiquetaUnidadItem[] =>
    seleccionadas.map(s => ({ ean: s.ean, cantidad: parseInt(seleccion[s.ean], 10) || 0 }))

// Al marcar una talla: si es de otro articulo o color, la seleccion empieza de nuevo con ella
export const marcarTalla = (
    seleccion: Record<string, string>, lista: EtiquetaUnidadSkuInterface[], s: EtiquetaUnidadSkuInterface
): { seleccion: Record<string, string>, nueva: boolean } => {
    if (seleccion[s.ean] !== undefined) {
        const { [s.ean]: _, ...resto } = seleccion
        return { seleccion: resto, nueva: false }
    }
    const primera = lista.find(x => seleccion[x.ean] !== undefined)
    if (!primera) return { seleccion: { [s.ean]: '1' }, nueva: true }
    if (primera.articulo !== s.articulo || primera.colorId !== s.colorId) return { seleccion: { [s.ean]: '1' }, nueva: true }
    return { seleccion: { ...seleccion, [s.ean]: '1' }, nueva: false }
}
