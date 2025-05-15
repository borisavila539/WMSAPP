import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from "react-native"
import Header from "../../../components/Header"
import { StackScreenProps } from "@react-navigation/stack"
import { RootStackParams } from "../../../navigation/navigation"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { TopTelaPickingByVendroll } from "./ReceptionTelaVendroll.types"
import { ReceptionTelaVendrollService } from "./ReceptionTelaVendrollService"
import { ReceptionTelaStyle } from "../ReceptionTelaDiario/ReceptionTela.style"
import { black, blue, orange } from "../../../constants/Colors"
import Icon from 'react-native-vector-icons/FontAwesome5'
import { WMSContext } from "../../../context/WMSContext"

type props = StackScreenProps<RootStackParams, "ReceptionTelaVendroll">

export const ReceptionTelaVendrollScreen: FC<props> = ({ navigation }) => {

    const receptionTelaVendrollService = new ReceptionTelaVendrollService();
    const [data, setData] = useState<TopTelaPickingByVendroll[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const textInputRef = useRef<TextInput>(null);
    const [nombreProveedor, setNombreProveedor] = useState<string>('');
    const { changeReceptionTelaVendroll } = useContext(WMSContext);

    useEffect(() => {
        getData();
    }, [])

    const getData = () => {
        setIsLoading(true)
        receptionTelaVendrollService.topTelaPickingByVendroll(nombreProveedor)
            .then((response) => {
                setData(response);
                setIsLoading(false)
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
                setIsLoading(false)
            });
    }

    const generateUUID = (): string => {
        const date = new Date();
        const timestamp = date.getTime().toString(16);
        const randomUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
            const random = (Math.random() * 16) | 0;
            const value = char === 'x' ? random : (random & 0x3) | 0x8;
            return value.toString(16);
        });
        return `${timestamp}-${randomUUID}`;
    };

    const formatearFecha = (fechaIso: string): string => {
        const fecha = new Date(fechaIso);
        return fecha.toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    const renderItem = (item: TopTelaPickingByVendroll) => {
        return (

            <View style={{ width: '100%', alignItems: 'center', marginBottom: 12 }}>

                <TouchableOpacity
                    style={{ width: '100%', alignItems: 'center' }}
                    onPress={() => {
                        changeReceptionTelaVendroll(item.activityUUID);
                        navigation.navigate('ReceptionTelaVendrollDetalle');
                    }}
                >
                    <View style={{ width: '90%', borderWidth: 1, borderRadius: 10, padding: 5 }} >
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#000', fontWeight: '500', width: '80%' }} > {item.nombreProveedor} </Text>
                            <Text style={{ color: '#000' }} > {item.cantidadEscaneados} </Text>
                        </View>

                        <View style={{ marginVertical: 8 }}>
                            <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                                <Text style={{ fontWeight: 'bold' }}>Primer escaneo: </Text>
                                <Text>{formatearFecha(item.fechaInicioEscaneo)}</Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={{ fontWeight: 'bold' }}>Último escaneo: </Text>
                                <Text>{formatearFecha(item.fechaUltimoEscaneo)}</Text>
                            </View>
                        </View>

                    </View>

                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='Recepcion de Tela por Código' texto2='' texto3='' />

            <View style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}>

                <View style={[ReceptionTelaStyle.input, { borderColor: nombreProveedor != '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center' }]}>
                    <TextInput
                        ref={textInputRef}
                        placeholder='Textiles'

                        style={[ReceptionTelaStyle.input, { borderWidth: 0 }]}
                        onChangeText={(value) => setNombreProveedor(value)}
                        value={nombreProveedor}
                    />

                    <TouchableOpacity onPress={() => getData()}>

                        <Icon name='search' size={15} color={black} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={() => {
                        changeReceptionTelaVendroll(generateUUID());
                        navigation.navigate('ReceptionTelaVendrollDetalle');
                    }}
                    style={{ backgroundColor: blue, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginRight: 3, width: '10%' }}
                >
                    <Icon name='plus' size={15} color={'#fff'} />
                </TouchableOpacity>
            </View>

            {isLoading && <ActivityIndicator style={{ marginTop: 24 }} size={24} />}

            <View style={{ width: '100%', marginTop: 5, flex: 1 }}>

                <FlatList
                    data={data}
                    keyExtractor={(item, index) => `${index}`}
                    renderItem={({ item, index }) => renderItem(item)}
                    refreshControl={<RefreshControl refreshing={false} onRefresh={getData} />}
                    ListEmptyComponent={() => (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            {isLoading == false && <Text >No se encontraron registros de codigos.</Text>}
                        </View>
                    )}
                />
            </View>

        </View>
    )
}