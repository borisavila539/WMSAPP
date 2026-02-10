import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl, Alert } from "react-native";
import Header from "../../../components/Header";
import { black, grey } from "../../../constants/Colors";
import React, { FC, useState, useEffect } from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParams } from "../../../navigation/navigation";
import { ConsultaOpsPorBaseInterface, TallaInterface } from "../../../interfaces/Serigrafia/OpPorBaseInterface";
import { WMSApiSerigrafia } from "../../../api/WMSApiSerigrafia";
import { WMSContext } from "../../../context/WMSContext";
import { Icon } from "react-native-elements";
import Dropdown from "../ComponenteGenricos/Dropdowm";
import { OrderCard } from "../ComponenteGenricos/OrderCard";
import { EstadoOp, getEstadoTexto } from "../../../interfaces/Serigrafia/Enums/EstadoOP";
import { UsuarioValidoPorAccion } from "../../../interfaces/Serigrafia/UsuarioValidoPorAccion";
import { State } from "react-native-gesture-handler";


type Props = StackScreenProps<RootStackParams, 'ConsultaInicioPorOPsBaseScreen'>;

export const ConsultaInicioPorOPsBaseScreen: FC<Props> = ({ navigation }) => {
    const [data, setData] = useState<ConsultaOpsPorBaseInterface[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const [cargando, setCargando] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { WMSState } = React.useContext(WMSContext);
    const [selectedStyle, setSelectedStyle] = useState("");
    const [selectedEstado, setSelectedEstado] = useState("");
    const [seEstaEnviandoInf, setSeEstaEnviadoInf] = useState(false);
    const tituloConBase = `Base: ${WMSState.itemId}`;
    const tituloLote = `Lote: ${WMSState.lote}`;
    const [usuariosValidos, setUsuariosValidos] = useState<UsuarioValidoPorAccion[]>([]);
    const esUsuarioValido = usuariosValidos.some((u) => u.codigoEmpleado === WMSState.usuario)
    const styleOptions = Array.from(
        new Set(data.map(order => order.itemIdEstilo))
    ).map((s) => ({ label: s, value: s }));

    const getData = async () => {
        setData([]);

        setCargando(true);
        try {
            const resp = await WMSApiSerigrafia.get<ConsultaOpsPorBaseInterface[]>(
                `GetOpsPorBase/${WMSState.itemId}/${WMSState.lote}`
            );
            setData(resp.data);
            const noHayPendientesIniciar = resp.data.some((op) => op.estadoOp >= 0 && op.estadoOp <= EstadoOp.Iniciado)
            if (!noHayPendientesIniciar) {
                Alert.alert("No hay pendientes a Iniciar")
            }
        } catch (err) {
            console.log("Error fetching data", err);
        } finally {
            setCargando(false);
            setRefreshing(false);
        }
    };


    const getUsuarioValido = async () => {
        setData([]);
        const validoParaIniciar = "I";
        setCargando(true);
        try {
            const resp = await WMSApiSerigrafia.get<UsuarioValidoPorAccion[]>(
                `GetUsuariosPorAccion/${validoParaIniciar}`
            );
            setUsuariosValidos(resp.data)
        } catch (err) {
            console.log("Error fetching data", err);
        } finally {
            setCargando(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        getData();
    }, []);
    useEffect(() => {
        getUsuarioValido();
    }, []);
    const handleSearch = (value: string) => {
        setSearchText(value);
    };



    const onRefresh = () => {
        setRefreshing(true);
        getData();
    };



    const handleOnPressIniciar = async (order: ConsultaOpsPorBaseInterface, tallasActualizadas: TallaInterface[]) => {
        const orderActualizada = { ...order, tallas: tallasActualizadas };
        const detalle = generarDetlleTallasPendientesIniciar(orderActualizada);
        const tallasPendientes = orderActualizada.tallas.filter(t => t.estadoOP < EstadoOp.Iniciado);

        if (!esUsuarioValido) {
            Alert.alert("Alerta", "Usuario invalido para esta acción.")
            return
        }
        if (tallasPendientes.length === 0) {
            Alert.alert("No hay tallas pendientes para iniciar.");
            return;
        }
        const orderTosend = {
            ...orderActualizada,
            tallas: tallasPendientes
        };

        Alert.alert(
            "Confirmar Inicio Op: " + order.prodMasterId,
            detalle,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Iniciar",
                    onPress: async () => {
                        await iniciarOp(orderTosend);
                    }
                }
            ]
        );

    }
    const mostrarErrorProduccion = (errorRaw: string): void => {
        // extraer información de inventario insuficiente
        const inventarioRegex =
            /Código de artículo:\s*(.+?)\s*Físico disponible\s*Tamaño=([^,]+).*?\s(\d+\.?\d*)\s*no se puede seleccionar.*?solamente\s*(\d+\.?\d*)/i

        // const inventarioRegex =
        //     /Código de artículo:\s*(.+?)\s*Físico disponible\s*Tamaño=(\d+).*?(\d+\.?\d*)\s*no se puede seleccionar.*?solamente\s*(\d+\.?\d*)/i

        const match = errorRaw.match(inventarioRegex)

        if (match) {
            const itemId = match[1].trim()
            const size = match[2]
            const requerido = match[3]
            const disponible = match[4]

            Alert.alert(
                "Error: inventario insuficiente",
                `No hay stock disponible para el material seleccionado:\n\n` +
                `Artículo: ${itemId}\n` +
                `Tamaño: ${size}\n` +
                `Cantidad requerida: ${requerido}\n` +
                `Disponible: ${disponible}`,
                [{ text: "Aceptar" }]
            )
            return
        }

        // Error genérico
        Alert.alert(
            "Error de producción",
            "No se pudo iniciar la producción. El diario contiene líneas con errores.",
            [{ text: "Aceptar" }]
        )
    }

    const iniciarOp = async (order: ConsultaOpsPorBaseInterface) => {

        setSeEstaEnviadoInf(true)
        try {
            const resp = await WMSApiSerigrafia.post(`CambiarEstadoOpIniciado/${WMSState.itemId}`, order);
            const result = resp.data.split(':')[0]
            if (result === 'ERROR') {
                mostrarErrorProduccion(resp.data);
            } else {
                Alert.alert("Éxito", formatearRespuesApiExito(resp.data));
            }
        } catch (error) {
            mostrarErrorProduccion((error as any).response.data);
            setSeEstaEnviadoInf(false)

        }
        setSeEstaEnviadoInf(false)
        getData();
    }
    const formatearRespuesApiExito = (xmlRaw: string): string => {
        const match = xmlRaw.match(/<Respuesta>(.*?)<\/Respuesta>/i)

        if (!match) {
            return "Operación realizada correctamente."
        }

        let mensaje = match[1].trim()

        // Correcciones comunes
        mensaje = mensaje
            .replace(/^Se Inicio/i, "La orden de producción se inició")
            .replace(/:\.?$/, "")
            .replace(/\s+/g, " ")

        return mensaje
    }


    const handleOnAjustar = async (order: ConsultaOpsPorBaseInterface, tallasActualizadas: TallaInterface[]) => {
        if (!esUsuarioValido) {
            Alert.alert("Alerta", "Usuario invalido para esta acción.")
            return
        }
        const orderActualizada = { ...order, tallas: tallasActualizadas };

        const detalle = generarDetalleTallas(orderActualizada);
        const OrderToSend = {
            ...orderActualizada,
            tallas: orderActualizada.tallas.filter(t => t.cantidadPreparada !== t.cantidadSolicitada)
        };

        Alert.alert(
            "Confirmar Ajuste Op: " + order.prodMasterId,
            detalle,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Ajustar",
                    onPress: async () => {
                        setSeEstaEnviadoInf(true);
                        try {
                            const resp = await WMSApiSerigrafia.post(`AjustarCantidadPorOP/${WMSState.itemId}`, OrderToSend);
                            Alert.alert(resp.data);
                            getData();
                        } catch (error) {
                            console.error("Error al ajustar la OP:", error);
                        } finally {
                            setSeEstaEnviadoInf(false);
                        }
                    }
                }
            ]
        );
    };


    const generarDetlleTallasPendientesIniciar = (order: ConsultaOpsPorBaseInterface) => {
        if (!order.tallas || order.tallas.length === 0) return "No hay tallas asociadas.";
        let detalle = "Tallas pendientes de iniciar:\n\n";
        order.tallas.forEach(t => {
            if (t.estadoOP < EstadoOp.Iniciado) {
                const estadoTexto = getEstadoTexto(t.estadoOP);
                detalle += `• Talla: ${t.talla} | Estado Actual: ${estadoTexto}\n`;
            }
        });

        return detalle;
    }
    const generarDetalleTallas = (order: ConsultaOpsPorBaseInterface) => {
        if (!order.tallas || order.tallas.length === 0) return "No hay tallas asociadas.";
        let detalle = "Tallas a ajustar:\n\n";
        const TallasDiferenteaSolicitado = order.tallas.filter(t => t.cantidadPreparada !== t.cantidadSolicitada);
        if (TallasDiferenteaSolicitado.length === 0) {
            return detalle + "Todas las tallas están correctas. No se requieren ajustes.\n";
        }

        TallasDiferenteaSolicitado.forEach(t => {
            detalle += `• Talla: ${t.talla} | Solicitado: ${t.cantidadSolicitada} | Preparado: ${t.cantidadPreparada}\n`;
        });

        return detalle;
    };



    return (
        <SafeAreaView style={styles.container}>
            <Header texto1="Inicio Ops" texto2={tituloConBase} texto3={tituloLote} />

            {/* Barra de búsqueda */}
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
                        <Icon name='search' size={15} color={black} />
                    </View>
                </View>

                <Dropdown
                    options={styleOptions}
                    selectedOption={selectedStyle}
                    placeholder="Selecciona un estilo"
                    onSelect={(value) => setSelectedStyle(value)}
                    includeAll={true}
                />
                <Dropdown
                    options={[
                        { label: "Iniciado", value: "5" },
                        { label: "Liberado", value: "3" }
                    ]}
                    selectedOption={selectedEstado}
                    placeholder="Selecciona un estado"
                    onSelect={(value) => setSelectedEstado(value)}
                    includeAll={true}
                />
            </View>

            {/* Lista de órdenes */}
            <ScrollView
                style={styles.ordersList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[black]}
                        tintColor={black}
                    />
                }
            >
                {cargando && <ActivityIndicator size="large" color={black} />}
                {data
                    .filter((o) => {
                        const matchSearch =
                            o.prodMasterId.toLowerCase().includes(searchText.toLowerCase()) ||
                            o.itemIdEstilo.toLowerCase().includes(searchText.toLowerCase());

                        const matchStyle =
                            !selectedStyle || selectedStyle === "All" || o.itemIdEstilo === selectedStyle;
                        const matchEstado =
                            !selectedEstado || selectedEstado === "All" || o.estadoOp === parseInt(selectedEstado);
                        return matchSearch && matchStyle && matchEstado;
                    })
                    .map((order, index) => (
                        order.estadoOp >= 0 && order.estadoOp <= EstadoOp.Iniciado &&
                        <OrderCard
                            key={`${order.prodMasterId}-${index}`}
                            order={order}
                            labelButton1="Iniciar"
                            labelButton2="Limpiar"
                            labelButton3="Ajustar"
                            pantalla="IniciarOP"
                            seEstaEnviandoInfo={seEstaEnviandoInf}
                            onPress={(tallasActualizadas) => handleOnPressIniciar(order, tallasActualizadas)}
                            OnAjustar={(tallasActualizadas) => handleOnAjustar(order, tallasActualizadas)}
                        />
                    ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: grey },
    searchContainer: { backgroundColor: "white", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
    searchRow: { flexDirection: "row" },
    searchInputContainer: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, paddingHorizontal: 10 },
    searchInput: { flex: 1, height: 40, fontSize: 14 },
    ordersList: { flex: 1, padding: 16 },
});
