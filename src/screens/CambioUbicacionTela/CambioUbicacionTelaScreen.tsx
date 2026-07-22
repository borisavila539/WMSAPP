import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useCallback, useMemo, useRef, useState } from 'react'
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ListRenderItemInfo, Alert, } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { RootStackParams } from '../../navigation/navigation'
import Header from '../../components/Header'
import { black, blue, grey } from '../../constants/Colors'
import RolloCard, { Rollo } from './RolloCard'
import { WMSApiUbicacionRollos } from '../../api/WMSApiUbicacionRollos'
import { Respuesta } from '../../interfaces/Serigrafia/Respuesta'
import SoundPlayer from 'react-native-sound-player'

type props = StackScreenProps<RootStackParams, 'CambioUbicacionTelaScreen'>

const ITEM_HEIGHT = 76
type EstadoUbicacion = 'idle' | 'consultando' | 'existe' | 'noExiste'

interface UbicacionResponse {
    wmslocationid: string
}

export interface RespuestaConsultarRollo {
    numeroRollo: string;
    numeroRolloProveedor: string;
    itemId: string;
    sitio: string;
    almacen: string;
    ubicacion: string;
    cantidad: string;
}

const DATOS_ALMACENES = [
    { label: '21', value: '21' },
    { label: '50', value: '50' },
]

