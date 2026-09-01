import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  ListRenderItemInfo,
  ActivityIndicator,
  TextInput,
  Pressable,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'

import Header from '../../../components/Header'
import { black, blue, grey, green } from '../../../constants/Colors'
import { WMSApiUbicacionRollos } from '../../../api/WMSApiUbicacionRollos'
import { WMSContext } from '../../../context/WMSContext'
import RolloCard, { Rollo } from '../CambioUbicacionTela/RolloCard'
import { RespuestaConsultarRollo } from '../CambioUbicacionTela/CambioUbicacionTelaScreen'

type Props = StackScreenProps<RootStackParams, 'DetalleDiarioMovimientoScreen'>
export interface DetalleDiarioMovimientoDto {
  /** Número de línea del diario en AX (backend: LINENUM). Necesario para poder eliminar la línea. */
  linenum?: number
  journalId: string
  comprobante: string
  itemId: string
  numeroRollo: string
  almacenDesde: string
  ubicacionDesde: string
  almacenPara: string
  ubicacionPara: string
  cantidad: number
}

export type RootStackParams = {
  // ... tus otras pantallas
  ConsultaDiairosAbiertosScreen: undefined
  DetalleDiarioMovimientoScreen: { journalId: string }
}

interface DiarioDuplicado {
  numeroDiario: string
  descripcion: string
}

interface ValidarRolloRepetidoResponse {
  esDuplicado: boolean
  mensaje: string
  diarios: DiarioDuplicado[]
}

const DATOS_ALMACENES = [
  { label: '21', value: '21' },
  { label: '50', value: '50' },
]

const RolloLineaCard: FC<{ item: DetalleDiarioMovimientoDto; onDelete?: (item: DetalleDiarioMovimientoDto) => void }> = ({ item, onDelete }) => {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.rolloBadge}>
          <Text style={cardStyles.rolloTxt}>{item.numeroRollo || 'Sin Rollo'}</Text>
        </View>
        <Text style={cardStyles.qtyTxt}>{item.cantidad?.toFixed(2)} m</Text>
      </View>

      <Text style={cardStyles.itemTxt}>Ítem: {item.itemId}</Text>

      <View style={cardStyles.routeRow}>
        {/* Origen */}
        <View style={cardStyles.routeBox}>
          <Text style={cardStyles.routeTitle}>ORIGEN</Text>
          <Text style={cardStyles.routeLabel}>Almacén</Text>
          <Text style={cardStyles.routeValue}>{item.almacenDesde}</Text>
          <Text style={cardStyles.routeLabel}>Ubicación</Text>
          <Text style={cardStyles.routeSub}>{item.ubicacionDesde || '-'}</Text>
        </View>

        <Text style={cardStyles.arrow}>➔</Text>

        {/* Destino */}
        <View style={cardStyles.routeBox}>
          <Text style={cardStyles.routeTitle}>DESTINO</Text>
          <Text style={cardStyles.routeLabel}>Almacén</Text>
          <Text style={cardStyles.routeValue}>{item.almacenPara}</Text>
          <Text style={cardStyles.routeLabel}>Ubicación</Text>
          <Text style={cardStyles.routeSub}>{item.ubicacionPara || '-'}</Text>
        </View>
      </View>

      {onDelete && (
        <Pressable
          onPress={() => onDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={cardStyles.deleteButton}
          accessibilityRole="button"
        >
          <Text style={cardStyles.deleteText}>Eliminar línea ✕</Text>
        </Pressable>
      )}
    </View>
  )
}

