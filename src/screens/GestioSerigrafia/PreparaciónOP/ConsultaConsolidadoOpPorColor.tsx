import React, { FC, useContext, useEffect, useState } from "react"
import { StackScreenProps } from "@react-navigation/stack"
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, StyleSheet, FlatList, SafeAreaView, } from "react-native"
import Header from "../../../components/Header"
import { blue, grey } from "../../../constants/Colors"
import { RootStackParams } from "../../../navigation/navigation"
import { WMSApiSerigrafia } from "../../../api/WMSApiSerigrafia"
import { ColorData, ConsolidadoOpsPorColorInterface } from "../../../interfaces/Serigrafia/ConsolidadoOpsPorColor"
import { WMSContext } from "../../../context/WMSContext"
import Dropdown from "../ComponenteGenricos/Dropdowm"

type props = StackScreenProps<RootStackParams, "ConsultaConsolidadoOpPorColorScreen">


export const ConsultaConsolidadoOpPorColorScreen: FC<props> = () => {
    const [data, setData] = useState<ColorData[]>([])
    const [dataOriginal, setDataOriginal] = useState<ConsolidadoOpsPorColorInterface[]>([])
    const [filteredData, setFilteredData] = useState<ColorData[]>([])
    const [cargando, setCargando] = useState<boolean>(true)
    const { WMSState } = useContext(WMSContext);
    const [selectedColor, setSelectedColor] = useState("")
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)

    const colorOptions = [...data.map((d) => d.color)]
    const getData = async () => {
        try {
            setCargando(true);

            const respRaw = await WMSApiSerigrafia.get<ConsolidadoOpsPorColorInterface[]>(
                `GetConsolidadoOpsPorColor/${WMSState.itemId}`
            );
            setDataOriginal(respRaw.data);
            const resp: ColorData[] = respRaw.data.map((item) => {
                const solicitado: Record<string, number> = {};
                const preparado: Record<string, string> = {};

                item.tallas.forEach((t) => {
                    solicitado[t.talla] = t.cantidadSolicitada;
                    preparado[t.talla] = t.cantidadPreparada.toString();
                });

                return {
                    color: item.inventcolorid,
                    solicitado,
                    preparado,
                };
            });

            // const options = ["Todos", ...resp.map((r) => r.color)];

            setData(resp);
            setFilteredData(resp);
        } catch (error) {
            console.error(error);
        } finally {
            setCargando(false);
        }
    };


    useEffect(() => {
        getData()
    }, [])

    useEffect(() => {
        if (selectedColor === "All" || !selectedColor) setFilteredData(data)
        else setFilteredData(data.filter((x) => x.color === selectedColor))
    }, [selectedColor, data])

    const handleChange = (color: string, size: string, value: string) => {
        setData((prev) =>
            prev.map((item) =>
                item.color === color
                    ? { ...item, preparado: { ...item.preparado, [size]: value } }
                    : item
            )
        )
    }

    const handlePreparar = async(item: ColorData) => {
        const dataToSent: ConsolidadoOpsPorColorInterface = {
            inventcolorid: item.color,
            opsIds: dataOriginal.find(d => d.inventcolorid === item.color)?.opsIds || [],
            tallas: Object.keys(item.solicitado).map((size) => ({
                talla: size,
                cantidadSolicitada: item.solicitado[size],
                cantidadPreparada: parseInt(item.preparado[size]) || 0,
            }))
        }
        console.log(dataToSent)
        const response = await WMSApiSerigrafia.post(
            `CreaOpsPreparadasAsync/${WMSState.itemId}`,
            dataToSent
        );
        console.log("Respuesta de la API:", response.data);

    }
    const renderColorTable = (item: ColorData) => {
        const tallasKeys = Object.keys(item.solicitado)

        return (
            <View style={styles.tableContainer}>
                <Text style={styles.tableTitle}>{item.color}</Text>
                <View style={styles.table}>
                    {/* Header */}
                    <View style={styles.tableRow}>
                        <View style={styles.labelCell} />
                        {tallasKeys.map((size) => (
                            <View key={size} style={styles.sizeCell}>
                                <Text style={styles.headerText}>{size}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Solicitado */}
                    <View style={styles.tableRow}>
                        <View style={styles.labelCell}>
                            <Text style={styles.labelText}>Sol.</Text>
                        </View>
                        {tallasKeys.map((size) => (
                            <View key={size} style={styles.sizeCell}>
                                <Text style={styles.valueText}>{item.solicitado[size]}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Preparar */}
                    <View style={styles.tableRow}>
                        <View style={styles.labelCell}>
                            <Text style={styles.labelText}>Prep.</Text>
                        </View>
                        {tallasKeys.map((size) => (
                            <View key={size} style={styles.sizeCell}>
                                <TextInput
                                    style={styles.input}
                                    value={item.preparado[size]}
                                    onChangeText={(value) => handleChange(item.color, size, value)}
                                    keyboardType="numeric"
                                />
                            </View>
                        ))}
                    </View>
                </View>
                {/* Botón Preparar por card */}
                <TouchableOpacity
                    style={styles.prepararButton}
                    onPress={() => handlePreparar(item)}
                >
                    <Text style={styles.prepararButtonText}>Preparar</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.safe}>
            <Header texto1="" texto2="Preparación" texto3="" />

            {/* Barra superior con dropdown */}
            {/* <View style={styles.topBar}>
                <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => setIsDropdownOpen((v) => !v)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.dropdownText}>{selectedColor}</Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>

                    {isDropdownOpen && (
                        <TouchableOpacity
                            style={styles.backdrop}
                            activeOpacity={1}
                            onPress={() => setIsDropdownOpen(false)}
                        />
                    )}

                    {isDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                            {colorOptions.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setSelectedColor(color)
                                        setIsDropdownOpen(false)
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>{color}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View> */}
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
                        refreshControl={
                            <RefreshControl refreshing={false} onRefresh={getData} colors={["#069A8E"]} />
                        }
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
    safe: { flex: 1, backgroundColor: grey },
    topBar: {
        zIndex: 2000,
        elevation: 20,
        paddingHorizontal: 10,
        paddingTop: 6,
        paddingBottom: 2,
        backgroundColor: grey,
        overflow: "visible",
    },
    dropdownContainer: { position: "relative", zIndex: 2100, elevation: 21, overflow: "visible" },
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
    dropdownText: { fontSize: 14, color: "#374151" },
    dropdownArrow: { fontSize: 12, color: "#6b7280" },
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
    dropdownItem: { paddingHorizontal: 16, paddingVertical: 12 },
    dropdownItemText: { fontSize: 14, color: "#374151" },

    listWrapper: { flex: 1, padding: 10, zIndex: 0, elevation: 0, overflow: "visible" },

    tableContainer: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 16, padding: 16 },
    tableTitle: { fontSize: 16, fontWeight: "500", marginBottom: 12 },
    table: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8 },
    tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
    labelCell: { flex: 2, padding: 8, justifyContent: "center" },
    sizeCell: { flex: 1, padding: 8, alignItems: "center" },
    headerText: { fontWeight: "600" },
    labelText: { fontSize: 14, color: "#374151" },
    valueText: { fontSize: 14, color: "#111827" },
    input: { width: 48, height: 39, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, textAlign: "center" },
    prepararButton: { backgroundColor: blue, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginVertical: 10 },
    prepararButtonText: { color: "#fff", fontSize: 16, fontWeight: "500" },
    filterContainer: { backgroundColor: "white", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
})
