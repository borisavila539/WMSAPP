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

type Props = StackScreenProps<RootStackParams, 'ConsultaTerminarOpsPorBaseScreen'>;

const ESTADO_OP_DATA: { label: string; value: string }[] = [
    { label: "Iniciado", value: String(EstadoOp.Iniciado) },
    { label: "Terminado", value: String(EstadoOp.Terminado) },
];
export const ConsultaTerminarOpsPorBaseScreen: FC<Props> = ({ navigation }) => {
    const [data, setData] = useState<ConsultaOpsPorBaseInterface[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const [cargando, setCargando] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { WMSState } = React.useContext(WMSContext);
    const [selectedStyle, setSelectedStyle] = useState("");
    const [selectedEstadoOp, setSelectedEstadoOp] = useState<number | null>(null);
    const [seEstaEnviandoInf, setSeEstaEnviadoInf] = useState(false);


    const styleOptions = Array.from(
        new Set(
            data
                .filter(order => order.estadoOp >= EstadoOp.Iniciado)
                .map(order => order.itemIdEstilo)
        )
    ).map(s => ({ label: String(s), value: String(s) }));

    const getData = async () => {
        setData([]);
        setCargando(true);
        try {
            const resp = await WMSApiSerigrafia.get<ConsultaOpsPorBaseInterface[]>(
                `GetOpsPrepardas/${WMSState.itemId}/${WMSState.lote}`
            );

            resp.data.sort((a, b) => a.estadoOp - b.estadoOp);
            setData(resp.data);
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

    const handleSearch = (value: string) => {
        setSearchText(value);
    };


    const onRefresh = () => {
        setRefreshing(true);
        getData();
    };

    const handleOnPressTerminar = async (order: ConsultaOpsPorBaseInterface, tallasActualizadas: TallaInterface[]) => {
        const orderActualizada = { ...order, tallas: tallasActualizadas };

        const detalle = generarDetlleTallasPendientesNotificarTerminado(orderActualizada);
        const tallasPendientes = {
            tallas: orderActualizada.tallas.filter(t => t.estadoOP < EstadoOp.NotificadoTerminado)
        };
        if (!tallasPendientes || tallasPendientes.tallas.length === 0) {
            Alert.alert("No hay tallas pendientes de notificar como terminadas.");
            return;
        }

        //validacion para la cantidad empacada por talla
        if (tallasPendientes.tallas.some(t => t.cantidadSolicitada !== t.cantidadEmpacada)) {
            //detallae de las tallas que no cumplen la condicion
            const detalleTallasInvalidas = tallasPendientes.tallas
                .filter(t => t.cantidadSolicitada !== t.cantidadEmpacada)
                .map(t => `Talla: ${t.talla} | Cantidad a Notficar: ${t.cantidadSolicitada} | Cantidad Empacada: ${t.cantidadEmpacada}`)
                .join('\n');
            Alert.alert("Error de Validación / Se debe Ajustar Tallas",
                `Las siguientes tallas tienen cantidades empacadas que no coinciden con las cantidades preparadas:\n\n${detalleTallasInvalidas}
                \n `);
            return;
        }
        const OrderToSend = {
            ...orderActualizada,
            tallas: tallasPendientes.tallas
        };
        if (tallasPendientes.tallas.length > 0) {
            Alert.alert(
                "Confirmar Notificación de Terminado: " + order.prodMasterId,
                detalle,
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Confirmar", onPress: async () =>
                            await enviarNotificacionTerminado(OrderToSend)
                    },
                ]
            );
        } else {
            Alert.alert("No hay tallas pendientes de notificar como terminadas.");
        }


    }
    const enviarNotificacionTerminado = async (order: ConsultaOpsPorBaseInterface) => {
        setSeEstaEnviadoInf(true);
        try {
            const resp = await WMSApiSerigrafia.post(`CambiarEstadOpTerminado/${WMSState.itemId}`, order);
            Alert.alert(formatXmlForAlert(resp.data))
        } catch (error) {
            console.error("Error al iniciar la OP:", error);
        }
        setSeEstaEnviadoInf(false)
        getData()
    };
    function formatXmlForAlert(xml: string): string {
        const regex = /<Respuesta>\s*(.*?)\s*<\/Respuesta>/g;
        const mensajes: string[] = [];

        let match;
        while ((match = regex.exec(xml)) !== null) {
            mensajes.push(`• ${match[1].trim()}`);
        }

        return mensajes.join('\n');
    }

    const generarDetlleTallasPendientesNotificarTerminado = (order: ConsultaOpsPorBaseInterface) => {
        if (!order.tallas || order.tallas.length === 0) return "No hay tallas asociadas.";
        let detalle = "Tallas pendientes de Notificar:\n\n";
        order.tallas.forEach(t => {
            if (t.estadoOP < EstadoOp.NotificadoTerminado) {
                const estadoTexto = getEstadoTexto(t.estadoOP);
                detalle += `• Talla: ${t.talla} | Estado Actual: ${estadoTexto}\n`;
            }
        });
        return detalle;
    };



    const handleOnAjustar = async (order: ConsultaOpsPorBaseInterface, tallasActualizadas: TallaInterface[]) => {
        const orderActualizada = { ...order, tallas: tallasActualizadas };

        const detalle = generarDetalleTallas(orderActualizada);
        const OrderToSend = {
            ...orderActualizada,
            tallas: orderActualizada.tallas.map(t => ({
                ...t,
                cantidadPreparada: t.cantidadEmpacada
            }))
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
                            const resp = await WMSApiSerigrafia.post(`AjustarCantidadPorOPEnNotificar/${WMSState.itemId}`, OrderToSend);

                            Alert.alert(formatearRespuesApi(resp.data));

                            getData();
                        } catch (error: any) {
                            Alert.alert("Error al ajustar la OP" + error.message);
                        } finally {
                            setSeEstaEnviadoInf(false);
                        }
                    }
                }
            ]
        );
    };

    const formatearRespuesApi = (xmlRaw: string): string => {
        const match = xmlRaw.match(/<Respuesta>(.*?)<\/Respuesta>/i)

        if (!match) {
            return "Operación realizada correctamente."
        }

        let mensaje = match[1].trim()

        // Correcciones comunes
        mensaje = mensaje
            .replace(/^Ok/i, "Se ha ajustado las cantidades correctamente")
            .replace(/:\.?$/, "")
            .replace(/\s+/g, " ")

        return mensaje
    }
    const generarDetalleTallas = (order: ConsultaOpsPorBaseInterface) => {
        if (!order.tallas || order.tallas.length === 0) return "No hay tallas asociadas.";
        let detalle = "Tallas a ajustar:\n\n";
        const TallasDiferenteaSolicitado = order.tallas.filter(t => t.cantidadEmpacada !== t.cantidadSolicitada);
        if (TallasDiferenteaSolicitado.length === 0) {
            return detalle + "Todas las tallas están correctas. No se requieren ajustes.\n";
        }

        TallasDiferenteaSolicitado.forEach(t => {
            detalle += `• Talla: ${t.talla} | Solicitado: ${t.cantidadSolicitada} | Preparado: ${t.cantidadEmpacada}\n`;
        });

        return detalle;
    };
    return (
        <SafeAreaView style={styles.container}>
            <Header texto1="Terminar Ops" texto2={WMSState.itemId} texto3={WMSState.lote} />

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
                    options={ESTADO_OP_DATA}
                    selectedOption={selectedEstadoOp !== null ? String(selectedEstadoOp) : ""}
                    placeholder="Selecciona un estado"
                    onSelect={(value) => setSelectedEstadoOp(value ? Number(value) : null)}
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


                        const matchEstadoOp =
                            !selectedEstadoOp || selectedEstadoOp === null || selectedEstadoOp === -1 || o.estadoOp === selectedEstadoOp;

                        return matchSearch && matchStyle && matchEstadoOp;
                    })

                    .map((order, index) => (
                        order.estadoOp >= EstadoOp.Iniciado &&
                        <OrderCard
                            key={`${order.prodMasterId}-${index}`}
                            order={order}
                            labelButton1="Not. Terminado"
                            labelButton2="Limpiar"
                            labelButton3="Ajustar"
                            pantalla="TerminarOP"
                            seEstaEnviandoInfo={seEstaEnviandoInf}
                            onPress={(tallasActualizadas) => handleOnPressTerminar(order, tallasActualizadas)}
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
