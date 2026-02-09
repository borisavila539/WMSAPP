"use client"

import type { StackScreenProps } from "@react-navigation/stack"
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native"
import Header from "../../../../components/Header"
import type { RootStackParams } from "../../../../navigation/navigation"
import { type FC, useState, useMemo, useEffect, useContext } from "react"
import { WMSApiSerigrafia } from "../../../../api/WMSApiSerigrafia"
import { Dropdown } from "react-native-element-dropdown"
import type { ConsultaLoteInterface } from "../../../../interfaces/Serigrafia/Lote"
import { WMSContext } from "../../../../context/WMSContext"
import { TrasladoDespachoDTO } from "../../../../interfaces/Serigrafia/TrasladoDespachoDTO"
import { DespachoCreado } from "../../../../interfaces/Serigrafia/DespachoCreado"
import { WmSApi } from "../../../../api/WMSApi"
import { useFocusEffect } from "@react-navigation/native"

type props = StackScreenProps<RootStackParams, "CreacionDespachoPakingScreen">

export const CreacionDespachoPakingScreen: FC<props> = ({ navigation }) => {
  // Campos del formulario
  const [truck, setTruck] = useState("")
  const [driver, setDriver] = useState("")
  const [deTraslado, setDeTraslado] = useState("")
  const [aTraslado, setATraslado] = useState("")
  const [dataLote, setDataLote] = useState<ConsultaLoteInterface[]>([])
  const [loteSeleccionadoModal, setLoteSeleccionadoModal] = useState<string>("")
  const [loteSeleccionadoDespacho, setLoteSeleccionadoDespacho] = useState<string>("")
  const [cargando, setCargando] = useState<boolean>(true)
  const { changeSRGDespachoId } = useContext(WMSContext)
  const [traslados, setTraslados] = useState<TrasladoDespachoDTO[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [despachosCreados, setDespachosCreados] = useState<DespachoCreado[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { WMSState } = useContext(WMSContext)

  const getData = async () => {
    if (!loteSeleccionadoModal) return
    setCargando(true)
    try {
      const Estado = 1 // Estado 1 = Creado
      const resp = await WMSApiSerigrafia.get<DespachoCreado[]>(`GetDespachosByBatchId/${loteSeleccionadoModal}/${Estado}`)
      setDespachosCreados(resp.data)
      setCargando(false)
    } catch (error) {
      Alert.alert("Error al obtener los despachos creados")
      setCargando(false)
    }
  }
  useFocusEffect(
    useMemo(() => {
      return () => {
        getData()
      }
    }, [loteSeleccionadoDespacho]),
  )

  useEffect(() => {
    if (loteSeleccionadoDespacho) {
      getData()
    }
  }, [loteSeleccionadoDespacho])

  const getLote = async () => {
    setCargando(true)
    try {
      const resp = await WMSApiSerigrafia.get<ConsultaLoteInterface[]>("GetLote")
      setDataLote(resp.data)

      if (resp.data.length > 0) {
        setLoteSeleccionadoModal(resp.data[0].itemseasonid)
        setLoteSeleccionadoDespacho(resp.data[0].itemseasonid)
      }
    } catch (error) {
      Alert.alert("Error al obtener los lotes")
    } finally {
      setCargando(false)
    }
  }

  const getTrasladosPorLote = async (lote: string) => {
    setIsLoading(true)

    try {
      const resp = await WMSApiSerigrafia.get<TrasladoDespachoDTO[]>(`GetTrasladoParaDespachoPorLote/${lote}`)

      const data = resp.data?.map((t) => ({ ...t, selected: false })) ?? []
      setTraslados(data)

      if (data.length === 0) {
        Alert.alert("No hay traslados disponibles para el lote seleccionado")
      }
    } catch (error) {

      Alert.alert("Error al obtener los traslados del lote especificado")
      setTraslados([])
    }

    setIsLoading(false)
  }

  useEffect(() => {
    getLote()
  }, [])

  const extractNumeroTraslado = (transferId: string): number => {
    const match = transferId.match(/\d+/)
    return match ? Number.parseInt(match[0], 10) : 0
  }

  const handleTrasladoInput = (value: string, setter: (val: string) => void) => {
    const numericValue = value.replace(/\D/g, "")

    if (numericValue) {
      setter(`TRAS-${numericValue}`)
    } else {
      setter("")
    }
  }

  const trasladosFiltrados = useMemo(() => {
    return traslados.filter((traslado) => {
      const numeroTraslado = extractNumeroTraslado(traslado.transferId)

      if (deTraslado) {
        const numeroDesde = extractNumeroTraslado(deTraslado)
        if (numeroTraslado < numeroDesde) {
          return false
        }
      }

      if (aTraslado) {
        const numeroHasta = extractNumeroTraslado(aTraslado)
        if (numeroTraslado > numeroHasta) {
          return false
        }
      }

      return true
    })
  }, [traslados, deTraslado, aTraslado])

  const toggleTraslado = (id: string) => {
    setTraslados((prev) => prev.map((t) => (t.transferId === id ? { ...t, selected: !t.selected } : t)))
  }

  const toggleSelectAll = () => {
    const todosSeleccionados = trasladosFiltrados.every((t) => t.selected)

    setTraslados((prev) =>
      prev.map((t) => {
        const estaEnFiltrados = trasladosFiltrados.some((tf) => tf.transferId === t.transferId)
        if (estaEnFiltrados) {
          return { ...t, selected: !todosSeleccionados }
        }
        return t
      }),
    )
  }

  const abrirModalCrearDespacho = () => {
    if (!truck || !driver) {
      Alert.alert("Validación", "Por favor complete todos los campos obligatorios (Camión y Chofer)")
      return
    }

    setTraslados([])
    setDeTraslado("")
    setATraslado("")
    setModalVisible(true)
  }

  const confirmarCreacionDespacho = async () => {
    try {

      const trasladosSeleccionados = traslados.filter((t) => t.selected)

      if (trasladosSeleccionados.length === 0) {
        Alert.alert("Validación", "Debe seleccionar al menos un traslado")
        return
      }

      const nuevoDespacho: DespachoCreado = {
        id: 0, // Temporal hasta que el API retorne el ID real
        truck: truck,
        driver: driver,
        store: "40", // Agregar store si es necesario
        createdBy: WMSState.usuario, // Agregar createdBy si es necesario
        createdDateTime: new Date().toISOString(),
        statusId: 0,
        traslados: trasladosSeleccionados.map((t) => ({ ...t, selected: false })),
      }

      const resp = await WMSApiSerigrafia.post<string>('CreateDespacho', nuevoDespacho)
      if (resp.data.includes("Error")) {
        Alert.alert("Error al crear el despacho", resp.data)
        return
      }
      // changeSRGDespachoId(Number(resp.data))
      // navigation.navigate("DespachoEnviarTrasladoScreen")
      
      // Limpiar formulario
      setTruck("")
      setDriver("")
      setDeTraslado("")
      setATraslado("")
      Alert.alert("Éxito", `Despacho creado con ${trasladosSeleccionados.length} traslado(s)`)
      await getData()
      setModalVisible(false)
    } catch {

    }
  }
  const getStatusStyle = (statusId: number) => {
    switch (statusId) {
      case 0: // Creado
        return { backgroundColor: '#e4e2d9' } // amarillo
      case 1: // Enviado #22C55E
        return { backgroundColor: '#22C55E' } // azul
      case 2: // Recibido
        return { backgroundColor: '#3B82F6' } // verde
      case 3: // Cancelado
        return { backgroundColor: '#EF4444' } // rojo
      default:
        return { backgroundColor: '#9CA3AF' } // gris
    }
  }

  const getStatusTextStyle = (statusId: number) => {
    switch (statusId) {
      case 0:
        return { color: '#000' }
      default:
        return { color: '#FFF' }
    }
  }

  const getStatusLabel = (statusId: number) => {
    switch (statusId) {
      case 0:
        return 'Creado'
      case 1:
        return 'Enviado'
      case 2:
        return 'Recibido'
      case 3:
        return 'Cancelado'
      default:
        return 'Desconocido'
    }
  }


  const renderDespachoCreado = ({ item }: { item: DespachoCreado }) => {
    // Formatear la fecha del API
    const fechaCreacion = new Date(item.createdDateTime)
    const fechaFormateada = `${fechaCreacion.toLocaleDateString()} ${fechaCreacion.toLocaleTimeString()}`

    return (
      <TouchableOpacity
        style={styles.despachoCard}
        activeOpacity={0.75}
        onPress={() => {
          changeSRGDespachoId(item.id);
          navigation.navigate("DespachoEnviarTrasladoScreen")
        }}
      >
        <View>
          <View style={styles.despachoHeader}>
            <Text style={styles.despachoId}>Despacho #{item.id}</Text>
            <Text style={styles.despachoFecha}>{fechaFormateada}</Text>
          </View>

          <View style={styles.despachoInfo}>
            <View style={styles.despachoInfoRow}>
              <Text style={styles.despachoLabel}>Camión:</Text>
              <Text style={styles.despachoValue}>{item.truck}</Text>
            </View>

            <View style={styles.despachoInfoRow}>
              <Text style={styles.despachoLabel}>Chofer:</Text>
              <Text style={styles.despachoValue}>{item.driver}</Text>
            </View>

            {item.createdBy && (
              <View style={styles.despachoInfoRow}>
                <Text style={styles.despachoLabel}>Creado por:</Text>
                <Text style={styles.despachoValue}>{item.createdBy}</Text>
              </View>
            )}

          </View>
          <View style={[styles.statusBadge, getStatusStyle(item.statusId)]}>
            <Text style={[styles.statusText, getStatusTextStyle(item.statusId)]}>
              {getStatusLabel(item.statusId)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Header texto1="" texto2="Crear Despacho" texto3="" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}></Text>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Camión *</Text>
            <TextInput
              style={styles.input}
              value={truck}
              onChangeText={setTruck}
              placeholder="Ingrese patente del camión"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chofer *</Text>
            <TextInput
              style={styles.input}
              value={driver}
              onChangeText={setDriver}
              placeholder="Ingrese nombre del chofer"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity style={styles.createButtonTop} onPress={abrirModalCrearDespacho} activeOpacity={0.8}>
            <Text style={styles.createButtonText}>Crear Despacho</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.despachosSection}>
          <Text style={styles.despachosTitle}>Despachos Creados</Text>
          <View style={styles.dropdownContainer}>
            <Dropdown
              data={dataLote.filter((lote) => lote.itemseasonid)}
              labelField="name"
              valueField="itemseasonid"
              placeholder="Seleccione un lote"
              value={loteSeleccionadoDespacho}
              onChange={(item) => setLoteSeleccionadoDespacho(item.itemseasonid)}
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              itemTextStyle={{ color: "black" }}
            />
          </View>
          {cargando ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.emptySubtext}>Cargando despachos...</Text>
            </View>
          ) : despachosCreados.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay despachos creados</Text>
              <Text style={styles.emptySubtext}>Crea tu primer despacho usando el formulario</Text>
            </View>
          ) : (
            <FlatList
              data={despachosCreados}
              renderItem={renderDespachoCreado}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.despachosList}
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Modal expandido a 90% de altura */}
          <View style={styles.modalContentExpanded}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Traslados</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ScrollView expandido para el contenido del modal */}
            <ScrollView style={styles.modalScrollViewExpanded} showsVerticalScrollIndicator={true}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Seleccionar Lote</Text>
                <Dropdown
                  data={dataLote.filter((lote) => lote.itemseasonid)}
                  labelField="name"
                  valueField="itemseasonid"
                  placeholder="Seleccione un lote"
                  value={loteSeleccionadoModal}
                  onChange={(item) => {
                    setLoteSeleccionadoModal(item.itemseasonid)
                    getTrasladosPorLote(item.itemseasonid)
                  }}
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  itemTextStyle={{ color: "black" }}
                  containerStyle={{
                    backgroundColor: "white",
                    zIndex: 100,
                    elevation: 5,
                  }}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Filtrar Traslados</Text>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>De Traslado</Text>
                    <View style={styles.inputWithPrefix}>
                      <Text style={styles.prefixText}>TRAS-</Text>
                      <TextInput
                        style={styles.inputNumeric}
                        value={deTraslado.replace("TRAS-", "")}
                        onChangeText={(text) => handleTrasladoInput(text, setDeTraslado)}
                        placeholder="0141458"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>A Traslado</Text>
                    <View style={styles.inputWithPrefix}>
                      <Text style={styles.prefixText}>TRAS-</Text>
                      <TextInput
                        style={styles.inputNumeric}
                        value={aTraslado.replace("TRAS-", "")}
                        onChangeText={(text) => handleTrasladoInput(text, setATraslado)}
                        placeholder="0141500"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.modalSection}>
                <View style={styles.trasladosHeaderModal}>
                  <Text style={styles.modalSectionTitle}>Traslados Disponibles ({trasladosFiltrados.length})</Text>

                  {!isLoading && trasladosFiltrados.length > 0 && (
                    <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll} activeOpacity={0.7}>
                      <Text style={styles.selectAllText}>
                        {trasladosFiltrados.every((t) => t.selected) ? "Deseleccionar" : "Seleccionar todos"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isLoading ? (
                  <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
                ) : trasladosFiltrados.length === 0 ? (
                  <View style={styles.emptyStateModal}>
                    <Text style={styles.emptyText}>No se encontraron traslados</Text>
                    <Text style={styles.emptySubtext}>
                      {traslados.length === 0
                        ? "No hay traslados disponibles para este lote"
                        : `Ajusta los filtros (${traslados.length} traslados totales)`}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.trasladosList}>
                    {trasladosFiltrados.map((item) => (
                      <TouchableOpacity
                        key={item.transferId}
                        style={[styles.trasladoCard, item.selected && styles.trasladoCardSelected]}
                        onPress={() => toggleTraslado(item.transferId)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.trasladoHeader}>
                          <View style={[styles.checkbox, item.selected && styles.checkboxSelected]}>
                            {item.selected && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                          <Text style={styles.trasladoId}>#{item.transferId}</Text>
                        </View>

                        <View style={styles.trasladoContent}>
                          <View style={styles.trasladoRoute}>
                            <View style={styles.locationContainer}>
                              <Text style={styles.locationLabel}>Origen</Text>
                              <Text style={styles.locationText}>{item.inventLocationIdFrom}</Text>
                            </View>

                            <View style={styles.arrow}>
                              <Text style={styles.arrowText}>→</Text>
                            </View>

                            <View style={styles.locationContainer}>
                              <Text style={styles.locationLabel}>Destino</Text>
                              <Text style={styles.locationText}>{item.inventLocationIdTo}</Text>
                            </View>
                          </View>

                          <View style={styles.trasladoDetails}>
                            <Text style={styles.productoText}>{item.itemId}</Text>
                            <Text style={styles.cantidadText}>{item.montoTraslado} unidades</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Botón confirmar */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmarCreacionDespacho} activeOpacity={0.8}>
                <Text style={styles.confirmButtonText}>
                  Confirmar ({traslados.filter((t) => t.selected).length} seleccionados)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ==========================================
//   STYLES (SIN CAMBIOS)
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    // fontSize: 28,
    // fontWeight: "700",
    // color: "#1a1a1a",
    marginTop: 5,
    marginBottom: 5,
  },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  createButtonTop: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  despachosSection: {
    marginBottom: 24,
  },
  despachosTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  despachosList: {
    gap: 16,
  },
  despachoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  despachoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  despachoId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
  },
  despachoFecha: {
    fontSize: 12,
    color: "#999",
  },
  despachoInfo: {
    gap: 8,
    marginBottom: 12,
  },
  despachoInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  despachoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  despachoValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  despachoCantidad: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "700",
    backgroundColor: "#f0f7ff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  despachoTraslados: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  despachoTrasladoItem: {
    fontSize: 13,
    color: "#333",
  },
  trasladosHeaderModal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  trasladosCount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trasladoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  trasladoCardSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f7ff",
  },
  trasladoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d0d0d0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  trasladoId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  trasladoContent: {
    gap: 12,
  },
  trasladoRoute: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
    fontWeight: "500",
  },
  locationText: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  arrow: {
    paddingHorizontal: 8,
  },
  arrowText: {
    fontSize: 20,
    color: "#007AFF",
    fontWeight: "600",
  },
  trasladoDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  productoText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  cantidadText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateModal: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  trasladosList: {
    gap: 12,
    paddingBottom: 16,
  },
  dropdown: {
    height: 50,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f5f5f5",
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#999",
  },
  selectedTextStyle: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    color: "#000",
    backgroundColor: "#f1f1f1",
  },
  selectAllButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectAllText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  inputWithPrefix: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingLeft: 16,
  },
  prefixText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  inputNumeric: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1a1a1a",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContentExpanded: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    paddingTop: 20,
  },
  modalScrollViewExpanded: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalCloseButton: {
    fontSize: 28,
    color: "#666",
    fontWeight: "400",
  },
  modalSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },

  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  statusBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F57C00",
  },
})
