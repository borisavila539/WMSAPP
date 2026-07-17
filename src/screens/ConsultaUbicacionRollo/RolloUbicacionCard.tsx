import React, { memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { black, blue } from '../../constants/Colors'

// Modelo tal cual llega del endpoint GetConsultarRollosPorUbicacion.
export interface RolloUbicacion {
  numeroRollo: string
  numeroRolloProveedor: string
  itemId: string
  sitio: string
  almacen: string
  ubicacion: string
  cantidad: number
}

interface Props {
  rollo: RolloUbicacion
}

// Card memoizada: solo se re-renderiza si cambia el numeroRollo.
const RolloUbicacionCard: React.FC<Props> = ({ rollo }) => {
  return (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.ro} numberOfLines={1}>
          {rollo.numeroRollo}
        </Text>
        <View style={styles.qtyPill}>
          <Text style={styles.qtyTxt}>{rollo.cantidad.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.rowMeta}>
        <Text style={styles.metaLabel}>Item</Text>
        <Text style={styles.metaValue} numberOfLines={1}>
          {rollo.itemId}
        </Text>
      </View>

      <View style={styles.rowMeta}>
        <Text style={styles.metaLabel}>Proveedor</Text>
        <Text style={styles.metaValue} numberOfLines={1}>
          {rollo.numeroRolloProveedor}
        </Text>
      </View>

      <View style={styles.rowMeta}>
        <Text style={styles.metaLabel}>Ubicación</Text>
        <Text style={[styles.metaValue, styles.ubic]} numberOfLines={1}>
          {rollo.ubicacion}
        </Text>
      </View>
    </View>
  )
}

function areEqual(prev: Props, next: Props) {
  return prev.rollo.numeroRollo === next.rollo.numeroRollo
}

export default memo(RolloUbicacionCard, areEqual)

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  ro: { fontSize: 15, fontWeight: '700', color: black, flex: 1, marginRight: 8 },
  qtyPill: {
    backgroundColor: '#E7EEFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  qtyTxt: { fontSize: 13, fontWeight: '700', color: blue },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A9099',
    width: 78,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  metaValue: { fontSize: 13, color: '#4B5058', flex: 1 },
  ubic: { fontWeight: '700', color: black },
})
