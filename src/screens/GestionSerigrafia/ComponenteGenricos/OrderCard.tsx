
import React, { memo, useCallback, useMemo, useState } from "react"
import type {
  ConsultaOpsPorBaseInterface,
  TallaInterface,
} from "../../../interfaces/Serigrafia/OpPorBaseInterface"
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { EstadoOp } from "../../../interfaces/Serigrafia/Enums/EstadoOP"

type OrderCardProps = {
  order: ConsultaOpsPorBaseInterface
  onPress: (tallasActualizadas: ConsultaOpsPorBaseInterface["tallas"]) => void
  OnAjustar: (tallasActualizadas: ConsultaOpsPorBaseInterface["tallas"]) => void
  labelButton1?: string
  labelButton2?: string
  labelButton3?: string
  pantalla?: string
  seEstaEnviandoInfo: boolean
  ejecutarNotificacionConErrores: boolean
}

const toInt = (value: string) => {
  const n = Number.parseInt(value, 10)
  return Number.isNaN(n) ? 0 : n
}

const getColorByEstado = (estado?: EstadoOp) => {
  switch (estado) {
    case EstadoOp.Liberado:
      return "#fef3c7"
    case EstadoOp.Iniciado:
      return "#b3cff0"
    case EstadoOp.NotificadoTerminado:
      return "#d1fae5"
    case EstadoOp.Terminado:
      return "#c7c5c5"
    default:
      return "#ffffff"
  }
}

const getBorderByEstado = (estado?: EstadoOp) => {
  switch (estado) {
    case EstadoOp.Liberado:
      return "#f59e0b"
    case EstadoOp.Iniciado:
      return "#51a2ff"
    case EstadoOp.NotificadoTerminado:
      return "#10b981"
    case EstadoOp.Terminado:
      return "#d1d5db"
    default:
      return "#d1d5db"
  }
}

const EditableCell = memo(function EditableCell({
  value,
  editable,
  onChangeText,
  backgroundColor,
  borderColor,
  disabledStyle,
}: {
  value: string
  editable: boolean
  onChangeText: (value: string) => void
  backgroundColor?: string
  borderColor?: string
  disabledStyle?: boolean
}) {
  return (
    <TextInput
      style={[
        styles.sizeInput,
        disabledStyle && styles.texAreaDisabled,
        editable && backgroundColor && borderColor
          ? {
              backgroundColor,
              borderColor,
              borderWidth: 2,
            }
          : undefined,
      ]}
      value={value}
      onChangeText={onChangeText}
      keyboardType="numeric"
      textAlign="center"
      editable={editable}
    />
  )
})

const ReadOnlyCell = memo(function ReadOnlyCell({
  value,
  backgroundColor,
  borderColor,
}: {
  value: string | number
  backgroundColor?: string
  borderColor?: string
}) {
  return (
    <View
      style={[
        styles.readOnlyCell,
        backgroundColor && borderColor
          ? {
              backgroundColor,
              borderColor,
            }
          : undefined,
      ]}
    >
      <Text style={styles.readOnlyText}>{value}</Text>
    </View>
  )
})

const HeaderSizeCell = memo(function HeaderSizeCell({
  talla,
  backgroundColor,
  borderColor,
}: {
  talla: string
  backgroundColor?: string
  borderColor?: string
}) {
  return (
    <View
      style={[
        styles.sizeHeaderCell,
        backgroundColor && borderColor
          ? {
              backgroundColor,
              borderWidth: 2,
              borderColor,
              borderRadius: 6,
              paddingVertical: 4,
            }
          : undefined,
      ]}
    >
      <Text style={styles.sizeHeader}>{talla}</Text>
    </View>
  )
})

