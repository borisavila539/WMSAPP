
import React, { FC, useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParams } from '../../../navigation/navigation';

import Header from '../../../components/Header';
import { WMSApiRecepcionYUbicacionAx } from '../../../api/WMSApiRecepcionYUbicacionAx';
import { WMSContext } from '../../../context/WMSContext';
import ResultadoModal, { ResultadoModalItem } from '../../../components/Respuesta';
import { WmSApi } from '../../../api/WMSApi';
import { IM_WMS_UsuarioPorPantallaInterface } from '../../../interfaces/UsuarioPorPantallaInterface';

export interface DetalleTrasladoDto {
    estadoTraslado: number;
    cantidadCajas: number;
    cantidadOP: number;
    cantidadUnidades: number;
    propuesta: string;
    op: string;
    numeroCaja: string;
    talla: string;
    cantidad: number;
    color: string;
    lote: string;
    codigoArticulo: string;
    nombreArticulo: string;
    desdeAlmacen: string;
    hastaAlmacen: string;
    categoriaCaja: string;
    loteDescripcion: string;
    trasladoPrimerasAX: string;
    trasladoSegundasAX: string;
    conductor: string;
    codigoRecibido: string;
    camion: string;
    recibido: number;
    fechaValidado: string | null;
}

type props = StackScreenProps<RootStackParams, "DetalleRecibirTrasladoScreen">
const pantalla = 'RecibimientoTrasladoPepeMBDenim';
export const DetalleRecibirTrasladoScreen: FC<props> = ({ navigation, route }) => {
    const { WMSState } = useContext(WMSContext);
    const [data, setData] = useState<DetalleTrasladoDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [usuarioConPermiso, setUsuarioConPermiso] =
        useState<IM_WMS_UsuarioPorPantallaInterface | null>(null);

    const [resultados, setResultados] = useState<ResultadoModalItem[]>([]);

    useEffect(() => {
        fetchDetalleTraslado();
    }, []);
    useEffect(() => {
        getPermisoUsuario();
    }, []);
    const getPermisoUsuario = async () => {
        //setCargando(true);
        try {
            const resp = await WmSApi.get(`GetPermisoUsuarioPorPantalla/${WMSState.usuario}/${pantalla}`);
            setUsuarioConPermiso(resp.data);
            
        } catch (err) {
            console.log('Error al verificar permiso de usuario:', err);
            return false;
        }
        //setCargando(false);
    }
    const fetchDetalleTraslado = async () => {
        try {
            const transferId = WMSState.TRANSFERIDFROM.split('-')[1]; // Asumiendo que el formato es "transferId|inventLocationIdFrom"
            await WMSApiRecepcionYUbicacionAx.get<DetalleTrasladoDto[]>(`GetReporteInformacionAXTraslado/${transferId}`)
                .then(resp => {
                    setData(resp.data);
                });
        } catch (error) {
            console.error('Error fetching detalle traslado:', error);
            Alert.alert('Error', 'No se pudo cargar el detalle del traslado');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDetalleTraslado();
    };

    const handleRecibirTraslado = async () => {
        const cajasNoRecibidas = data.filter(item => item.recibido === 0);
        if (!usuarioConPermiso?.permisoadmin) {
            Alert.alert('Permiso Denegado', 'No tienes permiso para recibir el traslado. Contacta al administrador.');
            return;
        }


        Alert.alert(
            'Confirmar Recepcion',
            `¿Todavía hay  ${cajasNoRecibidas.length} cajas pendientes a escanear? Desea recibir el traslado?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        setProcesando(true);
                        try {
                            // Aqui va la llamada al endpoint para recibir el traslado
                            const response = await WMSApiRecepcionYUbicacionAx.post(`RecibirTrasladoConCambioUbiacion/${WMSState.TRANSFERIDFROM}/${WMSState.NombreEmpresa}`);
                            setResultados([response.data]);
                            setModalVisible(true);
                            console.log('Respuesta al recibir traslado:', response.data);
                            console.log('Resultados:', resultados);

                            // fetchDetalleTraslado(); // Recargar datos
                        } catch (error) {
                            console.error('Error al recibir traslado:', error);
                            Alert.alert('Error', 'No se pudo recibir el traslado');
                        } finally {
                            setProcesando(false);
                        }
                    }
                }
            ]
        );
    };

    const getResumenTraslado = () => {
        if (data.length === 0) return null;
        const primer = data[0];
        const totalUnidades = data.reduce((sum, item) => sum + item.cantidad, 0);
        const cajasRecibidas = data.filter(item => item.recibido === 1).length;
        const cajasPendientes = data.filter(item => item.recibido === 0).length;

        return {
            estadoTraslado: primer.estadoTraslado,
            trasladoPrimeras: primer.trasladoPrimerasAX,
            trasladoSegundas: primer.trasladoSegundasAX,
            propuesta: primer.propuesta,
            desdeAlmacen: primer.desdeAlmacen,
            hastaAlmacen: primer.hastaAlmacen,
            camion: primer.camion,
            conductor: primer.conductor,
            totalCajas: data.length,
            totalUnidades,
            cajasRecibidas,
            cajasPendientes,
        };
    };

    const renderResumen = () => {
        const resumen = getResumenTraslado();
        if (!resumen) return null;

        return (
            <View style={styles.resumenContainer}>
                <View style={styles.resumenHeader}>
                    <Text style={styles.resumenTitle}>Informacion del Traslado</Text>
                </View>


                {/* <View style={styles.resumenRow}>
                    <Text style={styles.resumenLabel}>Traslasdo:</Text>
                    <Text style={styles.resumenValue}>{WMSState.TRANSFERIDFROM}</Text>
                </View> */}
                <View style={styles.resumenRow}>
                    <Text style={styles.resumenLabel}>Propuesta:</Text>
                    <Text style={styles.resumenValue}>{resumen.propuesta}</Text>
                </View>

                <View style={styles.ubicacionContainer}>
                    <View style={styles.ubicacionBox}>
                        <Text style={styles.ubicacionLabel}>Desde</Text>
                        <Text style={styles.ubicacionValue}>{resumen.desdeAlmacen}</Text>
                    </View>
                    <Text style={styles.arrow}>→</Text>
                    <View style={styles.ubicacionBox}>
                        <Text style={styles.ubicacionLabel}>Hasta</Text>
                        <Text style={styles.ubicacionValue}>{resumen.hastaAlmacen}</Text>
                    </View>
                </View>

                <View style={styles.transporteContainer}>
                    <View style={styles.transporteItem}>
                        <Text style={styles.transporteLabel}>Camion</Text>
                        <Text style={styles.transporteValue}>{resumen.camion}</Text>
                    </View>
                    <View style={styles.transporteItem}>
                        <Text style={styles.transporteLabel}>Conductor</Text>
                        <Text style={styles.transporteValue}>{resumen.conductor}</Text>
                    </View>
                </View>

                <View style={styles.estadisticasContainer}>
                    <View style={styles.estadisticaItem}>
                        <Text style={styles.estadisticaNumero}>{resumen.totalCajas}</Text>
                        <Text style={styles.estadisticaLabel}>Cajas</Text>
                    </View>
                    <View style={styles.estadisticaItem}>
                        <Text style={styles.estadisticaNumero}>{resumen.totalUnidades}</Text>
                        <Text style={styles.estadisticaLabel}>Unidades</Text>
                    </View>
                    <View style={[styles.estadisticaItem, styles.estadisticaRecibido]}>
                        <Text style={[styles.estadisticaNumero, { color: '#27ae60' }]}>{resumen.cajasRecibidas}</Text>
                        <Text style={styles.estadisticaLabel}>Recibidas</Text>
                    </View>
                    <View style={[styles.estadisticaItem, styles.estadisticaPendiente]}>
                        <Text style={[styles.estadisticaNumero, { color: '#e74c3c' }]}>{resumen.cajasPendientes}</Text>
                        <Text style={styles.estadisticaLabel}>Pendientes</Text>
                    </View>
                </View>
            </View>

        );
    };

    const renderItem = ({ item }: { item: DetalleTrasladoDto }) => {
        const esRecibido = item.recibido === 1;

        return (
            <View style={[
                styles.card,
                esRecibido ? styles.cardRecibido : styles.cardPendiente
            ]}>
                <View style={styles.cardHeader}>
                    <View style={styles.cajaInfo}>
                        <Text style={styles.cajaNumero}>Caja #{item.numeroCaja}</Text>
                        <View style={[
                            styles.statusBadge,
                            esRecibido ? styles.badgeRecibido : styles.badgePendiente
                        ]}>
                            <Text style={styles.statusText}>
                                {esRecibido ? 'Recibido' : 'Pendiente'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.categoriaCaja}>{item.categoriaCaja}</Text>
                </View>

                <View style={styles.codigoOpContainer}>
                    <View style={styles.codigoOpRow}>
                        <Text style={styles.codigoOpLabel}>Codigo:</Text>
                        <Text style={styles.codigoOpValue} numberOfLines={1}>{item.codigoArticulo}</Text>
                    </View>
                    <View style={styles.codigoOpRow}>
                        <Text style={styles.codigoOpLabel}>OP:</Text>
                        <Text style={styles.codigoOpValue}>{item.op}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Talla</Text>
                            <Text style={styles.infoValue}>{item.talla}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Color</Text>
                            <Text style={styles.infoValue}>{item.color}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Cantidad</Text>
                            <Text style={styles.infoValue}>{item.cantidad}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Lote</Text>
                            <Text style={styles.infoValue}>{item.lote}</Text>
                        </View>
                    </View>
                </View>

                {esRecibido && item.fechaValidado && (
                    <View style={styles.fechaValidadoContainer}>
                        <Text style={styles.fechaValidadoText}>
                            Recibido: {new Date(item.fechaValidado).toLocaleString()}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Header texto1={`Traslado: ${WMSState.TRANSFERIDFROM}`} texto2='Detalle Recepcion' texto3='' />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                    <Text style={styles.loadingText}>Cargando detalle...</Text>
                </View>
            </View>
        );
    }

    const resumen = getResumenTraslado();
    const cajasPendientes = resumen?.cajasPendientes || 0;
    const trasladoPendiente = resumen?.estadoTraslado || 0;

    return (
        <View style={styles.container}>
            <Header texto1={`Traslado: ${WMSState.TRANSFERIDFROM}`} texto2='Detalle Recepcion' texto3='' />

            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.numeroCaja}-${index}`}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderResumen}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No hay cajas para mostrar</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3498db']}
                    />
                }
            />

            <View style={styles.footerContainer}>
                <TouchableOpacity
                    style={[
                        styles.recibirButton,
                        trasladoPendiente === 1 && styles.recibirButtonDisabled
                    ]}
                    onPress={handleRecibirTraslado}
                    disabled={procesando || trasladoPendiente === 1}
                >
                    {procesando ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.recibirButtonText}>
                            {trasladoPendiente === 1
                                ? 'Todo Recibido'
                                : `Recibir Traslado`
                            }
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
            <ResultadoModal
                visible={modalVisible}
                titulo="Resultado Recepción"
                resultados={resultados}
                onClose={() => {
                    setModalVisible(false);
                    fetchDetalleTraslado(); // Recargar datos al cerrar el modal
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    listContent: {
        padding: 15,
        paddingBottom: 100,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    // Resumen styles
    resumenContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 15,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    resumenHeader: {
        backgroundColor: '#2c3e50',
        padding: 12,
    },
    resumenTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    resumenRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    resumenLabel: {
        fontSize: 13,
        color: '#666',
        flex: 1,
    },
    resumenValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        flex: 2,
        textAlign: 'right',
    },
    ubicacionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    ubicacionBox: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    ubicacionLabel: {
        fontSize: 12,
        color: '#999',
    },
    ubicacionValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    arrow: {
        fontSize: 24,
        color: '#3498db',
        marginHorizontal: 15,
    },
    transporteContainer: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    transporteItem: {
        flex: 1,
        alignItems: 'center',
    },
    transporteLabel: {
        fontSize: 11,
        color: '#999',
    },
    transporteValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    estadisticasContainer: {
        flexDirection: 'row',
        paddingVertical: 15,
    },
    estadisticaItem: {
        flex: 1,
        alignItems: 'center',
    },
    estadisticaRecibido: {
        borderLeftWidth: 1,
        borderLeftColor: '#eee',
    },
    estadisticaPendiente: {
        borderLeftWidth: 1,
        borderLeftColor: '#eee',
    },
    estadisticaNumero: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    estadisticaLabel: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    // Card styles
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderLeftWidth: 4,
    },
    cardRecibido: {
        borderLeftColor: '#27ae60',
        backgroundColor: '#f8fdf9',
    },
    cardPendiente: {
        borderLeftColor: '#e74c3c',
        backgroundColor: '#fff',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    cajaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cajaNumero: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    badgeRecibido: {
        backgroundColor: '#27ae60',
    },
    badgePendiente: {
        backgroundColor: '#e74c3c',
    },
    statusText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600',
    },
    categoriaCaja: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    codigoOpContainer: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    codigoOpRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    codigoOpLabel: {
        fontSize: 12,
        color: '#666',
        width: 55,
    },
    codigoOpValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2c3e50',
        flex: 1,
    },
    cardBody: {
        padding: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        alignItems: 'center',
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        color: '#999',
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginTop: 2,
    },
    fechaValidadoContainer: {
        backgroundColor: '#e8f8f0',
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    fechaValidadoText: {
        fontSize: 11,
        color: '#27ae60',
    },
    // Footer styles
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    recibirButton: {
        backgroundColor: '#27ae60',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    recibirButtonDisabled: {
        backgroundColor: '#95a5a6',
    },
    recibirButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