export const CambioUbicacionTelaScreen: FC<props> = () => {
    const [ubicacionDestino, setUbicacionDestino] = useState('')
    const [almacenDestino, setAlmacenDestino] = useState('')
    const [estadoUbicacion, setEstadoUbicacion] = useState<EstadoUbicacion>('idle')
    const [validarEtiquetas, setValidarEtiquetas] = useState(true)
    const [rolloInput, setRolloInput] = useState('')
    const [escaneados, setEscaneados] = useState<Rollo[]>([])
    const [rolloPendiente, setRolloPendiente] = useState<RespuestaConsultarRollo | null>(null)
    const locationInputRef = useRef<TextInput>(null)
    const scanRef = useRef<TextInput>(null)
    const [isLoading, setIsLoading] = useState(false) // Corregido camelCase
    
    /* --------------------------- Handlers --------------------------- */

const agregarUbicacion = useCallback(async (codigoAInsertar: string) => {
    if (!codigoAInsertar || isLoading) return;

    setIsLoading(true);
    setEstadoUbicacion('consultando');

    try {
        // Aseguramos que el código vaya perfectamente limpio
        const codigoLimpio = codigoAInsertar.trim();
        
        // Si crearUbicacion requiere el almacén, pásalo explícitamente
        const creadoExitosamente = await crearUbicacion(codigoLimpio);
        console.log(`Ubicación "${codigoLimpio}" creada exitosamente: ${creadoExitosamente}`);

        if (creadoExitosamente) {
            setEstadoUbicacion('existe');
            requestAnimationFrame(() => scanRef.current?.focus());
        } else {
            setEstadoUbicacion('noExiste');
            Alert.alert('Aviso', 'No se pudo crear la ubicación en el sistema.');
        }
    } catch (error: any) {
        setEstadoUbicacion('noExiste');
        // Imprime el error real en consola para verificar si falta un parámetro
        console.error('Error al crear ubicación:', error);
        Alert.alert('Error de red', 'No se pudo establecer conexión con el servidor. Intente de nuevo.');
    } finally {
        setIsLoading(false);
    }
}, [isLoading]); // 👈 Si crearUbicacion usa variables del componente, agrégalas aquí

const consultarUbicacion = useCallback(async () => {
    const codigo = ubicacionDestino.trim();
    if (!codigo || isLoading) return;

    setIsLoading(true);
    setEstadoUbicacion('consultando');

    let existe = false;
    let debemostrarAlerta = false;

    try {
        existe = await verificarUbicacion(codigo, almacenDestino);
        setEstadoUbicacion(existe ? 'existe' : 'noExiste');

        if (existe) {
            requestAnimationFrame(() => scanRef.current?.focus());
        } else {
            debemostrarAlerta = true;
        }
    } catch (error) {
        setEstadoUbicacion('noExiste');
        Alert.alert('Error', 'Hubo un problema al conectar con el servidor.');
    } finally {
        setIsLoading(false);
    }

    // 💡 MOSTRAR LA ALERTA FUERA DEL TRY/FINALLY 
    // Esto evita que la alerta quede atrapada en un estado de render intermedio
    if (debemostrarAlerta) {
        // Usamos un pequeño timeout para dar tiempo a que Android destruya el spinner de carga
        setTimeout(() => {
            Alert.alert(
                'Ubicación no encontrada',
                `La ubicación "${codigo}" no existe. ¿Deseas agregarla?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Agregar', 
                      onPress: () => {
                        // Invocación limpia con la variable en scope
                        agregarUbicacion(codigo);
                      } 
                    },
                ],
                { cancelable: false }
            );
        }, 100);
    }
}, [ubicacionDestino, almacenDestino, isLoading, agregarUbicacion]);

    const limpiarUbicacion = useCallback(() => {
        if (isLoading) return
        setUbicacionDestino('')
        setEstadoUbicacion('idle')
        requestAnimationFrame(() => locationInputRef.current?.focus())
    }, [isLoading])


    // --- MANEJADOR DE ESCANEO PRINCIPAL ---
    const procesarEscaneoRollo = useCallback(async () => {
        const codigo = rolloInput.trim()
        if (!codigo || isLoading) return
        setRolloInput('')

        // CASO B: Si ya tenemos un rollo consultado y estamos esperando la verificación del proveedor
        if (rolloPendiente) {
            const numerosProveedor = (rolloPendiente.numeroRolloProveedor || '').replace(/\D/g, '');
            const numerosEscaneados = codigo.replace(/\D/g, '');
            console.log(`Validando: Escaneado="${numerosEscaneados}" vs Proveedor="${numerosProveedor}"`)
            
            const esValido =
                numerosProveedor &&
                numerosEscaneados &&
                (numerosEscaneados.includes(numerosProveedor) || numerosProveedor.includes(numerosEscaneados));

            if (esValido) {
                setEscaneados((prev) => {
                    if (prev.some((r) => r.ro === rolloPendiente.numeroRollo)) return prev

                    return [{
                        ro: rolloPendiente.numeroRollo,
                        ubicacionOrigen: rolloPendiente.ubicacion || 'Sin Ubicación',
                        medida: parseFloat(rolloPendiente.cantidad) || 0,
                        unidad: 'm',
                        sitio: rolloPendiente.sitio || '',
                        almacen: rolloPendiente.almacen || ''
                    }, ...prev]
                })
                setRolloPendiente(null)
            } else {
                Alert.alert(
                    'Error de Validación',
                    `El código escaneado "${codigo}" no coincide con el número de proveedor esperado (${rolloPendiente.numeroRolloProveedor}).`
                )
            }
            requestAnimationFrame(() => scanRef.current?.focus())
            return
        }

        // CASO A: Primer Escaneo (Consulta Inicial del número RO)
        setIsLoading(true)
        try {
            const info = await consultarRollo(codigo)

            if (!info || !info.numeroRollo) {
                Alert.alert('No encontrado', `El rollo "${codigo}" no se encontró en el sistema.`)
                return
            }

            if (escaneados.some((r) => r.ro === info.numeroRollo)) {
                PlaySound('error')
                return
            }

            if (!validarEtiquetas) {
                setEscaneados((prev) => {
                    if (prev.some((r) => r.ro === info.numeroRollo)) return prev
                    return [{
                        ro: info.numeroRollo,
                        ubicacionOrigen: info.ubicacion || 'Sin Ubicación',
                        medida: parseFloat(info.cantidad) || 0,
                        unidad: 'm',
                        sitio: info.sitio || '',
                        almacen: info.almacen || ''
                    }, ...prev]
                })
            } else {
                setRolloPendiente(info)
            }
        } catch (error) {
            Alert.alert('Error', `Hubo un problema al consultar el rollo "${codigo}".`)
        } finally {
            setIsLoading(false)
            requestAnimationFrame(() => scanRef.current?.focus())
        }
    }, [rolloInput, rolloPendiente, validarEtiquetas, isLoading])

    // Permite cancelar manualmente una verificación en curso si el usuario se equivocó de rollo
    const cancelarValidacionPendiente = useCallback(() => {
        if (isLoading) return
        setRolloPendiente(null)
        setRolloInput('')
        requestAnimationFrame(() => scanRef.current?.focus())
    }, [isLoading])

    const quitarRollo = useCallback((ro: string) => {
        if (isLoading) return
        Alert.alert(
            'Quitar rollo',
            `¿Estás seguro de que deseas remover el rollo "${ro}" de la lista?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () => {
                        setEscaneados((prev) => prev.filter((r) => r.ro !== ro))
                    }
                }
            ]
        )
    }, [isLoading])

    const limpiarLista = useCallback(() => {
        if (escaneados.length === 0 || isLoading) return

        Alert.alert(
            'Limpiar lista',
            '¿Estás seguro de que deseas remover todos los rollos de la lista actual?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sí, limpiar', style: 'destructive', onPress: () => setEscaneados([]) }
            ]
        )
    }, [escaneados.length, isLoading])

    const registrarCambio = useCallback(() => {
        if (escaneados.length === 0 || !ubicacionDestino.trim() || isLoading) return
        
        const sitioDestino = almacenDestino === '21' ? '1' : almacenDestino === '50' ? '1S' : 'Desconocido'
        const payload = escaneados.map((item) => ({
            CodigoBarraRollo: item.ro,
            SitioOrigen: item.sitio,
            SitioDestino: sitioDestino,
            AlmacenOrigen: item.almacen,
            AlmacenDestino: almacenDestino,
            UbicacionOrigen: item.ubicacionOrigen,
            UbicacionDestino: ubicacionDestino.trim(),
            Cantidad: item.medida?.toString() || '0'
        }))

        try {
            Alert.alert(
                'Confirmar Registro',
                `¿Deseas registrar el cambio de ubicación para ${escaneados.length} rollo(s)?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Confirmar',
                        onPress: async () => {
                            try {
                                setIsLoading(true)
                                const res = await WMSApiUbicacionRollos.post('RegistrarCambioUbicacionRollos', payload)

                                if (res.data && res.data.startsWith('S ')) {
                                    Alert.alert('Éxito', res.data || 'Movimiento de rollos registrado correctamente.', [
                                        {
                                            text: 'Aceptar',
                                            onPress: () => {
                                                setEscaneados([])
                                                setUbicacionDestino('')
                                                setEstadoUbicacion('idle')
                                                requestAnimationFrame(() => locationInputRef.current?.focus())
                                            }
                                        }
                                    ])
                                } else {
                                    Alert.alert('Error en Registro', res.data || 'No se pudo procesar el diario en el sistema.')
                                }
                            } catch (error) {
                                Alert.alert('Error de Red', 'Hubo un fallo al intentar registrar los movimientos en el servidor.')
                            } finally {
                                setIsLoading(false)
                            }
                        }
                    }
                ]
            )
        } catch (error) {
            Alert.alert('Error', 'Sucedió un problema inesperado al preparar los datos.')
            setIsLoading(false)
        }
    }, [escaneados, ubicacionDestino, isLoading])

    /* ----------------------- Llamadas al API --------------------- */

    const verificarUbicacion = async (codigo: string, almacen: string): Promise<boolean> => {
        try {
            const res = await WMSApiUbicacionRollos.get<UbicacionResponse>(`ExistenciaUbicacion/${codigo}/${almacen}`)
            return !!(res.data && res.data.wmslocationid)
        } catch (error: any) {
            if (error?.response?.status === 404) return false
            throw error
        }
    }

    const crearUbicacion = async (_codigo: string): Promise<boolean> => {
        try {
            const empresa = 'IMHN'
            const almacen = almacenDestino
            const pasillo = '01'
            const res = await WMSApiUbicacionRollos.post<Respuesta>(`AgregarUbicacionRollos/${empresa}/${(_codigo)}/${almacen}/${pasillo}`)
            console.log(`Respuesta al crear ubicación "${_codigo}":`, res.data)
            if (res.data && res.data.exito) {
                Alert.alert('Ubicación agregada')
                return true
            } else {
                Alert.alert('Error', res.data?.mensaje || 'No se pudo agregar la ubicación.')
                return false
            }
        } catch (error) {
            throw error
        }
    }

    const consultarRollo = async (codigo: string): Promise<RespuestaConsultarRollo> => {
        const res = await WMSApiUbicacionRollos.get<RespuestaConsultarRollo>(`ConsultarRolloCambioUbicacion/${codigo}`)
        return res.data
    }

    /* ----------------------- Render de la lista --------------------- */

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<Rollo>) => (
            <RolloCard
                rollo={item}
                ubicacionDestino={ubicacionDestino}
                almacenDestino={almacenDestino}
                onDelete={quitarRollo}
            />
        ),
        [quitarRollo, ubicacionDestino, almacenDestino],
    )

    const keyExtractor = useCallback((item: Rollo) => item.ro, [])

    const getItemLayout = useCallback(
        (_: ArrayLike<Rollo> | null | undefined, index: number) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
        }),
        [],
    )

    const puedeRegistrar = useMemo(
        () => estadoUbicacion === 'existe' && escaneados.length > 0 && !isLoading,
        [estadoUbicacion, escaneados.length, isLoading],
    )

    return (
        <View style={styles.root}>
            <Header texto1="" texto2="Cambio Ubicación Tela" texto3="" />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={[styles.formCard, isLoading && styles.disabledContainer]}>
                    <View style={styles.rowDestino}>

                        {/* Almacén */}
                        <View style={styles.almacenContainer}>
                            <Text style={styles.label}>Almacén Destino</Text>
                            <Dropdown
                                disable={isLoading} // Deshabilitar dropdown si carga
                                style={[styles.dropdown, isLoading && styles.disabledInput]}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                containerStyle={styles.dropdownContainer}
                                itemTextStyle={styles.itemTextStyle}
                                activeColor="#E7EEFF"
                                data={DATOS_ALMACENES}
                                labelField="label"
                                valueField="value"
                                placeholder="--"
                                value={almacenDestino}
                                onChange={item => {
                                    setAlmacenDestino(item.value);
                                    requestAnimationFrame(() => locationInputRef.current?.focus())
                                }}
                            />
                        </View>

                        {/* Ubicación */}
                        <View style={styles.ubicacionContainer}>
                            <Text style={styles.label}>Ubicación Destino</Text>

                            <View style={styles.inputRow}>
                                <View style={[
                                    styles.inputContainer, 
                                    styles.flex, 
                                    isLoading && styles.disabledInputContainer
                                ]}>
                                    <TextInput
                                        ref={locationInputRef}
                                        value={ubicacionDestino}
                                        editable={!isLoading} // Deshabilita el input
                                        onChangeText={(t) => {
                                            setUbicacionDestino(t)
                                            if (estadoUbicacion !== 'idle') {
                                                setEstadoUbicacion('idle')
                                            }
                                        }}
                                        onSubmitEditing={consultarUbicacion}
                                        placeholder="Escanear ubicación"
                                        style={[styles.inputStyle, isLoading && styles.disabledInputStyle]}
                                        autoCapitalize="none"
                                    />
                                    {ubicacionDestino.length > 0 && !isLoading && (
                                        <Pressable onPress={limpiarUbicacion} style={styles.clearButton}>
                                            <Text style={styles.clearButtonText}>✕</Text>
                                        </Pressable>
                                    )}
                                </View>

                                <UbicacionBadge estado={estadoUbicacion} />
                            </View>
                        </View>

                    </View>

                    {/* Segmented */}
                    <View style={styles.segment}>
                        <Pressable
                            disabled={isLoading}
                            onPress={() => {
                                setValidarEtiquetas(true)
                                setRolloPendiente(null)
                            }}
                            style={[
                                styles.segBtn, 
                                validarEtiquetas && styles.segBtnOn,
                                isLoading && styles.disabledPressable
                            ]}
                        >
                            <Text style={[styles.segTxt, validarEtiquetas && styles.segTxtOn]}>
                                Aplicar validación
                            </Text>
                        </Pressable>
                        <Pressable
                            disabled={isLoading}
                            onPress={() => {
                                setValidarEtiquetas(false)
                                setRolloPendiente(null)
                            }}
                            style={[
                                styles.segBtn, 
                                !validarEtiquetas && styles.segBtnOn,
                                isLoading && styles.disabledPressable
                            ]}
                        >
                            <Text style={[styles.segTxt, !validarEtiquetas && styles.segTxtOn]}>
                                No aplicar
                            </Text>
                        </Pressable>
                    </View>

                    {/* UI informativa si hay una validación de proveedor pendiente */}
                    {rolloPendiente && (
                        <View style={styles.validationNotice}>
                            <View style={styles.validationNoticeTextContainer}>
                                <Text style={styles.validationLabel}>VALIDACIÓN REQUERIDA:</Text>
                                <Text style={styles.validationSub}>
                                    Escanea el código de proveedor para el Rollo <Text style={{ fontWeight: 'bold' }}>{rolloPendiente.numeroRollo}</Text>
                                </Text>
                            </View>
                            <Pressable 
                                onPress={cancelarValidacionPendiente} 
                                disabled={isLoading}
                                style={[styles.cancelValidationBtn, isLoading && styles.disabledPressable]}
                            >
                                <Text style={styles.cancelValidationTxt}>Cancelar</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Input escaneo de rollos */}
                    <TextInput
                        ref={scanRef}
                        value={rolloInput}
                        editable={!isLoading} // Deshabilita el escáner si está cargando
                        onChangeText={setRolloInput}
                        onSubmitEditing={procesarEscaneoRollo}
                        blurOnSubmit={false}
                        placeholder={
                            rolloPendiente
                                ? "Escanear CÓDIGO DE PROVEEDOR..."
                                : "Escanear código de rollo..."
                        }
                        placeholderTextColor={rolloPendiente ? "#E5484D" : "#A6ABB3"}
                        style={[
                            styles.input,
                            styles.scanInput,
                            rolloPendiente && styles.scanInputValidationPending,
                            isLoading && styles.disabledInput
                        ]}
                        autoCapitalize="none"
                        returnKeyType="done"
                    />
                </View>

                {/* Sección Única del Listado */}
                <View style={styles.listaSeccion}>
                    <View style={styles.listHead}>
                        <View style={styles.colTitleRow}>
                            <Text style={styles.listTitle}>Rollos Escaneados</Text>
                            <Text style={styles.colCount}>{escaneados.length}</Text>
                        </View>
                        {escaneados.length > 0 && (
                            <Pressable 
                                onPress={limpiarLista} 
                                disabled={isLoading} 
                                style={styles.clearListButton}
                            >
                                <Text style={[styles.clearListText, isLoading && styles.disabledTextRed]}>Limpiar Todo</Text>
                            </Pressable>
                        )}
                    </View>

                    <FlatList
                        data={escaneados}
                        renderItem={renderItem}
                        keyExtractor={keyExtractor}
                        getItemLayout={getItemLayout}
                        contentContainerStyle={styles.listPad}
                        initialNumToRender={10}
                        maxToRenderPerBatch={8}
                        windowSize={5}
                        removeClippedSubviews
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={<EmptyHint />}
                    />
                </View>

                {/* Botón registrar */}
                <Pressable
                    onPress={registrarCambio}
                    disabled={!puedeRegistrar}
                    style={[styles.cta, !puedeRegistrar && styles.ctaOff]}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.ctaTxt}>Registrar cambio de ubicación</Text>
                    )}
                </Pressable>
            </KeyboardAvoidingView>
        </View>
    )
}

/* --------------------------- Sub-componentes Visuales --------------------------- */

const UbicacionBadge: FC<{ estado: EstadoUbicacion }> = ({ estado }) => {
    if (estado === 'idle') return null
    if (estado === 'consultando') {
        return <ActivityIndicator style={styles.badge} color={blue} />
    }
    const existe = estado === 'existe'
    return (
        <View style={[styles.badge, existe ? styles.badgeOk : styles.badgeErr]}>
            <Text style={styles.badgeTxt}>{existe ? '✓' : '✕'}</Text>
        </View>
    )
}

const EmptyHint = () => (
    <Text style={styles.empty}>Escanea un código de rollo para iniciar el flujo de traslado…</Text>
)

const styles = StyleSheet.create({
    root: { flex: 1, width: '100%', backgroundColor: grey, alignItems: 'stretch' },
    flex: { flex: 1 },
    formCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 10,
        marginTop: 8,
        borderRadius: 12,
        padding: 10,
        gap: 8,
    },
    field: { gap: 3 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7078',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 4,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F5F7',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E6E8EC',
        paddingRight: 8,
        height: 42,
    },
    inputStyle: {
        flex: 1,
        paddingHorizontal: 10,
        fontSize: 15,
        color: black,
    },
    clearButton: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: 14,
        color: '#A6ABB3',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#F4F5F7',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: Platform.OS === 'ios' ? 8 : 5,
        fontSize: 15,
        color: black,
        borderWidth: 1,
        borderColor: '#E6E8EC',
    },
    scanInput: {
        borderColor: blue,
        borderWidth: 1.5,
    },
    scanInputValidationPending: {
        borderColor: '#E5484D',
        borderWidth: 2,
    },
    badge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeOk: { backgroundColor: '#1DB954' },
    badgeErr: { backgroundColor: '#E5484D' },
    badgeTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    segment: {
        flexDirection: 'row',
        backgroundColor: '#F4F5F7',
        borderRadius: 8,
        padding: 3,
        gap: 3,
    },
    segBtn: {
        flex: 1,
        paddingVertical: 7,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segBtnOn: { backgroundColor: blue },
    segTxt: { fontSize: 12, fontWeight: '600', color: '#6B7078' },
    segTxtOn: { color: '#FFFFFF' },

    /* Estilos del Listado Único */
    listaSeccion: {
        flex: 1,
        marginTop: 4,
    },
    listHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 6,
    },
    colTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    listTitle: { fontSize: 14, fontWeight: '700', color: black },
    colCount: {
        fontSize: 12,
        fontWeight: '700',
        color: blue,
        backgroundColor: '#E7EEFF',
        minWidth: 24,
        textAlign: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        overflow: 'hidden',
    },
    clearListButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    clearListText: {
        fontSize: 12,
        color: '#E5484D',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    listPad: { paddingHorizontal: 10, paddingBottom: 10 },
    empty: {
        textAlign: 'center',
        color: '#A6ABB3',
        fontSize: 14,
        marginTop: 36,
        paddingHorizontal: 24,
        lineHeight: 18,
    },
    cta: {
        backgroundColor: blue,
        marginHorizontal: 10,
        marginBottom: 10,
        marginTop: 4,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
    },
    ctaOff: { backgroundColor: '#B9C0CC' },
    ctaTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    rowDestino: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    almacenContainer: {
        width: 100,
    },
    ubicacionContainer: {
        flex: 1,
    },
    dropdown: {
        height: 42,
        backgroundColor: '#F4F5F7',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E6E8EC',
        paddingHorizontal: 10,
    },
    dropdownContainer: {
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E6E8EC',
    },
    placeholderStyle: {
        fontSize: 15,
        color: '#A6ABB3',
    },
    selectedTextStyle: {
        fontSize: 15,
        color: black,
        fontWeight: '500',
    },
    itemTextStyle: {
        fontSize: 15,
        color: black,
    },

    /* NUEVOS ESTILOS PARA LA SECCIÓN DE VALIDACIÓN */
    validationNotice: {
        flexDirection: 'row',
        backgroundColor: '#FFF0F0',
        borderColor: '#F8C6C6',
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    validationNoticeTextContainer: {
        flex: 1,
        paddingRight: 8,
    },
    validationLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#E5484D',
    },
    validationSub: {
        fontSize: 12,
        color: '#4A505A',
        marginTop: 2,
    },
    cancelValidationBtn: {
        backgroundColor: '#E5484D',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    cancelValidationTxt: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },

    /* --- NUEVOS ESTILOS PARA DESHABILITADO --- */
    disabledContainer: {
        opacity: 0.85, // Atenúa levemente la tarjeta de inputs
    },
    disabledInputContainer: {
        backgroundColor: '#E6E8EC',
        borderColor: '#D1D5DB',
    },
    disabledInput: {
        backgroundColor: '#E6E8EC',
        borderColor: '#D1D5DB',
        color: '#6B7078',
    },
    disabledInputStyle: {
        color: '#6B7078',
    },
    disabledPressable: {
        opacity: 0.5,
    },
    disabledTextRed: {
        color: '#F8C6C6',
    }
})

function PlaySound(estado: string) {
    try {
        SoundPlayer.playSoundFile(estado, "mp3")
    } catch {
        // noop
    }
}