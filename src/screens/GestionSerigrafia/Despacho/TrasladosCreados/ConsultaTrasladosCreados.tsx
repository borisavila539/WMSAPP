import type { StackScreenProps } from "@react-navigation/stack";
import React, { FC, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import Header from "../../../../components/Header";
import type { RootStackParams } from "../../../../navigation/navigation";
import { WMSApiSerigrafia } from "../../../../api/WMSApiSerigrafia";
import { Dropdown } from "react-native-element-dropdown";
import type { ConsultaLoteInterface } from "../../../../interfaces/Serigrafia/Lote";
import type { TrasladoDespachoDTO } from "../../../../interfaces/Serigrafia/TrasladoDespachoDTO";

type Props = StackScreenProps<RootStackParams, "ConsultaTrasladoCreadosScreen">;

export const ConsultaTrasladoCreadosScreen: FC<Props> = () => {
    const [dataLote, setDataLote] = useState<ConsultaLoteInterface[]>([]);
    const [loteSeleccionado, setLoteSeleccionado] = useState<string>("");

    const [traslados, setTraslados] = useState<TrasladoDespachoDTO[]>([]);

    const [cargandoLotes, setCargandoLotes] = useState<boolean>(true);
    const [cargandoTraslados, setCargandoTraslados] = useState<boolean>(false);

    const getLotes = async () => {
        setCargandoLotes(true);
        try {
            const resp = await WMSApiSerigrafia.get<ConsultaLoteInterface[]>("GetLote");
            const lotes = resp.data ?? [];
            setDataLote(lotes);

            // auto-seleccionar el primer lote y cargar traslados
            if (lotes.length > 0 && lotes[0].itemseasonid) {
                const first = String(lotes[0].itemseasonid);
                setLoteSeleccionado(first);
                getTrasladosPorLote(first);
            } else {
                setTraslados([]);
            }
        } catch (error) {
            Alert.alert("Error", "Error al obtener los lotes");
            setDataLote([]);
            setTraslados([]);
        } finally {
            setCargandoLotes(false);
        }
    };

    const getTrasladosPorLote = async (lote: string) => {
        if (!lote) return;

        setCargandoTraslados(true);
        try {
            const resp = await WMSApiSerigrafia.get<TrasladoDespachoDTO[]>(
                `GetTrasladoParaDespachoPorLote/${lote}`
            );
            const data = resp.data ?? [];
            setTraslados(data);
        } catch (error) {
            Alert.alert("Error", "Error al obtener los traslados del lote especificado");
            setTraslados([]);
        } finally {
            setCargandoTraslados(false);
        }
    };

    useEffect(() => {
        getLotes();
    }, []);

    const getstatusIdName = (statusId: number) => {
        switch (statusId) {
            case 0:
                return "Creado";
            case 1:
                return "Enviado";
            case 2:
                return "Recibido";
            default:
                return "Desconocido";
        }
    };
    const getstatusIdColor = (statusId: number) => {
        switch (statusId) {
            case 0:
                return "#FFA500"; // Naranja para "Creado"
            case 1:
                return "#28A745"; // Verde para "Recibido"
            case 2:
                return "#007AFF"; // Azul para "Enviado"
            default:
                return "#6c757d"; // Gris para "Desconocido"
        }
    };

        const lotesFiltrados = dataLote.filter((l) => !!l.itemseasonid);

        return (
            <View style={styles.container}>
                <Header texto1="" texto2="Gestion Serigrafia" texto3="" />

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                    <View style={styles.formSection}>
                        <Text style={styles.label}>Seleccionar Lote</Text>

                        {cargandoLotes ? (
                            <View style={styles.emptyState}>
                                <ActivityIndicator size="large" color="#007AFF" />
                                <Text style={styles.emptySubtext}>Cargando lotes...</Text>
                            </View>
                        ) : (
                            <Dropdown
                                data={lotesFiltrados}
                                labelField="name"
                                valueField="itemseasonid"
                                placeholder={lotesFiltrados.length ? "Seleccione un lote" : "No hay lotes disponibles"}
                                value={loteSeleccionado}
                                onChange={(item) => {
                                    const id = String(item.itemseasonid);
                                    setLoteSeleccionado(id);
                                    getTrasladosPorLote(id);
                                }}
                                style={styles.dropdown}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                inputSearchStyle={styles.inputSearchStyle}
                                itemTextStyle={{ color: "black" }}
                                containerStyle={{ backgroundColor: "white", zIndex: 100, elevation: 5 }}
                            />
                        )}
                    </View>

                    <View style={styles.despachosSection}>
                        <Text style={styles.despachosTitle}>Traslados del Lote</Text>

                        {cargandoTraslados ? (
                            <View style={styles.emptyState}>
                                <ActivityIndicator size="large" color="#007AFF" />
                                <Text style={styles.emptySubtext}>Cargando traslados...</Text>
                            </View>
                        ) : traslados.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No hay traslados para este lote</Text>
                                <Text style={styles.emptySubtext}>Selecciona otro lote</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={traslados}
                                keyExtractor={(item) => String(item.transferId)}
                                scrollEnabled={false}
                                contentContainerStyle={styles.despachosList}
                                renderItem={({ item }) => (
                                    <View style={styles.despachoCard}>
                                        <View style={styles.despachoHeader}>
                                            <Text style={styles.despachoId}>Transfer ID: {item.transferId}</Text>
                                            <Text style={[styles.despachoFecha, { color: getstatusIdColor(item.statusId) }]}>Status: {getstatusIdName(item.statusId)}</Text>
                                        </View>

                                        <View style={styles.despachoInfo}>
                                            <View style={styles.despachoInfoRow}>
                                                <Text style={styles.despachoLabel}>Desde:</Text>
                                                <Text style={styles.despachoValue}>{item.inventLocationIdFrom}</Text>
                                            </View>
                                            <View style={styles.despachoInfoRow}>
                                                <Text style={styles.despachoLabel}>Hacia:</Text>
                                                <Text style={styles.despachoValue}>{item.inventLocationIdTo}</Text>
                                            </View>
                                            <View style={styles.despachoInfoRow}>
                                                <Text style={styles.despachoLabel}>Producto:</Text>
                                                <Text style={styles.despachoValue}>{item.itemId}</Text>
                                            </View>
                                            <View style={styles.despachoInfoRow}>
                                                <Text style={styles.despachoLabel}>Cantidad:</Text>
                                                <Text style={styles.despachoCantidad}>{item.montoTraslado}</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            />
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        );
    };

    // Estilos mínimos (tomados del ejemplo que funciona)
    const styles = StyleSheet.create({
        container: { flex: 1, width: "100%", backgroundColor: "#f8f9fa" },
        content: { flex: 1, paddingHorizontal: 20 },

        title: { marginTop: 8, marginBottom: 12, fontSize: 20, fontWeight: "700", color: "#1a1a1a" },

        formSection: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 24 },
        label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },

        despachosSection: { marginBottom: 24 },
        despachosTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 },
        despachosList: { gap: 16 },

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
        despachoId: { fontSize: 16, fontWeight: "700", color: "#007AFF" },
        despachoFecha: { fontSize: 12, color: "#999" },

        despachoInfo: { gap: 8, marginBottom: 12 },
        despachoInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        despachoLabel: { fontSize: 14, color: "#666", fontWeight: "500" },
        despachoValue: { fontSize: 14, color: "#1a1a1a", fontWeight: "600" },
        despachoCantidad: {
            fontSize: 14,
            color: "#007AFF",
            fontWeight: "700",
            backgroundColor: "#f0f7ff",
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
        },

        dropdown: {
            height: 50,
            borderColor: "#e0e0e0",
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 16,
            backgroundColor: "#f5f5f5",
        },
        placeholderStyle: { fontSize: 16, color: "#999" },
        selectedTextStyle: { fontSize: 14, color: "#1a1a1a", fontWeight: "500" },
        inputSearchStyle: { height: 40, fontSize: 14, color: "#000", backgroundColor: "#f1f1f1" },

        emptyState: { backgroundColor: "#fff", borderRadius: 16, padding: 48, alignItems: "center", justifyContent: "center" },
        emptyText: { fontSize: 16, fontWeight: "600", color: "#666", marginBottom: 8 },
        emptySubtext: { fontSize: 14, color: "#999", textAlign: "center" },
    });