import { type FC, useContext, useEffect, useState } from "react"
import type { StackScreenProps } from "@react-navigation/stack"
import type { RootStackParams } from "../../navigation/navigation"
import { black, blue, grey } from "../../constants/Colors"
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native"
import Header from "../../components/Header"
import { WMSContext } from "../../context/WMSContext"
import { FlatList } from "react-native-gesture-handler"
import { WMSApiSerigrafia } from "../../api/WMSApiSerigrafia"
import type { ConsultaMateriaPrimaPorOpsInteface } from "../../interfaces/Serigrafia/MateriaPrimaPorOps"
import { Icon } from "react-native-elements"

import type { ConsultaLoteInterface } from "../../interfaces/Serigrafia/Lote"
import { Dropdown } from "react-native-element-dropdown"

type props = StackScreenProps<RootStackParams, "ConsultaPorBaseScreen">

export const ConsultaPorBaseScreen: FC<props> = ({ navigation }) => {
  
  const [data, setData] = useState<ConsultaMateriaPrimaPorOpsInteface[]>([])
  const [filteredData, setFilteredData] = useState<ConsultaMateriaPrimaPorOpsInteface[]>([])
  const [dataLote, setDataLote] = useState<ConsultaLoteInterface[]>([])
  const [loteslected, setLoteSelected] = useState<string>("")
  const { changeItemId } = useContext(WMSContext)
  const { changeLote } = useContext(WMSContext)
  const [idBusqueda, setIdBusqueda] = useState<string>("")
  const [cargando, setCargando] = useState<boolean>(true)
   const [refreshing, setRefreshing] = useState(false)

  const getLote = async () => {
    setCargando(true)
    try {
      const resp = await WMSApiSerigrafia.get<ConsultaLoteInterface[]>("GetLote")
      setDataLote(resp.data)

      if (resp.data.length > 0) {
        setLoteSelected(resp.data[0].itemseasonid)
      }
    } catch (error) {
      Alert.alert("Error al obtener los lotes")
    } finally {
      setCargando(false)
    }
  }

  const getData = async () => {
        setData([])
        setFilteredData([])
    if (!loteslected) return

    setIdBusqueda("")
    setCargando(true)

    try {
      const resp = await WMSApiSerigrafia.get<ConsultaMateriaPrimaPorOpsInteface[]>(
        `GetConsultaOpsPorBase/${loteslected}`,
      )

      setData(resp.data)
      setFilteredData(resp.data)
    } catch (error: any) {
      if (error.response) {
        Alert.alert(error.response.data)
      } else {
        Alert.alert("Error de conexión con el servidor")
      }
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    getLote()
  }, [])

  useEffect(() => {
    if (loteslected) {
      getData()
    }
  }, [loteslected])

  const handleSearch = (value: string) => {
    setIdBusqueda(value)

    if (value.trim() === "") {
      setFilteredData(data)
      return
    }

    const filtro = data.filter((item) => item.itemId.toLowerCase().includes(value.toLowerCase()))

    setFilteredData(filtro)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await getData()
    setRefreshing(false)
  }


  return (
    <View style={styles.mainContainer}>
      <Header texto1="" texto2="Consulta por Base" texto3="" />

      <View style={styles.searchContainer}>
        <Dropdown
          data={dataLote.filter((lote) => lote.itemseasonid)}
          labelField="name"
          valueField="itemseasonid"
          placeholder="Seleccione un lote"
          value={loteslected}
          onChange={(item) => setLoteSelected(item.itemseasonid)}
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          itemTextStyle={{ color: "black" }}
          containerStyle={{
            backgroundColor: "white",
            zIndex: 100,
            elevation: 5,
          }}
        />

        <View style={styles.searchRow}>
          <TextInput
            onChangeText={handleSearch}
            value={idBusqueda}
            style={styles.input}
            placeholder="Buscar artículo"
            placeholderTextColor="#999"
          />

          {cargando ? (
            <ActivityIndicator size={22} />
          ) : (
            <TouchableOpacity onPress={getData} style={styles.searchIcon}>
              <Icon name="search" size={20} color={black} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.itemId}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              changeItemId(item.itemId)
              changeLote(loteslected)
              navigation.navigate("MenuFlujoProcesoScreen")
            }}
            style={styles.itemContainer}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Icon name="dry-cleaning" type="material" size={28} color={blue} />
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.label}>ARTÍCULO</Text>
                <Text style={styles.itemText}>{item.itemId}</Text>
              </View>

              <View style={styles.arrowContainer}>
                <Icon name="chevron-right" size={24} color="#9ca3af" />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text>No se encontraron códigos de artículos</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: grey,
  },
  searchContainer: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    gap: 10,
  },

  // input + icono
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: grey,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 15,
    color: black,
  },
  searchIcon: {
    backgroundColor: grey,
    padding: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    backgroundColor: "#eff6ff",
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  itemText: {
    fontSize: 16,
    color: black,
    fontWeight: "600",
  },
  arrowContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 40,
  },

  // dropdown
  dropdown: {
    height: 45,
    borderColor: "#8e8e8e",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "white",
    zIndex: 100,
    elevation: 5,
  },
  placeholderStyle: {
    fontSize: 14,
    color: "#999",
  },
  selectedTextStyle: {
    fontSize: 14,
    color: "#000",
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    color: "#000",
    backgroundColor: "#f1f1f1",
  },
})