export const OrderCard = memo(function OrderCard({
  order,
  onPress,
  OnAjustar,
  labelButton1,
  labelButton2,
  labelButton3,
  pantalla,
  seEstaEnviandoInfo,
  ejecutarNotificacionConErrores,
}: OrderCardProps) {
  const [tallas, setTallas] = useState(() => order.tallas.map((t) => ({ ...t })))
  const isIniciarPantalla = pantalla === "IniciarOP"
  const isTerminarPantalla = pantalla === "TerminarOP"
  const currentEstado = order.estadoOp

  const totalPreparado = useMemo(
    () => tallas.reduce((acc, t) => acc + t.cantidadPreparada, 0),
    [tallas]
  )

  const totalEmpacado = useMemo(
    () => tallas.reduce((acc, t) => acc + t.cantidadPrimeras + t.cantidadIrregulares, 0),
    [tallas]
  )

  const totalSolicitado = useMemo(
    () => tallas.reduce((acc, t) => acc + t.cantidadSolicitada, 0),
    [tallas]
  )

  const isComplete = isIniciarPantalla
    ? totalPreparado === totalSolicitado
    : totalEmpacado === totalSolicitado

  const isDisableIniciado = useMemo(
    () => tallas.every((t) => (t.estadoOP ?? 0) >= EstadoOp.Iniciado),
    [tallas]
  )

  const isDisableTerminado = useMemo(
    () => tallas.every((t) => (t.estadoOP ?? 0) >= EstadoOp.NotificadoTerminado),
    [tallas]
  )

  const isDisabled = useMemo(() => {
    if (seEstaEnviandoInfo) return true
    if (isIniciarPantalla) return isDisableIniciado
    if (isTerminarPantalla) return isDisableTerminado
    return false
  }, [
    seEstaEnviandoInfo,
    isIniciarPantalla,
    isTerminarPantalla,
    isDisableIniciado,
    isDisableTerminado,
  ])

  const isDisabledPreparadoEmpacado = useMemo(() => {
    if (seEstaEnviandoInfo) return true
    if (isIniciarPantalla) return isDisableIniciado
    if (isTerminarPantalla) return true
    return false
  }, [seEstaEnviandoInfo, isIniciarPantalla, isTerminarPantalla, isDisableIniciado])

  const colorbyStatusOp = useMemo(() => {
    switch (currentEstado) {
      case EstadoOp.Liberado:
        return "#f59e0b"
      case EstadoOp.Iniciado:
        return "#b3cff0"
      case EstadoOp.NotificadoTerminado:
        return "#10b981"
      case EstadoOp.Terminado:
        return "#d1d5db"
      default:
        return "#d1d5db"
    }
  }, [currentEstado])

  const colorbackgroundbyStatusOp = useMemo(() => {
    switch (currentEstado) {
      case EstadoOp.Liberado:
        return "#fef3c7ff"
      case EstadoOp.Iniciado:
        return "#b3cff0"
      case EstadoOp.NotificadoTerminado:
        return "#d1fae5"
      case EstadoOp.Terminado:
        return "#c7c5c5"
      default:
        return "#f3f4f6"
    }
  }, [currentEstado])

  const tallasConEstilo = useMemo(() => {
    return tallas.map((t) => {
      const backgroundColor = getColorByEstado(t.estadoOP)
      const borderColor =
        isTerminarPantalla &&
        t.cantidadPrimeras + t.cantidadIrregulares !== t.cantidadSolicitada
          ? "#ff4d4d"
          : getBorderByEstado(t.estadoOP)

      return {
        ...t,
        backgroundColor,
        borderColor,
      }
    })
  }, [tallas, isTerminarPantalla])

  const updateTallaField = useCallback(
    (index: number, field: keyof TallaInterface, value: string) => {
      setTallas((prev) => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          [field]: toInt(value),
        }
        return updated
      })
    },
    []
  )

  const handleReset = useCallback(() => {
    setTallas(
      order.tallas.map((t) => ({
        ...t,
        cantidadPreparada: 0,
        cantidadPrimeras: 0,
        cantidadIrregulares: 0,
      }))
    )
  }, [order.tallas])

  return (
    <View style={styles.orderCard}>
      {seEstaEnviandoInfo && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Enviando información...</Text>
        </View>
      )}

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
                backgroundColor: isComplete ? "#6bf1ac" : "#fed7aa",
                borderColor: isComplete ? "#195742" : "#ffb25b",
              },
            ]}
          >
            <Text style={[styles.statusText, { color: isComplete ? "#065f46" : "#92400e" }]}>
              {isIniciarPantalla ? totalPreparado : totalEmpacado}/{totalSolicitado}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sizesContainer}>
          <View style={styles.sizeRow}>
            <Text style={styles.rowLabel}>Talla</Text>
            {tallasConEstilo.map((t, i) => (
              <HeaderSizeCell
                key={`${t.talla}-${i}`}
                talla={t.talla}
                backgroundColor={t.estadoOP ? t.backgroundColor : undefined}
                borderColor={t.estadoOP ? t.borderColor : undefined}
              />
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.sizeRow}>
            <Text style={styles.rowLabel}>{isIniciarPantalla ? "Solicitado" : "Iniciado"}</Text>
            {tallasConEstilo.map((t, i) => (
              <ReadOnlyCell
                key={`${t.talla}-readonly-${i}`}
                value={t.cantidadSolicitada}
                backgroundColor={t.estadoOP ? t.backgroundColor : undefined}
                borderColor={t.estadoOP ? t.borderColor : undefined}
              />
            ))}
          </View>

          {isIniciarPantalla ? (
            <View style={styles.sizeRow}>
              <Text style={styles.rowLabel}>Preparado</Text>
              {tallasConEstilo.map((t, i) => (
                <EditableCell
                  key={`${t.talla}-prep-${i}`}
                  value={t.cantidadPreparada.toString()}
                  onChangeText={(value) => updateTallaField(i, "cantidadPreparada", value)}
                  editable={!isDisabledPreparadoEmpacado}
                  disabledStyle={isDisabledPreparadoEmpacado}
                  backgroundColor={t.backgroundColor}
                  borderColor={t.borderColor}
                />
              ))}
            </View>
          ) : (
            <>
              <View style={styles.sizeRow}>
                <Text style={styles.rowLabel}>
                  {ejecutarNotificacionConErrores ? "Primeras" : "Empacado"}
                </Text>
                {tallasConEstilo.map((t, i) => (
                  <EditableCell
                    key={`${t.talla}-emp-${i}`}
                    value={
                      ejecutarNotificacionConErrores
                        ? t.cantidadPrimeras.toString()
                        : (t.cantidadPrimeras + t.cantidadIrregulares).toString()
                    }
                    onChangeText={(value) => updateTallaField(i, "cantidadPrimeras", value)}
                    editable={!isDisabledPreparadoEmpacado}
                    disabledStyle={isDisabledPreparadoEmpacado}
                    backgroundColor={t.backgroundColor}
                    borderColor={t.borderColor}
                  />
                ))}
              </View>

              {ejecutarNotificacionConErrores && (
                <View style={styles.sizeRow}>
                  <Text style={styles.rowLabel}>Irregulares</Text>
                  {tallasConEstilo.map((t, i) => (
                    <EditableCell
                      key={`${t.talla}-irr-${i}`}
                      value={t.cantidadIrregulares?.toString() ?? "0"}
                      onChangeText={(value) =>
                        updateTallaField(i, "cantidadIrregulares", value)
                      }
                      editable={!isDisabledPreparadoEmpacado}
                      disabledStyle={isDisabledPreparadoEmpacado}
                      backgroundColor={t.backgroundColor}
                      borderColor={t.borderColor}
                    />
                  ))}
                </View>
              )}
            </>
          )}
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
              isDisabled
                ? isIniciarPantalla
                  ? styles.buttonDisabled2
                  : styles.buttonDisabled2Terminado
                : undefined,
            ]}
            onPress={() => onPress(tallas)}
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.75)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
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
    position: "relative",
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
    backgroundColor: "#fa8383",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fa838318",
  },
  borrarButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  button2: {
    flex: 1,
    backgroundColor: "#51a2ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#b0d2f8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  button2PantlaTerminado: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#a1f1d7",
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
    backgroundColor: "#fa838350",
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
    backgroundColor: "#10b98150",
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
