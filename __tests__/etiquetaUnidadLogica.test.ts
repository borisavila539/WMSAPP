import {
    MAX_ETIQUETAS, MAX_ORDEN, agruparPorArticulo, armarPatron, compararTalla, estiloSugerido, itemsSeleccion,
    limpiarCasilla, marcarTalla, pesoTalla, totalSeleccion, validarSeleccion
} from '../src/screens/ModuloDiseñoEtiquetaAImprimir/EtiquetaUnidad/etiquetaUnidadLogica'
import {
    EtiquetaUnidadDatosInterface, EtiquetaUnidadSkuInterface, EtiquetaUnidadTipoInterface
} from '../src/interfaces/EtiquetaUnidad/EtiquetaUnidadInterface'

const sku = (articulo: string, talla: string, ean: string, colorId = 'GI'): EtiquetaUnidadSkuInterface => ({
    articulo, descripcion: 'POLO MODA HOMBRE REGULAR FIT', colorId, colorNombre: 'GRIS JADE', talla, ean
})

// Tipos como los de IM_WMS_EtiquetaUnidad_Tipo
const camisa: EtiquetaUnidadTipoInterface = {
    tipoId: 4, nombre: 'Camisa', ayuda: '',
    casillas: [
        { largo: 2, etiqueta: '', valor: '30', fijo: true },
        { largo: 1, etiqueta: '', valor: '1', fijo: true },
        { largo: 1, etiqueta: '', valor: '3', fijo: false },
        { largo: 3, etiqueta: 'Modelo', valor: '', fijo: false },
        { largo: 2, etiqueta: '', valor: '', fijo: false },
        { largo: 4, etiqueta: 'Secuencia', valor: '', fijo: false },
    ]
}
const boxer: EtiquetaUnidadTipoInterface = {
    tipoId: 3, nombre: 'Boxer', ayuda: '',
    casillas: [
        { largo: 2, etiqueta: '', valor: '30', fijo: true },
        { largo: 1, etiqueta: '', valor: '1', fijo: true },
        { largo: 1, etiqueta: '', valor: '1', fijo: true },
        { largo: 3, etiqueta: 'Modelo', valor: '905', fijo: false },
        { largo: 2, etiqueta: '', valor: '45', fijo: false },
        { largo: 4, etiqueta: 'Secuencia', valor: '', fijo: false },
    ]
}

describe('armarPatron (articulo por casillas)', () => {
    test('camisa 801 secuencia 25 -> ceros a la izquierda y "_" en la casilla vacia', () => {
        expect(armarPatron(camisa, ['30', '1', '3', '801', '', '25'])).toBe('30 1 3 801 __ 0025')
    })

    test('sin tipo (campo libre) no hay patron', () => {
        expect(armarPatron(null, [])).toBeNull()
    })

    test('solo con los valores sugeridos no busca', () => {
        expect(armarPatron(camisa, ['30', '1', '3', '', '', ''])).toBeNull()
        expect(armarPatron(boxer, ['30', '1', '1', '905', '45', ''])).toBeNull()
    })

    test('cambiar un valor sugerido cuenta como escrito por el usuario', () => {
        expect(armarPatron(boxer, ['30', '1', '1', '205', '45', ''])).toBe('30 1 1 205 45 ____')
    })

    test('boxer con secuencia 1 -> 30 1 1 905 45 0001', () => {
        expect(armarPatron(boxer, ['30', '1', '1', '905', '45', '1'])).toBe('30 1 1 905 45 0001')
    })

    test('si se escribe de mas se toman los ultimos digitos del largo de la casilla', () => {
        expect(armarPatron(camisa, ['30', '1', '3', '801', '', '000025'])).toBe('30 1 3 801 __ 0025')
    })

    test('casillas faltantes cuentan como vacias', () => {
        expect(armarPatron(camisa, ['30', '1', '3', '801'])).toBe('30 1 3 801 __ ____')
    })
})

describe('limpiarCasilla', () => {
    test('solo letras y numeros en mayusculas', () => {
        expect(limpiarCasilla(' 8o1-')).toBe('8O1')
        expect(limpiarCasilla("25'; DROP")).toBe('25DROP')
    })
})

describe('orden de tallas', () => {
    const ordenar = (t: string[]) => [...t].sort(compararTalla)

    test('letras en orden de tamano', () => {
        expect(ordenar(['XL', 'S', 'L', 'XS', 'M', 'XXL'])).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
    })

    test('numeros de menor a mayor (no alfabetico) y medias tallas', () => {
        expect(ordenar(['16', '2', '14 1/2', '10', '15'])).toEqual(['2', '10', '14 1/2', '15', '16'])
    })

    test('las de empaque al final', () => {
        expect(ordenar(['Empaq-Po', 'L', 'Pre-pack1', 'M', 'Pre-pack2', 'S', 'XL']))
            .toEqual(['S', 'M', 'L', 'XL', 'Empaq-Po', 'Pre-pack1', 'Pre-pack2'])
    })

    test('pesoTalla clasifica letras, numeros, otras y empaque', () => {
        expect(pesoTalla('m')[0]).toBe(0)
        expect(pesoTalla('34')[0]).toBe(1)
        expect(pesoTalla('Unico')[0]).toBe(2)
        expect(pesoTalla('3-Pack-H')[0]).toBe(3)
    })
})

