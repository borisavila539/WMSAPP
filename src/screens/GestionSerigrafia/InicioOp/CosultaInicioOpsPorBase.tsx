
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { Icon } from "react-native-elements";

import Header from "../../../components/Header";
import { black, grey } from "../../../constants/Colors";
import { RootStackParams } from "../../../navigation/navigation";
import {
  ConsultaOpsPorBaseInterface,
  TallaInterface,
} from "../../../interfaces/Serigrafia/OpPorBaseInterface";
import { WMSApiSerigrafia } from "../../../api/WMSApiSerigrafia";
import { WMSContext } from "../../../context/WMSContext";
import Dropdown from "../ComponenteGenricos/Dropdowm";
import { OrderCard } from "../ComponenteGenricos/OrderCard";
import {
  EstadoOp,
  getEstadoTexto,
} from "../../../interfaces/Serigrafia/Enums/EstadoOP";
import { UsuarioValidoPorAccion } from "../../../interfaces/Serigrafia/UsuarioValidoPorAccion";

type Props = StackScreenProps<RootStackParams, "ConsultaInicioPorOPsBaseScreen">;

const ESTADO_OPTIONS = [
  { label: "Iniciado", value: String(EstadoOp.Iniciado) },
  { label: "Liberado", value: String(EstadoOp.Liberado) },
];

