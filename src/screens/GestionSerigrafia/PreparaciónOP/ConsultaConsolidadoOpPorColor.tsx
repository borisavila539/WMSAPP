
import { type FC, useContext, useEffect, useRef, useState } from "react"
import type { StackScreenProps } from "@react-navigation/stack"
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
    FlatList,
    SafeAreaView,
    Alert,

} from "react-native"
import Header from "../../../components/Header"
import { blue, grey } from "../../../constants/Colors"
import type { RootStackParams } from "../../../navigation/navigation"
import { WMSApiSerigrafia } from "../../../api/WMSApiSerigrafia"
import type { ColorData, ConsolidadoOpsPorColorInterface } from "../../../interfaces/Serigrafia/ConsolidadoOpsPorColor"
import { WMSContext } from "../../../context/WMSContext"
import Dropdown from "../ComponenteGenricos/Dropdowm"
import type { ConsultaOpsPorBaseInterface } from "../../../interfaces/Serigrafia/OpPorBaseInterface"
import { ScrollView } from "react-native-gesture-handler"
import { EstadoOp } from "../../../interfaces/Serigrafia/Enums/EstadoOP"

type props = StackScreenProps<RootStackParams, "ConsultaConsolidadoOpPorColorScreen">

export const ConsultaConsolidadoOpPorColorScreen: FC<props> = () => {
    const [data, setData] = useState<ColorData[]>([])
    const [dataOriginal, setDataOriginal] = useState<ConsultaOpsPorBaseInterface[]>([])
    const [filteredData, setFilteredData] = useState<ColorData[]>([])
    const [cargando, setCargando] = useState<boolean>(true)
    const { WMSState } = useContext(WMSContext)
    const [selectedColor, setSelectedColor] = useState("")
    const [scrollEnabled, setScrollEnabled] = useState(false);
    const containerWidth = useRef(0);
    const contentWidth = useRef(0);
    const tituloConBase = `Base: ${WMSState.itemId}`
    const tituloLote =  `Lote: ${WMSState.lote}` 
    const [cellWidth, setCellWidth] = useState(60)
    const tableAvailableWidth = useRef(0)
    const [isSendingInfo,setSendingInfo] = useState(false)



    const colorOptions = data.map((d) => ({ value: d.color, label: `${d.colornName} ${d.color}` }));
    const getData = async () => {
        try {
            setCargando(true)
            const respRaw = await WMSApiSerigrafia.get<ConsultaOpsPorBaseInterface[]>(`GetOpsPorBase/${WMSState.itemId}/${WMSState.lote}`)
            setDataOriginal(respRaw.data)
            let resp: ColorData[] = agruparPorColor(respRaw.data)
            //resp = ordenarTallasCamisas(resp);
            setData(resp)
            setFilteredData(resp)
        } catch (error) {
            console.error(error)
        } finally {
            setCargando(false)
        }
    }



    const agruparPorColor = (data: ConsultaOpsPorBaseInterface[]): ColorData[] => {
        const colorMap: Record<string, ColorData> = {}
        data.forEach((item) => {
            if (!colorMap[item.inventcolorid]) {
                colorMap[item.inventcolorid] = {
                    color: item.inventcolorid,
                    colornName: item.colorName,
                    solicitado: {},
                    preparado: {},
                    estado: item.estadoOp
                }
            }
            item.tallas.forEach((t) => {
                if (!colorMap[item.inventcolorid].solicitado[t.talla]) {
                    colorMap[item.inventcolorid].solicitado[t.talla] = 0
                }
                colorMap[item.inventcolorid].solicitado[t.talla] += t.cantidadSolicitada
                colorMap[item.inventcolorid].preparado[t.talla] = (
                    Number.parseInt(colorMap[item.inventcolorid].preparado[t.talla] || "0") + t.cantidadPreparada
                ).toString()
            })

        })

        return Object.values(colorMap)
    }

    
    useEffect(() => {
        getData()
    }, [])

    useEffect(() => {
        if (selectedColor === "All" || !selectedColor) setFilteredData(data)
        else setFilteredData(data.filter((x) => x.color === selectedColor))
    }, [selectedColor, data])

    const handleChange = (color: string, size: string, value: string) => {
        setData((prev) =>
            prev.map((item) => {
                if (item.color !== color) return item

                const solicitado = item.solicitado[size] || 0
                const numValue = Number(value)

                if (isNaN(numValue) || numValue < 0) {
                    Alert.alert("Valor inválido", "Ingrese un número válido.")
                    return item
                }

                if (numValue > solicitado) {
                    Alert.alert("Cantidad excedida", `No puede preparar más de ${solicitado} unidades.`)
                    return item
                }

                if (Number.isInteger(numValue) === false) {
                    Alert.alert("Valor inválido", "Ingrese un número entero válido.")
                    return item
                }

                return {
                    ...item,
                    preparado: { ...item.preparado, [size]: value },
                }
            }),
        )
    }


    const handlePreparar = async (item: ColorData) => {
        setSendingInfo(true)
        const dataToSent: ConsolidadoOpsPorColorInterface = {
            inventcolorid: item.color,
            opsIds: dataOriginal.filter((op) => op.inventcolorid === item.color).map((op) => op.prodMasterId),
            tallas: Object.keys(item.solicitado).map((size) => ({
                talla: size,
                cantidadSolicitada: item.solicitado[size] || 0,
                cantidadPreparada: Number.parseInt(item.preparado[size]) || 0,
                estadoOp:EstadoOp.Iniciado})),
        }
        const response = await WMSApiSerigrafia.post(`CreaOpsPreparadasAsync/${WMSState.itemId}/${WMSState.lote}`, dataToSent)
        
        if (!response.data.includes("Ok")){ 
            setSendingInfo(false)
            return Alert.alert("Erro", "Ocurrio error:  " + response.data) 
        }
        Alert.alert("Éxito", "Operaciones preparadas correctamente")
        getData()
        setSendingInfo(false)

    }


    const renderColorTable = (item: ColorData) => {
        const tallasKeys = Object.keys(item.solicitado);
        const totalSolicitado = tallasKeys.reduce((sum, size) => sum + (item.solicitado[size] || 0), 0);
        const totalPreparado = tallasKeys.reduce((sum, size) => sum + (Number.parseInt(item.preparado[size]) || 0), 0);
        const totalSolicitadoOriginal = dataOriginal
            .filter((op) => op.inventcolorid === item.color)
            .reduce((sum, op) => sum + op.tallas.reduce((subSum, t) => subSum + t.cantidadSolicitada, 0), 0);
        const totalPreparadoOriginal = dataOriginal
            .filter((op) => op.inventcolorid === item.color)
            .reduce((sum, op) => sum + op.tallas.reduce((subSum, t) => subSum + t.cantidadPreparada, 0), 0);

        const isDisabled = (item.estado >= EstadoOp.Liberado && totalSolicitadoOriginal === totalPreparadoOriginal) || isSendingInfo;

        let statusColor = "#6b7280";
        if (totalSolicitado === totalPreparado && totalSolicitado > 0) {
            statusColor = "#10b981";
        } else if (totalPreparado > 0) {
            statusColor = "#f59e0b";
        }

        return (
            <View style={styles.tableContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                <View style={styles.cardHeader}>
                    <Text style={styles.tableTitle}>{item.colornName + " | #" + item.color}</Text>
                    <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {totalPreparado}/{totalSolicitado}
                        </Text>
                    </View>
                </View>

                <View style={styles.table}>
                    {/* Columna fija */}
                    <View style={styles.fixedColumn}>
                        <Text style={styles.headerText}>Tallas</Text>
                        <Text style={styles.labelText}>Sol.</Text>
                        <Text style={styles.labelText}>Prep.</Text>
                    </View>

                    {/* Columnas desplazables */}
                     <View
                        style={{ flex: 1 }}
                        onLayout={(e) => {
                            tableAvailableWidth.current = e.nativeEvent.layout.width
                            const cols = tallasKeys.length
                            const minWidth = 60
                            const calculated = tableAvailableWidth.current / cols
                            setCellWidth(Math.max(minWidth, calculated))
                        }}
                    >
                    <ScrollView
                        horizontal
                        scrollEnabled={scrollEnabled}
                        showsHorizontalScrollIndicator={scrollEnabled}
                        contentContainerStyle={styles.scrollContent}
                        onLayout={(e) => {
                            containerWidth.current = e.nativeEvent.layout.width;
                            setScrollEnabled(contentWidth.current > containerWidth.current);
                        }}
                        onContentSizeChange={(w) => {
                            contentWidth.current = w;
                            setScrollEnabled(w > containerWidth.current);
                        }}
                    >
                        <View>
                            {/* Encabezado */}
                            <View style={styles.tableRow}>
                                {tallasKeys.map((size) => (
                                    <View key={size} style={styles.sizeCell}>
                                        <Text style={styles.headerText}>{size}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Solicitado */}
                            <View style={styles.tableRow}>
                                {tallasKeys.map((size) => (
                                    <View key={size} style={[styles.sizeCell, { width: cellWidth }]}>
                                        <Text style={styles.valueText}>{item.solicitado[size]}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Preparado */}
                            <View style={styles.tableRow}>
                                {tallasKeys.map((size) => (
                                    <View key={size} style={styles.sizeCell}>
                                        <TextInput
                                            style={styles.input}
                                            value={Number(item.preparado[size]) === 0 ? "" : item.preparado[size].toString()}
                                            onChangeText={(value) => handleChange(item.color, size, value)}
                                            keyboardType="numeric"
                                            editable={!isDisabled}
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                    </View>
                </View>



                {/* Botón Preparar por card */}
                <TouchableOpacity
                    style={[styles.prepararButton, isDisabled && styles.prepararButtonDisabled]}
                    onPress={() => handlePreparar(item)}
                    disabled={isDisabled}
                >
                    <Text style={styles.prepararButtonText}>{isDisabled ? "Preparado" : "Preparar"}</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.safe}>
            <Header texto1="Preparación" texto2={tituloConBase} texto3={tituloLote} />
            {/* Filtros */}
            <View style={styles.filterContainer}>
                <Dropdown
                    options={colorOptions}
                    selectedOption={selectedColor}
                    placeholder="Seleccione un color"
                    onSelect={(value) => setSelectedColor(value)}
                    includeAll={true}
                />
            </View>

            {/* Contenido */}
            <View style={styles.listWrapper}>
                {cargando ? (
                    <ActivityIndicator size={30} color={blue} />
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item) => item.color}
                        renderItem={({ item }) => renderColorTable(item)}
                        refreshControl={<RefreshControl refreshing={false} onRefresh={getData} colors={["#069A8E"]} />}
                        ListEmptyComponent={() => (
                            <View style={{ alignItems: "center", marginTop: 50 }}>
                                <Text>No hay datos</Text>
                            </View>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: grey
    },
    topBar: {
        zIndex: 2000,
        elevation: 20,
        paddingHorizontal: 10,
        paddingTop: 6,
        paddingBottom: 2,
        backgroundColor: grey,
        overflow: "visible",
    },
    dropdownContainer: {
        position: "relative",
        zIndex: 2100,
        elevation: 21,
        overflow: "visible"
    },
    dropdown: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dropdownText: {
        fontSize: 14,
        color: "#374151"
    },
    dropdownArrow: {
        fontSize: 12,
        color: "#6b7280"
    },
    backdrop: {
        position: "absolute",
        top: -6,
        left: -10,
        right: -10,
        bottom: 0,
        zIndex: 2100,
        elevation: 21,
        backgroundColor: "transparent",
    },
    dropdownMenu: {
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        marginTop: 4,
        zIndex: 2200,
        elevation: 24,
        overflow: "visible",
    },
    dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    dropdownItemText: {
        fontSize: 14,
        color: "#374151"
    },

    listWrapper: {
        flex: 1,
        padding: 10,
        zIndex: 0,
        elevation: 0,
        overflow: "visible"
    },

    tableContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        marginBottom: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        position: "relative",
    },
    statusIndicator: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: 6, // grosor de la barra lateral
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },

    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingLeft: 20,
    },
    scrollContent: {
        flexGrow: 2,
        paddingHorizontal: 8,
        border: 40
    },
    fixedColumn: {
        width: 60,
        backgroundColor: "#f3f4f6",
        alignItems: "center",
        justifyContent: "flex-start",
      //  paddingVertical: 9,
        borderRightWidth: 1,
        paddingTop: 40,
        borderColor: "#e5e7eb",
    },
    tableTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827"
    },
    table: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        overflow: "hidden"
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    labelCell: {
        flex: 2,
        padding: 0,
        justifyContent: "center",
        backgroundColor: "#f9fafb"
    },
    sizeCell: {
        flex: 1,
        padding: 20,
        paddingBottom: 20,
        alignItems: "center",
        marginTop: 4
    },
    headerText: {
        fontWeight: "600",
        fontSize: 13,
        color: "#374151",
        textAlign: "center",
        marginTop: 5
    },
    labelText: {
        fontSize: 14,
        color: "#6b7280",
        fontWeight: "500",
        textAlign: "center",
        marginTop: 30
    },
    valueText: {
        fontSize: 14,
        color: "#111827",
        fontWeight: "500"
    },
    input: {
        width: 48,
        height: 40,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        textAlign: "center",
        fontSize: 14,
        fontWeight: "500",
        backgroundColor: "#fff",
    },
    prepararButton: {
        backgroundColor: blue,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 16,
        shadowColor: blue,
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    prepararButtonDisabled: {
        backgroundColor: "#9ca3af",
        opacity: 0.6,
        shadowOpacity: 0,
        elevation: 0,
    },
    prepararButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600"
    },
    filterContainer: {
        backgroundColor: "white",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    statusBadge: {
        backgroundColor: "#f9fafb",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 2,
    },
    statusText: {
        fontSize: 13,
        fontWeight: "600"
    },
})
