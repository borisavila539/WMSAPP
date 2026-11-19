import React, { FC, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../../navigation/navigation'
import Header from '../../../components/Header'
import { navy } from '../../../constants/Colors'
import { WMSContext } from '../../../context/WMSContext'
import { WmSApi } from '../../../api/WMSApi'
import { WMSApiEtiquetaUnidad } from '../../../api/WMSApiEtiquetaUnidad'
import { PrinterInterface } from '../../../interfaces/PrintersInterface'
import {
    EtiquetaUnidadDatosInterface,
    EtiquetaUnidadSkuInterface,
    EtiquetaUnidadTipoInterface,
    FormatoEtiquetaUnidad,
    ImprimirEtiquetaUnidadRequest,
    ImprimirEtiquetaUnidadResponse,
    RespuestaEtiquetaUnidad
} from '../../../interfaces/EtiquetaUnidad/EtiquetaUnidadInterface'
import {
    MAX_ETIQUETAS, MAX_ORDEN, agruparPorArticulo, armarPatron as patronDeCasillas, estiloSugerido, itemsSeleccion,
    limpiarCasilla, marcarTalla, validarSeleccion
} from './etiquetaUnidadLogica'

type props = StackScreenProps<RootStackParams, 'EtiquetaUnidadScreen'>

const C = {
    fondo: '#F4F6F8',
    superficie: '#FFFFFF',
    borde: '#E5E7EB',
    texto: '#1F2933',
    texto2: '#6B7280',
    primario: navy,
    acento: '#176B87',
    seleccion: '#E8F1F8',
}

const FORMATOS: { id: FormatoEtiquetaUnidad, nombre: string, detalle: string, qr: boolean }[] = [
    { id: 'A', nombre: 'Contratista', detalle: 'Estilo, talla y Uds, QR y sigla (MA, OR, CM...)', qr: true },
    { id: 'B', nombre: 'Serigrafía (AX)', detalle: 'Estilo AX, OP, lote, QR', qr: true },
    { id: 'C', nombre: 'PEPE calceta', detalle: 'PEPE, estilo, color, talla, QR', qr: true },
    { id: 'D', nombre: 'PEPE camisa', detalle: 'PEPE, estilo, talla, color, sin QR', qr: false },
    { id: 'E', nombre: 'Style / Color / Size', detalle: 'Importado, sin QR', qr: false },
    { id: 'F', nombre: 'Pantalón (Denim)', detalle: 'Marca, talla, código base, OP y referencia, sin QR', qr: false },
]

const mensajeError = (err: any, porDefecto: string) =>
    err?.response?.data?.mensaje ?? porDefecto

export const EtiquetaUnidadScreen: FC<props> = () => {
    const { WMSState } = useContext(WMSContext)
    const [ean, setEan] = useState('')
    const [articulo, setArticulo] = useState('')
    const [color, setColor] = useState('')
    const [talla, setTalla] = useState('')
    const [skus, setSkus] = useState<EtiquetaUnidadSkuInterface[]>([])
    const [datos, setDatos] = useState<EtiquetaUnidadDatosInterface | null>(null)
    const [formato, setFormato] = useState<FormatoEtiquetaUnidad>('A')
    const [cantidad, setCantidad] = useState('1')
    const [uds, setUds] = useState('1')
    const [estilo, setEstilo] = useState('')
    const [buscando, setBuscando] = useState(false)
    const [cargandoDatos, setCargandoDatos] = useState(false)
    const [imprimiendo, setImprimiendo] = useState(false)
    const [impresoras, setImpresoras] = useState<PrinterInterface[]>([])
    const [verImpresoras, setVerImpresoras] = useState(false)
    // Busqueda sin codigo de barras: se marcan varias tallas, cada una con su cantidad (ean -> cantidad)
    const [porEan, setPorEan] = useState(true)
    const [seleccion, setSeleccion] = useState<Record<string, string>>({})
    // Articulo por casillas segun el tipo (null = campo libre)
    const [tipos, setTipos] = useState<EtiquetaUnidadTipoInterface[]>([])
    const [tipo, setTipo] = useState<EtiquetaUnidadTipoInterface | null>(null)
    const [casillas, setCasillas] = useState<string[]>([])

    useEffect(() => {
        WmSApi.get<PrinterInterface[]>('Impresoras')
            .then(resp => setImpresoras(resp.data))
            .catch(err => console.log(err))
        WMSApiEtiquetaUnidad.get<RespuestaEtiquetaUnidad<EtiquetaUnidadTipoInterface[]>>('Tipos')
            .then(resp => setTipos(resp.data.datos ?? []))
            .catch(err => console.log(err))
    }, [])

    const elegirTipo = (t: EtiquetaUnidadTipoInterface | null) => {
        setTipo(t)
        setCasillas(t ? t.casillas.map(c => c.valor) : [])
        setArticulo('')
    }

    const cambiarCasilla = (i: number, texto: string) =>
        setCasillas(prev => prev.map((v, k) => (k === i ? limpiarCasilla(texto) : v)))

    // Patron para AX: cada casilla con ceros a la izquierda; vacia = '_' (cualquier caracter)
    const armarPatron = (): string | null => patronDeCasillas(tipo, casillas)

    const limpiar = () => {
        setEan('')
        setArticulo('')
        setColor('')
        setTalla('')
        setCasillas(tipo ? tipo.casillas.map(c => c.valor) : [])
        setSkus([])
        setSeleccion({})
        setDatos(null)
        setCantidad('1')
    }

    const cargarDatos = async (ean: string) => {
        setCargandoDatos(true)
        try {
            const resp = await WMSApiEtiquetaUnidad.get<RespuestaEtiquetaUnidad<EtiquetaUnidadDatosInterface>>('ObtenerDatos', { params: { ean } })
            const d = resp.data.datos
            setDatos(d)
            setFormato(d.formatoSugerido)
            setEstilo(estiloSugerido(d, d.formatoSugerido))
            setUds('1')   // por defecto 1 (decision del usuario); se puede cambiar
            setCantidad('1')
        } catch (err: any) {
            setDatos(null)
            Alert.alert('Atención', mensajeError(err, 'No se pudieron consultar los datos de la etiqueta.'))
        } finally {
            setCargandoDatos(false)
        }
    }

    const buscar = async (eanBuscar: string = ean) => {
        const patron = armarPatron()
        const params = {
            ean: eanBuscar.trim(),
            articulo: tipo ? '' : articulo.trim().toUpperCase(),
            patron: patron ?? '',
            color: color.trim().toUpperCase(),
            talla: talla.trim().toUpperCase(),
        }
        if (!params.ean && !params.articulo && !params.patron) {
            Alert.alert('Atención', tipo
                ? 'Llene al menos una casilla del artículo (por ejemplo el modelo) o escanee el código de barras.'
                : 'Escanee el código de barras o escriba el artículo / estilo.')
            return
        }
        if (!params.ean && !params.color) {
            Alert.alert('Atención', 'Para buscar por artículo escriba también el color (código o nombre).')
            return
        }
        Keyboard.dismiss()
        setBuscando(true)
        setDatos(null)
        setSeleccion({})
        const buscaPorEan = !!params.ean
        setPorEan(buscaPorEan)
        try {
            const resp = await WMSApiEtiquetaUnidad.get<RespuestaEtiquetaUnidad<EtiquetaUnidadSkuInterface[]>>('BuscarArticulo', { params })
            const filas = resp.data.datos ?? []
            setSkus(filas)
            if (filas.length === 1) {
                if (!buscaPorEan) setSeleccion({ [filas[0].ean]: '1' })
                cargarDatos(filas[0].ean)
            }
        } catch (err: any) {
            setSkus([])
            Alert.alert('Atención', mensajeError(err, 'No se pudo buscar el artículo.'))
        } finally {
            setBuscando(false)
        }
    }

    const cantidadNumero = parseInt(cantidad, 10) || 0
    const udsNumero = parseInt(uds, 10) || 0
    const formatoActual = FORMATOS.find(f => f.id === formato)!

    // Seleccion de varias tallas (solo sin codigo de barras). Todas deben ser del mismo articulo y color,
    // porque el formato, el estilo y las uds por paquete se aplican a todas.
    const multiple = !porEan
    const seleccionadas = skus.filter(s => seleccion[s.ean] !== undefined)
    const totalSeleccion = seleccionadas.reduce((t, s) => t + (parseInt(seleccion[s.ean], 10) || 0), 0)

    const alternarTalla = (s: EtiquetaUnidadSkuInterface) => {
        const r = marcarTalla(seleccion, skus, s)
        setSeleccion(r.seleccion)
        if (Object.keys(r.seleccion).length === 0) setDatos(null)
        else if (r.nueva) cargarDatos(s.ean)   // primera talla, u otro articulo/color: se recargan los datos
    }

    const cambiarCantidadTalla = (eanTalla: string, texto: string) =>
        setSeleccion(prev => ({ ...prev, [eanTalla]: texto.replace(/\D/g, '') }))

    const pasoTalla = (eanTalla: string, delta: number) =>
        setSeleccion(prev => ({ ...prev, [eanTalla]: String(Math.min(Math.max((parseInt(prev[eanTalla], 10) || 0) + delta, 1), MAX_ETIQUETAS)) }))

    const cambiarCantidad = (delta: number) =>
        setCantidad(String(Math.min(Math.max(cantidadNumero + delta, 1), MAX_ETIQUETAS)))

    const elegirFormato = (f: FormatoEtiquetaUnidad) => {
        setFormato(f)
        if (datos) setEstilo(estiloSugerido(datos, f))
    }

    const alImprimir = () => {
        if (!datos) return
        if (formato !== 'F' && !estilo.trim()) {
            Alert.alert('Atención', 'Escriba el estilo que lleva la etiqueta.')
            return
        }
        if (multiple) {
            const error = validarSeleccion(seleccionadas, seleccion)
            if (error) {
                Alert.alert('Atención', error)
                return
            }
        } else if (cantidadNumero < 1 || cantidadNumero > MAX_ETIQUETAS) {
            Alert.alert('Atención', `La cantidad debe estar entre 1 y ${MAX_ETIQUETAS}.`)
            return
        }
        if (formato === 'A' && (udsNumero < 1 || udsNumero > 99)) {
            Alert.alert('Atención', 'Las unidades por paquete deben estar entre 1 y 99.')
            return
        }
        setVerImpresoras(true)
    }

    const imprimir = async (impresora: PrinterInterface) => {
        if (!datos) return
        setImprimiendo(true)
        const request: ImprimirEtiquetaUnidadRequest = {
            ean: datos.ean,
            formato,
            cantidad: cantidadNumero,
            items: multiple ? itemsSeleccion(seleccionadas, seleccion) : undefined,
            unidadesPaquete: formato === 'A' ? udsNumero : null,
            estilo: formato === 'F' ? '' : estilo.trim(),   // en F el codigo base no se modifica
            usuario: WMSState.usuario,
            impresora: impresora.iM_IPPRINTER,
        }
        try {
            const resp = await WMSApiEtiquetaUnidad.post<RespuestaEtiquetaUnidad<ImprimirEtiquetaUnidadResponse>>('Imprimir', request)
            const d = resp.data.datos
            setVerImpresoras(false)
            const series = !d.conQR ? '' : d.cantidad === 1 ? `\nSerie ${d.serialDesde}` : `\nSeries ${d.serialDesde} a ${d.serialHasta}`
            Alert.alert('Listo', `${resp.data.mensaje}${series}`)
            setCantidad('1')
            if (multiple) setSeleccion(prev => Object.fromEntries(Object.keys(prev).map(k => [k, '1'])))
            setDatos({ ...datos, etiquetasImpresas: datos.etiquetasImpresas + d.cantidad })
        } catch (err: any) {
            Alert.alert('Error', mensajeError(err, 'No se pudo mandar a imprimir.'))
        } finally {
            setImprimiendo(false)
        }
    }

    const qrEjemplo = datos
        ? `${datos.articulo},${datos.talla},${datos.colorId},${datos.ean},${datos.referencia},${datos.proveedor},${formato === 'A' ? udsNumero : datos.unidadesPaquete},<serial>`
        : ''

    return (
        <View style={styles.pantalla}>
            <Header texto1="" texto2="Etiqueta Unidad" texto3="Reimpresión" />
            <ScrollView contentContainerStyle={{ padding: 14 }} keyboardShouldPersistTaps="handled">
                {/* Busqueda */}
                <View style={styles.tarjeta}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.etiqueta}>Código de barras (EAN)</Text>
                        {(ean || articulo || color || talla || skus.length > 0) && (
                            <Pressable onPress={limpiar} hitSlop={10}>
                                <Text style={{ color: C.acento, fontSize: 13 }}>Limpiar</Text>
                            </Pressable>
                        )}
                    </View>
                    <View style={styles.inputFila}>
                        <TextInput
                            value={ean}
                            onChangeText={t => setEan(t.replace(/\D/g, ''))}
                            placeholder="7424667593072"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            autoFocus
                            blurOnSubmit={false}
                            onSubmitEditing={() => buscar()}
                            style={styles.input}
                        />
                    </View>

                    <Text style={styles.etiqueta}>o Artículo / Estilo</Text>
                    {/* Tipo: Libre = texto; un tipo = casillas con el inicio del codigo ya puesto */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} keyboardShouldPersistTaps="handled">
                        {[null, ...tipos].map(t => {
                            const activo = (t?.tipoId ?? 0) === (tipo?.tipoId ?? 0)
                            return (
                                <Pressable key={t?.tipoId ?? 0} onPress={() => elegirTipo(t)}
                                    style={[styles.chip, activo && styles.chipActivo]}>
                                    <Text style={[styles.chipTexto, activo && { color: C.acento, fontWeight: 'bold' }]}>{t ? t.nombre : 'Libre'}</Text>
                                </Pressable>
                            )
                        })}
                    </ScrollView>

                    {!tipo && (
                        <View style={styles.inputFila}>
                            <TextInput
                                value={articulo}
                                onChangeText={setArticulo}
                                placeholder="30 1 1 995 36 0016 · KP995 · PR510AM"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="characters"
                                onSubmitEditing={() => buscar()}
                                style={styles.input}
                            />
                        </View>
                    )}

                    {tipo && (
                        <View style={{ marginBottom: 12 }}>
                            <View style={styles.casillas}>
                                {tipo.casillas.map((c, i) => c.fijo ? (
                                    <Text key={i} style={styles.casillaFija}>{c.valor}</Text>
                                ) : (
                                    <View key={i} style={{ alignItems: 'center', marginRight: 6 }}>
                                        <TextInput
                                            value={casillas[i] ?? ''}
                                            onChangeText={t => cambiarCasilla(i, t)}
                                            maxLength={c.largo}
                                            keyboardType="numeric"
                                            placeholder={'_'.repeat(c.largo)}
                                            placeholderTextColor="#C4C9D0"
                                            onSubmitEditing={() => buscar()}
                                            style={[styles.casilla, { width: 18 + c.largo * 13 }]}
                                        />
                                        <Text style={styles.casillaEtiqueta}>{c.etiqueta || ' '}</Text>
                                    </View>
                                ))}
                            </View>
                            {!!tipo.ayuda && <Text style={styles.datoSecundario}>{tipo.ayuda}. Casilla vacía = cualquiera.</Text>}
                        </View>
                    )}

                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 3, marginRight: 10 }}>
                            <Text style={styles.etiqueta}>Color (código o nombre){!ean.trim() ? ' *' : ''}</Text>
                            <View style={styles.inputFila}>
                                <TextInput value={color} onChangeText={setColor} placeholder="GI / JADE" placeholderTextColor="#9CA3AF"
                                    autoCapitalize="characters" onSubmitEditing={() => buscar()} style={styles.input} />
                            </View>
                        </View>
                        <View style={{ flex: 2 }}>
                            <Text style={styles.etiqueta}>Talla</Text>
                            <View style={styles.inputFila}>
                                <TextInput value={talla} onChangeText={setTalla} placeholder="L" placeholderTextColor="#9CA3AF"
                                    autoCapitalize="characters" onSubmitEditing={() => buscar()} style={styles.input} />
                            </View>
                        </View>
                    </View>

                    <Pressable
                        onPress={() => buscar()}
                        disabled={buscando}
                        style={({ pressed }) => [styles.boton, { backgroundColor: C.acento, opacity: pressed ? 0.8 : 1, marginBottom: 0 }]}
                    >
                        {buscando
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <><Icon name="search" size={14} color="#fff" /><Text style={styles.botonTexto}>  Buscar</Text></>}
                    </Pressable>
                </View>

                {/* Resultados. Con codigo de barras: se toca el de la prenda.
                    Sin codigo de barras: se marcan varias tallas, cada una con su cantidad. */}
                {(skus.length > 1 || (multiple && skus.length > 0)) && (
                    <View style={styles.tarjeta}>
                        <Text style={styles.etiqueta}>
                            {skus.length > 300
                                ? 'Más de 300 resultados: agregue color o talla para acotar'
                                : `${skus.length} tallas en ${agruparPorArticulo(skus).length} artículo(s): ${multiple
                                    ? 'marque las tallas y la cantidad de cada una'
                                    : 'toque el de la prenda'}`}
                        </Text>
                        {agruparPorArticulo(skus.slice(0, 300)).map(g => {
                            const partes = g.articulo.split(' ')
                            const secuencia = partes.length > 1 ? partes[partes.length - 1] : ''
                            return (
                                <View key={`${g.articulo}|${g.colorId}`} style={styles.grupo}>
                                    {/* Encabezado del articulo: la secuencia resaltada distingue articulos del mismo estilo */}
                                    <Text style={styles.grupoArticulo}>
                                        {partes.slice(0, -1).join(' ')} <Text style={{ color: C.acento }}>{secuencia}</Text>
                                    </Text>
                                    <Text style={styles.datoSecundario} numberOfLines={1}>{g.descripcion} · {g.colorId} - {g.colorNombre}</Text>
                                    {g.tallas.map(s => {
                                        const marcada = multiple ? seleccion[s.ean] !== undefined : datos?.ean === s.ean
                                        return (
                                            <Pressable key={s.ean} onPress={() => multiple ? alternarTalla(s) : cargarDatos(s.ean)}
                                                style={[styles.resultado, marcada && { borderColor: C.acento, backgroundColor: C.seleccion }]}>
                                                {multiple && (
                                                    <Icon name={marcada ? 'check-square' : 'square'} size={18} color={marcada ? C.acento : C.texto2} style={{ marginRight: 6 }} />
                                                )}
                                                <Text style={styles.tallaResultado}>{s.talla}</Text>
                                                <Text style={[styles.datoSecundario, { flex: 1 }]}>{s.ean}</Text>
                                                {multiple && marcada && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Pressable onPress={() => pasoTalla(s.ean, -1)} hitSlop={6} style={styles.pasoChico}><Icon name="minus" size={11} color={C.primario} /></Pressable>
                                                        <TextInput value={seleccion[s.ean]} onChangeText={t => cambiarCantidadTalla(s.ean, t)}
                                                            keyboardType="numeric" maxLength={3} style={styles.cantidadTalla} />
                                                        <Pressable onPress={() => pasoTalla(s.ean, 1)} hitSlop={6} style={styles.pasoChico}><Icon name="plus" size={11} color={C.primario} /></Pressable>
                                                    </View>
                                                )}
                                            </Pressable>
                                        )
                                    })}
                                </View>
                            )
                        })}
                    </View>
                )}
                {cargandoDatos && <ActivityIndicator size="small" color={C.acento} style={{ marginBottom: 10 }} />}

                {/* Datos de la etiqueta */}
                {datos && (
                    <View style={styles.tarjeta}>
                        <Text style={styles.titulo}>{datos.descripcion}</Text>
                        <Text style={styles.dato}>{datos.articulo}</Text>
                        {multiple ? (
                            <>
                                <Text style={styles.dato}>Color: {datos.colorId} - {datos.colorNombre}</Text>
                                <Text style={styles.dato}>
                                    Tallas: {seleccionadas.map(s => `${s.talla} (${parseInt(seleccion[s.ean], 10) || 0})`).join('  ·  ') || '—'}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.dato}>Color: {datos.colorId} - {datos.colorNombre}   ·   Talla: {datos.talla}</Text>
                                <Text style={styles.dato}>EAN: {datos.ean}</Text>
                            </>
                        )}
                        {!!datos.composicion && <Text style={styles.dato}>{datos.composicion}</Text>}
                        <Text style={styles.datoSecundario}>
                            {datos.workOrderId ? `OP más reciente: ${datos.workOrderId}` : 'Sin OP (artículo importado)'}
                            {datos.conjunto || datos.empresa ? ` · ${datos.conjunto || datos.empresa}` : ''}
                            {datos.etiquetasImpresas > 0 ? ` · ${datos.etiquetasImpresas} ya reimpresas` : ''}
                        </Text>
                    </View>
                )}

                {/* Formato, cantidad e impresion */}
                {datos && (
                    <View style={styles.tarjeta}>
                        <Text style={styles.etiqueta}>Formato de etiqueta</Text>
                        {FORMATOS.map(f => {
                            const activo = formato === f.id
                            return (
                                <Pressable key={f.id} onPress={() => elegirFormato(f.id)}
                                    style={[styles.formato, activo && { borderColor: C.acento, backgroundColor: C.seleccion }]}>
                                    <Icon name={activo ? 'dot-circle' : 'circle'} size={16} color={activo ? C.acento : C.texto2} />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={styles.dato}>
                                            {f.id} · {f.nombre}{f.id === datos.formatoSugerido ? '  (sugerido)' : ''}
                                        </Text>
                                        <Text style={styles.datoSecundario}>{f.detalle}</Text>
                                    </View>
                                </Pressable>
                            )
                        })}

                        <Text style={[styles.etiqueta, { marginTop: 6 }]}>
                            {formato === 'F'
                                ? 'Código base (de AX, no se modifica)'
                                : `${formato === 'E' ? 'Style' : 'Estilo'} (corríjalo como viene en la prenda)`}
                        </Text>
                        <View style={styles.inputFila}>
                            <TextInput
                                value={estilo}
                                onChangeText={setEstilo}
                                editable={formato !== 'F'}
                                autoCapitalize="characters"
                                maxLength={30}
                                style={[styles.input, formato === 'F' && { backgroundColor: '#F3F4F6', color: '#6B7280' }]}
                            />
                            {formato !== 'F' && datos && estilo !== estiloSugerido(datos, formato) && (
                                <Pressable onPress={() => setEstilo(estiloSugerido(datos, formato))} hitSlop={10} style={{ padding: 4 }}>
                                    <Icon name="undo" size={14} color="#9CA3AF" />
                                </Pressable>
                            )}
                        </View>

                        <View style={{ flexDirection: 'row' }}>
                            {multiple ? (
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.etiqueta}>Etiquetas a imprimir</Text>
                                    <Text style={styles.titulo}>{totalSeleccion}</Text>
                                    <Text style={styles.datoSecundario}>
                                        {seleccionadas.length} talla(s) · máx. {MAX_ETIQUETAS} por talla y {MAX_ORDEN} por orden
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.etiqueta}>Cantidad (máx. {MAX_ETIQUETAS})</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Pressable onPress={() => cambiarCantidad(-1)} style={styles.paso}><Icon name="minus" size={14} color={C.primario} /></Pressable>
                                        <TextInput value={cantidad} onChangeText={t => setCantidad(t.replace(/\D/g, ''))}
                                            keyboardType="numeric" style={[styles.input, styles.numero]} />
                                        <Pressable onPress={() => cambiarCantidad(1)} style={styles.paso}><Icon name="plus" size={14} color={C.primario} /></Pressable>
                                    </View>
                                </View>
                            )}
                            {formato === 'A' && (
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.etiqueta}>Uds por paquete</Text>
                                    <TextInput value={uds} onChangeText={t => setUds(t.replace(/\D/g, ''))}
                                        keyboardType="numeric" style={[styles.input, styles.numero, { marginHorizontal: 0 }]} />
                                </View>
                            )}
                        </View>

                        {formatoActual.qr && (
                            <>
                                <Text style={[styles.datoSecundario, { marginTop: 10 }]}>Cada etiqueta lleva un serial nuevo en el QR:</Text>
                                <Text style={styles.qr}>{qrEjemplo}</Text>
                            </>
                        )}

                        <Pressable
                            onPress={alImprimir}
                            style={({ pressed }) => [styles.boton, { backgroundColor: C.primario, marginTop: 12, opacity: pressed ? 0.8 : 1 }]}
                        >
                            <Icon name="print" size={15} color="#fff" />
                            <Text style={styles.botonTexto}>  Imprimir {(multiple ? totalSeleccion : cantidadNumero) || ''}</Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>

            {/* Seleccion de impresora */}
            <Modal visible={verImpresoras} transparent animationType="slide" onRequestClose={() => !imprimiendo && setVerImpresoras(false)}>
                <View style={styles.modalFondo}>
                    <View style={styles.modal}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={styles.titulo}>Seleccione impresora</Text>
                            <Pressable onPress={() => setVerImpresoras(false)} disabled={imprimiendo} hitSlop={10}>
                                <Text style={{ color: C.acento, fontSize: 15 }}>Cerrar</Text>
                            </Pressable>
                        </View>
                        {imprimiendo
                            ? <ActivityIndicator size="large" color={C.acento} style={{ marginVertical: 24 }} />
                            : <FlatList
                                data={impresoras}
                                keyExtractor={(item, index) => `${item.iM_IPPRINTER}-${index}`}
                                ListEmptyComponent={<Text style={styles.datoSecundario}>No hay impresoras.</Text>}
                                renderItem={({ item }) => (
                                    <Pressable onPress={() => imprimir(item)} style={styles.impresora}>
                                        <Text style={{ fontSize: 15, color: C.texto }}>{item.iM_DESCRIPTION_PRINTER ?? item.iM_IPPRINTER}</Text>
                                        <Text style={styles.datoSecundario}>{item.iM_IPPRINTER}</Text>
                                    </Pressable>
                                )}
                            />}
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    pantalla: { flex: 1, width: '100%', backgroundColor: C.fondo },
    tarjeta: { backgroundColor: C.superficie, borderRadius: 10, borderWidth: 1, borderColor: C.borde, padding: 14, marginBottom: 12 },
    etiqueta: { fontSize: 13, fontWeight: '600', color: C.texto, marginBottom: 6 },
    inputFila: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.borde, borderRadius: 8, paddingHorizontal: 10, marginBottom: 12, backgroundColor: '#fff' },
    input: { flex: 1, paddingVertical: 8, fontSize: 15, color: C.texto },
    boton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12 },
    botonTexto: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    titulo: { fontSize: 16, fontWeight: 'bold', color: C.primario, marginBottom: 4 },
    dato: { fontSize: 14, color: C.texto },
    datoSecundario: { fontSize: 12, color: C.texto2, marginTop: 2 },
    chip: { borderWidth: 1, borderColor: C.borde, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, backgroundColor: '#fff' },
    chipActivo: { borderColor: C.acento, backgroundColor: C.seleccion },
    chipTexto: { fontSize: 13, color: C.texto },
    casillas: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
    casillaFija: { fontSize: 18, fontWeight: 'bold', color: C.primario, marginRight: 8, paddingVertical: 8, fontFamily: 'monospace' },
    casilla: { borderWidth: 1, borderColor: C.acento, borderRadius: 6, paddingVertical: 6, fontSize: 18, textAlign: 'center', color: C.texto, fontFamily: 'monospace', backgroundColor: '#fff' },
    casillaEtiqueta: { fontSize: 10, color: C.texto2, marginTop: 2 },
    grupo: { borderTopWidth: 1, borderTopColor: C.borde, paddingTop: 8, marginTop: 4 },
    grupoArticulo: { fontSize: 15, fontWeight: 'bold', color: C.primario, fontFamily: 'monospace' },
    pasoChico: { width: 28, height: 30, borderRadius: 6, borderWidth: 1, borderColor: C.borde, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    cantidadTalla: { width: 44, height: 34, marginHorizontal: 4, borderWidth: 1, borderColor: C.acento, borderRadius: 6, textAlign: 'center', fontSize: 16, color: C.texto, paddingVertical: 2, backgroundColor: '#fff' },
    resultado: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.borde, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginTop: 6 },
    tallaResultado: { fontSize: 17, fontWeight: 'bold', color: C.primario, minWidth: 64, maxWidth: 110, marginRight: 8 },
    formato: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.borde, borderRadius: 8, padding: 10, marginBottom: 8 },
    paso: { width: 44, height: 40, borderRadius: 8, borderWidth: 1, borderColor: C.borde, alignItems: 'center', justifyContent: 'center' },
    numero: { flex: 0, width: 72, textAlign: 'center', borderWidth: 1, borderColor: C.borde, borderRadius: 8, marginHorizontal: 10, fontSize: 18 },
    qr: { fontSize: 12, color: C.texto, fontFamily: 'monospace', marginTop: 4 },
    modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modal: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '70%' },
    impresora: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borde },
})