export const DetalleDiarioMovimientoScreen: FC<Props> = ({ route }) => {

  const [lineas, setLineas] = useState<DetalleDiarioMovimientoDto[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [eliminandoLineNum, setEliminandoLineNum] = useState<number | null>(null)
  const { WMSState } = useContext(WMSContext)
  const journalId = WMSState.telaJournalId

  const fetchDetalle = useCallback(async (isPull = false) => {
    if (isPull) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const res = await WMSApiUbicacionRollos.get<DetalleDiarioMovimientoDto[]>(
        `GetDetalleDiarioMovimiento/${journalId}`
      )
      if (res?.data && Array.isArray(res.data)) {
        setLineas(res.data)
      } else {
        setLineas([])
      }
    } catch (error) {
      console.error('Error cargando detalle del diario:', error)
      setLineas([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [journalId])

  useEffect(() => {
    fetchDetalle()
  }, [fetchDetalle])

  const onRefresh = useCallback(() => {
    fetchDetalle(true)
  }, [fetchDetalle])

  // Buscador local dentro de las líneas (por rollo o por ítem)
  const filteredLineas = useMemo(() => {
    const s = search.trim().toUpperCase()
    if (!s) return lineas
    return lineas.filter(
      l =>
        (l.numeroRollo || '').toUpperCase().includes(s) ||
        (l.itemId || '').toUpperCase().includes(s)
    )
  }, [lineas, search])

  // ── Eliminar una línea del diario ──────────────────────────────────────────
  const handleEliminarLinea = useCallback((item: DetalleDiarioMovimientoDto) => {
    const lineNumValue = item.linenum
    if (!lineNumValue || lineNumValue <= 0) {
      Alert.alert('No se puede eliminar', 'Esta línea no trae un número de línea válido. Contacta a sistemas.')
      return
    }

    Alert.alert(
      'Eliminar línea',
      `¿Estás seguro de que deseas eliminar el rollo "${item.numeroRollo}" del diario ${journalId}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setEliminandoLineNum(lineNumValue)
            try {
              const res = await WMSApiUbicacionRollos.post<string>(
                `EliminarLineaDiarioRollos/${journalId}/${lineNumValue}`
              )
              if (res.data && res.data.startsWith('S ')) {
                  await fetchDetalle()
              } else {
                Alert.alert('Error', res.data || 'No se pudo eliminar la línea.')
              }
            } catch (error) {
              Alert.alert('Error de Red', 'Hubo un fallo al intentar eliminar la línea en el servidor.')
            } finally {
              setEliminandoLineNum(null)
            }
          }
        }
      ]
    )
  }, [journalId])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<DetalleDiarioMovimientoDto>) => (
      <RolloLineaCard item={item} onDelete={handleEliminarLinea} />
    ),
    [handleEliminarLinea]
  )

  const keyExtractor = useCallback(
    (item: DetalleDiarioMovimientoDto, index: number) => `${item.numeroRollo}-${index}`,
    []
  )

  // ── Registrar (postear/contabilizar) el diario en AX ─────────────────────
  const [posteando, setPosteando] = useState(false)

  const handlePostearDiario = useCallback(() => {
    if (lineas.length === 0) {
      Alert.alert('Diario vacío', 'Este diario no tiene líneas registradas todavía.')
      return
    }

    Alert.alert(
      'Registrar diario',
      `¿Deseas registrar (postear) el diario ${journalId} en AX? Esta acción lo contabiliza.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar',
          onPress: async () => {
            setPosteando(true)
            try {
              const res = await WMSApiUbicacionRollos.post<string>(`PostearDiarioRollos/${journalId}`)
              if (res.data && res.data.startsWith('S ')) {
                Alert.alert('Éxito', res.data)
              } else {
                Alert.alert('Error', res.data || 'No se pudo registrar el diario.')
              }
            } catch (error) {
              Alert.alert('Error de Red', 'Hubo un fallo al intentar registrar el diario en el servidor.')
            } finally {
              setPosteando(false)
            }
          }
        }
      ]
    )
  }, [journalId, lineas.length])

  // ── Agregar rollos escaneando (mismo flujo que CambioUbicacionTelaScreen) ──
  const [modoAgregar, setModoAgregar] = useState(false)
  const [almacenDestino, setAlmacenDestino] = useState('')
  const [ubicacionDestino, setUbicacionDestino] = useState('')
  const [rolloInput, setRolloInput] = useState('')
  const [pendientes, setPendientes] = useState<Rollo[]>([])
  const [consultando, setConsultando] = useState(false)
  const [agregando, setAgregando] = useState(false)
  const scanRef = useRef<TextInput>(null)

  // Al abrir el panel, se sugiere el mismo destino que ya llevan las líneas del diario
  useEffect(() => {
    if (modoAgregar && lineas.length > 0 && !almacenDestino && !ubicacionDestino) {
      setAlmacenDestino(lineas[0].almacenPara || '')
      setUbicacionDestino(lineas[0].ubicacionPara || '')
    }
  }, [modoAgregar, lineas, almacenDestino, ubicacionDestino])

  const consultarRollo = async (codigo: string): Promise<RespuestaConsultarRollo> => {
    const res = await WMSApiUbicacionRollos.get<RespuestaConsultarRollo>(`ConsultarRolloCambioUbicacion/${codigo}`)
    return res.data
  }

  const validarExistenciaRolloEnDiario = async (codigo: string): Promise<ValidarRolloRepetidoResponse> => {
    const res = await WMSApiUbicacionRollos.post<ValidarRolloRepetidoResponse>('validar-rollo-repetido', { numeroSerie: codigo })
    return res.data
  }

  const procesarEscaneoRollo = useCallback(async () => {
    const codigo = rolloInput.trim()
    if (!codigo || consultando) return
    setRolloInput('')

    if (!almacenDestino || !ubicacionDestino.trim()) {
      Alert.alert('Datos incompletos', 'Ingresa almacén y ubicación destino antes de escanear rollos.')
      return
    }

    if (pendientes.some(r => r.ro === codigo)) {
      Alert.alert('Rollo repetido', `El rollo "${codigo}" ya está en la lista de pendientes.`)
      requestAnimationFrame(() => scanRef.current?.focus())
      return
    }

    setConsultando(true)
    try {
      const info = await consultarRollo(codigo)
      if (!info || !info.numeroRollo) {
        Alert.alert('No encontrado', `El rollo "${codigo}" no se encontró en el sistema.`)
        return
      }

      const infoValidacion = await validarExistenciaRolloEnDiario(codigo)
      if (infoValidacion.esDuplicado) {
        Alert.alert('Rollo duplicado', infoValidacion.mensaje)
        return
      }

      setPendientes(prev => [{
        ro: info.numeroRollo,
        ubicacionOrigen: info.ubicacion || 'Sin Ubicación',
        medida: parseFloat(info.cantidad) || 0,
        unidad: 'm',
        sitio: info.sitio || '',
        almacen: info.almacen || ''
      }, ...prev])
    } catch (error) {
      Alert.alert('Error', `Hubo un problema al consultar el rollo "${codigo}".`)
    } finally {
      setConsultando(false)
      requestAnimationFrame(() => scanRef.current?.focus())
    }
  }, [rolloInput, consultando, almacenDestino, ubicacionDestino, pendientes])

  const quitarPendiente = useCallback((ro: string) => {
    setPendientes(prev => prev.filter(r => r.ro !== ro))
  }, [])

  const handleAgregarRollos = useCallback(() => {
    if (pendientes.length === 0 || agregando) return

    const sitioDestino = almacenDestino === '21' ? '1' : almacenDestino === '50' ? '1S' : 'Desconocido'
    const payload = pendientes.map(item => ({
      CodigoBarraRollo: item.ro,
      SitioOrigen: item.sitio,
      SitioDestino: sitioDestino,
      AlmacenOrigen: item.almacen,
      AlmacenDestino: almacenDestino,
      UbicacionOrigen: item.ubicacionOrigen,
      UbicacionDestino: ubicacionDestino.trim(),
      Cantidad: item.medida?.toString() || '0'
    }))

    Alert.alert(
      'Confirmar',
      `¿Agregar ${pendientes.length} rollo(s) al diario ${journalId}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Agregar',
          onPress: async () => {
            setAgregando(true)
            try {
              const res = await WMSApiUbicacionRollos.post<string>(`AgregarLineasADiarioRollos/${journalId}`, payload)
              if (res.data && (res.data.startsWith('S ') || res.data.startsWith('W '))) {
                Alert.alert(
                  res.data.startsWith('S ') ? 'Éxito' : 'Con observaciones',
                  res.data,
                  [{
                    text: 'Aceptar',
                    onPress: () => {
                      setPendientes([])
                      fetchDetalle()
                    }
                  }]
                )
              } else {
                Alert.alert('Error', res.data || 'No se pudieron agregar los rollos al diario.')
              }
            } catch (error) {
              Alert.alert('Error de Red', 'Hubo un fallo al intentar agregar los rollos en el servidor.')
            } finally {
              setAgregando(false)
            }
          }
        }
      ]
    )
  }, [pendientes, agregando, almacenDestino, ubicacionDestino, journalId, fetchDetalle])

  const renderPendiente = useCallback(
    ({ item }: ListRenderItemInfo<Rollo>) => (
      <RolloCard
        rollo={item}
        ubicacionDestino={ubicacionDestino}
        almacenDestino={almacenDestino}
        onDelete={quitarPendiente}
      />
    ),
    [ubicacionDestino, almacenDestino, quitarPendiente]
  )

  return (
    <View style={styles.root}>
      <Header texto1="" texto2={`Diario ${journalId}`} texto3="" />

      {/* Resumen Superior */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryTxt}>Total líneas: {lineas.length}</Text>
        <View style={styles.summaryAcciones}>
          <Pressable
            onPress={handlePostearDiario}
            disabled={posteando}
            style={[styles.registrarDiarioBtn, posteando && styles.registrarDiarioBtnOff]}
          >
            {posteando ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.registrarDiarioTxt}>Registrar</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => setModoAgregar(v => !v)}
            style={styles.toggleAgregarBtn}
          >
            <Text style={styles.toggleAgregarTxt}>{modoAgregar ? 'Cerrar' : '+ Agregar rollos'}</Text>
          </Pressable>
        </View>
      </View>

      {modoAgregar && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.agregarCard}>
            <View style={styles.rowDestino}>
              <View style={styles.almacenContainer}>
                <Text style={styles.label}>Almacén Destino</Text>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  containerStyle={styles.dropdownContainer}
                  data={DATOS_ALMACENES}
                  labelField="label"
                  valueField="value"
                  placeholder="--"
                  value={almacenDestino}
                  onChange={item => setAlmacenDestino(item.value)}
                />
              </View>

              <View style={styles.ubicacionContainer}>
                <Text style={styles.label}>Ubicación Destino</Text>
                <TextInput
                  value={ubicacionDestino}
                  onChangeText={setUbicacionDestino}
                  placeholder="Ubicación destino"
                  style={styles.inputBox}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <Text style={styles.label}>Escanear Rollo</Text>
            <View style={styles.scanRow}>
              <TextInput
                ref={scanRef}
                value={rolloInput}
                editable={!consultando}
                onChangeText={setRolloInput}
                onSubmitEditing={procesarEscaneoRollo}
                blurOnSubmit={false}
                placeholder="Escanear código de rollo..."
                style={[styles.inputBox, styles.flex]}
                autoCapitalize="none"
                returnKeyType="done"
              />
              {consultando && <ActivityIndicator color={blue} style={{ marginLeft: 8 }} />}
            </View>

            {pendientes.length > 0 && (
              <>
                <Text style={styles.pendientesTitle}>Pendientes por agregar ({pendientes.length})</Text>
                <FlatList
                  data={pendientes}
                  renderItem={renderPendiente}
                  keyExtractor={item => item.ro}
                  style={styles.pendientesList}
                  nestedScrollEnabled
                />
              </>
            )}

            <Pressable
              onPress={handleAgregarRollos}
              disabled={pendientes.length === 0 || agregando}
              style={[styles.cta, (pendientes.length === 0 || agregando) && styles.ctaOff]}
            >
              {agregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.ctaTxt}>Agregar {pendientes.length || ''} rollo(s) al diario</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Input de Búsqueda de rollos / ítems */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Buscar rollo o código de ítem..."
            placeholderTextColor="#A6ABB3"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            autoCapitalize="characters"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} style={styles.clearBtn}>
              <Text style={styles.clearTxt}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={blue} size="large" />
      ) : (
        <FlatList
          data={filteredLineas}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[blue]}
              tintColor={blue}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {search ? 'No hay rollos que coincidan con la búsqueda' : 'No hay detalles para este diario'}
            </Text>
          }
        />
      )}

      {eliminandoLineNum !== null && (
        <View style={styles.overlayLoading}>
          <ActivityIndicator color={blue} size="large" />
        </View>
      )}
    </View>
  )
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rolloBadge: {
    backgroundColor: '#F4F7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rolloTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: blue,
  },
  qtyTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: green,
  },
  itemTxt: {
    fontSize: 12,
    color: black,
    marginBottom: 10,
    fontWeight: '600',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
  },
  routeBox: {
    flex: 1,
    alignItems: 'center',
  },
  routeTitle: {
    fontSize: 9,
    color: '#808080',
    fontWeight: '700',
  },
  routeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: black,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#808080',
    marginTop: 4,
  },
  routeSub: {
    fontSize: 11,
    color: '#555555',
  },
  arrow: {
    fontSize: 16,
    color: blue,
    marginHorizontal: 8,
  },
  deleteButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFF0F0',
  },
  deleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5484D',
  },
})

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', backgroundColor: grey, alignItems: 'stretch' },
  summaryBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8EC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: black,
  },
  summaryAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registrarDiarioBtn: {
    backgroundColor: green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 74,
    alignItems: 'center',
  },
  registrarDiarioBtnOff: { backgroundColor: '#B9C0CC' },
  registrarDiarioTxt: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  toggleAgregarBtn: {
    backgroundColor: '#E7EEFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleAgregarTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: blue,
  },
  agregarCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 12,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  rowDestino: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  almacenContainer: { width: 100 },
  ubicacionContainer: { flex: 1 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7078',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
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
  placeholderStyle: { fontSize: 15, color: '#A6ABB3' },
  selectedTextStyle: { fontSize: 15, color: black, fontWeight: '500' },
  inputBox: {
    height: 42,
    backgroundColor: '#F4F5F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    paddingHorizontal: 10,
    fontSize: 15,
    color: black,
  },
  scanRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  pendientesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: black,
    marginTop: 4,
  },
  pendientesList: { maxHeight: 220 },
  cta: {
    backgroundColor: blue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaOff: { backgroundColor: '#B9C0CC' },
  ctaTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  searchContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: black,
  },
  clearBtn: {
    padding: 6,
  },
  clearTxt: {
    fontSize: 14,
    color: '#A6ABB3',
    fontWeight: 'bold',
  },
  listPad: { paddingVertical: 10, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#A6ABB3', marginTop: 30 },
  overlayLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
