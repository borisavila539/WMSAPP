import React, { FC, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import Header from '../../components/Header'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../navigation/navigation'
import { grey } from '../../constants/Colors'

import { PrinterInterface } from '../../interfaces/PrintersInterface'
import { WmSApi } from '../../api/WMSApi'
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5'

export interface IDatosEtiqueta {
    pedido: string;
    pedidoIntegrado: string;
    ordenCompra: string;
    listaEmpaque: string;

    clienteNombre: string;
    clienteCuenta: string;
    empresa: string;

    direccion: string;
    departamento: string;
    pais: string;
    ciudad: string;

    asesor: string;
    telefonoCliente: string;

    numeroCaja: string;
    numeroCajaLocal: number;

    itemIdOriginal: string;
    itemId: string;

    size: string;
    color: string;
    colorDescription: string;

    cantidad: number;

    marca: string;
}

export interface IRespuestaRutaPicking {
    imiB_PICKINGROUTEID: string;
    imiB_SALEORDER: string; // Este es el pedido
}

const EMPRESA = 'imhn'

type props = StackScreenProps<RootStackParams, 'ReimpresionEtiquetasClienteScreen'>

export const ReimpresionEtiquetasClienteScreen: FC<props> = ({ navigation }) => {
    const [pedido, setPedido] = useState('')
    const [ruta, setRuta] = useState('') // ListaEmpaque
    const [Impresoras, setImpresoras] = useState<PrinterInterface[]>([])
    const [etiquetas, setEtiquetas] = useState<IDatosEtiqueta[]>([])
    const [showImpresoras, setShowImpresoras] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingBusqueda, setLoadingBusqueda] = useState(false)
    const [loadingRuta, setLoadingRuta] = useState(false) // Loader para el escaneo de caja

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
        getImpresoras()
    }, [])


    useEffect(() => {
        const codigoCaja = ruta.trim();
        if (codigoCaja.toUpperCase().startsWith('IM') && codigoCaja.length === 13) {
            consultarRutaPorCaja(codigoCaja);
        }
    }, [ruta]);
    const consultarRutaPorCaja = async (codigoCaja: string) => {
        setLoadingRuta(true);
        try {
            // Indicamos a WmSApi.get que ahora esperamos el objeto IRespuestaRutaPicking
            const respuesta = await WmSApi.get<IRespuestaRutaPicking>(`GetRutaPacking/${codigoCaja}`);

            if (respuesta && respuesta.data) {
                const { imiB_PICKINGROUTEID, imiB_SALEORDER } = respuesta.data;

                setRuta(imiB_PICKINGROUTEID ?? '');
                setPedido(imiB_SALEORDER ?? '');


            } else {
                Alert.alert('Info', 'No se encontró información asociada a esta caja.');
            }
        } catch (err) {
            console.log(err);
            Alert.alert('Error', 'No se pudo obtener los datos del código escaneado.');
        } finally {
            setLoadingRuta(false);
        }
    };
    const onLimpiarRuta = () => {
        setRuta('');
        setPedido(''); // Limpia también el pedido sugerido por la caja
        setEtiquetas([]); 
    };

    // Función para buscar las etiquetas pendientes usando "all" como comodín
    const onBuscar = async () => {
        if (!ruta.trim()) {
            Alert.alert('Atención', 'Debe ingresar la Ruta obligatoriamente')
            return
        }

        setLoadingBusqueda(true)

        // Si el campo pedido está vacío, asignamos 'all' para proteger la estructura de la ruta de la API
        const pedidoParam = pedido.trim() ? pedido.trim() : 'all'

        try {
            const respuesta = await WmSApi.get<IDatosEtiqueta[]>(
                `GetEtiquetasPendientes/${EMPRESA}/${pedidoParam}/${ruta.trim()}`
            )
            if (respuesta && respuesta.data) {
                setEtiquetas(respuesta.data)
                if (respuesta.data.length === 0) {
                    Alert.alert('Info', 'No se encontraron etiquetas pendientes.')
                }
            }
        } catch (err: any) {
            console.log(err)
            // Manejo del BadRequest (400) cuando tu API responde que no encontró registros
            if (err.response && err.response.status === 400) {
                setEtiquetas([])
                Alert.alert('Info', 'No se encontraron registros para la ruta especificada.')
            } else {
                Alert.alert('Error', 'Hubo un problema al consultar las etiquetas.')
            }
        } finally {
            setLoadingBusqueda(false)
        }
    }

    // Valida los campos antes de abrir el modal de impresión
    const onImprimir = () => {
        if (!ruta.trim()) {
            Alert.alert('Atención', 'Debe ingresar la Ruta obligatoriamente')
            return
        }
        if (etiquetas.length === 0) {
            Alert.alert('Atención', 'Primero debe buscar y cargar las etiquetas a imprimir')
            return
        }
        setShowImpresoras(true)
    }

    // Envía la orden de impresión replicando el uso de "all" si no hay pedido
    const onSelectPrint = async (item: PrinterInterface) => {
        setLoading(true)
        const pedidoParam = pedido.trim() ? pedido.trim() : 'all'

        try {
            const respuesta = await WmSApi.get(
                `ImprimirEtiquetasPendientes/${EMPRESA}/${pedidoParam}/${ruta.trim()}/${item.iM_IPPRINTER}`
            )
            if (respuesta) {
                Alert.alert("Éxito", "Se mandó a imprimir correctamente")
            }
            setShowImpresoras(false)
        } catch (err: any) {
            console.log(err)
            Alert.alert('Error', 'No se pudo mandar a imprimir')
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey }}>
            <Header texto1="" texto2="Reimpresion Etiquetas" texto3="Clientes" />

            {/* Formulario Superior */}
            <View style={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 }}>
                <Text style={{ fontSize: 14, marginBottom: 4, color: '#333', fontWeight: '600' }}>Pedido (Opcional)</Text>
                <TextInput
                    value={pedido}
                    onChangeText={setPedido}
                    placeholder="Ingrese el pedido (opcional)"
                    placeholderTextColor="#999"
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        fontSize: 15,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: '#ddd',
                    }}
                />

                <Text style={{ fontSize: 14, marginBottom: 4, color: '#333', fontWeight: '600' }}>
                    Ruta / Escanear Caja * {loadingRuta && <ActivityIndicator size="small" color="#1565C0" />}
                </Text>

                {/* Contenedor del Input con el botón de borrar */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: loadingRuta ? '#f0f0f0' : '#fff',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#ddd',
                    marginBottom: 16,
                    paddingHorizontal: 14,
                }}>
                    <TextInput
                        value={ruta}
                        onChangeText={setRuta}
                        editable={!loadingRuta}
                        placeholder="Ingrese la ruta o escanee caja (Obligatorio)"
                        placeholderTextColor="#999"
                        autoCapitalize="characters"
                        style={{
                            flex: 1, // Hace que el input tome todo el espacio disponible
                            paddingVertical: 10,
                            fontSize: 15,
                            color: '#333',
                        }}
                    />

                    {/* Mostrar la X solo si hay texto y no está cargando */}
                    {ruta.length > 0 && !loadingRuta && (
                        <TouchableOpacity
                            onPress={onLimpiarRuta}
                            style={{ padding: 4 }}
                        >
                            <FontAwesome5Icon name="times-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Contenedor de Botones (Buscar e Imprimir) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <TouchableOpacity
                        onPress={onBuscar}
                        activeOpacity={0.8}
                        disabled={loadingBusqueda || loadingRuta}
                        style={{
                            backgroundColor: '#4CAF50',
                            borderRadius: 8,
                            paddingVertical: 14,
                            alignItems: 'center',
                            flex: 1,
                            marginRight: 8,
                            flexDirection: 'row',
                            justifyContent: 'center'
                        }}
                    >
                        {loadingBusqueda ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <FontAwesome5Icon name="search" size={15} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>Buscar</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onImprimir}
                        activeOpacity={0.8}
                        disabled={loadingRuta}
                        style={{
                            backgroundColor: '#1565C0',
                            borderRadius: 8,
                            paddingVertical: 14,
                            alignItems: 'center',
                            flex: 1,
                            marginLeft: 8,
                            flexDirection: 'row',
                            justifyContent: 'center'
                        }}
                    >
                        <FontAwesome5Icon name="print" size={15} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>Imprimir</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Listado de Cards de Etiquetas */}
            <FlatList
                data={etiquetas}
                keyExtractor={(item, index) => `${item.numeroCaja}-${item.itemId}-${index}`}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
                ListEmptyComponent={
                    !loadingBusqueda ? (
                        <Text style={{ textAlign: 'center', color: '#777', marginTop: 40, fontSize: 14 }}>
                            No hay datos para mostrar. Realice una búsqueda por Ruta.
                        </Text>
                    ) : null
                }
                renderItem={({ item }) => (
                    <View
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 10,
                            padding: 14,
                            marginBottom: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                            borderLeftWidth: 5,
                            borderLeftColor: '#1565C0'
                        }}
                    >
                        {/* Fila 1: Pedido y Ruta */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ fontSize: 13, color: '#666' }}>
                                <Text style={{ fontWeight: 'bold', color: '#333' }}>Ped: </Text>{item.pedido || 'N/A'}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#666' }}>
                                <Text style={{ fontWeight: 'bold', color: '#333' }}>Ruta: </Text>{item.listaEmpaque}
                            </Text>
                        </View>

                        {/* Fila 2: Caja y Cantidad */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ fontSize: 13, color: '#666' }}>
                                <Text style={{ fontWeight: 'bold', color: '#333' }}>Caja Local: </Text>#{item.numeroCajaLocal} ({item.numeroCaja.substring(0, 8)}...)
                            </Text>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1565C0' }}>
                                Cant: {item.cantidad}
                            </Text>
                        </View>

                        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 4 }} />

                        {/* Fila 3: Item y Detalles Visuales */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#222' }}>
                                {item.itemId} [{item.size}]
                            </Text>
                            <Text style={{ fontSize: 12, color: '#555', fontStyle: 'italic' }}>
                                {item.color} -{item.colorDescription.trim()}
                            </Text>
                        </View>
                    </View>
                )}
            />

            {/* Modal de selección de impresora */}
            <Modal
                visible={showImpresoras}
                transparent
                animationType="slide"
                onRequestClose={() => setShowImpresoras(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
                    <View
                        style={{
                            backgroundColor: '#fff',
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            paddingVertical: 20,
                            paddingHorizontal: 16,
                            maxHeight: '70%',
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Seleccione impresora</Text>
                            <TouchableOpacity onPress={() => setShowImpresoras(false)}>
                                <Text style={{ fontSize: 16, color: '#1565C0' }}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color="#1565C0" style={{ marginVertical: 24 }} />
                        ) : (
                            <FlatList
                                data={Impresoras}
                                keyExtractor={(item, index) => `${item.iM_IPPRINTER}-${index}`}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => onSelectPrint(item)}
                                        activeOpacity={0.7}
                                        style={{
                                            paddingVertical: 14,
                                            paddingHorizontal: 12,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#eee',
                                        }}
                                    >
                                        <Text style={{ fontSize: 16, color: '#333' }}>
                                            {item.iM_DESCRIPTION_PRINTER ?? item.iM_IPPRINTER}
                                        </Text>
                                        <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                                            {item.iM_IPPRINTER}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    )
}