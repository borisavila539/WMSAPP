import type { StackScreenProps } from "@react-navigation/stack"
import React, { type FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  InteractionManager,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

import Icon from "react-native-vector-icons/FontAwesome5"
import type { RootStackParams } from "../../../../navigation/navigation"
import Header from "../../../../components/Header"
import { WMSContext } from "../../../../context/WMSContext"
import { WMSApiSerigrafia } from "../../../../api/WMSApiSerigrafia"
import type { TrasladoDespachoDTO } from "../../../../interfaces/Serigrafia/TrasladoDespachoDTO"
import SoundPlayer from "react-native-sound-player"
import { UsuarioValidoPorAccion } from "../../../../interfaces/Serigrafia/UsuarioValidoPorAccion"
import { ConsultaLoteInterface } from "../../../../interfaces/Serigrafia/Lote"
import { Dropdown } from "react-native-element-dropdown"
import { IDespachoLinesPacking } from "../../../../interfaces/Serigrafia/IDespachoLinesPacking"
import { ScrollView } from "react-native"

interface PackingRequestDTO {
  DespachoId: number
  ProdMasterId: string
  Box: number
  UserPacking: string
}

type props = StackScreenProps<RootStackParams, "DespachoEnviarTrasladoScreen">

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const isSmallDevice = SCREEN_WIDTH < 400 // PDAs Zebra ~320-380px
const isTablet = SCREEN_WIDTH >= 600

const scanRegex = /^OP-\d{8}\s\d{3},\d+$/

function parseScan(raw: string): { prodMasterId: string; box: number } | null {
  const v = raw.trim()
  const m = v.match(/^(OP-\d{8}\s\d{3}),(\d+)$/)
  if (!m) return null
  const prodMasterId = m[1]
  const box = Number(m[2])
  if (!prodMasterId || !Number.isFinite(box)) return null
  return { prodMasterId, box }
}

function PlaySound(estado: string) {
  try {
    SoundPlayer.playSoundFile(estado, "mp3")
  } catch {
    // noop
  }
}

const Info = React.memo(({ label, value }: { label: string; value: string }) => {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
})

/** Card memoizada para reducir re-renders */
const ItemCard = React.memo(
  ({ item }: { item: IDespachoLinesPacking }) => {
    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return "N/A"
      const d = new Date(date as any)
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    }

    const isSegunda = Number(item.boxCategoryId) === 2

    const bg = isSegunda
      ? item.packing
        ? "#7B1FA2"
        : "#AB47BC"
      : item.packing
        ? "#4CAF50"
        : "#FF9800"

    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, { backgroundColor: bg }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.productId} numberOfLines={1}>
              {item.prodMasterId}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Caja {item.box}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <Info label="Articulo" value={String(item.itemId)} />
            <Info label="Talla" value={String(item.size)} />
            <Info label="Cant" value={String(item.qty ?? 0)} />
            <Info label="Color" value={String(item.colorId)} />
            <Info label="Categoria" value={String(item.boxCategoryId)} />
            {item.packing && <Info label="Fecha" value={formatDate(item.packingDateTime)} />}
          </View>
        </View>
      </View>
    )
  },
  (prev, next) => {
    const a = prev.item
    const b = next.item
    return (
      a.id === b.id &&
      a.packing === b.packing &&
      a.packingDateTime === b.packingDateTime &&
      a.qty === b.qty &&
      a.boxCategoryId === b.boxCategoryId
    )
  }
)

