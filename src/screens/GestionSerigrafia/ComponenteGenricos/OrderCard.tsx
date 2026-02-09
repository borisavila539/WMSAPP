

import { useState, useMemo, useEffect, useCallback, memo } from "react"
import type { ConsultaOpsPorBaseInterface } from "../../../interfaces/Serigrafia/OpPorBaseInterface"
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { EstadoOp } from "../../../interfaces/Serigrafia/Enums/EstadoOP"
import { Dropdown } from "react-native-element-dropdown"


export const OrderCard = memo(function OrderCard({
  order,
  onPress,
  OnAjustar,
  labelButton1,
  labelButton2,
  labelButton3,
  pantalla,
  seEstaEnviandoInfo,
}: {
  order: ConsultaOpsPorBaseInterface
  onPress: (tallasActualizadas: typeof order.tallas) => void
  OnAjustar: (tallasActualizadas: typeof order.tallas) => void
  labelButton1?: string
  labelButton2?: string
  labelButton3?: string
  pantalla?: string
  seEstaEnviandoInfo: boolean
}) {
  
  const [tallas, setTallas] = useState(() => order.tallas.map((t) => ({ ...t })))
  const [estado, setEstado] = useState<EstadoOp>(order.estadoOp)

  const isIniciarPantalla = pantalla === "IniciarOP"
  const isTerminarPantalla = pantalla === "TerminarOP"

  const getColorByEstadoTalla = useCallback((estadoTalla: EstadoOp) => {
    switch (estadoTalla) {
      case EstadoOp.Liberado:
        return "#fef3c7" // amarillo suave
      case EstadoOp.Iniciado:
        return "#d1fae5" // verde suave
      case EstadoOp.NotificadoTerminado:
        return "#ffcccc" // rojo suave
      case EstadoOp.Terminado:
        return "#c7c5c5" 
      default:
        return "#ffffff" // blanco por defecto
    }
  }, [])

  const getBorderColorByEstadoTalla = useCallback((estadoTalla: EstadoOp) => {
    switch (estadoTalla) {
      case EstadoOp.Liberado:
        return "#f59e0b" // amarillo
      case EstadoOp.Iniciado:
        return "#10b981" // verde
      case EstadoOp.NotificadoTerminado:
        return "#ff4d4d" // rojo
      case EstadoOp.Terminado:
        return "#d1d5db"
      default:
        return "#d1d5db" // gris por defecto
    }
  }, [])

  const updatePreparadoSize = useCallback((index: number, value: string) => {
    setTallas((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        cantidadPreparada: Number.isNaN(Number.parseInt(value)) ? 0 : Number.parseInt(value),
      }
      return updated
    })
  }, [])

    const updateEmpacadoSize = useCallback((index: number, value: string) => {
    setTallas((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        cantidadEmpacada: Number.isNaN(Number.parseInt(value)) ? 0 : Number.parseInt(value),
      }
      return updated
    })
  }, [])

  const totalPreparado = useMemo(() => tallas.reduce((acc, t) => acc + t.cantidadPreparada, 0), [tallas])
  const totalEmpacado = useMemo(() => tallas.reduce((acc, t) => acc + t.cantidadEmpacada, 0), [tallas])
  const totalSolicitado = useMemo(() => tallas.reduce((acc, t) => acc + t.cantidadSolicitada, 0), [tallas])
  const isComplePantallaIniciar = totalPreparado === totalSolicitado
  const isComplePantallaTerminar = totalEmpacado === totalSolicitado
  const isComplete = isIniciarPantalla? isComplePantallaIniciar:isComplePantallaTerminar

  function handleReset(): void {
    setTallas(order.tallas.map((t) => ({ ...t, cantidadPreparada: 0})))
  }


  const currentEstado = estado ?? order.estadoOp

  const colorbyStatusOp = useMemo(() => {
    switch (currentEstado) {
      case EstadoOp.Liberado:
        return "#f59e0b"
      case EstadoOp.Iniciado:
        return "#10b981"
      case EstadoOp.NotificadoTerminado:
        return "rgba(255, 77, 77, 0.64)"
      case EstadoOp.Terminado:
        return "#ff4d4dff"
      default:
        return "#d1d5db"
    }
  }, [currentEstado])

  const colorbackgroundbyStatusOp = useMemo(() => {
    switch (currentEstado) {
      case EstadoOp.Liberado:
        return "#fef3c7ff"
      case EstadoOp.Iniciado:
        return "#d1fae5"
      case EstadoOp.Terminado:
        return "#ffccccff"
      default:
        return "#f3f4f6"
    }
  }, [currentEstado])

  const isDisableIniciado = useMemo(() => {
    return tallas.every((t) => (t.estadoOP?? 0) >= EstadoOp.Iniciado)
  },[tallas])

  const isDisableTerminado = useMemo( 
    () => {
      return tallas.every((t)=> (t.estadoOP??0) >= EstadoOp.NotificadoTerminado)
    },[tallas]
  )



  const isDisabled = useMemo(() => {
    if (seEstaEnviandoInfo) return true

    if (isIniciarPantalla){
      return isDisableIniciado
    }

    if (isTerminarPantalla){
      return isDisableTerminado
    }

    return false
  },[
    seEstaEnviandoInfo,
    isIniciarPantalla,
    isTerminarPantalla,
    isDisableIniciado,
    isDisableTerminado
  ])



  const isDisabledPreparadoEmpacado = useMemo(()=> {
    if (seEstaEnviandoInfo) return true

    if (isIniciarPantalla){
      return isDisableIniciado
    }

    if (isTerminarPantalla){
      return true
    }

    return false
  },[
    seEstaEnviandoInfo,
    isIniciarPantalla,
    isTerminarPantalla,
    isDisableIniciado,
  ])
  console.log(isDisabledPreparadoEmpacado)
  return (
    <View style={styles.orderCard}>
      <View style={[styles.statusIndicator, { backgroundColor: colorbyStatusOp }]} />

      <View style={styles.cardContent}>
        <View style={[styles.cardHeader, { backgroundColor: colorbackgroundbyStatusOp }]}>
          <View style={styles.headerInfo}>
            <Text style={styles.orderId}>{order.prodMasterId}</Text>
            <Text style={styles.articleCode}>{order.itemIdEstilo}</Text>
            <Text style={styles.colorId}>{order.colorName}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isComplete ? "#d1fae5" : "#fed7aa",
                borderColor: isComplete ? "#10b981" : "#f59e0b",
              },
            ]}
          >
            <Text style={[styles.statusText, { color: isComplete ? "#065f46" : "#92400e" }]}>
              {isIniciarPantalla? totalPreparado:totalEmpacado}/{totalSolicitado}
            </Text>
          </View>
        </View>
        

        <View style={styles.divider} />

        <View style={styles.sizesContainer}>
          <View style={styles.sizeRow}>
            <Text style={styles.rowLabel}>Talla</Text>
            {tallas.map((t, i) => (
              <View
                key={i}
                style={[
                  styles.sizeHeaderCell,
                  t.estadoOP
                    ? {
                        backgroundColor: getColorByEstadoTalla(t.estadoOP),
                        borderWidth: 2,
                        borderColor: getBorderColorByEstadoTalla(t.estadoOP),
                        borderRadius: 6,
                        paddingVertical: 4,
                      }
                    : {},
                ]}
              >
                <Text style={styles.sizeHeader}>{t.talla}</Text>
              </View>
            ))}
          </View>
          <View style={styles.divider} />
          <View style={styles.sizeRow}>
            <Text style={styles.rowLabel}>{isIniciarPantalla ? "Solicitado" : "Iniciado"}</Text>
            {tallas.map((t, i) => (
              <View
                key={i}
                style={[
                  styles.readOnlyCell,
                  t.estadoOP
                    ? {
                        backgroundColor: getColorByEstadoTalla(t.estadoOP),
                        borderColor: getBorderColorByEstadoTalla(t.estadoOP),
                      }
                    : {},
                ]}
              >
                <Text style={styles.readOnlyText}>{t.cantidadSolicitada}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sizeRow}>
            <Text style={styles.rowLabel}>{isIniciarPantalla ? "Preparado" : "Empacado"}</Text>
            {tallas.map((t, i) => (
              <TextInput
                key={i}
                style={[
                  styles.sizeInput,
                  isDisabledPreparadoEmpacado && styles.texAreaDisabled,
                  !isDisabledPreparadoEmpacado && t.estadoOP
                    ? {
                        backgroundColor: getColorByEstadoTalla(t.estadoOP),
                        borderColor: getBorderColorByEstadoTalla(t.estadoOP),
                        borderWidth: 2,
                      }
                    : undefined,
                ]}
                value={isIniciarPantalla? t.cantidadPreparada.toString(): t.cantidadEmpacada.toString()}
                onChangeText={(value) => isIniciarPantalla? updatePreparadoSize(i, value):updateEmpacadoSize(i,value)}
                keyboardType="numeric"
                textAlign="center"
                editable={!isDisabledPreparadoEmpacado}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.borrarButton, isDisabled && styles.buttonDisabled1]}
            onPress={handleReset}
            activeOpacity={0.7}
            disabled={isDisabled}
          >
            <Text style={styles.borrarButtonText}>{labelButton2}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.labelButton3, isDisabled && styles.buttonDisabled3]}
            onPress={() => OnAjustar?.(tallas)}
            activeOpacity={0.7}
            disabled={isDisabled}
          >
            <Text style={styles.borrarButtonText}>{labelButton3}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              isIniciarPantalla ? styles.button2 : styles.button2PantlaTerminado,
              isDisabled && (isIniciarPantalla ? styles.buttonDisabled2 : styles.buttonDisabled2Terminado),
            ]}
            onPress = {() => onPress(tallas)}
            activeOpacity={0.8}
            disabled={isDisabled}
          >
            <Text style={styles.button2Text}>{labelButton1}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: "row",
  },
  statusIndicator: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
  },
  headerInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
  },
  articleCode: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
    fontWeight: "500",
  },
  colorId: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
    fontWeight: "500",
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
  },
  sizesContainer: {
    marginBottom: 16,
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  labelCell: {
    width: 80,
  },
  sizeHeaderCell: {
    flex: 1,
    alignItems: "center",
  },
  sizeHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowLabel: {
    width: 80,
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
  },
  readOnlyCell: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    paddingVertical: 8,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  readOnlyText: {
    textAlign: "center",
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  sizeInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingVertical: 8,
    marginHorizontal: 3,
    fontSize: 14,
    backgroundColor: "#ffffff",
    fontWeight: "600",
    color: "#111827",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  borrarButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  labelButton3: {
    flex: 1,
    backgroundColor: "#f3bd67ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  borrarButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  button2: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  button2PantlaTerminado: {
    flex: 1,
    backgroundColor: "#f34646ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#a36464ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  button2Text: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  buttonDisabled1: {
    backgroundColor: "#9ca3af",
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled3: {
    backgroundColor: "#f3bd6750",
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled2: {
    backgroundColor: "#b8e6c4ff",
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled2Terminado: {
    backgroundColor: "#ffccccff",
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  texAreaDisabled: {
    backgroundColor: "#d3dae9ff",
    color: "#6b7280",
  },
  estadoDropdown: {
    marginTop: 8,
    letterSpacing: -0.2,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
  },
})
