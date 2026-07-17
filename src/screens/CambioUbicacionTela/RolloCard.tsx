import React, { memo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { black, blue } from '../../constants/Colors'

export interface Rollo {
    /** Número de rollo, ej: R0-12345 */
    ro: string
    /** Ubicación actual del rollo (origen), viene del API */
    ubicacionOrigen: string
    /** Metraje o yardaje del rollo (opcional) */
    medida?: number
    /** Unidad de medida (m / yd) */
    unidad?: string
    sitio?: string
    almacen: string
}

interface Props {
    rollo: Rollo
    /** Ubicación de destino general seleccionada en la pantalla */
    ubicacionDestino: string
    almacenDestino: string
    /** Acción al presionar el botón de eliminar (X) */
    onDelete?: (ro: string) => void
}

/**
 * Card unificada de movimiento. 
 * Muestra el flujo Origen ➔ Destino en una sola fila con botón de borrar.
 */
const RolloCard: React.FC<Props> = ({ rollo, ubicacionDestino, almacenDestino, onDelete }) => {
    return (
        <View style={styles.card}>
            {/* Información principal del Rollo */}
            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.ro} numberOfLines={1}>
                        {rollo.ro}
                    </Text>
                    {rollo.medida !== undefined && (
                        <Text style={styles.medida}>
                            {rollo.medida} {rollo.unidad || 'm'}
                        </Text>
                    )}
                </View>

                {/* Flujo de Ubicaciones: Origen ➜ Destino */}
                <View style={styles.flowRow}>
                    <View style={styles.ubiBlock}>
                        <Text style={styles.tag}>ORIGEN</Text>
                        <Text style={styles.ubiOrig} numberOfLines={1}>
                           almacen: {rollo.almacen || '—'}
                        </Text>
                        <Text style={styles.ubiOrig} numberOfLines={1}>
                            {rollo.ubicacionOrigen || '—'}
                        </Text>
                    </View>

                    <Text style={styles.arrow}>➔</Text>

                    <View style={styles.ubiBlock}>
                        <Text style={[styles.tag, styles.tagDest]}>DESTINO</Text>
                        <Text style={styles.ubiDest} numberOfLines={1}>
                            almacen: {almacenDestino || '—'}
                        </Text>
                        <Text style={styles.ubiDest} numberOfLines={1}>
                            {ubicacionDestino || '—'}
                        </Text>

                    </View>
                </View>
            </View>

            {/* Botoncito discreto de eliminar (X) */}
            {onDelete && (
                <Pressable
                    onPress={() => onDelete(rollo.ro)}
                    style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                    hitSlop={12} // Aumenta el área táctil sin agrandar el botón visible
                >
                    <Text style={styles.deleteText}>✕</Text>
                </Pressable>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E6E8EC',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        // Pequeña sombra para darle relieve en iOS/Android
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    infoContainer: {
        flex: 1,
        gap: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ro: {
        fontSize: 15,
        fontWeight: '700',
        color: black,
    },
    medida: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7078',
        backgroundColor: '#F4F5F7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    flowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    ubiBlock: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        padding: 6,
        borderRadius: 6,
        borderWidth: 0.5,
        borderColor: '#E6E8EC',
    },
    tag: {
        fontSize: 9,
        fontWeight: '700',
        color: '#8A8F98',
        marginBottom: 2,
        letterSpacing: 0.3,
    },
    tagDest: {
        color: blue,
    },
    ubiOrig: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4A4D54',
    },
    ubiDest: {
        fontSize: 13,
        fontWeight: '700',
        color: blue,
    },
    arrow: {
        fontSize: 16,
        color: '#A6ABB3',
        fontWeight: '600',
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF0F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteText: {
        fontSize: 14,
        color: '#E5484D', // Rojo destructivo
        fontWeight: '700',
    },
    pressed: {
        opacity: 0.5,
        backgroundColor: '#FFE0E0',
    },
})

export default memo(RolloCard, (prev, next) => {
    return (
        prev.rollo.ro === next.rollo.ro &&
        prev.ubicacionDestino === next.ubicacionDestino &&
        prev.almacenDestino === next.almacenDestino
    )
})