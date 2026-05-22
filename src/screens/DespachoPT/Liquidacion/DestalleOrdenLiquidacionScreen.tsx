import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../../../navigation/navigation'
import Header from '../../../components/Header'
import { WMSContext } from '../../../context/WMSContext'
import { black, blue, green, grey } from '../../../constants/Colors'
import { DetalleOrdenLiquidacionInterface } from '../../../interfaces/DespachoPT/Liquidacion/OrdenesLiquidacionInterface';
import { WmSApi } from '../../../api/WMSApi'
import { EstadoOp, getEstadoTexto } from '../../../interfaces/Serigrafia/Enums/EstadoOP'
import { RespuestaNotificadoConErroresSubcontracionInterface } from '../../../interfaces/TejidoPunto/RespuestaNotificadoSubcontratacion'
import { IM_WMS_UsuarioPorPantallaInterface } from '../../../interfaces/UsuarioPorPantallaInterface'


type props = StackScreenProps<RootStackParams, "DestalleOrdenLiquidacionScreen">

export interface IConfirmacionRecepcionDTO {
    action: string;
    prodmasterId: string;
    purchId: string;
    packingSlipId: string;
    qtyReceive: number;
}

const pantalla = 'RecibimientoSubcontratacion'

export const DestalleOrdenLiquidacionScreen: FC<props> = ({ navigation }) => {

    const { WMSState } = useContext(WMSContext)
    const [data, setData] = useState<DetalleOrdenLiquidacionInterface[]>([])
    const [cargando, setCargando] = useState<Boolean>(false)
    const [modalVisible, setModalVisible] = useState(false);
    const [resultados, setResultados] = useState<RespuestaNotificadoConErroresSubcontracionInterface[]>([]);
    const [esRecepcion, setEsRecepcion] = useState<boolean>(false);
    const [usuarioConPermiso, setUsuarioConPermiso] =
    useState<IM_WMS_UsuarioPorPantallaInterface | null>(null);

    const isDisabled = Number(WMSState.TieneDiarioRecepcion) === 1
    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<DetalleOrdenLiquidacionInterface[]>(`DetalleOrdenesRecibidasliquidacion/${WMSState.DespachoID}/${WMSState.ProdID}`)
                .then(resp => {
                    setData(resp.data)
                })
        } catch (err) {

        }
        setCargando(false)
    }

    const getPermisoUsuario = async () => {
        setCargando(true);
        try {
            const resp = await WmSApi.get(`GetPermisoUsuarioPorPantalla/${WMSState.usuario}/${pantalla}`);
            setUsuarioConPermiso(resp.data);
        } catch (err) {
            console.log('Error al verificar permiso de usuario:', err);
            return false;
        }
        setCargando(false);
    }

    // Calcular totales de toda la operación
    const getTotales = () => {
        const totalEnviado = data.reduce((acc, item) => acc + item.enviado, 0)
        const totalRecibido = data.reduce((acc, item) => acc + item.recibido, 0)
        const totalDiferencia = totalEnviado - totalRecibido
        return { totalEnviado, totalRecibido, totalDiferencia }
    }

    const { totalEnviado, totalRecibido, totalDiferencia } = getTotales()

    const handleConfirmaciónPc = async (): Promise<boolean> => {
        try {
            const dataToSend: IConfirmacionRecepcionDTO = {
                action: 'CONFIRM_PC',
                purchId: WMSState.PurchId,
                packingSlipId: WMSState.NumeroOPPakingList,
                prodmasterId: WMSState.ProdID,
                qtyReceive: totalRecibido
            };

            const resp = await WmSApi.post(`ConfirmacionRecepcionDePedidoDeCompra`, dataToSend);
            setResultados(resp.data);
            if (!resp.data[0].exito) {
                setModalVisible(true);
                return false;
            }
            return true;

        } catch (err) {
            console.log('Error en confirmación PC:', err);
            return false;
        }
    };
    const loRecibidoMayorAlEnviado = async (): Promise<boolean> => {
        const recibidoMayorEnviado = data.some(item => item.recibido !== item.enviado || item.cortado !== item.enviado);

        if (!recibidoMayorEnviado) {
            return true;
        }

        return new Promise(resolve => {
            Alert.alert(
                'Cantidad recibida diferente a la enviada',
                'Hay al menos una talla con cantidad recibida diferente a la enviada. ¿Desea forzar la notificación?',
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                        onPress: () => {
                            setCargando(false);
                            resolve(false);
                        }
                    },
                    {
                        text: 'Forzar notificación',
                        onPress: () => {

                            resolve(true);
                        }
                    }
                ]
            );
        });
    };
    
    const handleLiquidar = async () => {
        setCargando(true);
        if (!usuarioConPermiso?.permisoadmin) {
            Alert.alert('Permiso denegado', 'No tienes permiso para notificar esta orden.')
            setCargando(false);
            return;
        }

        const tallasNtofificadas = data.every(item => item.prodStatus === EstadoOp.NotificadoTerminado);
        if (tallasNtofificadas) {
            Alert.alert('No hay tallas para notificar', 'Todas las tallas de esta orden ya han sido notificadas como terminadas.')
            setCargando(false)
            return;
        }

        const faltaLiberarTela = data.some(item => item.cumpleBOM === 0);
        if (faltaLiberarTela) {
            Alert.alert('Falta liberar tela', 'No se puede notificar la OP porque falta libera tela en AX.');
            setCargando(false)
            return;
        }

        const puedeContinuar = await loRecibidoMayorAlEnviado();
        if (!puedeContinuar) {
            return;
        }



        var respustaConfirmacion = await handleConfirmaciónPc();
        if (!respustaConfirmacion) {
            setCargando(false)
            return;
        }

        try {
            const resp = await WmSApi.post(`NotificacionSubcontratacionTejidoPunto/${data[0].prodCutSheetID}`);
            setResultados(resp.data);
            getData();
            setModalVisible(true);
        } catch (err) {

        }
        setCargando(false)
    }

    const handleRecepcion = async () => {
        if (!usuarioConPermiso?.permisoadmin) {
            Alert.alert('Permiso denegado', 'No tienes permiso para notificar esta orden.')
            setCargando(false);
            return;
        }
        const hayTallasSinNotificar = data.some(item => item.prodStatus !== EstadoOp.NotificadoTerminado);
        if (hayTallasSinNotificar) {
            Alert.alert('No se puede recepcionar', 'Todas las tallas deben estar notificadas como terminadas para poder recepcionar.')
            return;
        }
        try {

            const dataToSend: IConfirmacionRecepcionDTO = {
                action: 'RECEIVE',
                purchId: WMSState.PurchId,
                packingSlipId: WMSState.NumeroOPPakingList,
                prodmasterId: WMSState.ProdID,
                qtyReceive: totalRecibido
            }
            const resp = await WmSApi.post(`ConfirmacionRecepcionDePedidoDeCompra`, dataToSend);
            setResultados(resp.data);
            if (resultados.some(resultado => resultado.exito)) {
                setEsRecepcion(true);
            }

            setModalVisible(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al confirmar recepción en AX';
            Alert.alert('Error', message, [
                { text: 'OK', onPress: () => console.log('OK Pressed') }
            ]);
        }
    }

    const getColorEstado = (status: number) => {
        switch (status) {
            case EstadoOp.Iniciado:
                return '#346796'
            case EstadoOp.NotificadoTerminado:
                return '#349963'
            default:
                return '#999'
        }
    }
    const gobackifRecepcion = () => {
        if (esRecepcion) {
            navigation.goBack();
        }
    }
    useEffect(() => {
        getData();
    }, [])

    useEffect(() => {
        getPermisoUsuario();
    }, [])

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1={`Despacho: ${WMSState.DespachoID}`} texto2={`Orden: ${WMSState.ProdID}`} texto3={`${WMSState.NumeroOPPakingList} / ${WMSState.PurchId}`} />

            <ScrollView
                style={{ flex: 1, width: '100%' }}
                contentContainerStyle={{ alignItems: 'center', padding: 10 }}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                }
            >
                {cargando ? (
                    <ActivityIndicator size="large" color={blue} style={{ marginTop: 50 }} />
                ) : (
                    <View style={{ width: '95%', alignItems: 'center' }}>
                        {/* Leyenda de estados */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            marginBottom: 10,
                            gap: 20
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#346796' }} />
                                <Text style={{ fontSize: 12, color: '#666' }}>Iniciado</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#349963' }} />
                                <Text style={{ fontSize: 12, color: '#666' }}>Terminado</Text>
                            </View>
                        </View>

                        {/* Card única con todas las tallas */}
                        <View style={{
                            backgroundColor: grey,
                            width: '100%',
                            borderRadius: 10,
                            padding: 12,
                            borderWidth: 2,
                            borderColor: blue
                        }}>
                            {/* Encabezado de columnas */}
                            <View style={{ flexDirection: 'row', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 6 }}>
                                <Text style={{ width: '14%', fontWeight: 'bold', textAlign: 'center', fontSize: 12 }}>Talla</Text>
                                <Text style={{ width: '17%', fontWeight: 'bold', textAlign: 'center', fontSize: 12 }}>Cortado</Text>
                                <Text style={{ width: '17%', fontWeight: 'bold', textAlign: 'center', fontSize: 12 }}>Enviado</Text>
                                <Text style={{ width: '17%', fontWeight: 'bold', textAlign: 'center', fontSize: 12 }}>Recibido</Text>
                                <Text style={{ width: '17%', fontWeight: 'bold', textAlign: 'center', fontSize: 12 }}>Dif.</Text>
                                <Text style={{ width: '18%', fontWeight: 'bold', textAlign: 'center', fontSize: 12 }}>Estado</Text>
                            </View>

                            {/* Lista de tallas */}
                            {data.map((item, index) => (
                                <View
                                    key={index}
                                    style={{
                                        flexDirection: 'row',
                                        paddingVertical: 6,
                                        alignItems: 'center',
                                        borderBottomWidth: index < data.length - 1 ? 1 : 0,
                                        borderBottomColor: '#eee'
                                    }}
                                >
                                    <Text style={{ width: '14%', textAlign: 'center', fontWeight: '600', fontSize: 13 }}>{item.size}</Text>
                                    <Text style={{ width: '17%', textAlign: 'center', fontSize: 13 }}>{item.cortado}</Text>
                                    <Text style={{ width: '17%', textAlign: 'center', fontSize: 13 }}>{item.enviado}</Text>
                                    <Text style={{ width: '17%', textAlign: 'center', fontSize: 13 }}>{item.recibido}</Text>
                                    <Text style={{
                                        width: '17%',
                                        textAlign: 'center',
                                        color: item.enviado - item.recibido !== 0 ? 'red' : 'green',
                                        fontWeight: '600',
                                        fontSize: 13
                                    }}>
                                        {item.enviado - item.recibido}
                                    </Text>
                                    <View style={{ width: '18%', alignItems: 'center' }}>
                                        <View style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: 7,
                                            backgroundColor: getColorEstado(item.prodStatus)
                                        }} />
                                    </View>
                                </View>
                            ))}

                            {/* Fila de totales */}
                            <View style={{
                                flexDirection: 'row',
                                marginTop: 8,
                                paddingTop: 8,
                                borderTopWidth: 2,
                                borderTopColor: blue
                            }}>
                                <Text style={{ width: '14%', fontWeight: 'bold', textAlign: 'center', fontSize: 12 }}>Total</Text>
                                <Text style={{ width: '17%', fontWeight: 'bold', textAlign: 'center', fontSize: 12 }}>{data.reduce((acc, item) => acc + item.cortado, 0)}</Text>
                                <Text style={{ width: '17%', fontWeight: 'bold', textAlign: 'center', fontSize: 12 }}>{totalEnviado}</Text>
                                <Text style={{ width: '17%', fontWeight: 'bold', textAlign: 'center', fontSize: 12 }}>{totalRecibido}</Text>
                                <Text style={{
                                    width: '17%',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    color: totalDiferencia !== 0 ? 'red' : 'green',
                                    fontSize: 12
                                }}>
                                    {totalDiferencia}
                                </Text>
                                <Text style={{ width: '18%', textAlign: 'center' }}></Text>
                            </View>

                            {/* Botones */}
                            <View style={{ flexDirection: 'row', marginTop: 15, gap: 10 }}>
                                <TouchableOpacity
                                    style={{
                                        flex: 1,
                                        backgroundColor: isDisabled ? '#A0A0A0' : blue,
                                        borderRadius: 10,
                                        paddingVertical: 12,
                                        opacity: isDisabled ? 0.6 : 1
                                    }}
                                    disabled={isDisabled}
                                    onPress={handleRecepcion}
                                >
                                    <Text style={{
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        color: isDisabled ? '#666' : grey,
                                        fontSize: 14
                                    }}>
                                        Recepcion
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                        flex: 1,
                                        backgroundColor: isDisabled ? '#A0A0A0' : green,
                                        borderRadius: 10,
                                        paddingVertical: 12,
                                        opacity: isDisabled ? 0.6 : 1
                                    }}
                                    disabled={isDisabled}
                                    onPress={handleLiquidar}
                                >
                                    <Text style={{
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        color: isDisabled ? '#666' : grey,
                                        fontSize: 14
                                    }}>
                                        Notificar OP
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Resultado</Text>

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
                            onPress={() => {
                                setModalVisible(false);
                                gobackifRecepcion();
                            }}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
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
})
