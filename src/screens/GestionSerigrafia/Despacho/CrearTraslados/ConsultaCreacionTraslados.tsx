

import { type FC, useState, useEffect, useContext } from "react"
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native"

import type { StackScreenProps } from "@react-navigation/stack"
import type { RootStackParams } from "../../../../navigation/navigation"

import Header from "../../../../components/Header"
import { WMSApiSerigrafia } from "../../../../api/WMSApiSerigrafia"
import type { ArticulosParaTrasladoInterface } from "../../../../interfaces/Serigrafia/ArticulosParaTraslado"
import type { LineasTrasladoDTO } from "../../../../interfaces/Serigrafia/LineasTrasladoDTO"
import type { ConsultaLoteInterface } from "../../../../interfaces/Serigrafia/Lote"
import { WMSContext } from "../../../../context/WMSContext"
import { Diario } from "../../../../interfaces/Serigrafia/DiariosAbiertos"

type props = StackScreenProps<RootStackParams, "ConsultaCreacionTrasladosScreen">

interface TallaDetalle {
  sizedId: string
  cantidad: number
  seleccionada: boolean
  cantidadDisponible: number
  productType: number // 1 = primeras, 2 = segundas, 3 = terceras
}

interface ArticuloConTallas extends ArticulosParaTrasladoInterface {
  tallas?: TallaDetalle[]
}
export interface DiarioLineasDTO {
  journalId: string;
  lineas: LineasDiarioDTO[];
}

export interface LineasDiarioDTO {
  itemId: string;
  site: string;
  wareHouse: string;
  color: string;
  batch: string;
  wmsLocation: string;
  transDate: string;
  size: string;
  qty: string;
}

export interface ArticulosGenericosSegundas {
  itemId: string;
  name: string;
}

