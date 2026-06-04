import type { StackScreenProps } from "@react-navigation/stack"
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  InteractionManager,
  RefreshControl,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import Icon from "react-native-vector-icons/FontAwesome5"
import SoundPlayer from "react-native-sound-player"

import type { RootStackParams } from "../../../../navigation/navigation"
import Header from "../../../../components/Header"
import { WMSContext } from "../../../../context/WMSContext"
import { WMSApiSerigrafia } from "../../../../api/WMSApiSerigrafia"
import type { TrasladoDespachoDTO } from "../../../../interfaces/Serigrafia/TrasladoDespachoDTO"
import { UsuarioValidoPorAccion } from "../../../../interfaces/Serigrafia/UsuarioValidoPorAccion"
import { IDespachoLinesPacking } from "../../../../interfaces/Serigrafia/IDespachoLinesPacking"

interface ReceivingRequestDTO {
  DespachoId: number
  ProdMasterId: string
  Box: number
  UserPacking: string
}

type props = StackScreenProps<RootStackParams, "DespachoRecibirTrasladoScreen">

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const isSmallDevice = SCREEN_WIDTH < 400
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
  } catch (err) {
    // noop
  }
}

/** Card memoizada: solo re-render si cambia "item.receive" o campos que muestras */
const ItemCard = React.memo(
  ({ item }: { item: IDespachoLinesPacking }) => {
    const isSegunda = Number(item.boxCategoryId) === 2
    const bg = isSegunda ? (item.receive ? "#7B1FA2" : "#AB47BC") : item.receive ? "#5e93e2" : "#4CAF50"

    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return "N/A"
      const d = new Date(date)
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    }

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
            {item.receive && <Info label="Fecha" value={formatDate(item.receiveDateTime)} />}
          </View>
        </View>
      </View>
    )
  },
  (prev, next) => {
    // Comparación súper barata y efectiva
    const a = prev.item
    const b = next.item
    return (
      a.id === b.id &&
      a.receive === b.receive &&
      a.receiveDateTime === b.receiveDateTime &&
      a.qty === b.qty &&
      a.boxCategoryId === b.boxCategoryId
    )
  }
)

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

