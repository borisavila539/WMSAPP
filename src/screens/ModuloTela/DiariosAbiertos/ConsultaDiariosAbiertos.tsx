import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useCallback, useMemo, useState, useEffect, useContext } from 'react'
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'
import { RootStackParams } from '../../../navigation/navigation'
import Header from '../../../components/Header'
import { black, blue, grey, green } from '../../../constants/Colors'
import { WMSApiUbicacionRollos } from '../../../api/WMSApiUbicacionRollos'
import { WMSContext } from '../../../context/WMSContext'

type props = StackScreenProps<RootStackParams, 'ConsultaDiairosAbiertosScreen'>

interface DiarioAbierto {
  journalId: string
  description: string
  numOfLines: number
  isPosted: boolean
}


const DiarioCard: FC<{ item: DiarioAbierto; onPress: (journalId: string) => void }> = ({ item, onPress }) => {
  return (
    <Pressable style={cardStyles.card} onPress={() => onPress(item.journalId)}>
      <View style={cardStyles.left}>
        <Text style={cardStyles.id}>{item.journalId}</Text>
        <Text style={cardStyles.desc} numberOfLines={2}>{item.description}</Text>
      </View>
      <View style={cardStyles.right}>
        <View style={cardStyles.linesBadge}>
          <Text style={cardStyles.linesText}>{item.numOfLines} líneas</Text>
        </View>
        <View style={[cardStyles.postedBadge, item.isPosted ? cardStyles.postedTrue : cardStyles.postedFalse]}>
          <Text style={cardStyles.postedTxt}>{item.isPosted ? 'Publicado' : 'Abierto'}</Text>
        </View>
      </View>
    </Pressable>
  )
}

export const ConsultaDiairosAbiertosScreen: FC<props> = ({ navigation }) => {
  const [diarios, setDiarios] = useState<DiarioAbierto[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const {changeTelaJournalId} = useContext(WMSContext)

  const fetchDiarios = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const res = await WMSApiUbicacionRollos.get<DiarioAbierto[]>('GetDiariosMovimientoPendientes')
      if (res?.data && Array.isArray(res.data)) {
        setDiarios(res.data)
      } else {
        Alert.alert("No se encontraron Rollos")
      }
    } catch (error) {
      console.error('Error cargando diarios:', error)
     
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDiarios()
  }, [fetchDiarios])

  const onRefresh = useCallback(() => {
    fetchDiarios(true)
  }, [fetchDiarios])

  const handlePressCard = useCallback((journalId: string) => {
    changeTelaJournalId(journalId)
    navigation.navigate('DetalleDiarioMovimientoScreen')
  }, [navigation])

  const filtered = useMemo(() => {
    const s = search.trim().toUpperCase()
    if (!s) return diarios
    return diarios.filter(d => 
      (d.journalId || '').toUpperCase().includes(s) ||
      (d.description || '').toUpperCase().includes(s)
    )
  }, [diarios, search])

  const renderItem = useCallback(({ item }: ListRenderItemInfo<DiarioAbierto>) => (
    <DiarioCard item={item} onPress={handlePressCard} />
  ), [handlePressCard])

  const keyExtractor = useCallback((item: DiarioAbierto) => item.journalId, [])

  return (
    <View style={styles.root}>
      <Header texto1="" texto2="Diarios Abiertos" texto3="" />

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Buscar por ID o ubicación..."
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
          data={filtered}
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
              {search ? 'No se encontraron coincidencias' : 'No hay diarios abiertos'}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  left: { flex: 1, paddingRight: 8 },
  id: { fontSize: 14, fontWeight: '700', color: black, marginBottom: 4 },
  desc: { fontSize: 12, color: '#60656E' },
  right: { alignItems: 'flex-end', justifyContent: 'center' },
  linesBadge: { backgroundColor: '#F4F7FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
  linesText: { color: blue, fontWeight: '700', fontSize: 12 },
  postedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  postedTrue: { backgroundColor: green },
  postedFalse: { backgroundColor: '#FFEFD6' },
  postedTxt: { fontSize: 12, fontWeight: '700', color: '#2F2F2F' },
})

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', backgroundColor: grey, alignItems: 'stretch' },
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