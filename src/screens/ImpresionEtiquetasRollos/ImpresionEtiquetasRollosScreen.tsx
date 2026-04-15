import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ListRenderItem,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { RootStackParams } from '../../navigation/navigation'
import Header from '../../components/Header'
import { WmSApi } from '../../api/WMSApi'

const { width, height } = Dimensions.get('window')
const CARD_GAP = 8
const CARD_WIDTH = (width - 24 - CARD_GAP) / 2
const CARD_HEIGHT = 116
const ROW_HEIGHT = CARD_HEIGHT + CARD_GAP

const colors = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  accent: '#10B981',
  accentLight: '#D1FAE5',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  muted: '#94A3B8',
  overlay: 'rgba(15,23,42,0.35)',
}

type Props = StackScreenProps<RootStackParams, 'ImpresionEtiquetasRollosScreen'>
type TipoTela = 'denim' | 'tejido'

export interface DetalleEtiquetaRolloInterface {
  tela: string
  nombreBusqueda: string
  color: string
  nombreColor: string
  configuracion: string
  numeroRollo: string
  numeroRolloProveedor: string
  proveedor: string
  nombreProveedor: string
  almacen: string
  lote: string
  ubicacion: string
  cantidad: number
  unidad: string
}

type RowItem = {
  id: string
  items: DetalleEtiquetaRolloInterface[]
}

type InputFieldProps = {
  icon: string
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  keyboardType?: 'default' | 'numeric'
  flex?: number
  onFocus?: () => void
}

const InputField: FC<InputFieldProps> = memo(
  ({
    icon,
    placeholder,
    value,
    onChangeText,
    keyboardType = 'default',
    flex = 1,
    onFocus,
  }) => {
    return (
      <View style={[styles.inputWrap, { flex }]}>
        <Icon name={icon} size={12} color={colors.muted} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          keyboardType={keyboardType}
          autoCorrect={false}
          autoCapitalize="none"
          blurOnSubmit={false}
          returnKeyType="search"
        />
      </View>
    )
  },
)

type DropdownFieldProps = {
  label: string
  value: string
  placeholder: string
  onPress: () => void
  flex?: number
}

const DropdownField: FC<DropdownFieldProps> = memo(
  ({ value, placeholder, onPress, flex = 1 }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.inputWrap, { flex }]}
        onPress={onPress}
      >
        <Icon name="list" size={12} color={colors.muted} />
        <View style={styles.dropdownTextWrap}>
          <Text
            numberOfLines={1}
            style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}
          >
            {value || placeholder}
          </Text>
        </View>
        <Icon name="chevron-down" size={14} color={colors.muted} />
      </TouchableOpacity>
    )
  },
)

type RolloCardProps = {
  item: DetalleEtiquetaRolloInterface
  selected: boolean
  onPress: (id: string) => void
}

const RolloCard: FC<RolloCardProps> = memo(
  ({ item, selected, onPress }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onPress(item.numeroRollo)}
        style={[styles.card, selected && styles.cardSelected]}
      >
        <View style={[styles.check, selected && styles.checkSelected]}>
          {selected ? <Icon name="check" size={11} color="#FFF" /> : null}
        </View>

        <Text style={styles.rollo} numberOfLines={1}>
          {item.numeroRollo}
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.cantidad} {item.unidad}
          </Text>
        </View>

        <Text style={styles.line} numberOfLines={1}>
          {item.tela}
        </Text>

        <Text style={styles.lineMuted} numberOfLines={1}>
          {item.nombreColor} ({item.color})
        </Text>

        <View style={styles.rowMini}>
          <Text style={styles.miniLabel}>Lote</Text>
          <Text style={styles.miniValue} numberOfLines={1}>
            {item.lote}
          </Text>
        </View>

        <View style={styles.rowMini}>
          <Text style={styles.miniLabel}>Prov</Text>
          <Text style={styles.miniValue} numberOfLines={1}>
            {item.numeroRolloProveedor}
          </Text>
        </View>
      </TouchableOpacity>
    )
  },
  (prev, next) =>
    prev.selected === next.selected &&
    prev.item.numeroRollo === next.item.numeroRollo &&
    prev.item.cantidad === next.item.cantidad &&
    prev.item.unidad === next.item.unidad &&
    prev.item.tela === next.item.tela &&
    prev.item.nombreColor === next.item.nombreColor &&
    prev.item.color === next.item.color &&
    prev.item.lote === next.item.lote &&
    prev.item.numeroRolloProveedor === next.item.numeroRolloProveedor,
)

type RolloRowProps = {
  items: DetalleEtiquetaRolloInterface[]
  isSelected: (id: string) => boolean
  onToggle: (id: string) => void
}