export const DespachoRecibirTrasladoScreen: FC<props> = () => {
  const { WMSState } = useContext(WMSContext)

  // ⚡ Importante: evitar re-render por cada tecla
  const [uiText, setUiText] = useState("")
  const inputRef = useRef<TextInput>(null)

  const [loadingSend, setLoadingSend] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [data, setData] = useState<IDespachoLinesPacking[]>([])
  const [traslados, setTraslados] = useState<TrasladoDespachoDTO[]>([])
  const [trasladosExpanded, setTrasladosExpanded] = useState(!isSmallDevice)

  const [usuariosValidos, setUsuariosValidos] = useState<UsuarioValidoPorAccion[]>([])
  const esUsuarioValido = useMemo(
    () => usuariosValidos.some((u) => u.codigoEmpleado === WMSState.usuario),
    [usuariosValidos, WMSState.usuario]
  )

  // ========= 1) Derivados ultrarrápidos =========
  const { pendiente, escaneado, totals, itemIndexByKey, receiveAllByItemId } = useMemo(() => {
    const p: IDespachoLinesPacking[] = []
    const e: IDespachoLinesPacking[] = []
    const idx = new Map<string, number>()

    let p1 = 0,
      p2 = 0,
      e1 = 0,
      e2 = 0

    // precompute por itemId para status de traslados sin O(n²)
    const countByItem = new Map<number, { total: number; received: number }>()

    for (let i = 0; i < data.length; i++) {
      const it = data[i]
      idx.set(`${it.prodMasterId}|${it.box}`, i)

      const cat = Number(it.boxCategoryId)
      if (it.receive) {
        e.push(it)
        if (cat === 1) e1 += it.qty ?? 0
        else if (cat === 2) e2 += it.qty ?? 0
      } else {
        p.push(it)
        if (cat === 1) p1 += it.qty ?? 0
        else if (cat === 2) p2 += it.qty ?? 0
      }

      const k = it.itemId
      const prev = countByItem.get(k) ?? { total: 0, received: 0 }
      prev.total += 1
      if (it.receive) prev.received += 1
      countByItem.set(k, prev)
    }

    const all = new Map<number, boolean>()
    for (const [k, v] of countByItem) all.set(k, v.total > 0 && v.total === v.received)

    return {
      pendiente: p,
      escaneado: e,
      totals: { p1, p2, e1, e2 },
      itemIndexByKey: idx,
      receiveAllByItemId: all,
    }
  }, [data])

  const isDisabled = useMemo(() => {
    // habilita botón si hay traslados "completos" pero no enviados
    return traslados.some((t) => receiveAllByItemId.get(t.itemId) === true && t.statusId !== 2)
  }, [traslados, receiveAllByItemId])

  const totalTrasladoRecibible = useMemo(() => {
    // tu contador (ajústalo si querías otra lógica)
    return traslados.filter((t) => t.statusId === 1 && receiveAllByItemId.get(t.itemId) === true).length
  }, [traslados, receiveAllByItemId])

  // ========= 2) Fetchers =========
  const getUsuarioValido = useCallback(async () => {
    try {
      const resp = await WMSApiSerigrafia.get<UsuarioValidoPorAccion[]>(`GetUsuariosPorAccion/R`)
      setUsuariosValidos(resp.data)
    } catch (err) {
      // noop
    }
  }, [])

  const getData = useCallback(async () => {
    const resp = await WMSApiSerigrafia.get<IDespachoLinesPacking[]>(
      `GetDespachoLinesByIdARecibir/${WMSState.SRGDespachoId}`
    )
    setData(resp.data)
  }, [WMSState.SRGDespachoId])

  const getTraslados = useCallback(async () => {
    const resp = await WMSApiSerigrafia.get<TrasladoDespachoDTO[]>(`GetDespachoTrasladosById/${WMSState.SRGDespachoId}`)
    setTraslados(resp.data)
  }, [WMSState.SRGDespachoId])

  useEffect(() => {
    getUsuarioValido()
  }, [getUsuarioValido])

  useEffect(() => {
    // evita jank al entrar: carga después de animaciones
    const task = InteractionManager.runAfterInteractions(() => {
      getTraslados()
      getData()
      setTimeout(() => inputRef.current?.focus(), 150)
    })
    return () => task.cancel()
  }, [getData, getTraslados])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([getData(), getTraslados()])
    } finally {
      setRefreshing(false)
    }
  }, [getData, getTraslados])

  // ========= 3) SendReceive ultra rápido =========
  const sendReceive = useCallback(
    async (rawCode: string) => {
      if (loadingSend) return

      const clean = rawCode.trim()
      if (!scanRegex.test(clean)) return

      const parsed = parseScan(clean)
      if (!parsed) {
        PlaySound("error")
        setUiText("")
        Alert.alert("Error", "El código escaneado no corresponde a ningún item pendiente.")
        return
      }

      // UI inmediata: limpiar input y mantener foco sin loop raro
      setUiText("")
      requestAnimationFrame(() => inputRef.current?.focus())

      // Optimista (instantáneo): marca como recibido ANTES de esperar red
      const key = `${parsed.prodMasterId}|${parsed.box}`
      const index = itemIndexByKey.get(key)

      if (index === undefined) {
        PlaySound("error")
        setUiText("")
        Alert.alert("Error", "El código escaneado no corresponde a ningún item pendiente.")
        requestAnimationFrame(() => inputRef.current?.focus())
        return
      }

      const itemActual = data[index]

      if (!itemActual || itemActual.receive) {
        PlaySound("error")
        setUiText("")
        Alert.alert("Error", "El item ya ha sido recibido.")
        requestAnimationFrame(() => inputRef.current?.focus())
        return
      }
      if (index !== undefined) {
        setData((prev) => {
          const cur = prev[index]
          if (!cur || cur.receive) return prev
          const next = prev.slice()
          next[index] = { ...cur, receive: true, receiveDateTime: new Date() }
          return next
        })
      }

      setLoadingSend(true)
      try {
        const packingRequest: ReceivingRequestDTO = {
          DespachoId: WMSState.SRGDespachoId,
          ProdMasterId: parsed.prodMasterId,
          Box: parsed.box,
          UserPacking: (WMSState as any)?.usuario ?? (WMSState as any)?.UserName ?? "Usuario Demo",
        }

        const resp = await WMSApiSerigrafia.post("SetReceiveAsync", packingRequest)

        if (Number(resp.data) > 0) {
          PlaySound("success")
        } else {
          // rollback si backend dice que no
          PlaySound("error")
          if (index !== undefined) {
            setData((prev) => {
              const cur = prev[index]
              if (!cur) return prev
              const next = prev.slice()
              next[index] = { ...cur, receive: false, receiveDateTime: null as any }
              return next
            })
          }
        }
      } catch (e) {
        // rollback por error
        PlaySound("error")
        if (index !== undefined) {
          setData((prev) => {
            const cur = prev[index]
            if (!cur) return prev
            const next = prev.slice()
            next[index] = { ...cur, receive: false, receiveDateTime: null as any }
            return next
          })
        }
      } finally {
        setLoadingSend(false)
      }
    },
    [WMSState, itemIndexByKey, loadingSend]
  )

  // ========= 4) Input sin lag =========
  // Tip: el escáner normalmente pega el string entero de golpe;
  // no necesitamos recalcular nada pesado aquí.
  const onChangeText = useCallback(
    (text: string) => {
      setUiText(text)
      const t = text.trim()
      if (scanRegex.test(t)) {
        sendReceive(t)
      }
    },
    [sendReceive]
  )

  // ========= 5) Transfer status =========
  const changeTransferStatus = useCallback(async () => {
    if (!esUsuarioValido) {
      Alert.alert("Alerta", "Usuario invalido para esta acción.")
      return
    }
    if (loadingSend) return

    const dataToSend = traslados.filter((t) => t.statusId === 1 && receiveAllByItemId.get(t.itemId) === true)

    if (dataToSend.length === 0) return

    setLoadingSend(true)
    try {
      await WMSApiSerigrafia.post(`RecibirDespacho/${WMSState.SRGDespachoId}`, dataToSend)
      Alert.alert("Éxito", "Los traslados han sido recibidos correctamente.")
      await Promise.all([getTraslados(), getData()])
    } catch (error: any) {
      const msg = "Error al recibir despacho. " + (error?.response?.data ?? "")
      Alert.alert("Error", msg)
    } finally {
      setLoadingSend(false)
    }
  }, [WMSState.SRGDespachoId, esUsuarioValido, getData, getTraslados, loadingSend, receiveAllByItemId, traslados])

  // ========= 6) FlatList optimizada =========
  const keyExtractor = useCallback((item: IDespachoLinesPacking) => item.id.toString(), [])
  const renderRow = useCallback(({ item }: { item: IDespachoLinesPacking }) => <ItemCard item={item} />, [])

  // Si tus cards tienen altura constante (aprox), descomenta para boost grande:
  // const CARD_H = isSmallDevice ? 86 : 102
  // const getItemLayout = useCallback((_: any, index: number) => ({ length: CARD_H, offset: CARD_H * index, index }), [])

  return (
    <View style={styles.container}>
      <Header texto1="" texto2="Recibir Despacho" texto3={`Numero de Despacho: ${WMSState.SRGDespachoId}`} />

      {!!traslados.length && (
        <View style={styles.trasladosSection}>
          <TouchableOpacity style={styles.trasladosHeader} onPress={() => setTrasladosExpanded((s) => !s)}>
            <View style={styles.trasladosHeaderLeft}>
              <Icon name="exchange-alt" size={isSmallDevice ? 10 : 12} color="#1976D2" />
              <Text style={styles.trasladosHeaderText}>Traslados ({traslados.length})</Text>
            </View>
            <Icon name={trasladosExpanded ? "chevron-up" : "chevron-down"} size={isSmallDevice ? 10 : 12} color="#757575" />
          </TouchableOpacity>

          {trasladosExpanded && (
            <View style={styles.trasladosContent}>
              <ScrollView
                style={styles.trasladosScroll}
                contentContainerStyle={styles.trasladosChips}
                showsVerticalScrollIndicator
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {traslados.map((t, i) => (
                  <View key={i} style={[styles.trasladoChip, getStatusStyle(t.statusId)]}>
                    <Text style={[styles.trasladoChipText, getStatusTextStyle(t.statusId)]}>{t.transferId}</Text>
                    <Text style={[styles.trasladoChipText, getStatusTextStyle(t.statusId)]}>{t.itemId}</Text>
                    <Text style={[styles.trasladoChipText, getStatusTextStyle(t.statusId)]}>Total Uni: {t.montoTraslado}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Input rápido */}
      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <Icon name="barcode" size={isSmallDevice ? 14 : 16} color="#757575" />
          <TextInput
            ref={inputRef}
            value={uiText}
            onChangeText={onChangeText}
            style={styles.input}
            placeholder="Escanear..."
            placeholderTextColor="#9E9E9E"
            autoFocus
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
            // OJO: quitar onBlur refocus evita loops raros; si lo necesitas, hazlo condicionado:
            onBlur={() => {
              if (!loadingSend) requestAnimationFrame(() => inputRef.current?.focus())
            }}
          />
          {loadingSend && <ActivityIndicator size="small" color="#4CAF50" />}
          {!!uiText.length && !loadingSend && (
            <TouchableOpacity onPress={() => setUiText("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="times" size={isSmallDevice ? 12 : 14} color="#757575" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Dos listas (manteniendo tu layout) */}
      <View style={styles.listsContainer}>
        <View style={styles.listColumn}>
          <View style={[styles.columnHeader, { backgroundColor: "#FFF3E0" }]}>
            <View style={styles.headerTopRow}>
              <Icon name="clock" size={isSmallDevice ? 10 : 12} color="#FF9800" />
              <Text style={[styles.columnTitle, { color: "#E65100" }]}>
                Pendiente ({pendiente.length})
              </Text>
            </View>

            <View style={styles.totalsRowBelow}>
              <Text style={styles.totalLabel}>
                1ra: <Text style={styles.totalValue}>{totals.p1}</Text>
              </Text>
              <Text style={[styles.totalLabel, { color: "#7B1FA2" }]}>
                2da: <Text style={styles.totalValue}>{totals.p2}</Text>
              </Text>
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
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4CAF50"]} />}
          // getItemLayout={getItemLayout}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.listColumn}>
          <View style={[styles.columnHeader, { backgroundColor: "#c2c9e7" }]}>
            <View style={styles.headerTopRow}>
              <Icon name="check-circle" size={isSmallDevice ? 10 : 12} color="#8ca5f5" />
              <Text style={[styles.columnTitle, { color: "#6085ff" }]}>
                Escaneado ({escaneado.length})
              </Text>
            </View>

            <View style={styles.totalsRowBelow}>
              <Text style={styles.totalLabel}>
                1ra: <Text style={styles.totalValue}>{totals.e1}</Text>
              </Text>
              <Text style={[styles.totalLabel, { color: "#7B1FA2" }]}>
                2da: <Text style={styles.totalValue}>{totals.e2}</Text>
              </Text>
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
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} />}
          // getItemLayout={getItemLayout}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.footerButton,
            isDisabled ? styles.footerButtonEnabled : styles.footerButtonDisabled,
            loadingSend && styles.footerButtonLoading,
          ]}
          onPress={changeTransferStatus}
          disabled={!isDisabled || loadingSend}
          activeOpacity={0.85}
        >
          {loadingSend ? (
            <ActivityIndicator size="small" color={isDisabled ? "#FFFFFF" : "#3B82F6"} />
          ) : (
            <View style={styles.footerButtonContent}>
              <Icon name="check-double" size={isSmallDevice ? 14 : 16} color={isDisabled ? "#FFFFFF" : "#3B82F6"} />
              <Text style={[styles.footerButtonText, { color: isDisabled ? "#FFFFFF" : "#3B82F6" }]}>
                Recibir traslados ({totalTrasladoRecibible})
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ===== estilos (reutilicé los tuyos casi igual) =====

const styles = StyleSheet.create({
  columnHeader: {
    paddingVertical: isSmallDevice ? 6 : 8,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: isSmallDevice ? 4 : 6,
  },
  totalsRowBelow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: isSmallDevice ? 10 : 14,
    marginTop: 4,
  },
  trasladosScroll: {
    maxHeight: isSmallDevice ? 200 : isTablet ? 160 : 120, // ajusta a gusto
  },
  trasladosChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: isSmallDevice ? 4 : 6,
    marginTop: isSmallDevice ? 4 : 6,
    paddingBottom: 6, // para que no quede pegado al final al hacer scroll
  },
  totalsRow: { flexDirection: "row", gap: isSmallDevice ? 6 : 10, marginTop: 1 },
  totalLabel: { fontSize: isSmallDevice ? 10 : isTablet ? 13 : 11, color: "#E65100", fontWeight: "500" },
  totalValue: { fontWeight: "700" },
  container: { flex: 1, backgroundColor: "#F5F5F5" },

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
  trasladosChips: { flexDirection: "row", flexWrap: "wrap", gap: isSmallDevice ? 4 : 6, marginTop: isSmallDevice ? 4 : 6 },
  trasladoChip: { paddingHorizontal: isSmallDevice ? 6 : 10, paddingVertical: isSmallDevice ? 2 : 4, borderRadius: 12 },
  trasladoChipText: { fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12, fontWeight: "600" },

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

  listsContainer: { flex: 1, flexDirection: "row", paddingBottom: isSmallDevice ? 56 : 64 },
  listColumn: { flex: 1 },
  divider: { width: 1, backgroundColor: "#E0E0E0" },
  columnTitle: { fontSize: isSmallDevice ? 12 : isTablet ? 16 : 14, fontWeight: "600" },
  listContent: { paddingVertical: isSmallDevice ? 2 : 4 },

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

  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: isSmallDevice ? 8 : 12, paddingVertical: isSmallDevice ? 8 : 10, backgroundColor: "transparent" },
  footerButton: {
    alignSelf: "center",
    width: "94%",
    height: isSmallDevice ? 44 : isTablet ? 56 : 48,
    borderRadius: isSmallDevice ? 10 : 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    elevation: 2,
  },
  footerButtonEnabled: { backgroundColor: "#3B82F6", opacity: 1 },
  footerButtonDisabled: { backgroundColor: "transparent", opacity: 0.35 },
  footerButtonLoading: { opacity: 0.85 },
  footerButtonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerButtonText: { fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14, fontWeight: "700" },
})

function getStatusStyle(statusId: number) {
  switch (statusId) {
    case 0:
      return { backgroundColor: "#e4e2d9" }
    case 1:
      return { backgroundColor: "#22C55E" }
    case 2:
      return { backgroundColor: "#3f96be" }
    default:
      return { backgroundColor: "#9CA3AF" }
  }
}
function getStatusTextStyle(statusId: number) {
  switch (statusId) {
    case 0:
      return { color: "#000000" }
    case 1:
    case 2:
    default:
      return { color: "#FFFFFF" }
  }
}