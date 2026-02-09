import type { StackScreenProps } from "@react-navigation/stack"
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    ScrollView,
    Alert,
} from "react-native"
import Header from "../../../../components/Header"
import type { RootStackParams } from "../../../../navigation/navigation"
import { type FC, useState, useMemo, useEffect, useContext } from "react"
import { WMSApiSerigrafia } from "../../../../api/WMSApiSerigrafia"
import type { DespachoCreado } from "../../../../interfaces/Serigrafia/DespachoCreado"
import { WMSContext } from "../../../../context/WMSContext"
import { useFocusEffect } from "@react-navigation/native"
import { ConsultaLoteInterface } from "../../../../interfaces/Serigrafia/Lote"
import { Dropdown } from "react-native-element-dropdown"


type props = StackScreenProps<RootStackParams, "EscorgerTrasladoParaRecibirScreen">

export const EscorgerTrasladoParaRecibirScreen: FC<props> = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState("")
    const [cargando, setCargando] = useState<boolean>(true)
    const [despachosEnviados, setDespachosEnviados] = useState<DespachoCreado[]>([])
    const [dataLote, setDataLote] = useState<ConsultaLoteInterface[]>([])
    const [loteslected, setLoteSelected] = useState<string>("")
    const [refreshing, setRefreshing] = useState(false)
    const { WMSState } = useContext(WMSContext)
    const { changeSRGDespachoId } = useContext(WMSContext)

    const getData = async () => {
        if (!loteslected) return
        setCargando(true)
        try {
            const TipoPantalla = 2 // TipoPantalla 2 para despachos enviados
            const resp = await WMSApiSerigrafia.get<DespachoCreado[]>(`GetDespachosByBatchId/${loteslected}/${TipoPantalla}`)
            setDespachosEnviados(resp.data)
            setCargando(false)
        } catch (error) {
            Alert.alert("Error", "Error al obtener los despachos enviados pendientes")
            setCargando(false)
        }
    }


    const getLote = async () => {
        setCargando(true)
        try {
            const resp = await WMSApiSerigrafia.get<ConsultaLoteInterface[]>("GetLote")
            setDataLote(resp.data)

            if (resp.data.length > 0) {
                setLoteSelected(resp.data[0].itemseasonid)
            }
        } catch (error) {
            Alert.alert("Error al obtener los lotes")
        } finally {
            setCargando(false)
        }
    }

    useFocusEffect(
        useMemo(() => {
            return () => {
                getData()
            }
        }, [loteslected]),
    )


    useEffect(() => {
        getLote()
    }, [])
    useEffect(() => {
        if (loteslected) {

            getData()
        }
    }, [loteslected])

    // Filtrar despachos según la búsqueda
    const despachosFiltrados = useMemo(() => {
        if (!searchQuery.trim()) {
            return despachosEnviados
        }

        const query = searchQuery.toLowerCase().trim()

        return despachosEnviados.filter((despacho) => {
            if (despacho.id.toString().includes(query)) return true
            if (despacho.truck.toLowerCase().includes(query)) return true
            if (despacho.driver.toLowerCase().includes(query)) return true
            return false
        })
    }, [despachosEnviados, searchQuery])

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


    const renderDespachoCard = ({ item }: { item: DespachoCreado }) => {
        const fechaCreacion = new Date(item.createdDateTime)
        const fechaFormateada = `${fechaCreacion.toLocaleDateString()} ${fechaCreacion.toLocaleTimeString()}`

        const totalUnidades = item.traslados?.reduce((sum, t) => sum + t.montoTraslado, 0) ?? 0

        return (
            <TouchableOpacity
                style={styles.despachoCard}
                activeOpacity={0.75}

                onPress={() => {
                    changeSRGDespachoId(item.id);
                    navigation.navigate("DespachoRecibirTrasladoScreen")
                }}
            >
                <View>
                    <View style={styles.despachoHeader}>

                        <View style={styles.despachoIdContainer}>
                            <Text style={styles.despachoId}>Despacho #{item.id}</Text>

                        </View>
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

                        <View style={styles.despachoInfoRow}>
                            <Text style={styles.despachoLabel}>Tienda destino:</Text>
                            <Text style={styles.despachoValue}>{item.store}</Text>
                        </View>

                        {item.createdBy && (
                            <View style={styles.despachoInfoRow}>
                                <Text style={styles.despachoLabel}>Enviado por:</Text>
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
        )
    }


    return (
        <View style={styles.container}>
            <Header texto1="" texto2="Despachos Enviados" texto3="Pendientes a Recibir" />

            <View style={styles.content}>
                {/* Buscador */}
                <View style={styles.searchSection}>
                    <View style={styles.dropdownContainer}>
                        <Dropdown
                            data={dataLote.filter((lote) => lote.itemseasonid)}
                            labelField="name"
                            valueField="itemseasonid"
                            placeholder="Seleccione un lote"
                            value={loteslected}
                            onChange={(item) => setLoteSelected(item.itemseasonid)}
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
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar..."
                            placeholderTextColor="#999"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                                <Text style={styles.clearButtonText}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={styles.resultsCount}>
                        {despachosFiltrados.length} despacho{despachosFiltrados.length !== 1 ? "s" : ""} encontrado
                        {despachosFiltrados.length !== 1 ? "s" : ""}
                    </Text>
                </View>

                {/* Lista de despachos */}
                <View style={styles.despachosSection}>
                    {cargando ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.emptySubtext}>Cargando despachos...</Text>
                        </View>
                    ) : despachosFiltrados.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                {searchQuery ? "No se encontraron resultados" : "No hay despachos pendientes"}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchQuery
                                    ? "Intenta con otro término de búsqueda"
                                    : "No hay despachos enviados pendientes a recibir"}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={despachosFiltrados}
                            renderItem={renderDespachoCard}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.despachosList}
                            showsVerticalScrollIndicator={false}
                            refreshing={refreshing}
                            onRefresh={getData}
                        />
                    )}
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        backgroundColor: "#f8f9fa",
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    searchSection: {
        marginBottom: 20,
    },
    dropdownContainer: {
        marginBottom: 8,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },

    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: "#1a1a1a",
    },
    clearButton: {
        padding: 8,
    },
    clearButtonText: {
        fontSize: 16,
        color: "#999",
    },
    resultsCount: {
        fontSize: 13,
        color: "#666",
        marginTop: 8,
        marginLeft: 4,
    },
    despachosSection: {
        flex: 1,
    },
    despachosList: {
        gap: 16,
        paddingBottom: 20,
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
        alignItems: "flex-start",
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    despachoIdContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    despachoId: {
        fontSize: 16,
        fontWeight: "700",
        color: "#007AFF",
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
    despachoCantidadTotal: {
        fontSize: 14,
        color: "#34C759",
        fontWeight: "700",
        backgroundColor: "#E8F5E9",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    verTrasladosHint: {
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        padding: 10,
        alignItems: "center",
    },
    verTrasladosText: {
        fontSize: 13,
        color: "#007AFF",
        fontWeight: "500",
    },
    emptyState: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 48,
        alignItems: "center",
        justifyContent: "center",
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: "80%",
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
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
    modalSubtitle: {
        fontSize: 14,
        color: "#007AFF",
        marginTop: 4,
        fontWeight: "500",
    },
    modalCloseButton: {
        fontSize: 28,
        color: "#666",
        fontWeight: "400",
    },
    modalDespachoInfo: {
        backgroundColor: "#f8f9fa",
        marginHorizontal: 20,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    modalInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modalInfoLabel: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },
    modalInfoValue: {
        fontSize: 14,
        color: "#1a1a1a",
        fontWeight: "600",
    },
    modalInfoValueHighlight: {
        fontSize: 14,
        color: "#007AFF",
        fontWeight: "700",
    },
    modalScrollView: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: 16,
    },
    trasladosList: {
        gap: 12,
        paddingBottom: 16,
    },
    trasladoCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    trasladoHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 10,
    },
    trasladoId: {
        fontSize: 14,
        fontWeight: "600",
        color: "#007AFF",
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
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        backgroundColor: "#fff",
    },
    closeModalButton: {
        backgroundColor: "#007AFF",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    closeModalButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    placeholderStyle: {
        fontSize: 14,
        color: "#999",
    },

    dropdown: {
        height: 45,
        borderColor: "#8e8e8e",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: "white",
        zIndex: 100,
        elevation: 5,

    },
    selectedTextStyle: {
        fontSize: 14,
        color: "#000",
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 14,
        color: "#000",
        backgroundColor: "#f1f1f1",
    },
})

