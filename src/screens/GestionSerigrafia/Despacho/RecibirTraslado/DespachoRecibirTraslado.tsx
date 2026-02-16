import type { StackScreenProps } from "@react-navigation/stack"
import { type FC, useContext, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
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
import { IDespachoLinesPacking } from "../../../../interfaces/Serigrafia/IDespachoLinesPacking"

interface ReceivingRequestDTO {
  DespachoId: number
  ProdMasterId: string
  Box: number
  userReceive: string
}

type props = StackScreenProps<RootStackParams, "DespachoRecibirTrasladoScreen">

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const isSmallDevice = SCREEN_WIDTH < 400 // PDAs Zebra ~320-380px
const isTablet = SCREEN_WIDTH >= 600

export const DespachoRecibirTrasladoScreen: FC<props> = ({ navigation }) => {
  const [searchText, setSearchText] = useState<string>("")
  const textInputRef = useRef<TextInput>(null)

  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<IDespachoLinesPacking[]>([])
  const [pendiente, setPendiente] = useState<IDespachoLinesPacking[]>([])
  const [escaneado, setEscaneado] = useState<IDespachoLinesPacking[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const { WMSState } = useContext(WMSContext)

  const [despachoTrasladodata, setDespachoTrasladodata] = useState<TrasladoDespachoDTO[]>([])
  const [trasladosExpanded, setTrasladosExpanded] = useState<boolean>(!isSmallDevice)

 // const isDisabled = data.length > 0 && data.every((item) => item.receive);

  const [usuariosValidos, setUsuariosValidos] = useState<UsuarioValidoPorAccion[]>([]);
  const esUsuarioValido = usuariosValidos.some((u) => u.codigoEmpleado === WMSState.usuario)

  const totalPendientePrimeras = pendiente.reduce((total, item) => {
    const cat = Number(item.boxCategoryId)
    if (cat === 1) return total + (item.qty ?? 0)
    return total
  }, 0)

  const totalPendienteSegundas = pendiente.reduce((total, item) => {
    const cat = Number(item.boxCategoryId)
    if (cat === 2) return total + (item.qty ?? 0)
    return total
  }, 0)

  const totalEscaneadoPrimeras = escaneado.reduce((total, item) => {
    const cat = Number(item.boxCategoryId)
    if (cat === 1) return total + (item.qty ?? 0)
    return total
  }, 0)

  const totalEscaneadoSegundas = escaneado.reduce((total, item) => {
    const cat = Number(item.boxCategoryId)
    if (cat === 2) return total + (item.qty ?? 0)
    return total
  }, 0)

  const isTrasladoCompletamentePikeado = (tras: TrasladoDespachoDTO) =>
    data
      .filter(d => d.itemId === tras.itemId)
      .every(d => d.receive)

  const isTrasladoEnviado = (tras: TrasladoDespachoDTO) => tras.statusId === 2

  const isDisabled = despachoTrasladodata.some(
    (tras) => isTrasladoCompletamentePikeado(tras) && !isTrasladoEnviado(tras)
  )
  const totaldtrasladoRecibido = despachoTrasladodata.filter((tras) => tras.statusId === 1 &&
    data
      .filter(d => d.itemId === tras.itemId)
      .every(d => d.receive)).length
 
  const PlaySound = (estado: string) => {
    try {
      SoundPlayer.playSoundFile(estado, "mp3")
    } catch (err) {
      console.log(err)
    }
  }

  const getUsuarioValido = async () => {
    setData([]);
    const validoEnviar = "R";
    try {
      const resp = await WMSApiSerigrafia.get<UsuarioValidoPorAccion[]>(
        `GetUsuariosPorAccion/${validoEnviar}`
      );
      setUsuariosValidos(resp.data)
    } catch (err) {
      console.log("Error fetching data", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getUsuarioValido();
  }, []);

  const scanRegex = /^OP-\d{8}\s\d{3},\d+$/

  const parseScan = (raw: string): { prodMasterId: string; box: number } | null => {
    const v = raw.trim()
    const m = v.match(/^(OP-\d{8}\s\d{3}),(\d+)$/)
    if (!m) return null

    const prodMasterId = m[1]
    const box = Number(m[2])

    if (!prodMasterId || !Number.isFinite(box)) return null
    return { prodMasterId, box }
  }

  const getData = async () => {
    try {
      const resp = await WMSApiSerigrafia.get<IDespachoLinesPacking[]>(
        `GetDespachoLinesByIdARecibir/${WMSState.SRGDespachoId}`,
      )
      setData(resp.data)

      const data1: IDespachoLinesPacking[] = []
      const data2: IDespachoLinesPacking[] = []

      resp.data.forEach((element) => {
        if (element.receive) data2.push(element)
        else data1.push(element)
      })

      setPendiente(data1)
      setEscaneado(data2)
    } catch (err) {
      console.log(err)
    }
  }

  const getDespachoTrasladoData = async () => {
    try {
      const resp = await WMSApiSerigrafia.get<TrasladoDespachoDTO[]>(
        `GetDespachoTrasladosById/${WMSState.SRGDespachoId}`,
      )
      setDespachoTrasladodata(resp.data)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    getDespachoTrasladoData()
    getData()
    const id = setTimeout(() => textInputRef.current?.focus(), 300)
    return () => clearTimeout(id)
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([getData(), getDespachoTrasladoData()])
    } finally {
      setRefreshing(false)
    }
  }
  const changeTransferStatus = async () => {
    if (!esUsuarioValido) {
      Alert.alert("Alerta", "Usuario invalido para esta acción.")
      return
    }
    if (loading) return
    const dataToSend = despachoTrasladodata.filter(tras => tras.statusId == 1 &&
      data
        .filter(d => d.itemId === tras.itemId)
        .every(d => d.receive)
    );
    setLoading(true)
    await WMSApiSerigrafia.post(`RecibirDespacho/${WMSState.SRGDespachoId}`, dataToSend).then(async (response) => {
      Alert.alert("Éxito", "Los traslados han sido recibidos correctamente.")
      await getDespachoTrasladoData()
      await getData()
    }
    ).catch((error) => {
      const errorMessage = "Error al recibir despacho." + error.response.data
      Alert.alert("Error", errorMessage)
    }).finally(() => {
      setLoading(false)
    })
  }


  const sendReceive = async (rawCode: string) => {
    if (loading) return

    const clean = rawCode.trim()
    if (!scanRegex.test(clean)) return

    const parsed = parseScan(clean)
    if (!parsed) {
      PlaySound("error")
      return
    }

    setLoading(true)
    try {
      const packingRequest: ReceivingRequestDTO = {
        DespachoId: WMSState.SRGDespachoId,
        ProdMasterId: parsed.prodMasterId,
        Box: parsed.box,
        userReceive: WMSState.usuario,
      }

      await WMSApiSerigrafia.post("SetReceiveAsync", packingRequest)

      await getData()
      PlaySound("success")
    } catch (error) {
      console.log(error)
      PlaySound("error")
    } finally {
      setLoading(false)
      setSearchText("")
      requestAnimationFrame(() => textInputRef.current?.focus())
    }
  }
  const getStatusStyle = (statusId: number) => {
    switch (statusId) {
      case 0: // Creado
        return { backgroundColor: '#e4e2d9' } // amarillo
      case 1: // Enviado
        return { backgroundColor: '#22C55E' } // verde
      case 2: // ecibido
        return { backgroundColor: '#3f96be' } // rojo
      default:
        return { backgroundColor: '#9CA3AF' } // gris
    }
  }
  const getStatusTextStyle = (statusId: number) => {
    switch (statusId) {
      case 0: // Creado (fondo claro)
        return { color: "#000000" }
      case 1: // Enviado (verde)
        return { color: "#FFFFFF" }
      case 3: // Recibido (azul)
        return { color: "#FFFFFF" }
      default: // Gris
        return { color: "#FFFFFF" }
    }
  }

  const handleScanChange = (text: string) => {
    setSearchText(text)
    const trimmed = text.trim()
    if (scanRegex.test(trimmed)) {
      sendReceive(trimmed)
    }
  }

  const renderItem = (item: IDespachoLinesPacking) => {

    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return "N/A"
      const d = new Date(date)
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    }
    const isSegunda = Number(item.boxCategoryId) === 2
    const getCardColor = () => {
      if (isSegunda) {
        // Segundas: tonos distintos para diferenciar
        return item.receive ? "#7B1FA2" : "#AB47BC" // morado oscuro / morado claro
      }
      // Primeras: colores originales
      return item.receive ? "#5e93e2" : "#4CAF50"
    }


    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, { backgroundColor: getCardColor() }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.productId} numberOfLines={1}>{item.prodMasterId}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Caja {item.box}</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Articulo</Text>
                <Text style={styles.infoValue}>{item.itemId}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Talla</Text>
                <Text style={styles.infoValue}>{item.size}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Cant</Text>
                <Text style={styles.infoValue}>{item.qty}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Color</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{item.colorId}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>categoria</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{item.boxCategoryId}</Text>
              </View>
              {item.receive && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Fecha</Text>
                  <Text style={styles.infoValue}>{formatDate(item.receiveDateTime)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header compacto */}

      <Header texto1="" texto2="Recibir Despacho" texto3={`Numero de Despacho: ${WMSState.SRGDespachoId}`} />
      {/* Traslados colapsable */}
      {despachoTrasladodata.length > 0 && (
        <View style={styles.trasladosSection}>
          <TouchableOpacity
            style={styles.trasladosHeader}
            onPress={() => setTrasladosExpanded(!trasladosExpanded)}
          >
            <View style={styles.trasladosHeaderLeft}>
              <Icon name="exchange-alt" size={isSmallDevice ? 10 : 12} color="#1976D2" />
              <Text style={styles.trasladosHeaderText}>
                Traslados ({despachoTrasladodata.length})
              </Text>
            </View>
            <Icon
              name={trasladosExpanded ? "chevron-up" : "chevron-down"}
              size={isSmallDevice ? 10 : 12}
              color="#757575"
            />
          </TouchableOpacity>

          {trasladosExpanded && (
            <View style={styles.trasladosContent}>
              <View style={styles.trasladosChips}>
                {despachoTrasladodata.map((traslado, index) => (
                  <View key={index} style={[styles.trasladoChip, getStatusStyle(traslado.statusId)]}>
                    <Text style={[styles.trasladoChipText,getStatusTextStyle(traslado.statusId)]}>{traslado.transferId}</Text>
                    <Text style={[styles.trasladoChipText,getStatusTextStyle(traslado.statusId)]}>{traslado.itemId}</Text>
                    <Text style={[styles.trasladoChipText,getStatusTextStyle(traslado.statusId)]}>Total Uni: {traslado.montoTraslado}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Barra de busqueda compacta */}
      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <Icon name="barcode" size={isSmallDevice ? 14 : 16} color="#757575" />
          <TextInput
            ref={textInputRef}
            value={searchText}
            onChangeText={handleScanChange}
            style={styles.input}
            placeholder="Escanear..."
            placeholderTextColor="#9E9E9E"
            autoFocus
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
            onBlur={() => requestAnimationFrame(() => textInputRef.current?.focus())}
          />
          {loading && <ActivityIndicator size="small" color="#4CAF50" />}
          {searchText.length > 0 && !loading && (
            <TouchableOpacity onPress={() => setSearchText("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="times" size={isSmallDevice ? 12 : 14} color="#757575" />
            </TouchableOpacity>
          )}
        </View>

      </View>

      {/* Listas - Layout adaptivo */}
      <View style={styles.listsContainer}>
        {/* Columna Pendiente */}
        <View style={styles.listColumn}>
          <View style={[styles.columnHeader, { backgroundColor: "#FFF3E0" }]}>
            <Icon name="clock" size={isSmallDevice ? 10 : 12} color="#FF9800" />
            <Text style={[styles.columnTitle, { color: "#E65100" }]}>
              Pendiente ({pendiente.length})
            </Text>
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>1ra: <Text style={styles.totalValue}>{totalPendientePrimeras}</Text></Text>
              <Text style={[styles.totalLabel, { color: "#7B1FA2" }]}>2da: <Text style={styles.totalValue}>{totalPendienteSegundas}</Text></Text>
            </View>
          </View>
          <FlatList
            data={pendiente}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => renderItem(item)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#4CAF50"]}
              />
            }
          />
        </View>

        <View style={styles.divider} />


        {/* Columna Escaneado */}
        <View style={styles.listColumn}>
          <View style={[styles.columnHeader, { backgroundColor: "#c2c9e7" }]}>
            <Icon name="check-circle" size={isSmallDevice ? 10 : 12} color="#8ca5f5" />
            <Text style={[styles.columnTitle, { color: "#6085ff" }]}>
              Escaneado ({escaneado.length})
            </Text>
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>1ra: <Text style={styles.totalValue}>{totalEscaneadoPrimeras}</Text></Text>
              <Text style={[styles.totalLabel, { color: "#7B1FA2" }]}>2da: <Text style={styles.totalValue}>{totalEscaneadoSegundas}</Text></Text>
            </View>
          </View>
          <FlatList
            data={escaneado}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => renderItem(item)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#3B82F6"]}
              />
            }
          />
        </View>
      </View>

      {/* Footer flotante (sin franja) */}
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
            <ActivityIndicator size="small" color={isDisabled ? "#FFFFFF" : "#3B82F6"} />
          ) : (
            <View style={styles.footerButtonContent}>
              <Icon
                name="check-double"
                size={isSmallDevice ? 14 : 16}
                color={isDisabled ? "#FFFFFF" : "#3B82F6"}
              />
              <Text style={[styles.footerButtonText, { color: isDisabled ? "#FFFFFF" : "#3B82F6" }]}>
                 Recibir traslados ({totaldtrasladoRecibido})
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

    </View>

  )
}

const styles = StyleSheet.create({
  totalsRow: {
    flexDirection: "row",
    gap: isSmallDevice ? 6 : 10,
    marginTop: 1,
  },
  totalLabel: {
    fontSize: isSmallDevice ? 10 : isTablet ? 13 : 11,
    color: "#E65100",
    fontWeight: "500",
  },
  totalValue: {
    fontWeight: "700",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  // Header compacto
  headerCompact: {
    backgroundColor: "#1976D2",
    paddingHorizontal: isSmallDevice ? 8 : 12,
    paddingVertical: isSmallDevice ? 6 : 10,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 16 : isTablet ? 20 : 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 12 : isTablet ? 15 : 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 1,
  },

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
  trasladosHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: isSmallDevice ? 4 : 6,
  },
  trasladosHeaderText: {
    fontSize: isSmallDevice ? 12 : isTablet ? 15 : 13,
    fontWeight: "600",
    color: "#1976D2",
  },
  trasladosContent: {
    paddingHorizontal: isSmallDevice ? 8 : 12,
    paddingBottom: isSmallDevice ? 6 : 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  trasladosChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: isSmallDevice ? 4 : 6,
    marginTop: isSmallDevice ? 4 : 6,
  },
  trasladoChip: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: isSmallDevice ? 6 : 10,
    paddingVertical: isSmallDevice ? 2 : 4,
    borderRadius: 12,
  },
  trasladoChipText: {
    fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12,
    fontWeight: "600",
    color: "#1565C0",
  },

  // Busqueda
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
  input: {
    flex: 1,
    fontSize: isSmallDevice ? 14 : isTablet ? 17 : 15,
    color: "#212121",
    paddingVertical: 0,
  },
  sendButton: {
    backgroundColor: "#4CAF50",
    borderRadius: isSmallDevice ? 6 : 8,
    width: isSmallDevice ? 36 : isTablet ? 48 : 42,
    height: isSmallDevice ? 36 : isTablet ? 48 : 42,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#BDBDBD",
  },

  // Listas
  listsContainer: {
    flex: 1,
    flexDirection: "row",
    paddingBottom: isSmallDevice ? 56 : 64,
  },
  listColumn: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: "#E0E0E0",
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: isSmallDevice ? 4 : 6,
    paddingVertical: isSmallDevice ? 6 : 8,
  },
  columnTitle: {
    fontSize: isSmallDevice ? 12 : isTablet ? 16 : 14,
    fontWeight: "600",
  },
  listContent: {
    paddingVertical: isSmallDevice ? 2 : 4,
  },

  // Cards compactas
  cardContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: isSmallDevice ? 2 : 3,
  },
  card: {
    width: "94%",
    borderRadius: isSmallDevice ? 6 : 10,
    padding: isSmallDevice ? 8 : isTablet ? 14 : 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isSmallDevice ? 6 : 8,
    paddingBottom: isSmallDevice ? 6 : 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  productId: {
    flex: 1,
    fontSize: isSmallDevice ? 13 : isTablet ? 17 : 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: isSmallDevice ? 6 : 10,
    paddingVertical: isSmallDevice ? 2 : 3,
    borderRadius: 10,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardContent: {},
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: isSmallDevice ? 4 : 6,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: isSmallDevice ? 2 : 4,
    minWidth: isSmallDevice ? "45%" : "40%",
  },
  infoLabel: {
    fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: isSmallDevice ? 12 : isTablet ? 15 : 13,
    color: "#FFFFFF",
    fontWeight: "600",
    flexShrink: 1,
  },
  // Footer flotante
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: isSmallDevice ? 8 : 12,
    paddingVertical: isSmallDevice ? 8 : 10,
    backgroundColor: "transparent", // <- clave: sin franja
    // sin borderTop
  },

  footerButton: {
    alignSelf: "center",
    width: "94%",
    height: isSmallDevice ? 44 : isTablet ? 56 : 48,
    borderRadius: isSmallDevice ? 10 : 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#3B82F6",

    // sombra ligera opcional para que el botón se distinga sobre los cards
    elevation: 2,
  },

  footerButtonEnabled: {
    backgroundColor: "#3B82F6",
    opacity: 1,
  },

  // deshabilitado: transparente (se “ve” la lista detrás del botón)
  footerButtonDisabled: {
    backgroundColor: "transparent",
    opacity: 0.35,
  },

  footerButtonLoading: {
    opacity: 0.85,
  },

  footerButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  footerButtonText: {
    fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14,
    fontWeight: "700",
  },

})