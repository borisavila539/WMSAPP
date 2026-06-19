import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, processColor } from 'react-native';
import { RootStackParams } from '../../../navigation/navigation'
import { WMSContext } from '../../../context/WMSContext'
import Header from '../../../components/Header'
import { WMSApiRecepcionYUbicacionAx } from '../../../api/WMSApiRecepcionYUbicacionAx';
import { WmSApi } from '../../../api/WMSApi';
import { IM_WMS_UsuarioPorPantallaInterface } from '../../../interfaces/UsuarioPorPantallaInterface';

interface TrasladoAxDto {
    transferId: string;
    fecha: string;
    inventLocationIdFrom: string;
    inventLocationIdTo: string;
    itemId: string;
    imDatosTecnicos2: string;
    montoTraslado: number;
    statusId: number;
}
interface TrasladoAgrupado {
    transferId: string;
    fecha: string;
    inventLocationIdFrom: string;
    inventLocationIdTo: string;
    statusId: number;
    imDatosTecnicos2: string;
    items: {
        itemId: string;
        imDatosTecnicos2: string;
        montoTraslado: number
    }[];
    montoTotal: number;
}

type props = StackScreenProps<RootStackParams, "RecepcionTrasladosScreen">

const pantalla = 'RecepcionYUbiacionTrasladoScreen';

export const RecepcionTrasladosScreen: FC<props> = ({ navigation }) => {
    const { changeTRANSFERIDFROM, changeNombreEmpresa, WMSState } = useContext(WMSContext);
    const [data, setData] = useState<TrasladoAgrupado[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [usuarioConPermiso, setUsuarioConPermiso] =
        useState<IM_WMS_UsuarioPorPantallaInterface | null>(null);

    const agruparTraslados = (traslados: TrasladoAxDto[]): TrasladoAgrupado[] => {
        const grupos: { [key: string]: TrasladoAgrupado } = {};

        traslados.forEach(traslado => {
            if (!grupos[traslado.transferId]) {
                grupos[traslado.transferId] = {
                    transferId: traslado.transferId,
                    fecha: traslado.fecha,
                    inventLocationIdFrom: traslado.inventLocationIdFrom,
                    inventLocationIdTo: traslado.inventLocationIdTo,
                    statusId: traslado.statusId,
                    imDatosTecnicos2: traslado.imDatosTecnicos2,
                    items: [],
                    montoTotal: 0,
                };
            }
            grupos[traslado.transferId].items.push({
                itemId: traslado.itemId,
                imDatosTecnicos2: traslado.imDatosTecnicos2,
                montoTraslado: traslado.montoTraslado,
            });
            grupos[traslado.transferId].montoTotal += traslado.montoTraslado;
        });

        return Object.values(grupos);
    };
    const getPermisoUsuario = async () => {
        //setCargando(true);
        try {
            const resp = await WmSApi.get(`GetPermisoUsuarioPorPantalla/${WMSState.usuario}/${pantalla}`);
            setUsuarioConPermiso(resp.data);
            console.log('Permiso de usuario para la pantalla:', resp.data);
        } catch (err) {
            console.log('Error al verificar permiso de usuario:', err);
            return false;
        }
        //setCargando(false);
    }

    const fetchTrasladosAX = async () => {
        try {
            await WMSApiRecepcionYUbicacionAx.get<TrasladoAxDto[]>('GetTrasladosAX')
                .then(resp => {
                    const agrupados = agruparTraslados(resp.data);
                    setData(agrupados);
                });
        } catch (error) {
            console.log('Error al obtener traslados:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTrasladosAX();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTrasladosAX();
    };

    const navigateToRecepcion = (traslado: TrasladoAgrupado) => {
        changeTRANSFERIDFROM(traslado.transferId);
        changeNombreEmpresa(traslado.imDatosTecnicos2);
        navigation.navigate('DetalleRecibirTrasladoScreen');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatMonto = (monto: number) => {
        return monto.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const getStatusText = (statusId: number) => {
        switch (statusId) {
            case 0: return 'Pendiente';
            case 1: return 'Enviado';
            case 2: return 'Recibido';
            case 3: return 'Cancelado';
            default: return 'Desconocido';
        }
    };

    const getStatusColor = (statusId: number) => {
        switch (statusId) {
            case 0: return '#FFA500';
            case 1: return '#3498db';
            case 2: return '#27ae60';
            case 3: return '#e74c3c';
            default: return '#95a5a6';
        }
    };

    const renderItem = ({ item }: { item: TrasladoAgrupado }) => {
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigateToRecepcion(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.transferId}>{item.transferId}</Text>
                        <View style={styles.fechaRow}>
                            <Text style={styles.fecha}>{formatDate(item.fecha)}</Text>

                            <View style={styles.productTypeContainer}>
                                <Text style={styles.productType}>{item.imDatosTecnicos2}</Text>
                            </View>
                        </View>

                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statusId) }]}>
                        <Text style={styles.statusText}>{getStatusText(item.statusId)}</Text>
                    </View>
                </View>

                <View style={styles.locationContainer}>
                    <View style={styles.locationBox}>
                        <Text style={styles.locationLabel}>Origen</Text>
                        <Text style={styles.locationValue}>{item.inventLocationIdFrom}</Text>
                    </View>
                    <Text style={styles.arrow}>→</Text>
                    <View style={styles.locationBox}>
                        <Text style={styles.locationLabel}>Destino</Text>
                        <Text style={styles.locationValue}>{item.inventLocationIdTo}</Text>
                    </View>
                </View>

                <View style={styles.summaryContainer}>
                    <Text style={styles.itemsCount}>{item.items.length} articulo(s)</Text>
                    <Text style={styles.montoTotal}>Uni. {formatMonto(item.montoTotal)}</Text>
                </View>

                <View style={styles.tapIndicator}>
                    <Text style={styles.tapText}>Toca para recibir</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Header texto1="Traslados" texto2="Traslados AX" texto3="" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                    <Text style={styles.loadingText}>Cargando traslados...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header texto1="Traslados" texto2="Traslados AX" texto3="" />

            {data.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No se encontraron traslados</Text>
                </View>
            ) : (
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.transferId}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#3498db']}
                        />
                    }
                />
            )}
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerLeft: {
        flex: 1,
    },
    transferId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    fecha: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    locationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f8f9fa',
    },
    locationBox: {
        flex: 1,
        alignItems: 'center',
    },
    locationLabel: {
        fontSize: 11,
        color: '#666',
        marginBottom: 2,
    },
    locationValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    arrow: {
        fontSize: 20,
        color: '#3498db',
        marginHorizontal: 10,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemsCount: {
        fontSize: 14,
        color: '#666',
    },
    montoTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#27ae60',
    },
    tapIndicator: {
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#e8f4fd',
    },
    tapText: {
        fontSize: 12,
        color: '#3498db',
        fontWeight: '600',
    },
    fechaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    productTypeContainer: {
        backgroundColor: '#e8f4fd',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    productType: {
        fontSize: 10,
        color: '#3498db',
        fontWeight: '600',
    },


});
