import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  ListRenderItemInfo,
  ActivityIndicator,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native'

import Header from '../../../components/Header'
import { black, blue, grey, green } from '../../../constants/Colors'
import { WMSApiUbicacionRollos } from '../../../api/WMSApiUbicacionRollos'
import { WMSContext } from '../../../context/WMSContext'

type Props = StackScreenProps<RootStackParams, 'DetalleDiarioMovimientoScreen'>
export interface DetalleDiarioMovimientoDto {
  journalId: string
  comprobante: string
  itemId: string
  numeroRollo: string
  almacenDesde: string
  ubicacionDesde: string
  almacenPara: string
  ubicacionPara: string
  cantidad: number
}

export type RootStackParams = {
  // ... tus otras pantallas
  ConsultaDiairosAbiertosScreen: undefined
  DetalleDiarioMovimientoScreen: { journalId: string }
}


const RolloCard: FC<{ item: DetalleDiarioMovimientoDto }> = ({ item }) => {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.rolloBadge}>
          <Text style={cardStyles.rolloTxt}>{item.numeroRollo || 'Sin Rollo'}</Text>
        </View>
        <Text style={cardStyles.qtyTxt}>{item.cantidad?.toFixed(2)} m</Text>
      </View>

      <Text style={cardStyles.itemTxt}>Ítem: {item.itemId}</Text>

      <View style={cardStyles.routeRow}>
        {/* Origen */}
        <View style={cardStyles.routeBox}>
          <Text style={cardStyles.routeTitle}>ORIGEN</Text>
          <Text style={cardStyles.routeLabel}>Almacén</Text>
          <Text style={cardStyles.routeValue}>{item.almacenDesde}</Text>
          <Text style={cardStyles.routeLabel}>Ubicación</Text>
          <Text style={cardStyles.routeSub}>{item.ubicacionDesde || '-'}</Text>
        </View>

        <Text style={cardStyles.arrow}>➔</Text>

        {/* Destino */}
        <View style={cardStyles.routeBox}>
          <Text style={cardStyles.routeTitle}>DESTINO</Text>
          <Text style={cardStyles.routeLabel}>Almacén</Text>
          <Text style={cardStyles.routeValue}>{item.almacenPara}</Text>
          <Text style={cardStyles.routeLabel}>Ubicación</Text>
          <Text style={cardStyles.routeSub}>{item.ubicacionPara || '-'}</Text>
        </View>
      </View>
    </View>
  )
}

export const DetalleDiarioMovimientoScreen: FC<Props> = ({ route }) => {

  const [lineas, setLineas] = useState<DetalleDiarioMovimientoDto[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const {WMSState}= useContext(WMSContext)

  const fetchDetalle = useCallback(async (isPull = false) => {
    if (isPull) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const res = await WMSApiUbicacionRollos.get<DetalleDiarioMovimientoDto[]>(
        `GetDetalleDiarioMovimiento/${WMSState.telaJournalId}`
      )
      if (res?.data && Array.isArray(res.data)) {
        setLineas(res.data)
      } else {
        setLineas([])
      }
    } catch (error) {
      console.error('Error cargando detalle del diario:', error)
      setLineas([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [WMSState.telaJournalId])

  useEffect(() => {
    fetchDetalle()
  }, [fetchDetalle])

  const onRefresh = useCallback(() => {
    fetchDetalle(true)
  }, [fetchDetalle])

  // Buscador local dentro de las líneas (por rollo o por ítem)
  const filteredLineas = useMemo(() => {
    const s = search.trim().toUpperCase()
    if (!s) return lineas
    return lineas.filter(
      l =>
        (l.numeroRollo || '').toUpperCase().includes(s) ||
        (l.itemId || '').toUpperCase().includes(s)
    )
  }, [lineas, search])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<DetalleDiarioMovimientoDto>) => <RolloCard item={item} />,
    []
  )

  const keyExtractor = useCallback(
    (item: DetalleDiarioMovimientoDto, index: number) => `${item.numeroRollo}-${index}`,
    []
  )

  return (
    <View style={styles.root}>
      <Header texto1="" texto2={`Diario ${WMSState.telaJournalId}`} texto3="" />

      {/* Resumen Superior */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryTxt}>Total líneas: {lineas.length}</Text>
      </View>

      {/* Input de Búsqueda de rollos / ítems */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Buscar rollo o código de ítem..."
            placeholderTextColor="#A6ABB3"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            autoCapitalize="characters"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} style={styles.clearBtn}>
              <Text style={styles.clearTxt}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={blue} size="large" />
      ) : (
        <FlatList
          data={filteredLineas}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[blue]}
              tintColor={blue}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {search ? 'No hay rollos que coincidan con la búsqueda' : 'No hay detalles para este diario'}
            </Text>
          }
        />
      )}
    </View>
  )
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rolloBadge: {
    backgroundColor: '#F4F7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rolloTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: blue,
  },
  qtyTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: green,
  },
  itemTxt: {
    fontSize: 12,
    color: black,
    marginBottom: 10,
    fontWeight: '600',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
  },
  routeBox: {
    flex: 1,
    alignItems: 'center',
  },
  routeTitle: {
    fontSize: 9,
    color: '#808080',
    fontWeight: '700',
  },
  routeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: black,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#808080',
    marginTop: 4,
  },
  routeSub: {
    fontSize: 11,
    color: '#555555',
  },
  arrow: {
    fontSize: 16,
    color: blue,
    marginHorizontal: 8,
  },
})

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', backgroundColor: grey, alignItems: 'stretch' },
  summaryBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8EC',
  },
  summaryTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: black,
  },
  searchContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: black,
  },
  clearBtn: {
    padding: 6,
  },
  clearTxt: {
    fontSize: 14,
    color: '#A6ABB3',
    fontWeight: 'bold',
  },
  listPad: { paddingVertical: 10, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#A6ABB3', marginTop: 30 },
})