describe('agruparPorArticulo', () => {
    // Caso real: KP995 + GI trae 3 articulos con las mismas tallas
    const lista = [
        sku('30 1 1 995 36 0012', 'L', '7424690929688'),
        sku('30 1 1 995 36 0012', 'Empaq-Po', '7424690929732'),
        sku('30 1 1 995 36 0016', 'M', '7424667593089'),
        sku('30 1 1 995 36 0016', 'L', '7424667593072'),
        sku('30 1 1 995 36 0017', 'L', '7424667556831'),
        sku('30 1 1 995 36 0012', 'S', '7424690929700'),
    ]

    test('un grupo por articulo, en el orden en que llegan', () => {
        const g = agruparPorArticulo(lista)
        expect(g.map(x => x.articulo)).toEqual(['30 1 1 995 36 0012', '30 1 1 995 36 0016', '30 1 1 995 36 0017'])
    })

    test('tallas ordenadas dentro de cada grupo', () => {
        const g = agruparPorArticulo(lista)
        expect(g[0].tallas.map(t => t.talla)).toEqual(['S', 'L', 'Empaq-Po'])
        expect(g[1].tallas.map(t => t.talla)).toEqual(['M', 'L'])
    })

    test('ningun EAN se pierde ni se repite', () => {
        const eans = agruparPorArticulo(lista).flatMap(x => x.tallas.map(t => t.ean))
        expect(eans.sort()).toEqual(lista.map(s => s.ean).sort())
    })

    test('mismo articulo con otro color es otro grupo', () => {
        const g = agruparPorArticulo([sku('30 1 1 995 36 0016', 'L', '1', 'GI'), sku('30 1 1 995 36 0016', 'L', '2', '09')])
        expect(g).toHaveLength(2)
    })
})

describe('seleccion de varias tallas', () => {
    const l = sku('30 1 1 995 36 0016', 'L', '7424667593072')
    const m = sku('30 1 1 995 36 0016', 'M', '7424667593089')
    const otroArticulo = sku('30 1 1 995 36 0017', 'L', '7424667556831')
    const otroColor = sku('30 1 1 995 36 0016', 'L', '7424667556411', '09')
    const lista = [l, m, otroArticulo, otroColor]

    test('la primera talla marcada empieza la seleccion con cantidad 1', () => {
        expect(marcarTalla({}, lista, l)).toEqual({ seleccion: { [l.ean]: '1' }, nueva: true })
    })

    test('otra talla del mismo articulo y color se agrega', () => {
        const r = marcarTalla({ [l.ean]: '2' }, lista, m)
        expect(r.nueva).toBe(false)
        expect(r.seleccion).toEqual({ [l.ean]: '2', [m.ean]: '1' })
    })

    test('volver a tocar una talla marcada la quita', () => {
        expect(marcarTalla({ [l.ean]: '2', [m.ean]: '1' }, lista, l).seleccion).toEqual({ [m.ean]: '1' })
    })

    test('otro articulo u otro color empieza una seleccion nueva', () => {
        expect(marcarTalla({ [l.ean]: '2' }, lista, otroArticulo)).toEqual({ seleccion: { [otroArticulo.ean]: '1' }, nueva: true })
        expect(marcarTalla({ [l.ean]: '2' }, lista, otroColor)).toEqual({ seleccion: { [otroColor.ean]: '1' }, nueva: true })
    })

    test('total, items y validacion', () => {
        const sel = { [l.ean]: '2', [m.ean]: '1' }
        expect(totalSeleccion(sel)).toBe(3)
        expect(itemsSeleccion([l, m], sel)).toEqual([{ ean: l.ean, cantidad: 2 }, { ean: m.ean, cantidad: 1 }])
        expect(validarSeleccion([l, m], sel)).toBeNull()
    })

    test('sin tallas marcadas no deja imprimir', () => {
        expect(validarSeleccion([], {})).toMatch(/al menos una talla/)
    })

    test('cantidad vacia, cero o mayor al maximo por talla no deja imprimir', () => {
        expect(validarSeleccion([l], { [l.ean]: '' })).toMatch(/talla L/)
        expect(validarSeleccion([l], { [l.ean]: '0' })).toMatch(/talla L/)
        expect(validarSeleccion([l], { [l.ean]: String(MAX_ETIQUETAS + 1) })).toMatch(/talla L/)
        expect(validarSeleccion([l], { [l.ean]: String(MAX_ETIQUETAS) })).toBeNull()
    })

    test('mas de 200 etiquetas en la orden no deja imprimir', () => {
        expect(validarSeleccion([l, m], { [l.ean]: '100', [m.ean]: '100' })).toBeNull()
        expect(validarSeleccion([l, m, otroArticulo], { [l.ean]: '100', [m.ean]: '100', [otroArticulo.ean]: '1' }))
            .toMatch(new RegExp(`${MAX_ORDEN + 1} etiquetas`))
    })
})

describe('estiloSugerido', () => {
    const datos = {
        articulo: '30 1 1 995 36 0016', estiloA: 'KP995', estiloB: '1 1 995 36 0016', estiloC: '30 11 995 36 0016',
        estiloD: '995360016', codigoBase: 'VI184'
    } as EtiquetaUnidadDatosInterface

    test.each([
        ['A', 'KP995'], ['B', '1 1 995 36 0016'], ['C', '30 11 995 36 0016'],
        ['D', '995360016'], ['E', '30 1 1 995 36 0016'], ['F', 'VI184'],
    ])('formato %s -> %s', (formato, esperado) => {
        expect(estiloSugerido(datos, formato as any)).toBe(esperado)
    })
})