export const ConsultaInicioPorOPsBaseScreen: FC<Props> = () => {
  const [data, setData] = useState<ConsultaOpsPorBaseInterface[]>([]);
  const [searchText, setSearchText] = useState("");
  const [cargando, setCargando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { WMSState } = useContext(WMSContext);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [seEstaEnviandoInf, setSeEstaEnviadoInf] = useState(false);
  const [usuariosValidos, setUsuariosValidos] = useState<UsuarioValidoPorAccion[]>([]);

  const tituloConBase = `Base: ${WMSState.itemId}`;
  const tituloLote = `Lote: ${WMSState.lote}`;

  const esUsuarioValido = useMemo(
    () => usuariosValidos.some((u) => u.codigoEmpleado === WMSState.usuario),
    [usuariosValidos, WMSState.usuario]
  );

  const styleOptions = useMemo(() => {
    return Array.from(new Set(data.map((order) => order.itemIdEstilo))).map((s) => ({
      label: s,
      value: s,
    }));
  }, [data]);

  const getData = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await WMSApiSerigrafia.get<ConsultaOpsPorBaseInterface[]>(
        `GetOpsPorBase/${WMSState.itemId}/${WMSState.lote}`
      );

      setData(resp.data);

      const noHayPendientesIniciar = resp.data.some(
        (op) => op.estadoOp >= 0 && op.estadoOp <= EstadoOp.Iniciado
      );

      if (!noHayPendientesIniciar) {
        Alert.alert("No hay pendientes a Iniciar");
      }
    } catch (err) {
      console.log("Error fetching data", err);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, [WMSState.itemId, WMSState.lote]);

  const getUsuarioValido = useCallback(async () => {
    const validoParaIniciar = "I";
    try {
      const resp = await WMSApiSerigrafia.get<UsuarioValidoPorAccion[]>(
        `GetUsuariosPorAccion/${validoParaIniciar}`
      );
      setUsuariosValidos(resp.data);
    } catch (err) {
      console.log("Error fetching data", err);
    }
  }, []);

  useEffect(() => {
    getData();
    getUsuarioValido();
  }, [getData, getUsuarioValido]);

  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getData();
  }, [getData]);

  const generarDetlleTallasPendientesIniciar = useCallback(
    (order: ConsultaOpsPorBaseInterface) => {
      if (!order.tallas || order.tallas.length === 0) {
        return "No hay tallas asociadas.";
      }

      let detalle = "Tallas pendientes de iniciar:\n\n";

      order.tallas.forEach((t) => {
        if (t.estadoOP < EstadoOp.Iniciado) {
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
      (t) => t.cantidadPreparada !== t.cantidadSolicitada
    );

    if (tallasDiferentes.length === 0) {
      return detalle + "Todas las tallas están correctas. No se requieren ajustes.\n";
    }

    tallasDiferentes.forEach((t) => {
      detalle += `• Talla: ${t.talla} | Solicitado: ${t.cantidadSolicitada} | Preparado: ${t.cantidadPreparada}\n`;
    });

    return detalle;
  }, []);

  const formatearRespuesApiExito = useCallback((xmlRaw: string): string => {
    const match = xmlRaw.match(/<Respuesta>(.*?)<\/Respuesta>/i);

    if (!match) {
      return "Operación realizada correctamente.";
    }

    let mensaje = match[1].trim();

    mensaje = mensaje
      .replace(/^Se Inicio/i, "La orden de producción se inició")
      .replace(/:\.?$/, "")
      .replace(/\s+/g, " ");

    return mensaje;
  }, []);

  const mostrarErrorProduccion = useCallback((errorRaw: string): void => {
    const inventarioRegex =
      /Código de artículo:\s*(.+?)\s*Físico disponible\s*Tamaño=([^,]+).*?\s(\d+\.?\d*)\s*no se puede seleccionar.*?solamente\s*(\d+\.?\d*)/i;

    const match = errorRaw.match(inventarioRegex);

    if (match) {
      const itemId = match[1].trim();
      const size = match[2];
      const requerido = match[3];
      const disponible = match[4];

      Alert.alert(
        "Error: inventario insuficiente",
        `No hay stock disponible para el material seleccionado:\n\n` +
          `Artículo: ${itemId}\n` +
          `Tamaño: ${size}\n` +
          `Cantidad requerida: ${requerido}\n` +
          `Disponible: ${disponible}`
      );
      return;
    }

    Alert.alert(
      "Error de producción",
      "No se pudo iniciar la producción. El diario contiene líneas con errores."
    );
  }, []);

  const iniciarOp = useCallback(
    async (order: ConsultaOpsPorBaseInterface) => {
      setSeEstaEnviadoInf(true);
      try {
        const resp = await WMSApiSerigrafia.post(
          `CambiarEstadoOpIniciado/${WMSState.itemId}`,
          order
        );

        const result = resp.data.split(":")[0];

        if (result === "ERROR") {
          mostrarErrorProduccion(resp.data);
        } else {
          Alert.alert("Éxito", formatearRespuesApiExito(resp.data));
        }
      } catch (error: any) {
        mostrarErrorProduccion(error?.response?.data ?? "Error desconocido");
      } finally {
        setSeEstaEnviadoInf(false);
        getData();
      }
    },
    [WMSState.itemId, mostrarErrorProduccion, formatearRespuesApiExito, getData]
  );

  const handleOnPressIniciar = useCallback(
    async (order: ConsultaOpsPorBaseInterface, tallasActualizadas: TallaInterface[]) => {
      const orderActualizada = { ...order, tallas: tallasActualizadas };
      const detalle = generarDetlleTallasPendientesIniciar(orderActualizada);
      const tallasPendientes = orderActualizada.tallas.filter(
        (t) => t.estadoOP < EstadoOp.Iniciado
      );

      const baseMateria = WMSState.itemId.split(" ")[3];
      const articuloOP = order.itemIdEstilo.split(" ")[3];

      if (!esUsuarioValido) {
        Alert.alert("Alerta", "Usuario invalido para esta acción.");
        return;
      }

      if (tallasPendientes.length === 0) {
        Alert.alert("No hay tallas pendientes para iniciar.");
        return;
      }

      if (baseMateria !== articuloOP) {
        Alert.alert(
          "Error de validación",
          `El artículo de la OP (${articuloOP}) no coincide con el artículo de la base (${baseMateria}). No se puede iniciar la OP.`
        );
        return;
      }

      const orderToSend = {
        ...orderActualizada,
        tallas: tallasPendientes,
      };

      Alert.alert(`Confirmar Inicio Op: ${order.prodMasterId}`, detalle, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Iniciar",
          onPress: async () => {
            await iniciarOp(orderToSend);
          },
        },
      ]);
    },
    [
      WMSState.itemId,
      esUsuarioValido,
      generarDetlleTallasPendientesIniciar,
      iniciarOp,
    ]
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
        tallas: orderActualizada.tallas.filter(
          (t) => t.cantidadPreparada !== t.cantidadSolicitada
        ),
      };

      Alert.alert(`Confirmar Ajuste Op: ${order.prodMasterId}`, detalle, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Ajustar",
          onPress: async () => {
            setSeEstaEnviadoInf(true);
            try {
              const resp = await WMSApiSerigrafia.post(
                `AjustarCantidadPorOP/${WMSState.itemId}`,
                orderToSend
              );
              Alert.alert(resp.data);
              getData();
            } catch (error) {
              console.error("Error al ajustar la OP:", error);
            } finally {
              setSeEstaEnviadoInf(false);
            }
          },
        },
      ]);
    },
    [esUsuarioValido, generarDetalleTallas, WMSState.itemId, getData]
  );

  const filteredData = useMemo(() => {
    const text = searchText.trim().toLowerCase();

    return data.filter((o) => {
      if (!(o.estadoOp >= 0 && o.estadoOp <= EstadoOp.Iniciado)) return false;

      const matchSearch =
        text === "" ||
        o.prodMasterId.toLowerCase().includes(text) ||
        o.itemIdEstilo.toLowerCase().includes(text);

      const matchStyle =
        !selectedStyle || selectedStyle === "All" || o.itemIdEstilo === selectedStyle;

      const matchEstado =
        !selectedEstado ||
        selectedEstado === "All" ||
        o.estadoOp === Number.parseInt(selectedEstado, 10);

      return matchSearch && matchStyle && matchEstado;
    });
  }, [data, searchText, selectedStyle, selectedEstado]);

  const renderItem = useCallback(
    ({ item }: { item: ConsultaOpsPorBaseInterface }) => (
      <OrderCard
        order={item}
        labelButton1="Iniciar"
        labelButton2="Limpiar"
        labelButton3="Ajustar"
        pantalla="IniciarOP"
        seEstaEnviandoInfo={seEstaEnviandoInf}
        onPress={(tallasActualizadas) => handleOnPressIniciar(item, tallasActualizadas)}
        OnAjustar={(tallasActualizadas) => handleOnAjustar(item, tallasActualizadas)}
        ejecutarNotificacionConErrores={false}
      />
    ),
    [handleOnPressIniciar, handleOnAjustar, seEstaEnviandoInf]
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
          options={ESTADO_OPTIONS}
          selectedOption={selectedEstado}
          placeholder="Selecciona un estado"
          onSelect={setSelectedEstado}
          includeAll={true}
        />
      </View>
    ),
    [searchText, handleSearch, styleOptions, selectedStyle, selectedEstado]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header texto1="Inicio Ops" texto2={tituloConBase} texto3={tituloLote} />

      <FlatList
        data={filteredData}
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
});