import { useState } from "react";
import { ConsultaOpsPorBaseInterface } from "../../../interfaces/Serigrafia/OpPorBaseInterface";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { grey } from "../../../constants/Colors";

export function OrderCard({ order }: { order: ConsultaOpsPorBaseInterface }) {
    const [tallas, setTallas] = useState(order.tallas.map(t => ({ ...t })));

    const updatePreparadoSize = (index: number, value: string) => {
        setTallas(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                cantidadPreparada: Number.parseInt(value) || 0
            };
            return updated;
        });
    };

    const totalPreparado = tallas.reduce((acc, t) => acc + t.cantidadPreparada, 0);
    const totalSolicitado = tallas.reduce((acc, t) => acc + t.cantidadSolicitada, 0);

    return (
        <View style={[styles.orderCard, { backgroundColor: totalPreparado === totalSolicitado ? "#f0fdf4" : "#fff7ed" }]}>
            {/* Encabezado */}
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.orderId}>{order.prodMasterId}</Text>
                    <Text style={styles.articleCode}>{order.itemIdEstilo}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{totalPreparado}/{totalSolicitado}</Text>
                </View>
            </View>

            {/* Tabla de tallas */}
            <View style={styles.sizesContainer}>
                {/* Encabezados */}
                <View style={styles.sizeRow}>
                    <View style={styles.labelCell} />
                    {tallas.map((t, i) => (
                        <Text key={i} style={styles.sizeHeader}>{t.talla}</Text>
                    ))}
                </View>

                {/* Solicitado */}
                <View style={styles.sizeRow}>
                    <Text style={styles.rowLabel}>Solicitado</Text>
                    {tallas.map((t, i) => (
                        <View key={i} style={styles.readOnlyCell}>
                            <Text style={styles.readOnlyText}>{t.cantidadSolicitada}</Text>
                        </View>
                    ))}
                </View>

                {/* Preparado */}
                <View style={styles.sizeRow}>
                    <Text style={styles.rowLabel}>Preparado</Text>
                    {tallas.map((t, i) => (
                        <TextInput
                            key={i}
                            style={styles.sizeInput}
                            value={t.cantidadPreparada.toString()}
                            onChangeText={(value) => updatePreparadoSize(i, value)}
                            keyboardType="numeric"
                            textAlign="center"
                        />
                    ))}
                </View>
            </View>

            {/* Botón INICIAR */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.iniciarButton}>
                    <Text style={styles.iniciarButtonText}>INICIAR</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    orderCard: { borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
    orderId: { fontSize: 14, fontWeight: "600", color: "#111827" },
    articleCode: { fontSize: 12, color: "#6b7280", marginTop: 4 },
    statusBadge: { backgroundColor: "white", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: "500", color: "#374151" },
    sizesContainer: { marginBottom: 12 },
    sizeRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    labelCell: { width: 70 },
    sizeHeader: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "500", color: "#374151" },
    rowLabel: { width: 70, fontSize: 12, fontWeight: "500", color: "#374151" },
    readOnlyCell: { flex: 1, backgroundColor: "#f3f4f6", borderRadius: 4, paddingVertical: 4, marginHorizontal: 2 },
    readOnlyText: { textAlign: "center", fontSize: 12, color: "#6b7280" },
    sizeInput: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 4, paddingVertical: 4, marginHorizontal: 2, fontSize: 12, backgroundColor: "white" },
    buttonContainer: { alignItems: "flex-end" },
    iniciarButton: { backgroundColor: "#22c55e", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
    iniciarButtonText: { color: "white", fontSize: 12, fontWeight: "600" },
});