
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { Icon } from "react-native-elements";

import Header from "../../../components/Header";
import { black, grey } from "../../../constants/Colors";
import { RootStackParams } from "../../../navigation/navigation";
import { ConsultaOpsPorBaseInterface, TallaInterface } from "../../../interfaces/Serigrafia/OpPorBaseInterface";
import { WMSApiSerigrafia } from "../../../api/WMSApiSerigrafia";
import { WMSContext } from "../../../context/WMSContext";
import Dropdown from "../ComponenteGenricos/Dropdowm";
import { OrderCard } from "../ComponenteGenricos/OrderCard";
import { EstadoOp, getEstadoTexto } from "../../../interfaces/Serigrafia/Enums/EstadoOP";
import { UsuarioValidoPorAccion } from "../../../interfaces/Serigrafia/UsuarioValidoPorAccion";
import { Respuesta } from "../../../interfaces/Serigrafia/Respuesta";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import { IM_WMS_SRG_RespustaGetEjecutarNotificadoConErrores } from "../../../interfaces/Serigrafia/IM_WMS_SRG_RespustaGetEjecutarNotificadoConErrores";

type Props = StackScreenProps<RootStackParams, "ConsultaTerminarOpsPorBaseScreen">;

const ESTADO_OP_DATA: { label: string; value: string }[] = [
  { label: "Iniciado", value: String(EstadoOp.Iniciado) },
  { label: "Terminado", value: String(EstadoOp.Terminado) },
];

