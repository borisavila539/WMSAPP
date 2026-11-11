import { StackScreenProps } from '@react-navigation/stack'
import { useFocusEffect } from '@react-navigation/native'
import React, { FC, memo, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Keyboard, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, View, unstable_batchedUpdates } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome5'
import SoundPlayer from 'react-native-sound-player'
import { RootStackParams } from '../../navigation/navigation'
import Header from '../../components/Header'
import { navy } from '../../constants/Colors'
import { WMSContext } from '../../context/WMSContext'
import { WMSApiAuditoriaInterna } from '../../api/WMSApiAuditoriaInterna'
import {
    AuditoriaInternaAbrirCajaInterface,
    AuditoriaInternaCajaInterface,
    AuditoriaInternaEscanearInterface,
    AuditoriaInternaLineaInterface,
    AuditoriaInternaPendienteInterface,
    AuditoriaInternaRespuestaInterface
} from '../../interfaces/AuditoriaInterna/AuditoriaInternaInterface'

type props = StackScreenProps<RootStackParams, "AuditoriaInternaScreen">

interface Aviso {
    tipo: 'ok' | 'sobrante' | 'error' | 'info'
    texto: string
}

// Aceptadas con advertencia: sobrante o pieza registrada en otra caja de la misma OP
const ACEPTADA_CON_AVISO = ['SOBRANTE', 'OTRA_CAJA']

// Paleta de la pantalla: superficies neutras y color solo para el estado
const C = {
    fondo: '#F4F6F8',
    superficie: '#FFFFFF',
    borde: '#E5E7EB',
    texto: '#1F2933',
    texto2: '#6B7280',
    pista: '#EEF0F3',
    primario: navy,
    acento: '#176B87',
    ok: '#2E7D32', okFondo: '#E8F5E9',
    alerta: '#B26A00', alertaFondo: '#FFF4E5',
    error: '#C62828', errorFondo: '#FDECEA',
    info: '#1E5A8A', infoFondo: '#E8F1F8',
}

const ESTADO_AVISO = {
    ok: { color: C.ok, fondo: C.okFondo, icono: 'check-circle' },
    sobrante: { color: C.alerta, fondo: C.alertaFondo, icono: 'exclamation-circle' },
    error: { color: C.error, fondo: C.errorFondo, icono: 'times-circle' },
    info: { color: C.info, fondo: C.infoFondo, icono: 'info-circle' },
}

const RESULTADO: Record<string, { texto: string, color: string, fondo: string }> = {
    COMPLETA: { texto: 'Completa', color: C.ok, fondo: C.okFondo },
    FALTANTE: { texto: 'Faltante', color: C.error, fondo: C.errorFondo },
    SOBRANTE: { texto: 'Sobrante', color: C.alerta, fondo: C.alertaFondo },
    MIXTO: { texto: 'Faltante y sobrante', color: C.error, fondo: C.errorFondo },
    // Las unidades cuadran; la unica diferencia es de etiquetas (prendas con otra etiqueta en la misma talla)
    ETIQUETAS: { texto: 'Completa · dif. etiquetas', color: C.alerta, fondo: C.alertaFondo },
}