export const DespachoEnviarTrasladoScreen: FC<props> = () => {
  const { WMSState } = useContext(WMSContext)

  // Texto del input (UI)
  const [scanText, setScanText] = useState<string>("")
  const inputRef = useRef<TextInput>(null)

  // Lock anti doble-scan (ref) + estado para spinner
  const busyRef = useRef(false)
  const [loading, setLoading] = useState<boolean>(false)

  const [refreshing, setRefreshing] = useState(false)

  // Fuente única: data
  const [data, setData] = useState<IDespachoLinesPacking[]>([])
  const [despachoTrasladodata, setDespachoTrasladodata] = useState<TrasladoDespachoDTO[]>([])
  const [trasladosExpanded, setTrasladosExpanded] = useState<boolean>(!isSmallDevice)

  // Estado para modo eliminar traslados
  const [modoEliminar, setModoEliminar] = useState<boolean>(false)

  // Modal agregar traslado
  const [modalAgregarVisible, setModalAgregarVisible] = useState<boolean>(false)
  const [loteSeleccionadoDespacho, setLoteSeleccionadoDespacho] = useState<string | null>(null)
  const [trasladosDisponibles, setTrasladosDisponibles] = useState<TrasladoDespachoDTO[]>([])
  const [loadingTrasladosDisponibles, setLoadingTrasladosDisponibles] = useState<boolean>(false)
  const [dataLote, setDataLote] = useState<ConsultaLoteInterface[]>([])

  const [usuariosValidos, setUsuariosValidos] = useState<UsuarioValidoPorAccion[]>([])
  const esUsuarioValido = useMemo(
    () => usuariosValidos.some((u) => u.codigoEmpleado === WMSState.usuario),
    [usuariosValidos, WMSState.usuario]
  )

  // ========= Derivados rápidos (1 solo pase) =========
  const { pendiente, escaneado, totals, itemIndexByKey, packingAllByItemId } = useMemo(() => {
    const p: IDespachoLinesPacking[] = []
    const e: IDespachoLinesPacking[] = []
    const idx = new Map<string, number>()

    let p1 = 0,
      p2 = 0,
      e1 = 0,
      e2 = 0

    // Para saber si itemId está completamente "packing"
    const countByItem = new Map<number, { total: number; packed: number }>()

    for (let i = 0; i < data.length; i++) {
      const it = data[i]
      idx.set(`${it.prodMasterId}|${it.box}`, i)

      const qty = it.qty ?? 0
      const cat = Number(it.boxCategoryId)

      if (it.packing) {
        e.push(it)
        if (cat === 1) e1 += qty
        else if (cat === 2) e2 += qty
      } else {
        p.push(it)
        if (cat === 1) p1 += qty
        else if (cat === 2) p2 += qty
      }

      const k = it.itemId
      const prev = countByItem.get(k) ?? { total: 0, packed: 0 }
      prev.total += 1
      if (it.packing) prev.packed += 1
      countByItem.set(k, prev)
    }

    const all = new Map<string, boolean>()
    for (const [k, v] of countByItem) {
      all.set(k, v.total > 0 && v.total === v.packed)
    }

    return {
      pendiente: p,
      escaneado: e,
      totals: { p1, p2, e1, e2 },
      itemIndexByKey: idx,
      packingAllByItemId: all,
    }
  }, [data])

  const isDisabled = useMemo(() => {
    // habilita botón si hay traslados "completos" pero aún no enviados
    return despachoTrasladodata.some(
      (t) => packingAllByItemId.get(t.itemId) === true && t.statusId === 0
    )
  }, [despachoTrasladodata, packingAllByItemId])

  const totaltrasladosparaEnviados = useMemo(() => {
    // contador de traslados listos para enviar (status 0 + completo)
    return despachoTrasladodata.filter(
      (t) => packingAllByItemId.get(t.itemId) === true && t.statusId === 0
    ).length
  }, [despachoTrasladodata, packingAllByItemId])

  // ========= Fetchers =========
  const getData = useCallback(async () => {
    const resp = await WMSApiSerigrafia.get<IDespachoLinesPacking[]>(
      `GetDespachoLinesByIdAEnviar/${WMSState.SRGDespachoId}`
    )
    setData(resp.data)

  }, [WMSState.SRGDespachoId])

  const getDespachoTrasladoData = useCallback(async () => {
    const resp = await WMSApiSerigrafia.get<TrasladoDespachoDTO[]>(
      `GetDespachoTrasladosById/${WMSState.SRGDespachoId}`
    )
    setDespachoTrasladodata(resp.data)

  }, [WMSState.SRGDespachoId])

  const getUsuarioValido = useCallback(async () => {
    const validoEnviar = "E"
    try {
      const resp = await WMSApiSerigrafia.get<UsuarioValidoPorAccion[]>(
        `GetUsuariosPorAccion/${validoEnviar}`
      )
      setUsuariosValidos(resp.data)
    } catch {
      // noop
    }
  }, [])

  const getLote = useCallback(async () => {
    try {
      const resp = await WMSApiSerigrafia.get<ConsultaLoteInterface[]>("GetLote")
      setDataLote(resp.data)
      if (resp.data.length > 0) setLoteSeleccionadoDespacho(resp.data[0].itemseasonid)
    } catch {
      Alert.alert("Error al obtener los lotes")
    }
  }, [])

  useEffect(() => {
    getUsuarioValido()
    getLote()
  }, [getUsuarioValido, getLote])

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      getDespachoTrasladoData()
      getData()
      setTimeout(() => inputRef.current?.focus(), 150)
    })
    return () => task.cancel()
  }, [getData, getDespachoTrasladoData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([getData(), getDespachoTrasladoData()])
    } finally {
      setRefreshing(false)
    }
  }, [getData, getDespachoTrasladoData])

  // ========= sendPacking ultra rápido (optimistic + rollback) =========
  const sendPacking = useCallback(
    async (rawCode: string) => {
      if (busyRef.current) {
        PlaySound("error")
        return
      }

      const clean = rawCode.trim()

      if (!scanRegex.test(clean)) {
        PlaySound("error")
        setScanText("")
        Alert.alert("Error", "El código escaneado no corresponde a ningún item pendiente.")
        requestAnimationFrame(() => inputRef.current?.focus())
        return
      }

      const parsed = parseScan(clean)

      if (!parsed) {
        PlaySound("error")
        setScanText("")
        Alert.alert("Error", "El código escaneado no corresponde a ningún item pendiente.")
        setScanText("")
        requestAnimationFrame(() => inputRef.current?.focus())
        return
      }

      setScanText("")
      requestAnimationFrame(() => inputRef.current?.focus())

      const key = `${parsed.prodMasterId}|${parsed.box}`
      const index = itemIndexByKey.get(key)

      if (index === undefined) {
        PlaySound("error")
        setScanText("")
        Alert.alert("Error", "El código escaneado no corresponde a ningún item pendiente.")
        requestAnimationFrame(() => inputRef.current?.focus())
        return
      }

      const itemActual = data[index]

      if (!itemActual || itemActual.packing) {
        PlaySound("error")
        setScanText("")
        Alert.alert("Error", "El item ya ha sido empaquetado.")
        requestAnimationFrame(() => inputRef.current?.focus())
        return
      }

      busyRef.current = true
      setLoading(true)

      // Cambio visual inmediato
      setData((prev) => {
        const next = prev.slice()
        next[index] = {
          ...itemActual,
          packing: true,
          packingDateTime: new Date() as any,
        }
        return next
      })

      try {
        const packingRequest: PackingRequestDTO = {
          DespachoId: WMSState.SRGDespachoId,
          ProdMasterId: parsed.prodMasterId,
          Box: parsed.box,
          UserPacking: (WMSState as any)?.usuario ?? (WMSState as any)?.UserName ?? "Usuario Demo",
        }

        const resp = await WMSApiSerigrafia.post("SetPacking", packingRequest)

        if (Number(resp.data) > 0) {
          PlaySound("success")
        } else {
          PlaySound("error")
          Alert.alert("Error", "Error al registrar el packing. Intente nuevamente.")
          // Revertir si AX/API respondió error
          setData((prev) => {
            const next = prev.slice()
            next[index] = {
              ...itemActual,
              packing: false,
              packingDateTime: null as any,
            }
            return next
          })
        }
      } catch (error) {
        PlaySound("error")
        setScanText("")
        Alert.alert("Error", "Error al registrar el packing. Intente nuevamente.")
        // Revertir si hubo error de conexión/API
        setData((prev) => {
          const next = prev.slice()
          next[index] = {
            ...itemActual,
            packing: false,
            packingDateTime: null as any,
          }
          return next
        })
      } finally {
        busyRef.current = false
        setLoading(false)
        requestAnimationFrame(() => inputRef.current?.focus())
      }
    },
    [WMSState, itemIndexByKey, data]
  )

  const handleScanChange = useCallback(
    (text: string) => {
      setScanText(text)
      const trimmed = text.trim()
      if (scanRegex.test(trimmed)) {
        sendPacking(trimmed)
      }
    },
    [sendPacking]
  )

  // ========= Enviar traslados =========
  const changeTransferStatus = useCallback(async () => {
    if (!esUsuarioValido) {
      Alert.alert("Alerta", "Usuario invalido para esta acción.")
      return
    }
    if (busyRef.current) return

    const dataToSend = despachoTrasladodata.filter(
      (t) => t.statusId === 0 && packingAllByItemId.get(t.itemId) === true
    )
    if (dataToSend.length === 0) return

    busyRef.current = true
    setLoading(true)

    try {
      await WMSApiSerigrafia.post(`EnviarDespacho/${WMSState.SRGDespachoId}`, dataToSend)
      Alert.alert("Éxito", "Los traslados se enviaron correctamente.")
      await Promise.all([getDespachoTrasladoData(), getData()])
    } catch (error: any) {
      const errorMessage = "Error al enviar despacho. " + (error?.response?.data ?? "")
      Alert.alert("Error", errorMessage)
    } finally {
      busyRef.current = false
      setLoading(false)
    }
  }, [WMSState.SRGDespachoId, despachoTrasladodata, packingAllByItemId, esUsuarioValido, getData, getDespachoTrasladoData])

  // ========= Eliminar traslado =========
  const confirmarEliminarTraslado = useCallback((traslado: TrasladoDespachoDTO) => {
    Alert.alert(
      "Confirmar eliminacion",
      `¿Esta seguro de eliminar el traslado ${traslado.transferId} (${traslado.itemId})?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => eliminarTraslado(traslado) },
      ]
    )
  }, [])

  const eliminarTraslado = useCallback(
    async (traslado: TrasladoDespachoDTO) => {
      if (busyRef.current) return
      busyRef.current = true
      setLoading(true)
      try {
        await WMSApiSerigrafia.post(`EliminarTrasladoDespacho`, traslado)
        await Promise.all([getDespachoTrasladoData(), getData()])
      } catch (error: any) {
        const msg = error?.response?.data ?? "Error al eliminar traslado."
        Alert.alert("Error", String(msg))
      } finally {
        busyRef.current = false
        setLoading(false)
        if (despachoTrasladodata.length <= 1) setModoEliminar(false)
      }
    },
    [getData, getDespachoTrasladoData, despachoTrasladodata.length]
  )

  // ========= Agregar traslado =========
  const getTrasladosDisponibles = useCallback(async (lote: string) => {
    setLoadingTrasladosDisponibles(true)
    try {
      const resp = await WMSApiSerigrafia.get<TrasladoDespachoDTO[]>(
        `GetTrasladoParaDespachoPorLote/${lote}`
      )
      setTrasladosDisponibles(resp.data)
    } catch {
      setTrasladosDisponibles([])
    } finally {
      setLoadingTrasladosDisponibles(false)
    }
  }, [])

  const agregarTraslado = useCallback(
    async (traslado: TrasladoDespachoDTO) => {
      if (busyRef.current) return

      const yaExisteElTraslado = despachoTrasladodata.some((t) => t.transferId === traslado.transferId)
      if (yaExisteElTraslado) {
        Alert.alert("Error", "Ya existe ese traslado en el despacho, agregue otro.")
        return
      }

      busyRef.current = true
      setLoading(true)
      try {
        await WMSApiSerigrafia.post(`AgregarTrasladoDespacho/${WMSState.SRGDespachoId}`, traslado)
        await Promise.all([getDespachoTrasladoData(), getData()])

        // quitar del listado
        setTrasladosDisponibles((prev) => prev.filter((t) => t.transferId !== traslado.transferId))
      } catch (error: any) {
        const msg = error?.response?.data ?? "Error al agregar traslado."
        Alert.alert("Error", String(msg))
      } finally {
        busyRef.current = false
        setLoading(false)
      }
    },
    [WMSState.SRGDespachoId, despachoTrasladodata, getData, getDespachoTrasladoData]
  )

  const abrirModalAgregar = useCallback(() => {
    setLoteSeleccionadoDespacho(null)
    setTrasladosDisponibles([])
    setModalAgregarVisible(true)
  }, [])

  // ========= FlatList optimizaciones =========
  const keyExtractor = useCallback((item: IDespachoLinesPacking) => String(item.id), [])
  const renderRow = useCallback(({ item }: { item: IDespachoLinesPacking }) => <ItemCard item={item} />, [])

  const getStatusStyle = useCallback((statusId: number) => {
    switch (statusId) {
      case 0:
        return { backgroundColor: "#e4e2d9" }
      case 1:
        return { backgroundColor: "#22C55E" }
      case 3:
        return { backgroundColor: "#4ea4ebf5" }
      default:
        return { backgroundColor: "#9CA3AF" }
    }
  }, [])

  const getStatusTextStyle = useCallback((statusId: number) => {
    switch (statusId) {
      case 0:
        return { color: "#000000" }
      case 1:
      case 3:
      default:
        return { color: "#FFFFFF" }
    }
  }, [])

  return (
    <View style={styles.container}>
      <Header texto1="" texto2="Enviar Despacho" texto3={`Numero de Despacho: ${WMSState.SRGDespachoId}`} />

      {/* Traslados colapsable */}
      <View style={styles.trasladosSection}>
        <TouchableOpacity style={styles.trasladosHeader} onPress={() => setTrasladosExpanded((s) => !s)}>
          <View style={styles.trasladosHeaderLeft}>
            <Icon name="exchange-alt" size={isSmallDevice ? 10 : 12} color="#1976D2" />
            <Text style={styles.trasladosHeaderText}>Traslados ({despachoTrasladodata.length})</Text>
          </View>
          <Icon name={trasladosExpanded ? "chevron-up" : "chevron-down"} size={isSmallDevice ? 10 : 12} color="#757575" />
        </TouchableOpacity>

        {trasladosExpanded && (
          <View style={styles.trasladosContent}>
            {/* Botones */}
            <View style={styles.trasladosActions}>
              <TouchableOpacity
                style={[
                  styles.trasladoActionBtn,
                  modoEliminar ? styles.trasladoActionBtnActive : styles.trasladoActionBtnDelete,
                ]}
                onPress={() => setModoEliminar((s) => !s)}
              >
                <Icon name={modoEliminar ? "times" : "trash-alt"} size={isSmallDevice ? 10 : 12} color={modoEliminar ? "#FFFFFF" : "#D32F2F"} />
                <Text style={[styles.trasladoActionBtnText, { color: modoEliminar ? "#FFFFFF" : "#D32F2F" }]}>
                  {modoEliminar ? "Cancelar" : "Eliminar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.trasladoActionBtn, styles.trasladoActionBtnAdd]} onPress={abrirModalAgregar}>
                <Icon name="plus" size={isSmallDevice ? 10 : 12} color="#2E7D32" />
                <Text style={[styles.trasladoActionBtnText, { color: "#2E7D32" }]}>Agregar</Text>
              </TouchableOpacity>
            </View>

            {/* Chips */}
            <ScrollView
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={true}>
              <View style={styles.trasladosChips}>
                {despachoTrasladodata.map((traslado, index) => (
                  <View
                    key={`${traslado.transferId}-${index}`}
                    style={[
                      styles.trasladoChip,
                      getStatusStyle(traslado.statusId),
                      modoEliminar && styles.trasladoChipDeleteMode,
                    ]}
                  >
                    <View>
                      <Text style={[styles.trasladoChipText, getStatusTextStyle(traslado.statusId)]}>{traslado.transferId}</Text>
                      <Text style={[styles.trasladoChipText, getStatusTextStyle(traslado.statusId)]}>{traslado.itemId}</Text>
                      <Text style={[styles.trasladoChipText, getStatusTextStyle(traslado.statusId)]}>Total Uni: {traslado.montoTraslado}</Text>
                    </View>

                    {modoEliminar && (
                      <TouchableOpacity
                        style={styles.trasladoChipDeleteBtn}
                        onPress={() => confirmarEliminarTraslado(traslado)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Icon name="times-circle" size={isSmallDevice ? 14 : 16} color="#D32F2F" solid />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Scan input */}
      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <Icon name="barcode" size={isSmallDevice ? 14 : 16} color="#757575" />
          <TextInput
            ref={inputRef}
            value={scanText}
            onChangeText={handleScanChange}
            style={styles.input}
            placeholder="Escanear..."
            placeholderTextColor="#9E9E9E"
            autoFocus
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
            onBlur={() => {
              if (!modalAgregarVisible && !loading) requestAnimationFrame(() => inputRef.current?.focus())
            }}
          />
          {loading && <ActivityIndicator size="small" color="#4CAF50" />}
          {!!scanText.length && !loading && (
            <TouchableOpacity onPress={() => setScanText("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="times" size={isSmallDevice ? 12 : 14} color="#757575" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Listas */}
      <View style={styles.listsContainer}>
        {/* Pendiente */}
        <View style={styles.listColumn}>
          <View style={[styles.columnHeader, { backgroundColor: "#FFF3E0" }]}>
            <Icon name="clock" size={isSmallDevice ? 10 : 12} color="#FF9800" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.columnTitle, { color: "#E65100" }]}>
                Pendiente ({pendiente.length})
              </Text>
              <View style={styles.totalsRow}>
                <Text style={styles.totalLabel}>
                  1ra: <Text style={styles.totalValue}>{totals.p1}</Text>
                </Text>
                <Text style={[styles.totalLabel, { color: "#7B1FA2" }]}>
                  2da: <Text style={styles.totalValue}>{totals.p2}</Text>
                </Text>
              </View>
            </View>
          </View>

          <FlatList
            data={pendiente}
            keyExtractor={keyExtractor}
            renderItem={renderRow}
            removeClippedSubviews
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            updateCellsBatchingPeriod={50}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF9800"]} />}
          />
        </View>

        <View style={styles.divider} />

        {/* Escaneado */}
        <View style={styles.listColumn}>
          <View style={[styles.columnHeader, { backgroundColor: "#E8F5E9" }]}>
            <Icon name="check-circle" size={isSmallDevice ? 10 : 12} color="#4CAF50" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.columnTitle, { color: "#2E7D32" }]}>
                Escaneado ({escaneado.length})
              </Text>
              <View style={styles.totalsRow}>
                <Text style={styles.totalLabel}>
                  1ra: <Text style={styles.totalValue}>{totals.e1}</Text>
                </Text>
                <Text style={[styles.totalLabel, { color: "#7B1FA2" }]}>
                  2da: <Text style={styles.totalValue}>{totals.e2}</Text>
                </Text>
              </View>
            </View>
          </View>

          <FlatList
            data={escaneado}
            keyExtractor={keyExtractor}
            renderItem={renderRow}
            removeClippedSubviews
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            updateCellsBatchingPeriod={50}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4CAF50"]} />}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.footerButton,
            isDisabled ? styles.footerButtonEnabled : styles.footerButtonDisabled,
            loading && styles.footerButtonLoading,
          ]}
          onPress={changeTransferStatus}
          disabled={!isDisabled || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color={isDisabled ? "#FFFFFF" : "#2E7D32"} />
          ) : (
            <View style={styles.footerButtonContent}>
              <Icon name="check-double" size={isSmallDevice ? 14 : 16} color={isDisabled ? "#FFFFFF" : "#2E7D32"} />
              <Text style={[styles.footerButtonText, { color: isDisabled ? "#FFFFFF" : "#2E7D32" }]}>
                Enviar traslados ({totaltrasladosparaEnviados})
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Agregar Traslado */}
      <Modal
        visible={modalAgregarVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalAgregarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Traslado</Text>
              <TouchableOpacity onPress={() => setModalAgregarVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="times" size={isSmallDevice ? 16 : 20} color="#757575" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDropdownSection}>
              <Text style={styles.modalSectionLabel}>Seleccione un lote</Text>
              <Dropdown
                data={dataLote.filter((lote) => lote.itemseasonid)}
                labelField="name"
                valueField="itemseasonid"
                placeholder="Seleccione un lote"
                value={loteSeleccionadoDespacho}
                onChange={(item) => {
                  setLoteSeleccionadoDespacho(item.itemseasonid)
                  getTrasladosDisponibles(item.itemseasonid)
                }}
                style={styles.modalDropdown}
                placeholderStyle={styles.modalDropdownPlaceholder}
                selectedTextStyle={styles.modalDropdownSelectedText}
                inputSearchStyle={styles.modalDropdownInputSearch}
                itemTextStyle={{ color: "black" }}
              />
            </View>

            <View style={styles.modalListSection}>
              <Text style={styles.modalSectionLabel}>
                Traslados disponibles {trasladosDisponibles.length > 0 ? `(${trasladosDisponibles.length})` : ""}
              </Text>

              {loadingTrasladosDisponibles ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="small" color="#1976D2" />
                  <Text style={styles.modalLoadingText}>Cargando traslados...</Text>
                </View>
              ) : trasladosDisponibles.length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <Icon name="inbox" size={isSmallDevice ? 24 : 32} color="#BDBDBD" />
                  <Text style={styles.modalEmptyText}>
                    {loteSeleccionadoDespacho
                      ? "No hay traslados disponibles para este lote"
                      : "Seleccione un lote para ver traslados"}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={trasladosDisponibles}
                  keyExtractor={(item, index) => `${item.transferId}-${index}`}
                  style={styles.modalScrollList}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item: traslado }) => (
                    <View style={styles.modalTrasladoItem}>
                      <View style={styles.modalTrasladoInfo}>
                        <Text style={styles.modalTrasladoId}>{traslado.transferId}</Text>
                        <Text style={styles.modalTrasladoDetail}>{traslado.itemId}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.modalTrasladoAddBtn}
                        onPress={() => agregarTraslado(traslado)}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Icon name="plus" size={isSmallDevice ? 10 : 12} color="#FFFFFF" />
                            <Text style={styles.modalTrasladoAddBtnText}>Agregar</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}
            </View>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalAgregarVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  // Traslados
  trasladosSection: {
    marginHorizontal: isSmallDevice ? 4 : 8,
    marginTop: isSmallDevice ? 4 : 6,
    backgroundColor: "#FFFFFF",
    borderRadius: isSmallDevice ? 6 : 8,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  trasladosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: isSmallDevice ? 8 : 12,
    paddingVertical: isSmallDevice ? 6 : 8,
  },
  trasladosHeaderLeft: { flexDirection: "row", alignItems: "center", gap: isSmallDevice ? 4 : 6 },
  trasladosHeaderText: { fontSize: isSmallDevice ? 12 : isTablet ? 15 : 13, fontWeight: "600", color: "#1976D2" },
  trasladosContent: {
    paddingHorizontal: isSmallDevice ? 8 : 12,
    paddingBottom: isSmallDevice ? 6 : 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  trasladosActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: isSmallDevice ? 6 : 8,
    marginBottom: isSmallDevice ? 4 : 6,
  },
  trasladoActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: isSmallDevice ? 3 : 4,
    paddingHorizontal: isSmallDevice ? 8 : 12,
    paddingVertical: isSmallDevice ? 4 : 6,
    borderRadius: isSmallDevice ? 6 : 8,
    borderWidth: 1,
  },
  trasladoActionBtnDelete: { borderColor: "#FFCDD2", backgroundColor: "#FFF5F5" },
  trasladoActionBtnActive: { borderColor: "#D32F2F", backgroundColor: "#D32F2F" },
  trasladoActionBtnAdd: { borderColor: "#C8E6C9", backgroundColor: "#F1F8E9" },
  trasladoActionBtnText: { fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12, fontWeight: "600" },

  trasladosChips: { flexDirection: "row", flexWrap: "wrap", gap: isSmallDevice ? 4 : 6, marginTop: isSmallDevice ? 4 : 6 },
  trasladoChip: {
    paddingHorizontal: isSmallDevice ? 6 : 10,
    paddingVertical: isSmallDevice ? 2 : 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: isSmallDevice ? 4 : 6,
  },
  trasladoChipDeleteMode: { backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#FFCDD2" },
  trasladoChipText: { fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12, fontWeight: "600" },
  trasladoChipDeleteBtn: { marginLeft: isSmallDevice ? 2 : 4 },

  // Input scan
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: isSmallDevice ? 4 : 8,
    marginHorizontal: isSmallDevice ? 4 : 8,
    marginVertical: isSmallDevice ? 4 : 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: isSmallDevice ? 6 : 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isSmallDevice ? 8 : 12,
    height: isSmallDevice ? 36 : isTablet ? 48 : 42,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: isSmallDevice ? 6 : 8,
  },
  input: { flex: 1, fontSize: isSmallDevice ? 14 : isTablet ? 17 : 15, color: "#212121", paddingVertical: 0 },

  // Listas
  listsContainer: { flex: 1, flexDirection: "row", paddingBottom: isSmallDevice ? 56 : 64 },
  listColumn: { flex: 1 },
  divider: { width: 1, backgroundColor: "#E0E0E0" },
  columnHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: isSmallDevice ? 4 : 6, paddingVertical: isSmallDevice ? 6 : 8, paddingHorizontal: 8 },
  columnTitle: { fontSize: isSmallDevice ? 12 : isTablet ? 16 : 14, fontWeight: "600" },
  totalsRow: { flexDirection: "row", gap: isSmallDevice ? 6 : 10, marginTop: 1 },
  totalLabel: { fontSize: isSmallDevice ? 10 : isTablet ? 13 : 11, color: "#E65100", fontWeight: "500" },
  totalValue: { fontWeight: "700" },
  listContent: { paddingVertical: isSmallDevice ? 2 : 4 },

  // Cards
  cardContainer: { width: "100%", alignItems: "center", paddingVertical: isSmallDevice ? 2 : 3 },
  card: { width: "94%", borderRadius: isSmallDevice ? 6 : 10, padding: isSmallDevice ? 8 : isTablet ? 14 : 10 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isSmallDevice ? 6 : 8,
    paddingBottom: isSmallDevice ? 6 : 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  productId: { flex: 1, fontSize: isSmallDevice ? 13 : isTablet ? 17 : 15, fontWeight: "700", color: "#FFFFFF" },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: isSmallDevice ? 6 : 10,
    paddingVertical: isSmallDevice ? 2 : 3,
    borderRadius: 10,
    marginLeft: 4,
  },
  badgeText: { fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12, fontWeight: "600", color: "#FFFFFF" },

  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: isSmallDevice ? 4 : 6 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: isSmallDevice ? 2 : 4, minWidth: isSmallDevice ? "45%" : "40%" },
  infoLabel: { fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12, color: "rgba(255, 255, 255, 0.75)", fontWeight: "500" },
  infoValue: { fontSize: isSmallDevice ? 12 : isTablet ? 15 : 13, color: "#FFFFFF", fontWeight: "600", flexShrink: 1 },

  // Footer
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: isSmallDevice ? 8 : 12,
    paddingVertical: isSmallDevice ? 8 : 10,
    backgroundColor: "transparent",
  },
  footerButton: {
    alignSelf: "center",
    width: "94%",
    height: isSmallDevice ? 44 : isTablet ? 56 : 48,
    borderRadius: isSmallDevice ? 10 : 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#53e75a",
    elevation: 2,
  },
  footerButtonEnabled: { backgroundColor: "#3db843", opacity: 1 },
  footerButtonDisabled: { backgroundColor: "transparent", opacity: 0.35 },
  footerButtonLoading: { opacity: 0.85 },
  footerButtonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerButtonText: { fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14, fontWeight: "700" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: isSmallDevice ? 12 : 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: isSmallDevice ? 10 : 14,
    width: "100%",
    maxHeight: "80%",
    padding: isSmallDevice ? 12 : 20,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isSmallDevice ? 12 : 16,
    paddingBottom: isSmallDevice ? 8 : 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: { fontSize: isSmallDevice ? 16 : isTablet ? 20 : 18, fontWeight: "700", color: "#1976D2" },
  modalDropdownSection: { marginBottom: isSmallDevice ? 12 : 16 },
  modalSectionLabel: { fontSize: isSmallDevice ? 12 : isTablet ? 15 : 13, fontWeight: "600", color: "#424242", marginBottom: isSmallDevice ? 4 : 6 },
  modalDropdown: {
    backgroundColor: "#F5F5F5",
    borderRadius: isSmallDevice ? 6 : 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: isSmallDevice ? 10 : 14,
    paddingVertical: isSmallDevice ? 10 : 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalDropdownPlaceholder: { fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14, color: "#9E9E9E" },
  modalDropdownSelectedText: { fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14, color: "#212121", fontWeight: "500" },
  modalDropdownInputSearch: { height: isSmallDevice ? 36 : 40, fontSize: isSmallDevice ? 13 : 15 },

  modalListSection: { flexShrink: 1, minHeight: isSmallDevice ? 80 : 100 },
  modalLoadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: isSmallDevice ? 20 : 30 },
  modalLoadingText: { fontSize: isSmallDevice ? 12 : 14, color: "#757575" },
  modalEmptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: isSmallDevice ? 6 : 8, paddingVertical: isSmallDevice ? 20 : 30 },
  modalEmptyText: { fontSize: isSmallDevice ? 12 : isTablet ? 15 : 13, color: "#9E9E9E", textAlign: "center" },
  modalScrollList: { flexGrow: 0, marginTop: isSmallDevice ? 4 : 6 },

  modalTrasladoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: isSmallDevice ? 6 : 8,
    padding: isSmallDevice ? 8 : 12,
    marginBottom: isSmallDevice ? 4 : 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalTrasladoInfo: { flex: 1, marginRight: 8 },
  modalTrasladoId: { fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14, fontWeight: "700", color: "#1565C0" },
  modalTrasladoDetail: { fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12, color: "#757575", marginTop: 2 },
  modalTrasladoAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: isSmallDevice ? 3 : 4,
    backgroundColor: "#4CAF50",
    paddingHorizontal: isSmallDevice ? 10 : 14,
    paddingVertical: isSmallDevice ? 6 : 8,
    borderRadius: isSmallDevice ? 6 : 8,
  },
  modalTrasladoAddBtnText: { fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12, fontWeight: "600", color: "#FFFFFF" },
  modalCloseBtn: {
    marginTop: isSmallDevice ? 12 : 16,
    backgroundColor: "#F5F5F5",
    borderRadius: isSmallDevice ? 6 : 8,
    paddingVertical: isSmallDevice ? 10 : 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalCloseBtnText: { fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14, fontWeight: "600", color: "#424242" },
})