export const ConsultaCreacionTrasladosScreen: FC<props> = ({ navigation }) => {
  const [dataArticulos, setDataArticulos] = useState<ArticulosParaTrasladoInterface[]>([])
  const [searchText, setSearchText] = useState("")
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { WMSState } = useContext(WMSContext)
  // Nuevos filtros
  const [selectedLote, setSelectedLote] = useState<string>("")
  const [orderBy, setOrderBy] = useState<"asc" | "desc">("asc")

  // Modales
  const [showLoteModal, setShowLoteModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [articulosConTallas, setArticulosConTallas] = useState<ArticuloConTallas[]>([])
  const [dataLote, setDataLote] = useState<ConsultaLoteInterface[]>([])

  // const [diarioPorTipo, setDiarioPorTipo] = useState<Diario[]>([])
  const [diariosDisponibles, setDiariosDisponibles] = useState<Diario[]>([])
  const [diarioSeleccionadoPorTipo, setDiarioSeleccionadoPorTipo] = useState<Record<number, Diario | null>>({
    1: null,
    2: null,
    3: null,
  })
  const [showTipoDiarioModal, setShowTipoDiarioModal] = useState(false)
  const [productTypeSeleccionado, setProductTypeSeleccionado] = useState<number | null>(null)

  // Estado para artículo genérico de segundas
  const [articuloGenericoSegundas, setArticuloGenericoSegundas] = useState<string>("")
  const [showArticuloGenericoModal, setShowArticuloGenericoModal] = useState(false)
  const [articulosGenericosDisponibles, setArticulosGenericosDisponibles] = useState<ArticulosGenericosSegundas[]>([])
  const [isLoadingArticulosGenericos, setIsLoadingArticulosGenericos] = useState(false)


  const getTipoDiario = async (productType: number) => {
    try {
      const resp = await WMSApiSerigrafia.get<Diario[]>(`GetDiariosAbiertosByDiarioId/${WMSState.usuario}/${productType}`,)
      setDiariosDisponibles(resp.data ?? [])
    } catch (error) {
      Alert.alert("Error al obtener el tipo de diario")
      setDiariosDisponibles([])
    }
  }

  const getArticulosGenericosSegundas = async (articulo: string) => {
    setIsLoadingArticulosGenericos(true)
    try {
      const resp = await WMSApiSerigrafia.get<ArticulosGenericosSegundas[]>(`GetArticulosGenericoSegundas/${articulo}`)
      setArticulosGenericosDisponibles(resp.data ?? [])
      // Si hay resultados y no hay selección, seleccionar el primero por defecto
      if (resp.data && resp.data.length > 0 && !articuloGenericoSegundas) {
        setArticuloGenericoSegundas(resp.data[0].itemId)
      }
    } catch (error) {
      console.error("Error al obtener artículos genéricos:", error)
      Alert.alert("Error", "No se pudieron cargar los artículos genéricos")
    } finally {
      setIsLoadingArticulosGenericos(false)
    }
  }

  const getArticulosParaTraslado = async (loteId: string) => {
    if (!loteId) return // No hacer la llamada si no hay lote seleccionado

    setIsLoading(true)
    try {
      // Enviamos el lote como parámetro en la URL
      const resp = await WMSApiSerigrafia.get<ArticulosParaTrasladoInterface[]>(`GetArticulosDisponibleParaTraslado/${loteId}`,)
      setDataArticulos(resp.data ?? [])
    } catch (error) {
      Alert.alert("Alerta", "Selecione un lote que tenga traslados disponibles")
      setDataArticulos([])
    }

    setIsLoading(false)
  }

  const getLote = async () => {
    setIsLoading(true)
    try {
      const resp = await WMSApiSerigrafia.get<ConsultaLoteInterface[]>("GetLote")
      setDataLote(resp.data)

      if (resp.data.length > 0) {
        setSelectedLote(resp.data[0].itemseasonid)
      }
    } catch (error) {
      Alert.alert("Error al obtener los lotes")
      setDataLote([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getLote()
  }, [])

  useEffect(() => {
    if (selectedLote) {
      setSelectedArticles([]) // Limpiar selección al cambiar de lote
      getArticulosParaTraslado(selectedLote)
    }
  }, [selectedLote])

  const LOTES = dataLote.map((lote) => lote.itemseasonid)

  const articulosFiltrados = [...dataArticulos]
    .filter((art) => {
      const matchesSearch = art.itemId.toLowerCase().includes(searchText.toLowerCase())
      return matchesSearch
    })
    .sort((a, b) => {
      if (orderBy === "asc") {
        return a.itemId.localeCompare(b.itemId)
      } else {
        return b.itemId.localeCompare(a.itemId)
      }
    })



  // Selección
  const toggleArticleSelection = (id: string) => {
    setSelectedArticles((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // Render item
  const renderArticle = ({ item }: { item: ArticulosParaTrasladoInterface }) => {
    const isSelected = selectedArticles.includes(item.itemId)

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => toggleArticleSelection(item.itemId)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View>
            <Text style={[styles.articleNumber, isSelected && styles.articleNumberSelected]}>{item.itemId}</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              <Text style={styles.chipBlue}>Lote: {item.loteId || "SIN_LOTE"}</Text>

              <Text style={styles.chipGray}>Color: {item.color || "SIN COLOR"}</Text>

              <Text style={styles.chipGreen}>Físico Disponible: {item.cantidadDisponible || "SIN DISPONIBLE"}</Text>

              <Text style={styles.chipYellow}>Ubicación: {item.locationId || "SIN UBICACION"}</Text>
            </View>
          </View>

          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const obtenerTallasPorArticulo = async (articulo: ArticulosParaTrasladoInterface): Promise<TallaDetalle[]> => {
    const resp = await WMSApiSerigrafia.get<LineasTrasladoDTO[]>(`GetLineasDeTraslado/${articulo.itemId}`)
    return resp.data.map((l) => ({
      sizedId: l.sizeId,
      cantidad: l.cantidadDisponible,
      seleccionada: true,
      cantidadDisponible: l.cantidadDisponible,
      productType: l.productType ?? 1, // Valor por defecto 1 si no viene
    }))
  }

  const toggleTallaSelection = (articuloId: string, talla: string) => {
    setArticulosConTallas((prev) =>
      prev.map((art) => {
        if (art.itemId === articuloId) {
          return {
            ...art,
            tallas: art.tallas?.map((t) => (t.sizedId === talla ? { ...t, seleccionada: !t.seleccionada } : t)),
          }
        }
        return art
      }),
    )
  }

  const updateTallaCantidad = (articuloId: string, talla: string, newCantidad: string) => {
    const cantidad = Number.parseInt(newCantidad) || 0

    setArticulosConTallas((prev) =>
      prev.map((art) => {
        if (art.itemId === articuloId) {
          return {
            ...art,
            tallas: art.tallas?.map((t) => (t.sizedId === talla ? { ...t, cantidad } : t)),
          }
        }
        return art
      }),
    )
  }

  const handleCrearTraslados = async () => {
    if (selectedArticles.length === 0) {
      Alert.alert("Por favor selecciona al menos un artículo")
      return
    }
    setArticuloGenericoSegundas("") // Limpiar selección de artículo genérico al iniciar el proceso
    setDiarioSeleccionadoPorTipo({ 1: null, 2: null, 3: null }) // Limpiar selección de diarios al iniciar el proceso

    // Obtener artículos seleccionados
    const articulos = dataArticulos.filter((art) => selectedArticles.includes(art.itemId))

    // Esperar las tallas
    const articulosConTallas = await Promise.all(
      articulos.map(async (art) => ({
        ...art,
        tallas: await obtenerTallasPorArticulo(art), // ← AQUÍ se resuelve
      })),
    )

    setArticulosConTallas(articulosConTallas)
    setShowConfirmModal(true)
  }

  const confirmarTraslado = async () => {
    const hayDiarioPrimerasSelecionado = !!diarioSeleccionadoPorTipo[1]?.journalid;
    const hayDiarioSegundasSelecionado = !!diarioSeleccionadoPorTipo[2]?.journalid;
    const hayPrimeras = articulosConTallas.some(art => art.tallas?.some(t => t.seleccionada && Number(t.productType) === 1))
    const haySegundas = articulosConTallas.some(art => art.tallas?.some(t => t.seleccionada && Number(t.productType) === 2))

    if (!hayDiarioPrimerasSelecionado && hayPrimeras) {
      return Alert.alert("Alerta", "debe de seleccionarse los diarios de primeras")
    }
    if (!hayDiarioSegundasSelecionado && haySegundas) {
      return Alert.alert("Alerta", "debe de seleccionarse los diarios de segundas")
    }

    if (!articuloGenericoSegundas && haySegundas) {
      return Alert.alert("Alerta", "debe de seleccionarse articulo Generico")
    }

    try {

      const dataTraslado = articulosConTallas.flatMap((art) =>
        art
          .tallas!.filter((t) => t.seleccionada && t.cantidad > 0 && Number(t.productType) == 1)
          .map((t) => ({
            itemId: art.itemId,
            color: art.color ?? "",
            loteId: art.loteId ?? "",
            locationId: art.locationId ?? "",
            sizeId: t.sizedId,
            cantidadDisponible: t.cantidadDisponible,
            cantidadEnviar: t.cantidad,
            productType: t.productType,
            tipoDiario: diarioSeleccionadoPorTipo[t.productType]?.journalnameid || "",
          })),
      )
      const dataToSend = articulosConTallas.flatMap((art) =>
        art
          .tallas!.filter((t) => t.seleccionada && t.cantidad > 0)
          .map((t) => ({
            itemId: art.itemId,
            color: art.color ?? "",
            loteId: art.loteId ?? "",
            locationId: art.locationId ?? "",
            sizeId: t.sizedId,
            cantidadDisponible: t.cantidadDisponible,
            cantidadEnviar: t.cantidad,
            productType: t.productType,
            tipoDiario: diarioSeleccionadoPorTipo[t.productType]?.journalnameid || "",
          })),
      )

      const diarioLineasSegundas: DiarioLineasDTO = {
        journalId: diarioSeleccionadoPorTipo[2]?.journalid || "",
        lineas: dataToSend
          .filter(d => Number(d.productType) === 2)
          .map(d => ({
            itemId: articuloGenericoSegundas, // Usar el artículo genérico seleccionado
            site: "1S",
            wareHouse: "SB2",
            color: "00",
            batch: "",
            wmsLocation: "IRREGULAR",
            transDate: new Date().toISOString(),
            size: d.sizeId,
            qty: d.cantidadEnviar.toString(),
          })),
      }


      const diarioLineasPrimeras: DiarioLineasDTO = {
        journalId: diarioSeleccionadoPorTipo[1]?.journalid || "",
        lineas: dataToSend
          .filter(d => Number(d.productType) === 2)
          .map(d => ({
            itemId: d.itemId,
            site: "1",
            wareHouse: "40",
            color: d.color,
            batch: d.loteId,
            wmsLocation: "010101-01",
            transDate: new Date().toISOString(),
            size: d.sizeId,
            qty: d.cantidadEnviar.toString(),
          })),
      }

      if (hayPrimeras) {
        const respDiarioPrimeras = await WMSApiSerigrafia.post('CrearDiarioLines', diarioLineasPrimeras);
        const errorDiairoPrimeras = !respDiarioPrimeras.data.includes("OK")
        if (errorDiairoPrimeras) {
          Alert.alert("Error" + respDiarioPrimeras.data)
        } else {
          Alert.alert("Se añadio linea a diairo primeras")
        }
      }
      if (haySegundas) {
        const respDiarioSegundas = await WMSApiSerigrafia.post('CrearDiarioLines', diarioLineasSegundas);
        const errorDiarioSegundas = !respDiarioSegundas.data.includes("OK")
        if (errorDiarioSegundas) {
          Alert.alert("Error" + respDiarioSegundas.data)
        } else {
          Alert.alert("Se añadio linea a diairo segundas")
        }
      }

      const respCrearTraslado = await WMSApiSerigrafia.post('CrearTraslado', dataTraslado);
      const erroTraslado = !respCrearTraslado.data.includes("OK")
      if (erroTraslado) {
        Alert.alert("Error" + respCrearTraslado.data)
      } else {
        Alert.alert("Exito", "El traslado se creo correctamente")
      }


      if (selectedLote) {
        getArticulosParaTraslado(selectedLote)
      }
      setSelectedArticles([])
      setSearchText("")
      setShowConfirmModal(false)
      setArticulosConTallas([])
    } catch (error) {
      console.error("Error al crear la traslado: \n", error)
      Alert.alert("Error", "No se pudo crear el traslado")
    }

  }

  const getProductTypeName = (type: number): string => {
    switch (type) {
      case 1:
        return "Primeras"
      case 2:
        return "Segundas"
      case 3:
        return "Terceras"
      default:
        return "Desconocido"
    }
  }

  const getProductTypeCardStyle = (type: number) => {
    switch (type) {
      case 1:
        return styles.productTypeCardPrimeras
      case 2:
        return styles.productTypeCardSegundas
      case 3:
        return styles.productTypeCardTerceras
      default:
        return styles.productTypeCardPrimeras
    }
  }

  const getProductTypeTitleStyle = (type: number) => {
    switch (type) {
      case 1:
        return styles.productTypeTitlePrimeras
      case 2:
        return styles.productTypeTitleSegundas
      case 3:
        return styles.productTypeTitleTerceras
      default:
        return styles.productTypeTitlePrimeras
    }
  }

  return (
    <View style={styles.container}>
      <Header texto1="" texto2="Creación Traslados por Artículo" texto3="" />

      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />

        {/* Scroll con pull to refresh */}
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => getArticulosParaTraslado(selectedLote)}
              tintColor="#007AFF"
              colors={["#007AFF"]}
            />
          }
        >
          {/* Buscador + filtros */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar artículo..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#999"
            />

            {/* Filtros */}
            <View style={styles.filtersRow}>
              <TouchableOpacity style={styles.filterButton} onPress={() => setShowLoteModal(true)}>
                <Text style={styles.filterLabel}>Lote: </Text>
                <Text style={styles.filterValue}>{selectedLote}</Text>
                <Text style={styles.filterArrow}>▼</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.filterButton} onPress={() => setShowOrderModal(true)}>
                <Text style={styles.filterLabel}>Orden: </Text>
                <Text style={styles.filterValue}>{orderBy === "asc" ? "A-Z" : "Z-A"}</Text>
                <Text style={styles.filterArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Modal Lotes */}
          <Modal visible={showLoteModal} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLoteModal(false)}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Seleccionar Lote</Text>

                {dataLote.map((lote) => (
                  <TouchableOpacity
                    key={lote.itemseasonid}
                    style={[styles.modalOption, selectedLote === lote.itemseasonid && styles.modalOptionSelected]}
                    onPress={() => {
                      setSelectedLote(lote.itemseasonid)
                      setShowLoteModal(false)
                    }}
                  >
                    <Text
                      style={[styles.modalOptionText, selectedLote === lote.itemseasonid && styles.modalOptionTextSelected]}
                    >
                      {lote.itemseasonid}
                    </Text>
                    {selectedLote === lote.itemseasonid && <Text style={styles.checkmarkText}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Modal Orden */}
          <Modal visible={showOrderModal} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOrderModal(false)}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Ordenar por</Text>

                <TouchableOpacity
                  style={[styles.modalOption, orderBy === "asc" && styles.modalOptionSelected]}
                  onPress={() => {
                    setOrderBy("asc")
                    setShowOrderModal(false)
                  }}
                >
                  <Text style={[styles.modalOptionText, orderBy === "asc" && styles.modalOptionTextSelected]}>
                    A-Z (Ascendente)
                  </Text>
                  {orderBy === "asc" && <Text style={styles.checkmarkText}>✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalOption, orderBy === "desc" && styles.modalOptionSelected]}
                  onPress={() => {
                    setOrderBy("desc")
                    setShowOrderModal(false)
                  }}
                >
                  <Text style={[styles.modalOptionText, orderBy === "desc" && styles.modalOptionTextSelected]}>
                    Z-A (Descendente)
                  </Text>
                  {orderBy === "desc" && <Text style={styles.checkmarkText}>✓</Text>}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <Modal visible={showTipoDiarioModal} transparent animationType="fade">
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => {
                setShowTipoDiarioModal(false)
                setProductTypeSeleccionado(null)
              }}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Selecciona Diario</Text>

                {diariosDisponibles.map((tipo) => {
                  const selected =
                    productTypeSeleccionado !== null &&
                    diarioSeleccionadoPorTipo[productTypeSeleccionado]?.journalid === tipo.journalid

                  return (
                    <TouchableOpacity
                      key={tipo.journalid}
                      style={[styles.modalOption, selected && styles.modalOptionSelected]}
                      onPress={() => {
                        if (productTypeSeleccionado !== null) {
                          setDiarioSeleccionadoPorTipo((prev) => ({
                            ...prev,
                            [productTypeSeleccionado]: tipo,
                          }))
                          setShowTipoDiarioModal(false)
                          setProductTypeSeleccionado(null)
                        }
                      }}
                    >
                      <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                        {tipo.description}
                      </Text>
                      {selected && <Text style={styles.checkmarkText}>✓</Text>}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Modal para seleccionar artículo genérico de segundas */}
          <Modal visible={showArticuloGenericoModal} transparent animationType="fade">
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowArticuloGenericoModal(false)}
            >
              <View style={styles.articuloGenericoModalContent}>
                <Text style={styles.articuloGenericoModalTitle}>Selecciona Artículo Genérico</Text>

                {isLoadingArticulosGenericos ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Cargando artículos...</Text>
                  </View>
                ) : articulosGenericosDisponibles.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No hay artículos genéricos disponibles</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.articuloGenericoScrollView}>
                    {articulosGenericosDisponibles.map((articulo) => {
                      const selected = articuloGenericoSegundas === articulo.itemId

                      return (
                        <TouchableOpacity
                          key={articulo.itemId}
                          style={[styles.modalOption, selected && styles.articuloGenericoOptionSelected]}
                          onPress={() => {
                            setArticuloGenericoSegundas(articulo.itemId)
                            setShowArticuloGenericoModal(false)
                          }}
                        >
                          <View style={styles.articuloGenericoOptionContent}>
                            <Text style={[styles.modalOptionText, selected && styles.articuloGenericoOptionTextSelected]}>
                              {articulo.itemId}
                            </Text>
                            <Text style={[styles.articuloGenericoName, selected && styles.articuloGenericoNameSelected]}>
                              {articulo.name}
                            </Text>
                          </View>
                          {selected && <Text style={styles.checkmarkTextOrange}>✓</Text>}
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                )}
              </View>
            </TouchableOpacity>
          </Modal>

          <Modal visible={showConfirmModal} transparent animationType="slide">
            <View style={styles.confirmModalOverlay}>
              <View style={styles.confirmModalContent}>
                <Text style={styles.confirmModalTitle}>Confirmar Traslado</Text>

                <ScrollView style={styles.confirmScrollView}>
                  {articulosConTallas.map((articulo) => {
                    const tallasPorTipo = articulo.tallas?.reduce(
                      (acc, talla) => {
                        if (!acc[talla.productType]) {
                          acc[talla.productType] = []
                        }
                        acc[talla.productType].push(talla)
                        return acc
                      },
                      {} as Record<number, TallaDetalle[]>,
                    )

                    return (
                      <View key={articulo.itemId} style={styles.articuloDetailCard}>
                        <Text style={styles.articuloDetailTitle}>{articulo.itemId}</Text>

                        <View style={styles.articuloInfoRow}>
                          <Text style={styles.chipBlueSm}>Lote: {articulo.loteId || "SIN_LOTE"}</Text>
                          <Text style={styles.chipGraySm}>Color: {articulo.color || "SIN COLOR"}</Text>
                        </View>

                        {tallasPorTipo &&
                          Object.entries(tallasPorTipo)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([productType, tallas]) => (
                              <View
                                key={productType}
                                style={[styles.productTypeCard, getProductTypeCardStyle(Number(productType))]}
                              >
                                <View style={styles.productTypeHeader}>
                                  <Text
                                    style={[styles.productTypeTitle, getProductTypeTitleStyle(Number(productType))]}
                                  >
                                    {getProductTypeName(Number(productType))}
                                  </Text>

                                  <TouchableOpacity
                                    style={styles.tipoDiarioButton}
                                    onPress={() => {
                                      const pt = Number(productType)
                                      getTipoDiario(pt)
                                      setProductTypeSeleccionado(pt)
                                      setShowTipoDiarioModal(true)
                                    }}
                                  >
                                    <Text style={styles.tipoDiarioLabel}>Diario: </Text>
                                    <Text style={styles.tipoDiarioValue}>
                                      {diarioSeleccionadoPorTipo[Number(productType)]?.description || "Seleccionar"}
                                    </Text>

                                    <Text style={styles.tipoDiarioArrow}>▼</Text>
                                  </TouchableOpacity>
                                </View>

                                {/* Selector de artículo genérico solo para Segundas */}
                                {Number(productType) === 2 && (
                                  <TouchableOpacity
                                    style={styles.articuloGenericoButton}
                                    onPress={() => {
                                      getArticulosGenericosSegundas(articulo.itemId)
                                      setShowArticuloGenericoModal(true)
                                    }}
                                  >
                                    <Text style={styles.articuloGenericoLabel}>Art. Genérico: </Text>
                                    <Text style={styles.articuloGenericoValue}>
                                      {articuloGenericoSegundas || "Seleccionar"}
                                    </Text>
                                    <Text style={styles.articuloGenericoArrow}>▼</Text>
                                  </TouchableOpacity>
                                )}
                                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                                  <View style={styles.tallasTableContainer}>
                                    {/* Primera fila: Checkboxes y nombres de tallas */}
                                    <View style={styles.tallasHeaderRow}>
                                      {tallas.map((talla) => (
                                        <View key={talla.sizedId} style={styles.tallaColumn}>
                                          <TouchableOpacity
                                            style={[
                                              styles.tallaCheckbox,
                                              talla.seleccionada && styles.tallaCheckboxSelected,
                                            ]}
                                            onPress={() => toggleTallaSelection(articulo.itemId, talla.sizedId)}
                                          >
                                            {talla.seleccionada && <Text style={styles.tallaCheckboxCheck}>✓</Text>}
                                          </TouchableOpacity>
                                          <Text
                                            style={[
                                              styles.tallaTitleText,
                                              !talla.seleccionada && styles.tallaLabelDisabled,
                                            ]}
                                          >
                                            {talla.sizedId}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>

                                    {/* Segunda fila: Inputs de cantidad */}
                                    <View style={styles.tallasInputRow}>
                                      {tallas.map((talla) => (
                                        <View key={talla.sizedId} style={styles.tallaColumn}>
                                          <TextInput
                                            style={[
                                              styles.tallaCantidadInputTable,
                                              !talla.seleccionada && styles.tallaCantidadInputDisabled,
                                            ]}
                                            value={talla.cantidad.toString()}
                                            onChangeText={(text) =>
                                              updateTallaCantidad(articulo.itemId, talla.sizedId, text)
                                            }
                                            keyboardType="numeric"
                                            editable={false}
                                            selectTextOnFocus
                                            placeholder="0"
                                          />
                                          <Text
                                            style={[
                                              styles.tallaCantidadLabelTable,
                                              !talla.seleccionada && styles.tallaLabelDisabled,
                                            ]}
                                          >
                                            uds (disp: {talla.cantidadDisponible})
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  </View>
                                </ScrollView>
                              </View>
                            ))}
                      </View>
                    )
                  })}
                </ScrollView>

                <View style={styles.confirmModalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirmModal(false)}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.confirmButton} onPress={confirmarTraslado}>
                    <Text style={styles.confirmButtonText}>Crear Traslado</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Lista renderizada a mano */}
          <View style={styles.listContainer}>
            {isLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Cargando artículos...</Text>
              </View>
            ) : articulosFiltrados.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron artículos</Text>
              </View>
            ) : (
              articulosFiltrados.map((item) => <View key={item.itemId}>{renderArticle({ item })}</View>)
            )}

            {/* espacio para el botón */}
            <View style={{ height: 120 }} />
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.createButton, selectedArticles.length === 0 && styles.createButtonDisabled]}
            onPress={handleCrearTraslados}
          >
            <Text style={styles.createButtonText}>
              Crear Traslados {selectedArticles.length > 0 && `(${selectedArticles.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchInput: {
    height: 48,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filtersRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterValue: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    flex: 1,
  },
  filterArrow: {
    fontSize: 12,
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f8f8f8",
  },
  modalOptionSelected: {
    backgroundColor: "#f0f7ff",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalOptionTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    width: "100%",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f7ff",
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  articleNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  articleNumberSelected: {
    color: "#007AFF",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  createButton: {
    backgroundColor: "#007AFF",
    height: 56,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: "#ccc",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  chipBlue: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#E8F1FF",
    color: "#3F7AD9",
    borderRadius: 6,
    fontWeight: "500",
  },

  chipGray: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F4F7F8",
    color: "#5A6A75",
    borderRadius: 6,
    fontWeight: "500",
  },

  chipGreen: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#EEFBEA",
    color: "#4A9A52",
    borderRadius: 6,
    fontWeight: "500",
  },

  chipYellow: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FFF8E1",
    color: "#D9A23F",
    borderRadius: 6,
    fontWeight: "500",
  },

  confirmModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  confirmModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingTop: 20,
  },
  confirmModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  confirmScrollView: {
    paddingHorizontal: 20,
  },
  articuloDetailCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  articuloDetailTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 8,
  },
  articuloInfoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  chipBlueSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#E8F5E9",
    color: "#4CAF50",
    borderRadius: 5,
    fontWeight: "500",
    fontSize: 12,
  },
  chipGraySm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#FFF3E0",
    color: "#FF9800",
    borderRadius: 5,
    fontWeight: "500",
    fontSize: 12,
  },
  tallasLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 10,
  },
  tallasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tallasGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tallaGridItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    gap: 8,
    width: "48%",
  },
  tallaContentRow: {
    flex: 1,
    gap: 4,
  },
  tallaTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  tallaCantidadGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tallaCantidadInputCompact: {
    height: 32,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    backgroundColor: "#f8f9fa",
    textAlign: "center",
    minWidth: 50,
  },
  tallaCantidadInputDisabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ddd",
    color: "#999",
  },
  tallaCantidadLabelCompact: {
    fontSize: 12,
    color: "#666",
  },
  tallaCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  tallaCheckboxSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  tallaCheckboxCheck: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  tallaLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    minWidth: 40,
  },
  tallaLabelDisabled: {
    color: "#999",
  },
  tallaCantidadLabel: {
    fontSize: 14,
    color: "#666",
  },
  tallasTableContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  tallasHeaderRow: {
    flexDirection: "row",
    gap: 12,
  },
  tallasInputRow: {
    flexDirection: "row",
    gap: 12,
  },
  tallaColumn: {
    alignItems: "center",
    gap: 6,
    minWidth: 80,
  },
  tallaCantidadInputTable: {
    height: 36,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    backgroundColor: "#f8f9fa",
    textAlign: "center",
    width: "100%",
  },
  tallaCantidadLabelTable: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  confirmModalButtons: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  productTypeCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
  },
  productTypeCardPrimeras: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  productTypeCardSegundas: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
  },
  productTypeCardTerceras: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
  },
  productTypeTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  productTypeTitlePrimeras: {
    color: "#2E7D32",
  },
  productTypeTitleSegundas: {
    color: "#E65100",
  },
  productTypeTitleTerceras: {
    color: "#C62828",
  },
  productTypeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tipoDiarioButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  tipoDiarioLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  tipoDiarioValue: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
    marginHorizontal: 4,
  },
  tipoDiarioArrow: {
    fontSize: 10,
    color: "#999",
  },
  articuloGenericoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF9800",
    marginBottom: 10,
  },
  articuloGenericoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E65100",
  },
  articuloGenericoValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  articuloGenericoArrow: {
    fontSize: 10,
    color: "#FF9800",
  },
  articuloGenericoModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "85%",
    maxHeight: "60%",
    borderWidth: 2,
    borderColor: "#FF9800",
  },
  articuloGenericoModalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#E65100",
  },
  articuloGenericoOptionSelected: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
    borderWidth: 1,
  },
  articuloGenericoOptionTextSelected: {
    color: "#E65100",
    fontWeight: "600",
  },
  checkmarkTextOrange: {
    color: "#FF9800",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  articuloGenericoScrollView: {
    maxHeight: 300,
  },
  articuloGenericoOptionContent: {
    flex: 1,
  },
  articuloGenericoName: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  articuloGenericoNameSelected: {
    color: "#E65100",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
})