const formatearFecha = (valor: string | null) => {
    if (!valor) return '-'
    const d = new Date(valor)
    if (isNaN(d.getTime())) return '-'
    const dos = (n: number) => String(n).padStart(2, '0')
    return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(d.getHours())}:${dos(d.getMinutes())}`
}

const Progreso: FC<{ valor: number, total: number, color: string, alto?: number }> = ({ valor, total, color, alto = 6 }) => {
    const pct = total > 0 ? Math.min(100, (valor / total) * 100) : (valor > 0 ? 100 : 0)
    return (
        <View style={[styles.pista, { height: alto, borderRadius: alto / 2 }]}>
            <View style={{ width: `${pct}%`, height: alto, borderRadius: alto / 2, backgroundColor: color }} />
        </View>
    )
}

const Chip: FC<{ texto: string, color?: string, fondo?: string }> = ({ texto, color = C.texto2, fondo = C.pista }) => (
    <View style={[styles.chip, { backgroundColor: fondo }]}>
        <Text style={[styles.chipTexto, { color }]}>{texto}</Text>
    </View>
)

const colorLinea = (item: AuditoriaInternaLineaInterface): string => {
    if (item.sobrantes > 0) return C.alerta
    if (item.faltantes == 0 && item.cantidadEscaneada > 0) return C.ok
    return C.acento
}

// Fila de talla memorizada: en cada escaneo la API devuelve todas las lineas como objetos nuevos,
// pero solo se repinta la talla cuyas cantidades cambiaron
const LineaTalla = memo(({ item }: { item: AuditoriaInternaLineaInterface }) => {
    const color = colorLinea(item)
    return (
        <View style={styles.linea}>
            <View style={styles.fila}>
                <Text style={styles.tallaTexto}>Talla {item.talla}</Text>
                <Text style={styles.lineaConteo}>{item.cantidadEscaneada} / {item.cantidadEsperada}</Text>
            </View>
            <View style={{ marginVertical: 6 }}>
                <Progreso valor={item.cantidadEscaneada} total={item.cantidadEsperada} color={color} />
            </View>
            <View style={styles.fila}>
                <Text style={styles.terciario}>{item.ean}</Text>
                <Text style={[styles.terciario, { color: item.faltantes > 0 || item.sobrantes > 0 ? color : C.ok }]}>
                    {item.faltantes > 0 ? `Faltan ${item.faltantes}` : ''}
                    {item.faltantes > 0 && item.sobrantes > 0 ? '  ·  ' : ''}
                    {item.sobrantes > 0 ? `Sobran ${item.sobrantes}` : ''}
                    {item.faltantes == 0 && item.sobrantes == 0 ? 'Completa' : ''}
                </Text>
            </View>
            {item.diferenciaEtiqueta > 0 &&
                <Text style={[styles.terciario, { color: C.alerta, marginTop: 2 }]}>
                    {item.diferenciaEtiqueta} con etiqueta distinta a la registrada en empaque
                </Text>
            }
        </View>
    )
}, (antes, despues) =>
    antes.item.id == despues.item.id &&
    antes.item.cantidadEscaneada == despues.item.cantidadEscaneada &&
    antes.item.cantidadEsperada == despues.item.cantidadEsperada &&
    antes.item.faltantes == despues.item.faltantes &&
    antes.item.sobrantes == despues.item.sobrantes &&
    antes.item.diferenciaEtiqueta == despues.item.diferenciaEtiqueta)

export const AuditoriaInternaScreen: FC<props> = ({ navigation }) => {
    const { WMSState } = useContext(WMSContext)

    const [pendientes, setPendientes] = useState<AuditoriaInternaPendienteInterface[]>([])
    const [caja, setCaja] = useState<AuditoriaInternaCajaInterface | null>(null)
    const [lineas, setLineas] = useState<AuditoriaInternaLineaInterface[]>([])
    const [aviso, setAviso] = useState<Aviso | null>(null)
    const [textoLector, setTextoLector] = useState<string>('')
    // El lector no necesita teclado; solo se muestra para escribir un codigo a mano
    const [tecladoManual, setTecladoManual] = useState<boolean>(false)
    const [cargando, setCargando] = useState<boolean>(false)

    const [modalCierre, setModalCierre] = useState<boolean>(false)
    const [observaciones, setObservaciones] = useState<string>('')
    const [guardando, setGuardando] = useState<boolean>(false)

    const textInputRef = useRef<TextInput>(null)

    // Caja cerrada: solo consulta (sin escaneo de piezas ni cierre)
    const soloLectura = caja?.estado === 'CERRADA'

    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }

    const mensajeError = (err: any): string => {
        return err?.response?.data?.message ?? err?.message ?? 'Error de comunicacion con el servidor.'
    }

    const getPendientes = async () => {
        setCargando(true)
        try {
            const resp = await WMSApiAuditoriaInterna.get<AuditoriaInternaPendienteInterface[]>('Pendientes')
            setPendientes(resp.data)
        } catch (err) {
            setAviso({ tipo: 'error', texto: mensajeError(err) })
        }
        setCargando(false)
    }

    const abrirCaja = async (qrCaja: string) => {
        setCargando(true)
        try {
            const resp = await WMSApiAuditoriaInterna.post<AuditoriaInternaAbrirCajaInterface>('AbrirCaja', {
                qrCaja: qrCaja,
                usuario: WMSState.usuario
            })

            const respuesta = resp.data.respuesta
            const nuevaCaja = resp.data.caja
            // Despues de un await los setState no se agrupan solos: se agrupan para repintar una sola vez
            unstable_batchedUpdates(() => {
                if (respuesta?.exito && nuevaCaja) {
                    // ADVERTENCIA: se audita igual, pero la caja sigue abierta en empaque
                    const advertencia = respuesta.resultado == 'ADVERTENCIA'
                    PlaySound(advertencia ? 'repeat' : 'success')
                    setCaja(nuevaCaja)
                    setLineas(resp.data.lineas)
                    setObservaciones(nuevaCaja.observaciones ?? '')
                    setAviso({ tipo: advertencia ? 'sobrante' : 'ok', texto: respuesta.mensaje })
                } else if (respuesta?.resultado == 'CERRADA' && nuevaCaja) {
                    // Caja ya auditada: se muestra en modo consulta
                    PlaySound('repeat')
                    setCaja(nuevaCaja)
                    setLineas(resp.data.lineas)
                    setObservaciones('')
                    setAviso({ tipo: 'info', texto: 'Caja auditada y cerrada. Solo consulta.' })
                } else {
                    PlaySound('error')
                    setAviso({ tipo: 'error', texto: respuesta?.mensaje ?? 'No se pudo abrir la caja.' })
                }
                setCargando(false)
            })
        } catch (err) {
            PlaySound('error')
            unstable_batchedUpdates(() => {
                setAviso({ tipo: 'error', texto: mensajeError(err) })
                setCargando(false)
            })
        }
    }

    const escanearPieza = async (qrPieza: string) => {
        if (!caja) return

        setCargando(true)
        try {
            const resp = await WMSApiAuditoriaInterna.post<AuditoriaInternaEscanearInterface>('EscanearPieza', {
                auditoriaId: caja.id,
                codigo: qrPieza,
                usuario: WMSState.usuario
            })

            const escaneo = resp.data.escaneo

            // El sonido es la confirmacion que oye el auditor: se reproduce antes de repintar
            if (escaneo) {
                const conAviso = ACEPTADA_CON_AVISO.includes(escaneo.resultado)
                PlaySound(escaneo.exito ? (conAviso ? 'repeat' : 'success') : (escaneo.resultado == 'YA_ESCANEADA' ? 'repeat' : 'error'))
            }

            // Un solo repintado por escaneo
            unstable_batchedUpdates(() => {
                setLineas(resp.data.lineas)
                if (escaneo) {
                    setCaja(actual => actual ? { ...actual, cantidadEsperada: escaneo.cajaEsperada, cantidadEscaneada: escaneo.cajaEscaneada } : actual)
                    setAviso({
                        tipo: escaneo.exito ? (ACEPTADA_CON_AVISO.includes(escaneo.resultado) ? 'sobrante' : 'ok') : 'error',
                        texto: escaneo.mensaje
                    })
                }
                setCargando(false)
            })
        } catch (err) {
            PlaySound('error')
            unstable_batchedUpdates(() => {
                setAviso({ tipo: 'error', texto: mensajeError(err) })
                setCargando(false)
            })
        }
    }

    const guardarCierre = async (cerrar: boolean) => {
        if (!caja) return

        setGuardando(true)
        try {
            const resp = await WMSApiAuditoriaInterna.post<AuditoriaInternaRespuestaInterface>('CerrarCaja', {
                auditoriaId: caja.id,
                observaciones: observaciones.trim() == '' ? null : observaciones.trim(),
                usuario: WMSState.usuario,
                cerrar: cerrar
            })

            if (resp.data.exito) {
                PlaySound('success')
                setModalCierre(false)
                salirDeCaja()
                setAviso({ tipo: 'ok', texto: `Caja ${caja.numeroCaja} de la ${caja.op}: ${resp.data.mensaje}` })
            } else {
                setAviso({ tipo: 'error', texto: resp.data.mensaje })
                PlaySound('error')
            }
        } catch (err) {
            setAviso({ tipo: 'error', texto: mensajeError(err) })
            PlaySound('error')
        }
        setGuardando(false)
    }

    // La lista de pendientes se recarga sola al quedar sin caja (useFocusEffect depende de caja)
    const salirDeCaja = () => {
        setCaja(null)
        setLineas([])
        setObservaciones('')
        setAviso(null)
    }

    // Con una caja abierta se escanean piezas; sin caja o en consulta, se abre otra caja.
    const procesarCodigo = (valor: string) => {
        const codigo = valor.trim()
        if (codigo.length == 0) return

        if (caja && !soloLectura) {
            escanearPieza(codigo)
        } else {
            abrirCaja(codigo)
        }
    }

    // El lector inyecta el codigo completo en el TextInput (un solo evento).
    // El codigo se envia en el mismo evento (sin esperar un repintado) y el campo,
    // que es controlado, se limpia despues con el efecto de abajo: clear() dentro de
    // onChangeText no es confiable en Android y los QR se pegaban uno tras otro.
    // Con el teclado manual se escribe caracter por caracter y se envia con Enter.
    const alCambiarTexto = (valor: string) => {
        setTextoLector(valor)
        if (!tecladoManual) procesarCodigo(valor)
    }

    const alEnviarManual = () => {
        procesarCodigo(textoLector)
        setTextoLector('')
        setTecladoManual(false)
        Keyboard.dismiss()
    }

    const abrirTecladoManual = () => {
        setTecladoManual(true)
        setTextoLector('')
        // Se re-enfoca para que Android muestre el teclado con la nueva propiedad
        textInputRef.current?.blur()
        setTimeout(() => textInputRef.current?.focus(), 100)
    }

    useEffect(() => {
        if (!tecladoManual && textoLector.length > 0) setTextoLector('')
    }, [textoLector])

    useFocusEffect(
        useCallback(() => {
            if (!caja) getPendientes()
        }, [caja])
    )

    // El lector escribe en el campo con foco: se recupera al cerrar el modal o cambiar de caja
    useEffect(() => {
        if (!modalCierre) {
            const timer = setTimeout(() => textInputRef.current?.focus(), 150)
            return () => clearTimeout(timer)
        }
    }, [modalCierre, caja?.id])

    const totalEscaneos = lineas.reduce((total, item) => total + item.escaneos, 0)
    const totalFaltantes = lineas.reduce((total, item) => total + item.faltantes, 0)
    const totalSobrantes = lineas.reduce((total, item) => total + item.sobrantes, 0)
    const totalEtiquetas = lineas.reduce((total, item) => total + (item.diferenciaEtiqueta ?? 0), 0)

    const placeholder = !caja ? 'Escanear QR de la caja' : soloLectura ? 'Escanear otra caja' : 'Escanear QR de la pieza'

    // ---------------------------------------------------------------- Render

    const renderPendiente = (item: AuditoriaInternaPendienteInterface) => (
        <Pressable
            style={({ pressed }) => [styles.tarjeta, pressed && styles.presionado]}
            onPress={() => abrirCaja(`${item.op},${item.numeroCaja}`)}
            disabled={cargando}
        >
            <View style={styles.fila}>
                <Text style={styles.titulo}>{item.op}</Text>
                <Text style={styles.cajaNum}>Caja {item.numeroCaja}</Text>
            </View>
            <Text style={styles.secundario} numberOfLines={1}>
                {item.estilo ?? item.articulo}  ·  {item.colorDescripcion ?? ''}
            </Text>
            <View style={[styles.fila, { marginTop: 8 }]}>
                <Chip texto={item.origen == 'PLANTA' ? 'Planta' : (item.contratista ?? 'Contratista')} />
                <Text style={styles.secundario}>{item.cantidadEscaneada} / {item.cantidadEsperada} uds</Text>
            </View>
            <View style={{ marginTop: 6 }}>
                <Progreso valor={item.cantidadEscaneada} total={item.cantidadEsperada} color={C.acento} alto={4} />
            </View>
        </Pressable>
    )

    const resumenCaja = (c: AuditoriaInternaCajaInterface) => {
        const resultado = c.resultado ? RESULTADO[c.resultado] : undefined
        return (
            <View style={styles.tarjeta}>
                <View style={styles.fila}>
                    <Text style={styles.titulo} numberOfLines={1}>{c.estilo ?? c.articulo}</Text>
                    {soloLectura && resultado && <Chip texto={resultado.texto} color={resultado.color} fondo={resultado.fondo} />}
                </View>
                <Text style={styles.secundario} numberOfLines={1}>{c.articulo}  ·  {c.colorDescripcion ?? ''}</Text>

                <View style={styles.chips}>
                    <Chip texto={c.origen == 'PLANTA' ? 'Planta' : (c.contratista ?? 'Contratista')} />
                    {c.categoriaInterna ? <Chip texto={c.categoriaInterna} /> : null}
                    {c.categoriaCaja ? <Chip texto={c.categoriaCaja} /> : null}
                    {c.lote ? <Chip texto={`Lote ${c.lote}`} /> : null}
                    {c.plDespacho ? <Chip texto={`PL ${c.plDespacho}`} /> : null}
                </View>

                <View style={[styles.fila, { alignItems: 'flex-end', marginTop: 12 }]}>
                    <Text style={styles.numeroGrande}>
                        {c.cantidadEscaneada}
                        <Text style={styles.numeroTotal}> / {c.cantidadEsperada} uds</Text>
                    </Text>
                    <Text style={styles.terciario}>{totalEscaneos} escaneos</Text>
                </View>
                <View style={{ marginTop: 6 }}>
                    <Progreso valor={c.cantidadEscaneada} total={c.cantidadEsperada}
                        color={soloLectura && resultado ? resultado.color : C.acento} alto={8} />
                </View>

                <Text style={[styles.terciario, { marginTop: 8 }]}>
                    {c.modoValidacion == 'PIEZA' ? 'Valida la pieza exacta (registro de empaque)' : 'Valida solo cantidad (empaque manual)'}
                </Text>

                {soloLectura && (
                    <View style={styles.datosCierre}>
                        <View style={styles.datoFila}>
                            <Text style={styles.datoLabel}>Auditó</Text>
                            <Text style={styles.datoValor}>{c.usuarioInicio}  ·  {formatearFecha(c.fechaInicio)}</Text>
                        </View>
                        <View style={styles.datoFila}>
                            <Text style={styles.datoLabel}>Cerró</Text>
                            <Text style={styles.datoValor}>{c.usuarioCierre ?? '-'}  ·  {formatearFecha(c.fechaCierre)}</Text>
                        </View>
                        <View style={styles.datoFila}>
                            <Text style={styles.datoLabel}>Faltan / Sobran</Text>
                            <Text style={styles.datoValor}>{c.faltantes} / {c.sobrantes} uds</Text>
                        </View>
                        {c.diferenciaEtiqueta > 0 ? (
                            <View style={styles.datoFila}>
                                <Text style={styles.datoLabel}>Dif. etiquetas</Text>
                                <Text style={[styles.datoValor, { color: C.alerta }]}>{c.diferenciaEtiqueta} uds con otra etiqueta</Text>
                            </View>
                        ) : null}
                        {c.observaciones ? (
                            <View style={styles.datoFila}>
                                <Text style={styles.datoLabel}>Observaciones</Text>
                                <Text style={styles.datoValor}>{c.observaciones}</Text>
                            </View>
                        ) : null}
                    </View>
                )}
            </View>
        )
    }

    const estiloAviso = aviso ? ESTADO_AVISO[aviso.tipo] : null

    return (
        <View style={styles.pantalla}>
            <Header texto1='' texto2='Auditoría Interna' texto3={caja ? `${caja.op}  ·  Caja ${caja.numeroCaja}` : ''} />

            <View style={styles.contenido}>
                <View style={[styles.scanner, { borderColor: caja && !soloLectura ? C.ok : C.borde }]}>
                    <Icon name='qrcode' size={16} color={C.texto2} />
                    <TextInput
                        ref={textInputRef}
                        placeholder={placeholder}
                        placeholderTextColor={C.texto2}
                        style={styles.scannerInput}
                        onChangeText={alCambiarTexto}
                        value={textoLector}
                        autoFocus
                        showSoftInputOnFocus={tecladoManual}
                        returnKeyType='send'
                        blurOnSubmit={false}
                        onSubmitEditing={() => tecladoManual ? alEnviarManual() : null}
                        onBlur={() => modalCierre ? null : textInputRef.current?.focus()}
                    />
                    {cargando && <ActivityIndicator size={18} color={C.acento} />}
                    <Pressable
                        onPress={() => tecladoManual ? (setTecladoManual(false), setTextoLector(''), Keyboard.dismiss()) : abrirTecladoManual()}
                        hitSlop={10}
                        style={[styles.botonTeclado, tecladoManual && { backgroundColor: C.infoFondo }]}
                    >
                        <Icon name='keyboard' size={16} color={tecladoManual ? C.info : C.texto2} />
                    </Pressable>
                </View>

                {tecladoManual &&
                    <Text style={[styles.terciario, { marginTop: 4, marginLeft: 4 }]}>Escriba el código y presione Enviar.</Text>
                }

                {aviso && estiloAviso &&
                    <View style={[styles.aviso, { backgroundColor: estiloAviso.fondo, borderLeftColor: estiloAviso.color }]}>
                        <Icon name={estiloAviso.icono} size={16} color={estiloAviso.color} solid />
                        <Text style={[styles.avisoTexto, { color: estiloAviso.color }]}>{aviso.texto}</Text>
                    </View>
                }

                {!caja ?
                    <FlatList
                        data={pendientes}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => renderPendiente(item)}
                        ListHeaderComponent={<Text style={styles.seccion}>Cajas abiertas  ·  {pendientes.length}</Text>}
                        ListEmptyComponent={
                            <View style={styles.vacio}>
                                <Icon name='box-open' size={28} color={C.texto2} />
                                <Text style={[styles.secundario, { marginTop: 8 }]}>No hay cajas abiertas.</Text>
                                <Text style={styles.terciario}>Escanee el QR de una caja para empezar.</Text>
                            </View>
                        }
                        refreshControl={
                            <RefreshControl refreshing={false} onRefresh={() => getPendientes()} colors={[C.acento]} />
                        }
                        contentContainerStyle={{ paddingBottom: 16 }}
                    />
                    :
                    <FlatList
                        data={lineas}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => <LineaTalla item={item} />}
                        ListHeaderComponent={
                            <View>
                                {resumenCaja(caja)}
                                <Text style={styles.seccion}>Por talla</Text>
                            </View>
                        }
                        contentContainerStyle={{ paddingBottom: 16 }}
                    />
                }
            </View>

            {caja &&
                <View style={styles.barraAcciones}>
                    {soloLectura ?
                        <Pressable style={[styles.boton, styles.botonPrimario, { flex: 1 }]} onPress={salirDeCaja}>
                            <Text style={styles.botonPrimarioTexto}>Salir</Text>
                        </Pressable>
                        :
                        <>
                            <Pressable style={[styles.boton, styles.botonSecundario]} onPress={salirDeCaja} disabled={cargando}>
                                <Text style={styles.botonSecundarioTexto}>Salir</Text>
                            </Pressable>
                            <Pressable style={[styles.boton, styles.botonPrimario]} onPress={() => setModalCierre(true)} disabled={cargando}>
                                <Text style={styles.botonPrimarioTexto}>Cerrar caja</Text>
                            </Pressable>
                        </>
                    }
                </View>
            }

            <Modal visible={modalCierre} transparent={true} animationType='fade' onRequestClose={() => setModalCierre(false)}>
                <View style={styles.modalFondo}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitulo}>Cerrar caja {caja?.numeroCaja}</Text>
                        <Text style={styles.secundario}>{caja?.op}</Text>

                        <View style={styles.totales}>
                            <View style={styles.total}>
                                <Text style={styles.totalLabel}>Esperado</Text>
                                <Text style={styles.totalValor}>{caja?.cantidadEsperada}</Text>
                            </View>
                            <View style={styles.total}>
                                <Text style={styles.totalLabel}>Escaneado</Text>
                                <Text style={styles.totalValor}>{caja?.cantidadEscaneada}</Text>
                            </View>
                            <View style={styles.total}>
                                <Text style={styles.totalLabel}>Faltan</Text>
                                <Text style={[styles.totalValor, totalFaltantes > 0 && { color: C.error }]}>{totalFaltantes}</Text>
                            </View>
                            <View style={styles.total}>
                                <Text style={styles.totalLabel}>Sobran</Text>
                                <Text style={[styles.totalValor, totalSobrantes > 0 && { color: C.alerta }]}>{totalSobrantes}</Text>
                            </View>
                        </View>

                        {totalEtiquetas > 0 &&
                            <View style={[styles.aviso, { backgroundColor: C.alertaFondo, borderLeftColor: C.alerta }]}>
                                <Icon name='tags' size={14} color={C.alerta} />
                                <Text style={[styles.avisoTexto, { color: C.alerta }]}>
                                    {totalEtiquetas} {totalEtiquetas == 1 ? 'prenda trae' : 'prendas traen'} una etiqueta distinta a la registrada en empaque (misma talla). No cuentan como faltante ni sobrante.
                                </Text>
                            </View>
                        }

                        <TextInput
                            placeholder='Observaciones (motivo del faltante o sobrante)'
                            placeholderTextColor={C.texto2}
                            style={styles.observaciones}
                            value={observaciones}
                            onChangeText={(value) => setObservaciones(value)}
                            multiline
                            maxLength={500}
                        />

                        {guardando ?
                            <ActivityIndicator style={{ marginTop: 16 }} color={C.acento} />
                            :
                            <View style={{ width: '100%', marginTop: 16 }}>
                                <Pressable style={[styles.botonModal, styles.botonPrimario]} onPress={() => guardarCierre(true)}>
                                    <Text style={styles.botonPrimarioTexto}>Cerrar caja</Text>
                                </Pressable>
                                <Pressable style={[styles.botonModal, styles.botonSecundario, { marginTop: 8 }]} onPress={() => guardarCierre(false)}>
                                    <Text style={styles.botonSecundarioTexto}>Guardar y dejar abierta</Text>
                                </Pressable>
                                <Pressable style={[styles.botonModal, { marginTop: 4 }]} onPress={() => setModalCierre(false)}>
                                    <Text style={[styles.botonSecundarioTexto, { color: C.texto2 }]}>Cancelar</Text>
                                </Pressable>
                            </View>
                        }
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    pantalla: {
        flex: 1,
        width: '100%',
        backgroundColor: C.fondo
    },
    contenido: {
        flex: 1,
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        paddingHorizontal: 12
    },
    scanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.superficie,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginTop: 10,
        height: 48
    },
    scannerInput: {
        flex: 1,
        marginHorizontal: 10,
        color: C.texto,
        fontSize: 15
    },
    botonTeclado: {
        marginLeft: 8,
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    aviso: {
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginTop: 8
    },
    avisoTexto: {
        flex: 1,
        marginLeft: 10,
        fontWeight: '600'
    },
    seccion: {
        color: C.texto2,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 14,
        marginBottom: 6
    },
    tarjeta: {
        backgroundColor: C.superficie,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.borde,
        padding: 14,
        marginTop: 8
    },
    presionado: {
        backgroundColor: '#F9FAFB'
    },
    fila: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    titulo: {
        flex: 1,
        color: C.texto,
        fontSize: 15,
        fontWeight: '700'
    },
    cajaNum: {
        color: C.acento,
        fontWeight: '700'
    },
    secundario: {
        color: C.texto2,
        fontSize: 13,
        marginTop: 2
    },
    terciario: {
        color: C.texto2,
        fontSize: 12
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10
    },
    chip: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginRight: 6,
        marginBottom: 4
    },
    chipTexto: {
        fontSize: 11,
        fontWeight: '700'
    },
    numeroGrande: {
        color: C.texto,
        fontSize: 26,
        fontWeight: '700'
    },
    numeroTotal: {
        color: C.texto2,
        fontSize: 15,
        fontWeight: '600'
    },
    pista: {
        width: '100%',
        backgroundColor: C.pista,
        overflow: 'hidden'
    },
    datosCierre: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: C.borde
    },
    datoFila: {
        flexDirection: 'row',
        marginTop: 4
    },
    datoLabel: {
        width: 110,
        color: C.texto2,
        fontSize: 12
    },
    datoValor: {
        flex: 1,
        color: C.texto,
        fontSize: 12,
        fontWeight: '600'
    },
    linea: {
        backgroundColor: C.superficie,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.borde,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 6
    },
    tallaTexto: {
        color: C.texto,
        fontWeight: '700'
    },
    lineaConteo: {
        color: C.texto,
        fontWeight: '700'
    },
    vacio: {
        alignItems: 'center',
        paddingVertical: 40
    },
    barraAcciones: {
        flexDirection: 'row',
        backgroundColor: C.superficie,
        borderTopWidth: 1,
        borderTopColor: C.borde,
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    boton: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4
    },
    // Botones apilados del modal: sin flex (en columna, flex: 1 colapsa la altura)
    botonModal: {
        width: '100%',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    botonPrimario: {
        backgroundColor: C.primario
    },
    botonPrimarioTexto: {
        color: '#FFFFFF',
        fontWeight: '700'
    },
    botonSecundario: {
        backgroundColor: C.superficie,
        borderWidth: 1,
        borderColor: C.borde
    },
    botonSecundarioTexto: {
        color: C.texto,
        fontWeight: '700'
    },
    modalFondo: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00000066',
        padding: 16
    },
    modal: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: C.superficie,
        borderRadius: 16,
        padding: 18,
        alignItems: 'stretch'
    },
    modalTitulo: {
        color: C.texto,
        fontSize: 18,
        fontWeight: '700'
    },
    totales: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        marginHorizontal: -4
    },
    total: {
        width: '50%',
        padding: 4
    },
    totalLabel: {
        color: C.texto2,
        fontSize: 12
    },
    totalValor: {
        color: C.texto,
        fontSize: 22,
        fontWeight: '700'
    },
    observaciones: {
        minHeight: 80,
        borderWidth: 1,
        borderColor: C.borde,
        borderRadius: 10,
        padding: 10,
        marginTop: 12,
        textAlignVertical: 'top',
        color: C.texto
    }
})