export const ConsultaTerminarOpsPorBaseScreen: FC<Props> = () => {
  const [data, setData] = useState<ConsultaOpsPorBaseInterface[]>([]);
  const [searchText, setSearchText] = useState("");
  const [cargando, setCargando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { WMSState } = useContext(WMSContext);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedEstadoOp, setSelectedEstadoOp] = useState<number | null>(null);
  const [seEstaEnviandoInf, setSeEstaEnviadoInf] = useState(false);
  const [usuariosValidos, setUsuariosValidos] = useState<UsuarioValidoPorAccion[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultados, setResultados] = useState<Respuesta[]>([]);
  const [ejecutarNotificacionConErrores, setEjecutarNotificacionConErrores] = useState(false);

  const esUsuarioValido = useMemo(
    () => usuariosValidos.some((u) => u.codigoEmpleado === WMSState.usuario),
    [usuariosValidos, WMSState.usuario]
  );

  const getEjecutarNotificacionConErrores = useCallback(async () => {
    try {
      const resp = await WMSApiSerigrafia.get<IM_WMS_SRG_RespustaGetEjecutarNotificadoConErrores>(
        `GetEjecutarNotificadoConErrores`
      );
      setEjecutarNotificacionConErrores(resp.data.isActive === 0 ? false : true);
    } catch (err) {
      console.log("Error fetching data", err);
    }
  }, []);


  const getData = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await WMSApiSerigrafia.get<ConsultaOpsPorBaseInterface[]>(
        `GetOpsPrepardas/${WMSState.itemId}/${WMSState.lote}`
      );

      const ordenadas = [...resp.data].sort((a, b) => a.estadoOp - b.estadoOp);
      setData(ordenadas);

      const hayPendientesNotificar = ordenadas.some(
        (op) => op.estadoOp >= EstadoOp.Iniciado
      );

      if (!hayPendientesNotificar) {
        Alert.alert("No hay pendientes a Noticar");
      }
    } catch (err) {
      console.log("Error fetching data", err);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, [WMSState.itemId, WMSState.lote]);

  const getUsuarioValido = useCallback(async () => {
    const validoNotificarComoTerminado = "N";
    try {
      const resp = await WMSApiSerigrafia.get<UsuarioValidoPorAccion[]>(
        `GetUsuariosPorAccion/${validoNotificarComoTerminado}`
      );
      setUsuariosValidos(resp.data);
    } catch (err) {
      console.log("Error fetching data", err);
    }
  }, []);

  useEffect(() => {
    getEjecutarNotificacionConErrores();
    getData();
    getUsuarioValido();
  }, [getData, getUsuarioValido, getEjecutarNotificacionConErrores]);

  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
  }, []);

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  try {
    await Promise.all([getData(), getEjecutarNotificacionConErrores()]);
  } finally {
    setRefreshing(false);
  }
}, [getData, getEjecutarNotificacionConErrores]);

  const styleOptions = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter((order) => order.estadoOp >= EstadoOp.Iniciado)
          .map((order) => order.itemIdEstilo)
      )
    ).map((s) => ({ label: String(s), value: String(s) }));
  }, [data]);

  const generarDetlleTallasPendientesNotificarTerminado = useCallback(
    (order: ConsultaOpsPorBaseInterface) => {
      if (!order.tallas || order.tallas.length === 0) {
        return "No hay tallas asociadas.";
      }

      let detalle = "Tallas pendientes de Notificar:\n\n";

      order.tallas.forEach((t) => {
        if (t.estadoOP < EstadoOp.NotificadoTerminado) {
          const estadoTexto = getEstadoTexto(t.estadoOP);
          detalle += `• Talla: ${t.talla} | Estado Actual: ${estadoTexto}\n`;
        }
      });

      return detalle;
    },
    []
  );

  const generarDetalleTallas = useCallback((order: ConsultaOpsPorBaseInterface) => {
    if (!order.tallas || order.tallas.length === 0) {
      return "No hay tallas asociadas.";
    }

    let detalle = "Tallas a ajustar:\n\n";

    const tallasDiferentes = order.tallas.filter(
      (t) => t.cantidadPrimeras + t.cantidadIrregulares !== t.cantidadSolicitada
    );

    if (tallasDiferentes.length === 0) {
      return detalle + "Todas las tallas están correctas. No se requieren ajustes.\n";
    }

    tallasDiferentes.forEach((t) => {
      detalle += `• Talla: ${t.talla} | Solicitado: ${t.cantidadSolicitada} | Preparado: ${
        t.cantidadPrimeras + t.cantidadIrregulares
      }\n`;
    });

    return detalle;
  }, []);

  const formatearRespuesApi = useCallback((xmlRaw: string): string => {
    const match = xmlRaw.match(/<Respuesta>(.*?)<\/Respuesta>/i);

    if (!match) {
      return "Operación realizada correctamente.";
    }

    let mensaje = match[1].trim();

    mensaje = mensaje
      .replace(/^Ok/i, "Se ha ajustado las cantidades correctamente")
      .replace(/:\.?$/, "")
      .replace(/\s+/g, " ");

    return mensaje;
  }, []);

  const enviarNotificacionTerminado = useCallback(
    async (order: ConsultaOpsPorBaseInterface) => {
      setSeEstaEnviadoInf(true);
      try {
        const resp = await WMSApiSerigrafia.post(
          `CambiarEstadOpNotificado/${WMSState.itemId}`,
          order
        );

        setResultados(resp.data);
        setModalVisible(true);
      } catch (error) {
        console.error("Error al Notificar la OP:", error);
      } finally {
        setSeEstaEnviadoInf(false);
        getData();
      }
    },
    [WMSState.itemId, getData]
  );

  const handleOnPressTerminar = useCallback(
    async (order: ConsultaOpsPorBaseInterface, tallasActualizadas: TallaInterface[]) => {
      if (!esUsuarioValido) {
        Alert.alert("Alerta", "Usuario invalido para esta acción.");
        return;
      }

      const orderActualizada = { ...order, tallas: tallasActualizadas };
      const detalle = generarDetlleTallasPendientesNotificarTerminado(orderActualizada);

      const tallasPendientes = orderActualizada.tallas.filter(
        (t) => t.estadoOP < EstadoOp.NotificadoTerminado
      );

      if (tallasPendientes.length === 0) {
        Alert.alert("No hay tallas pendientes de notificar como terminadas.");
        return;
      }

      const tallasInvalidas = tallasPendientes.filter(
        (t) => t.cantidadSolicitada !== t.cantidadPrimeras + t.cantidadIrregulares
      );

      if (tallasInvalidas.length > 0) {
        const detalleTallasInvalidas = tallasInvalidas
          .map(
            (t) =>
              `Talla: ${t.talla} | Cantidad a Notficar: ${t.cantidadSolicitada} | Cantidad Empacada: ${
                t.cantidadPrimeras + t.cantidadIrregulares
              }`
          )
          .join("\n");

        Alert.alert(
          "Error de Validación / Se debe Ajustar Tallas",
          `Las siguientes tallas tienen cantidades empacadas que no coinciden con las cantidades preparadas:\n\n${detalleTallasInvalidas}\n`
        );
        return;
      }

      const orderToSend = {
        ...orderActualizada,
        tallas: tallasPendientes,
      };

      Alert.alert(
        `Confirmar Notificación de Terminado: ${order.prodMasterId}`,
        detalle,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            onPress: async () => {
              await enviarNotificacionTerminado(orderToSend);
            },
          },
        ]
      );
    },
    [esUsuarioValido, generarDetlleTallasPendientesNotificarTerminado, enviarNotificacionTerminado]
  );

  const handleOnAjustar = useCallback(
    async (order: ConsultaOpsPorBaseInterface, tallasActualizadas: TallaInterface[]) => {
      if (!esUsuarioValido) {
        Alert.alert("Alerta", "Usuario invalido para esta acción.");
        return;
      }

      const orderActualizada = { ...order, tallas: tallasActualizadas };
      const detalle = generarDetalleTallas(orderActualizada);

      const orderToSend = {
        ...orderActualizada,
        tallas: orderActualizada.tallas.map((t) => ({
          ...t,
          cantidadPreparada: t.cantidadPrimeras + t.cantidadIrregulares,
        })),
      };

      Alert.alert(`Confirmar Ajuste Op: ${order.prodMasterId}`, detalle, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Ajustar",
          onPress: async () => {
            setSeEstaEnviadoInf(true);
            try {
              const resp = await WMSApiSerigrafia.post(
                `AjustarCantidadPorOPEnNotificar/${WMSState.itemId}`,
                orderToSend
              );

              Alert.alert(formatearRespuesApi(resp.data));
              getData();
            } catch (error: any) {
              Alert.alert("Error al ajustar la OP" + error.message);
            } finally {
              setSeEstaEnviadoInf(false);
            }
          },
        },
      ]);
    },
    [esUsuarioValido, generarDetalleTallas, WMSState.itemId, formatearRespuesApi, getData]
  );

  const filteredData = useMemo(() => {
    const text = searchText.trim().toLowerCase();

    return data.filter((o) => {
      if (o.estadoOp < EstadoOp.Iniciado) return false;

      const matchSearch =
        text === "" ||
        o.prodMasterId.toLowerCase().includes(text) ||
        o.itemIdEstilo.toLowerCase().includes(text);

      const matchStyle =
        !selectedStyle || selectedStyle === "All" || o.itemIdEstilo === selectedStyle;

      const matchEstadoOp =
        selectedEstadoOp === null ||
        selectedEstadoOp === -1 ||
        o.estadoOp === selectedEstadoOp;

      return matchSearch && matchStyle && matchEstadoOp;
    });
  }, [data, searchText, selectedStyle, selectedEstadoOp]);

  const renderItem = useCallback(
    ({ item }: { item: ConsultaOpsPorBaseInterface }) => (
      <OrderCard
        order={item}
        labelButton1="Not. Terminado"
        labelButton2="Limpiar"
        labelButton3="Ajustar"
        pantalla="TerminarOP"
        seEstaEnviandoInfo={seEstaEnviandoInf}
        onPress={(tallasActualizadas) => handleOnPressTerminar(item, tallasActualizadas)}
        OnAjustar={(tallasActualizadas) => handleOnAjustar(item, tallasActualizadas)}
        ejecutarNotificacionConErrores={ejecutarNotificacionConErrores}
      />
    ),
    [handleOnPressTerminar, handleOnAjustar, seEstaEnviandoInf, ejecutarNotificacionConErrores]
  );

  const keyExtractor = useCallback(
    (item: ConsultaOpsPorBaseInterface, index: number) =>
      `${item.prodMasterId}-${index}`,
    []
  );

  const ListHeader = useMemo(
    () => (
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={handleSearch}
              placeholder="Buscar OP..."
              autoFocus
            />
            <Icon name="search" size={15} color={black} />
          </View>
        </View>

        <Dropdown
          options={styleOptions}
          selectedOption={selectedStyle}
          placeholder="Selecciona un estilo"
          onSelect={setSelectedStyle}
          includeAll={true}
        />

        <Dropdown
          options={ESTADO_OP_DATA}
          selectedOption={selectedEstadoOp !== null ? String(selectedEstadoOp) : ""}
          placeholder="Selecciona un estado"
          onSelect={(value) => setSelectedEstadoOp(value ? Number(value) : null)}
          includeAll={true}
        />
      </View>
    ),
    [searchText, handleSearch, styleOptions, selectedStyle, selectedEstadoOp]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header texto1="Terminar Ops" texto2={WMSState.itemId} texto3={WMSState.lote} />

      <FlatList
        data={filteredData}
        extraData={{seEstaEnviandoInf,ejecutarNotificacionConErrores}}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.ordersList}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          cargando ? (
            <ActivityIndicator size="large" color={black} />
          ) : (
            <Text style={styles.emptyText}>No hay órdenes para mostrar.</Text>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[black]}
            tintColor={black}
          />
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Resultado de Notificación</Text>

            <FlatList
              data={resultados}
              keyExtractor={(_, index) => String(index)}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.resultItem,
                    { backgroundColor: item.exito ? "#e6fffa" : "#ffe6e6" },
                  ]}
                >
                  <Text style={styles.resultTitle}>
                    {item.exito ? "✅ Éxito" : "❌ Error"} / {item.datos}
                  </Text>
                  <Text>{item.mensaje}</Text>
                </View>
              )}
            />

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: grey,
  },
  searchContainer: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  ordersList: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 20,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultItem: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 6,
  },
  resultTitle: {
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: black,
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
  },
});