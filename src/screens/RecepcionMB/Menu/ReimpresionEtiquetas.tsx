import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useState, useContext, useEffect } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../../../navigation/navigation'
import { WMSContext } from '../../../context/WMSContext'
import Header from '../../../components/Header'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { ScrollView } from 'react-native-gesture-handler'
import { ReimpresionEtiqueta } from '../../../interfaces/ReimpresiónEtiqueta/ReimpresionEtiqueta'
import { WMSApiMB } from '../../../api/WMSApiMB'
import { PrinterInterface } from '../../../interfaces/PrintersInterface'
import { WmSApi } from '../../../api/WMSApi'
import { Dropdown } from 'react-native-element-dropdown'



type props = StackScreenProps<RootStackParams, "ReimpresionEtiquetasScreen">

export const ReimpresionEtiquetasScreen: FC<props> = ({ navigation }) => {
  const [cargando, setCargando] = useState<boolean>(false)
  const [data, setData] = useState<ReimpresionEtiqueta>({} as ReimpresionEtiqueta)
  const [scanCode, setScanCode] = useState("")
  const [quantity, setQuantity] = useState(data.qty ? parseInt(data.qty) : 1)
  const [Impresoras, setImpresoras] = useState<PrinterInterface[]>([]);
  const [impresoraSeleccionada, setImpresoraSelecionada] = useState<string>("Seleccionar impresora");

  const getImpresoras = async () => {
    try {
      await WmSApi.get<PrinterInterface[]>('Impresoras').then(resp => {
        setImpresoras(resp.data)


      })
    } catch (err) {
      console.log(err)
    }
  }
  useEffect(() => {
    getImpresoras();
  }, [])


  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta)
    setQuantity(newQuantity)
  }


  const getData = async (code: string) => {
    if (!cargando && code) {
      setCargando(true)
      try {
        const workOrderId = code.split(',')[0];
        const boxNum = code.split(',')[1];
        await WMSApiMB.get<ReimpresionEtiqueta>(`GetEtiquetaDespacho/${workOrderId}/${boxNum}`)
          .then(resp => {
            setData(resp.data)
            setQuantity(resp.data.qty ? parseInt(resp.data.qty) : 1)
          })
      } catch (err) {
        Alert.alert("Error", "No se encontró información para el código ingresado.")
      }
      setCargando(false)
    }
  }

  const handleConfirm = async () => {
    if (!scanCode) {
      Alert.alert("Error", "Debes escanear un código antes de confirmar.")
      return
    }
    data.qty = quantity.toString()
    Alert.alert("Confirmado", `Producto: ${data.productNameMB}\nCantidad: ${quantity}`)
    await WMSApiMB.post(`ReimpirmirEtiquetaDespachoMB/${impresoraSeleccionada}`, data).then(resp => {
      Alert.alert("Imprmiendo..", "Se acutalizó la cantidad con exito." + resp.data)
      setScanCode("")
      setQuantity(0)
      setData({} as ReimpresionEtiqueta)
      setImpresoraSelecionada("Seleccionar impresora")
    }).catch(err => {
      Alert.alert("Error", "Hubo un problema al enviar la etiqueta a la impresora." + err)
    })
  }

  const handleCancel = () => {
    setScanCode("")
    setQuantity(0)
    setData({} as ReimpresionEtiqueta)
    setImpresoraSelecionada("Seleccionar impresora")
  }

  function handleScandChange(text: string): void {
    setScanCode(text);
    if (text.length == 17) { // Ajusta este valor según el formato esperado del código escaneado
      getData(text);
      setScanCode(''); // Limpia el campo después de escanear
    }
  }
  
  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      {/* 🔹 Header personalizado */}
      <Header
        texto1={''}
        texto2={'Reimpresión de Etiquetas de Despacho'}
        texto3={''}
      />

      {/* 🔹 Contenido principal con scroll */}
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {/* Código de Escáner */}
          <View style={styles.section}>
            <Text style={styles.label}>Código de Caja</Text>
            <View style={styles.inputContainer}>
              <TextInput
                autoFocus
                style={styles.input}
                value={scanCode}
                onChangeText={handleScandChange}
                placeholder="Escanear código o escribirlo..."
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.scanButton} onPress={handleCancel}>
                <Icon name="times" size={30} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>
          {/* Selector de Impresora */}
          <View style={styles.section}>
            <Text style={styles.label}>Impresora</Text>
            <Dropdown data={Impresoras}
              labelField="iM_DESCRIPTION_PRINTER"
              valueField="iM_IPPRINTER"
              placeholder="Seleccionar impresora"
              value={impresoraSeleccionada}
              onChange={item => {
                setImpresoraSelecionada(item.iM_IPPRINTER);
              }}
              style={styles.input}
              placeholderStyle={{ color: '#9CA3AF' }}
              selectedTextStyle={{ color: '#111827', fontSize: 16 }}
              itemTextStyle={{ color: '#111827', fontSize: 16 }}
            />
          </View>
          {/* Información del Producto */}
          <View style={styles.productInfo}>
            <Text style={styles.productTitle}>Información del Producto</Text>

            <View style={styles.productGrid}>
              <View style={styles.productItem}>
                <Text style={styles.productLabel}>Descripción</Text>
                <Text style={styles.productValue}>{data.descripcionCompleta}</Text>
              </View>

              <View style={styles.productItem}>
                <Text style={styles.productLabel}>ubicación</Text>
                <Text style={styles.productValue}>{data.descripcionCompleta}</Text>
              </View>

              <View style={[styles.productItem, styles.fullWidth]}>
                <Text style={styles.productLabel}>O.P.</Text>
                <Text style={styles.productValue}>{data.workOrderId}</Text>
              </View>

              <View style={styles.productItem}>
                <Text style={styles.productLabel}>Número de Caja</Text>
                <Text style={styles.productValue}>{data.boxNum}</Text>
              </View>
              <View style={styles.productItem}>
                <Text style={styles.productLabel}>Lote</Text>
                <Text style={styles.productValue}>{data.batchId}</Text>
              </View>

              <View style={styles.productItem}>
                <Text style={styles.productLabel}>Estilo</Text>
                <Text style={styles.productValue}>{data.style}</Text>
              </View>

              <View style={[styles.productItem, styles.fullWidth]}>
                <Text style={styles.productLabel}>codigo de barra</Text>
                <Text style={styles.productValue}>{data.barcode}</Text>
              </View>

              <View style={[styles.productItem, styles.fullWidth]}>
                <Text style={styles.productLabel}>codigo de artículo</Text>
                <Text style={styles.productValue}>{data.productId}</Text>
              </View>

              <View style={[styles.productItem, styles.fullWidth]}>
                <Text style={styles.productLabel}>Nombre de Producto MB</Text>
                <Text style={styles.productValue}>{data.descripcionCompleta}</Text>
              </View>


              <View style={styles.productItem}>
                <Text style={styles.productLabel}>Talla</Text>
                <Text style={styles.productValue}>{data.size}</Text>
              </View>
            </View>
          </View>

          {/* Selector de Cantidad */}
          <View style={styles.section}>
            <Text style={styles.label}>Cantidad Actual</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={[styles.quantityButton]}
                onPress={() => handleQuantityChange(-1)}
              >
                <Text style={[styles.quantityButtonText, quantity <= 1 && styles.quantityButtonTextDisabled]}>−</Text>
              </TouchableOpacity>

              <View style={styles.quantityDisplay}>
                <TextInput style={styles.quantityNumber}>{quantity}</TextInput>
                <Text style={styles.quantityLabel}>unidades</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  styles.quantityButtonPlus,
                  ,
                ]}
                onPress={() => handleQuantityChange(1)}
              >
                <Text style={styles.quantityButtonTextWhite}>+</Text>
              </TouchableOpacity>
            </View>
          </View>


          {/* Botones de Acción */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    width: "100%",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 16,
    color: "#111827",
  },
  scanButton: {
    position: "absolute",
    right: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  productInfo: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",

  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  productItem: {
    width: "48%",
  },
  fullWidth: {
    width: "100%",
  },
  productLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  productValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonPlus: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
  },
  quantityButtonTextDisabled: {
    color: "#9CA3AF",
  },
  quantityButtonTextWhite: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  quantityDisplay: {
    alignItems: "center",
  },
  quantityNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
  },
  quantityLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  confirmButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  },
  filterContainer: { backgroundColor: "white", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
});