const RolloRow: FC<RolloRowProps> = memo(
  ({ items, isSelected, onToggle }) => {
    return (
      <View style={styles.rowContainer}>
        {items.map(item => (
          <RolloCard
            key={item.numeroRollo}
            item={item}
            selected={isSelected(item.numeroRollo)}
            onPress={onToggle}
          />
        ))}

        {items.length === 1 ? <View style={styles.cardPlaceholder} /> : null}
      </View>
    )
  },
  (prev, next) =>
    prev.items === next.items &&
    prev.isSelected === next.isSelected &&
    prev.onToggle === next.onToggle,
)

export const ImpresionEtiquetasRollosScreen: FC<Props> = () => {
  const [tipoTela, setTipoTela] = useState<TipoTela>('tejido')
  const [cargando, setCargando] = useState(false)
  const [imprimiendo, setImprimiendo] = useState(false)
  const [rollos, setRollos] = useState<DetalleEtiquetaRolloInterface[]>([])

  // selección optimizada
  const [allSelected, setAllSelected] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())

  const [importacion, setImportacion] = useState('')
  const [numProveedor, setNumProveedor] = useState('')
  const [rolloProveedor, setRolloProveedor] = useState('')
  const [configuracion, setConfiguracion] = useState('')
  const [color, setColor] = useState('')
  const [cantidad, setCantidad] = useState('')

  const [filtroLote, setFiltroLote] = useState('')
  const [filtroNumeroRollo, setFiltroNumeroRollo] = useState('')
  const [tipoTelaLocal, setTipoTelaLocal] = useState('')
  const [showTipoTelaDropdown, setShowTipoTelaDropdown] = useState(false)

  const limpiarSeleccion = useCallback(() => {
    setAllSelected(false)
    setSelectedIds(new Set())
    setExcludedIds(new Set())
  }, [])

  const opcionesTipoTela = useMemo(() => {
    const mapa = new Map<string, string>()

    for (const item of rollos) {
      const lote = (item.lote ?? '').trim()
      const nombre = (item.nombreBusqueda ?? '').trim()

      if (!lote || !nombre) continue

      if (!mapa.has(lote)) {
        mapa.set(lote, nombre)
      }
    }

    return Array.from(new Set(Array.from(mapa.values()))).sort((a, b) =>
      a.localeCompare(b),
    )
  }, [rollos])

  const filtrosActivos = useMemo(() => {
    const filtrosApi =
      tipoTela === 'denim'
        ? [importacion, numProveedor, rolloProveedor, configuracion].filter(Boolean).length
        : [importacion, color, cantidad].filter(Boolean).length

    const filtrosLocales = [filtroLote, filtroNumeroRollo, tipoTelaLocal].filter(Boolean).length

    return filtrosApi + filtrosLocales
  }, [
    tipoTela,
    importacion,
    numProveedor,
    rolloProveedor,
    configuracion,
    color,
    cantidad,
    filtroLote,
    filtroNumeroRollo,
    tipoTelaLocal,
  ])

  const limpiarFiltros = useCallback(() => {
    setImportacion('')
    setNumProveedor('')
    setRolloProveedor('')
    setConfiguracion('')
    setColor('')
    setCantidad('')
    setFiltroLote('')
    setFiltroNumeroRollo('')
    setTipoTelaLocal('')
    setRollos([])
    limpiarSeleccion()
  }, [limpiarSeleccion])

  const autocompletarImportacion = useCallback(() => {
    if (!importacion.trim()) {
      setImportacion('IM0000')
    }
  }, [importacion])

  const getData = useCallback(async () => {
    if (!importacion.trim()) {
      setRollos([])
      limpiarSeleccion()
      return
    }

    setCargando(true)
    try {
      const response = await WmSApi.get<DetalleEtiquetaRolloInterface[]>(
        'GetDetalleRolloAImprimir',
        {
          params: {
            InventBatchId: importacion.trim(),
            InventColorId: color.trim(),
            ConfigId: configuracion.trim(),
            Proveedor: numProveedor.trim(),
            RolloProveedor: rolloProveedor.trim(),
            Cantidad: cantidad.trim() ? Number(cantidad) : null,
            TipoEtiqueta: tipoTela === 'denim' ? 'DENIM' : 'TEJIDO',
          },
        },
      )

      if (response.data?.length === 0) {
        Alert.alert(
          'Aviso / No se encontraron rollos.',
          `*Revisa que la importacion pertejezca al tipo de tela seleccionado.\n*Revisa le numero de importacion.`,
        )
      }

      setRollos(response.data ?? [])
      limpiarSeleccion()
      setFiltroLote('')
      setFiltroNumeroRollo('')
      setTipoTelaLocal('')
    } catch (err) {
      console.log(err)
      setRollos([])
      limpiarSeleccion()
      Alert.alert('Error', 'No se pudo obtener la información.')
    } finally {
      setCargando(false)
    }
  }, [
    importacion,
    color,
    configuracion,
    numProveedor,
    rolloProveedor,
    cantidad,
    tipoTela,
    limpiarSeleccion,
  ])

  const rollosFiltrados = useMemo(() => {
    const lote = filtroLote.trim().toUpperCase()
    const numeroRollo = filtroNumeroRollo.trim().toUpperCase()
    const tipoTelaValue = tipoTelaLocal.trim().toUpperCase()

    if (!lote && !numeroRollo && !tipoTelaValue) return rollos

    return rollos.filter(item => {
      const matchLote = !lote || (item.lote ?? '').toUpperCase().includes(lote)
      const matchNumeroRollo =
        !numeroRollo || (item.numeroRollo ?? '').toUpperCase().includes(numeroRollo)
      const matchTipoTela =
        !tipoTelaValue || (item.nombreBusqueda ?? '').toUpperCase() === tipoTelaValue

      return matchLote && matchNumeroRollo && matchTipoTela
    })
  }, [rollos, filtroLote, filtroNumeroRollo, tipoTelaLocal])

  const rows = useMemo<RowItem[]>(() => {
    const result: RowItem[] = []

    for (let i = 0; i < rollosFiltrados.length; i += 2) {
      const items = rollosFiltrados.slice(i, i + 2)

      result.push({
        id: items.map(x => x.numeroRollo).join('-'),
        items,
      })
    }

    return result
  }, [rollosFiltrados])

  const isSelected = useCallback(
    (id: string) => {
      return allSelected ? !excludedIds.has(id) : selectedIds.has(id)
    },
    [allSelected, excludedIds, selectedIds],
  )

  const toggleSeleccion = useCallback(
    (id: string) => {
      if (allSelected) {
        setExcludedIds(prev => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
        return
      }

      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    },
    [allSelected],
  )

  const seleccionarTodos = useCallback(() => {
    setAllSelected(prev => !prev)
    setSelectedIds(new Set())
    setExcludedIds(new Set())
  }, [])

  const totalSeleccionados = useMemo(() => {
    return allSelected
      ? Math.max(rollosFiltrados.length - excludedIds.size, 0)
      : selectedIds.size
  }, [allSelected, excludedIds.size, selectedIds.size, rollosFiltrados.length])

  const imprimirEtiquetas = useCallback(async () => {
    const items = rollosFiltrados.filter(r => isSelected(r.numeroRollo))

    if (items.length === 0) {
      Alert.alert('Aviso', 'Selecciona al menos una etiqueta.')
      return
    }

    setImprimiendo(true)
    try {
      const endpoint =
        tipoTela === 'tejido'
          ? 'ImprimirEtiquetaTejidoPunto'
          : 'ImprimirEtiquetaDenim'

      const response = await WmSApi.post<string>(endpoint, items)

      Alert.alert(
        'Impresión',
        typeof response.data === 'string' ? response.data : 'Proceso completado.',
      )
    } catch (err) {
      console.log(err)
      Alert.alert('Error', 'No se pudo enviar la impresión.')
    } finally {
      setImprimiendo(false)
    }
  }, [rollosFiltrados, isSelected, tipoTela])

  const renderRow: ListRenderItem<RowItem> = useCallback(
    ({ item }) => (
      <RolloRow
        items={item.items}
        isSelected={isSelected}
        onToggle={toggleSeleccion}
      />
    ),
    [isSelected, toggleSeleccion],
  )

  const keyExtractor = useCallback((item: RowItem) => item.id, [])

  const getItemLayout = useCallback(
    (_: ArrayLike<RowItem> | null | undefined, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    [],
  )

  return (
    <View style={styles.container}>
      <Header
        texto1="Etiquetas"
        texto2={`${rollosFiltrados.length} encontrados`}
        texto3={filtrosActivos > 0 ? `${filtrosActivos} filtros` : ''}
      />

      <View style={styles.topSwitch}>
        <TouchableOpacity
          style={[styles.switchBtn, tipoTela === 'denim' && styles.switchBtnActive]}
          onPress={() => {
            setTipoTela('denim')
            limpiarFiltros()
          }}
        >
          <Text style={[styles.switchText, tipoTela === 'denim' && styles.switchTextActive]}>
            Denim
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchBtn, tipoTela === 'tejido' && styles.switchBtnActive]}
          onPress={() => {
            setTipoTela('tejido')
            limpiarFiltros()
          }}
        >
          <Text style={[styles.switchText, tipoTela === 'tejido' && styles.switchTextActive]}>
            Tejido
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersBox}>
        {tipoTela === 'denim' ? (
          <View style={styles.filtersRow}>
            <InputField
              icon="file-text"
              placeholder="IM0000"
              value={importacion}
              onChangeText={setImportacion}
              onFocus={autocompletarImportacion}
            />
            <InputField
              icon="hash"
              placeholder="Rollo prov."
              value={rolloProveedor}
              onChangeText={setRolloProveedor}
            />
          </View>
        ) : (
          <View style={styles.filtersRow}>
            <InputField
              icon="file-text"
              placeholder="IM0000"
              value={importacion}
              onChangeText={setImportacion}
              onFocus={autocompletarImportacion}
            />
            <InputField
              icon="droplet"
              placeholder="Color"
              value={color}
              onChangeText={setColor}
            />
            <InputField
              icon="activity"
              placeholder="Config."
              value={configuracion}
              onChangeText={setConfiguracion}
              keyboardType="numeric"
            />
          </View>
        )}

        <View style={styles.filtersRow}>
          <InputField
            icon="hash"
            placeholder="No. rollo"
            value={filtroNumeroRollo}
            onChangeText={setFiltroNumeroRollo}
          />
          <DropdownField
            label="Codigo de Artículo"
            placeholder="Codigo de artículo"
            value={tipoTelaLocal}
            onPress={() => setShowTipoTelaDropdown(true)}
          />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.clearBtn} onPress={limpiarFiltros}>
            <Icon name="x" size={14} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.searchBtn} onPress={getData} disabled={cargando}>
            {cargando ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Icon name="search" size={14} color="#FFF" />
                <Text style={styles.searchText}>Buscar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={16}
        windowSize={7}
        getItemLayout={getItemLayout}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={getData} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Icon name="inbox" size={28} color={colors.border} />
            <Text style={styles.emptyText}>
              {cargando ? 'Cargando...' : 'Sin resultados'}
            </Text>
          </View>
        }
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.selectBtn} onPress={seleccionarTodos}>
          <Icon
            name={allSelected && rollosFiltrados.length > 0 ? 'check-square' : 'square'}
            size={18}
            color={colors.primary}
          />
          <Text style={styles.selectText}>
            {totalSeleccionados > 0 ? totalSeleccionados : 'Todos'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.printBtn,
            (totalSeleccionados === 0 || imprimiendo) && styles.printBtnDisabled,
          ]}
          onPress={imprimirEtiquetas}
          disabled={totalSeleccionados === 0 || imprimiendo}
        >
          {imprimiendo ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Icon name="printer" size={16} color="#FFF" />
              <Text style={styles.printText}>
                Imprimir{totalSeleccionados > 0 ? ` (${totalSeleccionados})` : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showTipoTelaDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTipoTelaDropdown(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowTipoTelaDropdown(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tipo de tela</Text>
              <TouchableOpacity onPress={() => setShowTipoTelaDropdown(false)}>
                <Icon name="x" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} nestedScrollEnabled>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => {
                  setTipoTelaLocal('')
                  limpiarSeleccion()
                  setShowTipoTelaDropdown(false)
                }}
              >
                <Text style={styles.optionText}>Todos</Text>
              </TouchableOpacity>

              {opcionesTipoTela.map(opcion => (
                <TouchableOpacity
                  key={opcion}
                  style={styles.optionRow}
                  onPress={() => {
                    setTipoTelaLocal(opcion)
                    limpiarSeleccion()
                    setShowTipoTelaDropdown(false)
                  }}
                >
                  <Text style={styles.optionText}>{opcion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  topSwitch: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 6,
  },
  switchBtn: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchBtnActive: {
    backgroundColor: colors.primary,
  },
  switchText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  switchTextActive: {
    color: '#FFF',
  },

  filtersBox: {
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  inputWrap: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 0,
  },
  dropdownTextWrap: {
    flex: 1,
  },
  dropdownText: {
    fontSize: 13,
    color: colors.text,
  },
  dropdownPlaceholder: {
    color: colors.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  clearBtn: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  searchText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  listContent: {
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 78,
  },

  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },

  card: {
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPlaceholder: {
    width: CARD_WIDTH,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F5F9FF',
  },
  check: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  checkSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rollo: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    paddingRight: 22,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: colors.accentLight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
  },
  line: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  lineMuted: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  rowMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  miniLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    width: 24,
  },
  miniValue: {
    flex: 1,
    fontSize: 10,
    color: colors.text,
    fontWeight: '600',
  },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  printBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  printBtnDisabled: {
    backgroundColor: colors.border,
  },
  printText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: height * 0.65,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    height: 44,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modalList: {
    maxHeight: height * 0.5,
  },
  optionRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionText: {
    fontSize: 13,
    color: colors.text,
  },
})

export default ImpresionEtiquetasRollosScreen