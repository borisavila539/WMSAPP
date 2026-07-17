import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ListRenderItemInfo,
} from 'react-native'
import { RootStackParams } from '../../navigation/navigation'
import Header from '../../components/Header'
import { black, blue, grey } from '../../constants/Colors'

import { WMSApiUbicacionRollos } from '../../api/WMSApiUbicacionRollos'
import RolloUbicacionCard, { RolloUbicacion } from './RolloUbicacionCard'


// La respuesta del endpoint es un arreglo de rollos.
type UbicacionResponse = RolloUbicacion[]

type props = StackScreenProps<RootStackParams, 'ConsultarUbicacionRollosScreen'>

// Altura fija de cada card (contenido + margen) para getItemLayout.
const ITEM_HEIGHT = 122

type Estado = 'idle' | 'consultando' | 'ok' | 'vacio' | 'error'

export const ConsultarUbicacionRollosScreen: FC<props> = () => {
  const [almacen, setAlmacen] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [estado, setEstado] = useState<Estado>('idle')
  const [rollos, setRollos] = useState<RolloUbicacion[]>([])

  const ubicRef = useRef<TextInput>(null)

  /* --------------------------- Handlers --------------------------- */

  const consultar = useCallback(async () => {
    const alm = almacen.trim()
    const ubic = ubicacion.trim()
    if (!alm || !ubic) return

    setEstado('consultando')
    try {
      const res = await WMSApiUbicacionRollos.get<UbicacionResponse>(
        `GetConsultarRollosPorUbicacion/${alm}/${ubic}`,
      )
      const data = res.data ?? []
      setRollos(data)
      setEstado(data.length > 0 ? 'ok' : 'vacio')
    } catch {
      setRollos([])
      setEstado('error')
    }
  }, [almacen, ubicacion])

  /* ----------------------- Render de la lista --------------------- */

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<RolloUbicacion>) => (
      <RolloUbicacionCard rollo={item} />
    ),
    [],
  )

  const keyExtractor = useCallback((item: RolloUbicacion) => item.numeroRollo, [])

  const getItemLayout = useCallback(
    (_: ArrayLike<RolloUbicacion> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  )

  // Totales para el resumen (memoizado para no recalcular en cada render).
  const totalCantidad = useMemo(
    () => rollos.reduce((acc, r) => acc + r.cantidad, 0),
    [rollos],
  )

  /* ----------------------------- UI ------------------------------- */

  return (
    <View style={styles.root}>
      <Header texto1="" texto2="Consultar Ubicacion Rollos" texto3="" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Filtros: almacén + ubicación */}
        <View style={styles.formCard}>
          <View style={styles.row}>
            <View style={styles.fieldSmall}>
              <Text style={styles.label}>Almacén</Text>
              <TextInput
                value={almacen}
                onChangeText={setAlmacen}
                onSubmitEditing={() => ubicRef.current?.focus()}
                placeholder="Ej. 21"
                placeholderTextColor="#A6ABB3"
                style={styles.input}
                keyboardType="number-pad"
                returnKeyType="next"
              />
            </View>
            <View style={styles.fieldGrow}>
              <Text style={styles.label}>Ubicación</Text>
              <TextInput
                ref={ubicRef}
                value={ubicacion}
                onChangeText={setUbicacion}
                onSubmitEditing={consultar}
                placeholder="Escanear ubicación"
                placeholderTextColor="#A6ABB3"
                style={[styles.input, styles.inputUbic]}
                autoCapitalize="characters"
                returnKeyType="search"
              />
            </View>
          </View>

          <Pressable
            onPress={consultar}
            disabled={estado === 'consultando'}
            style={[styles.btn, estado === 'consultando' && styles.btnOff]}
          >
            {estado === 'consultando' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnTxt}>Consultar</Text>
            )}
          </Pressable>
        </View>

        {/* Resumen */}
        {estado === 'ok' && (
          <View style={styles.summary}>
            <Text style={styles.summaryTxt}>
              {rollos.length} rollos
            </Text>
            <Text style={styles.summaryTxt}>
              Total: {totalCantidad.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Lista de rollos */}
        <FlatList
          data={rollos}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listPad}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EstadoVacio estado={estado} />}
        />
      </KeyboardAvoidingView>
    </View>
  )
}

/* --------------------------- Sub-componentes --------------------------- */

const EstadoVacio: FC<{ estado: Estado }> = ({ estado }) => {
  if (estado === 'idle') {
    return (
      <Text style={styles.empty}>
        Ingresa almacén y ubicación para consultar.
      </Text>
    )
  }
  if (estado === 'vacio') {
    return <Text style={styles.empty}>No hay rollos en esta ubicación.</Text>
  }
  if (estado === 'error') {
    return (
      <Text style={[styles.empty, styles.emptyErr]}>
        Ocurrió un error al consultar. Intenta de nuevo.
      </Text>
    )
  }
  return null
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', backgroundColor: grey, alignItems: 'stretch' },
  flex: { flex: 1 },
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  row: { flexDirection: 'row', gap: 8 },
  fieldSmall: { width: 96, gap: 3 },
  fieldGrow: { flex: 1, gap: 3 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7078',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#F4F5F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 5,
    fontSize: 15,
    color: black,
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  inputUbic: { borderColor: blue, borderWidth: 1.5 },
  btn: {
    backgroundColor: blue,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOff: { backgroundColor: '#B9C0CC' },
  btnTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  summaryTxt: { fontSize: 12, fontWeight: '700', color: '#6B7078' },
  listPad: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 16 },
  empty: {
    textAlign: 'center',
    color: '#A6ABB3',
    fontSize: 13,
    marginTop: 32,
    paddingHorizontal: 24,
  },
  emptyErr: { color: '#E5484D' },
})
