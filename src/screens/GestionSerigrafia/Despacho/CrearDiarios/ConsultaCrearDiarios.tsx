
import type { StackScreenProps } from "@react-navigation/stack"
import type { RootStackParams } from "../../../../navigation/navigation"
import { type FC, useContext, useEffect, useState } from "react"
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import Header from "../../../../components/Header"
import { grey } from "../../../../constants/Colors"
import { WMSApiSerigrafia } from "../../../../api/WMSApiSerigrafia"
import { WMSContext } from "../../../../context/WMSContext"
import { Diario } from "../../../../interfaces/Serigrafia/DiariosAbiertos"
import { TipoDiarioInterface } from "../../../../interfaces/Serigrafia/TipoDiario"
import { Dropdown } from "react-native-element-dropdown"


type props = StackScreenProps<RootStackParams, "CrearDiariosCreen">
export interface DiarioHeaderDTO {
  personnelNumber: string;
  journalName: string;
  description: string;
}


export const CrearDiariosCreen: FC<props> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false)
  const { WMSState } = useContext(WMSContext)
  const [cargando, setCargando] = useState(false)
  const [diarios, setDiarios] = useState<Diario[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [tipoDiarioData, setTipoDiarioData] = useState<TipoDiarioInterface[]>([])
  const [tipodiarioselected, setTipoDiarioSelected] = useState<TipoDiarioInterface | null>(null)

  const getdata = async () => {
    // Lógica para obtener datos desde una API o base de datos
    try {
      setCargando(true)
      const respRaw = await WMSApiSerigrafia.get<Diario[]>(`GetDiariosAbiertos/${WMSState.usuario}`)
      setDiarios(respRaw.data)
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const getTipoDiario = async () => {
    try {
      const resp = await WMSApiSerigrafia.get<TipoDiarioInterface[]>(`GetTipoDiairo`)
      setTipoDiarioData(resp.data)
      return resp.data
    } catch (error) {
      console.error("Error al obtener el tipo de diario:", error)
      return null
    }
  }

  const [formData, setFormData] = useState({
    journalid: "",
    description: "",
    journalnameid: "",
  })

  useEffect(() => {
    getdata()
  }, [])


  useEffect(() => {
    getTipoDiario()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await getdata()
    setRefreshing(false)
  }

  const handleCreate = async () => {
    if (!formData.description || !formData.journalnameid) {
      Alert.alert("Error", "Por favor completa los campos requeridos")
      return
    }

    try {
      setCargando(true)
      let newDiairoHeader = {} as DiarioHeaderDTO
      newDiairoHeader.description = formData.description
      newDiairoHeader.journalName = formData.journalnameid
      newDiairoHeader.personnelNumber = WMSState.usuario

      const resp = await WMSApiSerigrafia.post('CrearDiarioHeader', newDiairoHeader)
      const result = resp.data.split(':')[0]

      // Manejar errores
      if (result  !== 'OK') {
        Alert.alert(
          "Error",
          `Error al crear el diario: ${resp.data}`
        )
        return
      }

      // Éxito
      Alert.alert("Éxito", "Diario creado correctamente")

      await getdata()

      setModalVisible(false)
      setFormData({
        journalid: "",
        description: "",
        journalnameid: "",
      })

    } catch (error) {
      console.error(error)
      Alert.alert("Error", "Hubo un problema al crear el diario")
    } finally {
      setCargando(false)
    }
  }


  const renderDiarioCard = ({ item }: { item: Diario }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle}>{item.journalid}</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.journalnameid}</Text>
            </View>
          </View>
        </View>
        <View style={styles.lineasBadge}>
          <Text style={styles.lineasText}>{item.numoflines}</Text>
          <Text style={styles.lineasLabel}>líneas</Text>
        </View>
      </View>

      <Text style={styles.cardDescription}>{item.description}</Text>
    </View>
  )

  return (
    cargando ? (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Cargando...</Text>
      </View>
    ) : (

      <View style={styles.container}>
        <Header texto1="" texto2="Gestion de Diarios" texto3="" />

        <View style={styles.content}>
          <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.createButtonText}>+ Nuevo Diario</Text>
          </TouchableOpacity>

          <FlatList
            data={diarios}
            renderItem={renderDiarioCard}
            keyExtractor={(item) => item.journalid}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nuevo Diario</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>


                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre del Diario *</Text>
                   <Dropdown
                     data={tipoDiarioData}
                     labelField="nameid"
                     valueField="id"
                     placeholder="Selecciona un tipo de diario"
                     value={tipodiarioselected}
                     onChange={(item) => {
                       setTipoDiarioSelected(item)
                       setFormData({ ...formData, journalnameid: item.nameid })
                     }}

                     style={styles.input}
                   />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Descripción</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe el propósito del diario"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                  <Text style={styles.submitButtonText}>Crear Diario</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    )
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: grey,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  content: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 16,
  },
  createButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 16,
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "600",
  },
  lineasBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 60,
  },
  lineasText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4F46E5",
  },
  lineasLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  closeButton: {
    fontSize: 28,
    color: "#9CA3AF",
    fontWeight: "300",
  },
  modalForm: {
    maxHeight: "70%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1F2937",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
